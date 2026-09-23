"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMonthlyPeriods, validateCompanySetup, type CompanySetupInput } from "@/domain/company/setup";

export type CreateCompanyResult =
  | { ok: true; companyId: string; legalName: string }
  | { ok: false; message: string };

export async function createCompany(input: CompanySetupInput): Promise<CreateCompanyResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { ok: false, message: "Tu sesión expiró. Inicia sesión nuevamente." };
  }

  const validation = validateCompanySetup(input);
  if (!validation.ok) {
    return validation;
  }

  const companyData = validation.value;
  const periods = buildMonthlyPeriods(companyData.fiscalYear);

  try {
    const company = await prisma.$transaction(async (transaction) => {
      const createdCompany = await transaction.company.create({
        data: {
          rut: companyData.rut,
          legalName: companyData.legalName,
          tradeName: companyData.tradeName,
          planTemplate: companyData.planTemplate,
          taxRegime: companyData.taxRegime,
          economicActivity: companyData.economicActivity,
        },
      });

      await transaction.companyMembership.create({
        data: {
          companyId: createdCompany.id,
          userId: session.user.id,
          role: "ADMIN",
        },
      });

      const fiscalYear = await transaction.fiscalYear.create({
        data: {
          companyId: createdCompany.id,
          year: companyData.fiscalYear,
          startDate: new Date(Date.UTC(companyData.fiscalYear, 0, 1)),
          endDate: new Date(Date.UTC(companyData.fiscalYear, 11, 31)),
        },
      });

      await transaction.accountingPeriod.createMany({
        data: periods.map((period) => ({
          companyId: createdCompany.id,
          fiscalYearId: fiscalYear.id,
          number: period.number,
          startDate: period.startDate,
          endDate: period.endDate,
        })),
      });

      await transaction.auditLog.create({
        data: {
          companyId: createdCompany.id,
          actorUserId: session.user.id,
          entityType: "Company",
          entityId: createdCompany.id,
          action: "COMPANY_CREATED",
          after: {
            rut: companyData.rut,
            legalName: companyData.legalName,
            fiscalYear: companyData.fiscalYear,
            planTemplate: companyData.planTemplate,
          },
        },
      });

      return createdCompany;
    });

    revalidatePath("/");
    return { ok: true, companyId: company.id, legalName: company.legalName };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        message: "Este RUT ya está registrado. Solicita acceso a la empresa existente.",
      };
    }

    console.error("Company creation failed", error);
    return { ok: false, message: "No se pudo guardar la empresa. Intenta nuevamente." };
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
