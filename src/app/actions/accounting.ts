"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseAccountInput } from "@/domain/accounting/account-input";
import { parseJournalDraftInput, scaledAmountToDecimal } from "@/domain/accounting/journal-draft";
import { createStarterChart } from "@/domain/accounting/starter-chart";

type ActionResult = { ok: true; message: string } | { ok: false; message: string };

export async function createAccount(companyId: string, input: unknown): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, message: "Tu sesión expiró. Inicia sesión nuevamente." };
  if (!validCompanyId(companyId)) return { ok: false, message: "No se encontró la empresa." };

  const membership = await getMembership(companyId, session.user.id);
  if (!membership || !["ADMIN", "ACCOUNTANT"].includes(membership.role)) {
    return { ok: false, message: "No tienes permiso para modificar el plan de cuentas." };
  }

  const parsed = parseAccountInput(input);
  if (!parsed.ok) return parsed;
  const data = parsed.value;

  if (data.parentId) {
    const parent = await prisma.account.findFirst({
      where: { id: data.parentId, companyId, isActive: true },
      select: { id: true, type: true },
    });
    if (!parent || parent.type !== data.type) {
      return { ok: false, message: "La cuenta agrupadora debe pertenecer a la misma empresa y clasificación." };
    }
    const alreadyUsed = await prisma.journalLine.count({ where: { companyId, accountId: parent.id } });
    if (alreadyUsed > 0) {
      return { ok: false, message: "No se puede convertir en agrupadora una cuenta ya utilizada en asientos." };
    }
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const account = await transaction.account.create({
        data: { companyId, ...data },
      });
      await transaction.auditLog.create({
        data: {
          companyId,
          actorUserId: session.user.id,
          entityType: "Account",
          entityId: account.id,
          action: "ACCOUNT_CREATED",
          after: { code: account.code, name: account.name, type: account.type, nature: account.nature, parentId: account.parentId },
        },
      });
    });
    revalidatePath(`/companies/${companyId}/accounts`);
    return { ok: true, message: "Cuenta agregada al plan." };
  } catch (error) {
    if (isUniqueConstraintError(error)) return { ok: false, message: "Ya existe una cuenta con ese código en esta empresa." };
    console.error("Account creation failed", error);
    return { ok: false, message: "No se pudo guardar la cuenta. Intenta nuevamente." };
  }
}

export async function installStarterChart(companyId: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, message: "Tu sesión expiró. Inicia sesión nuevamente." };
  if (!validCompanyId(companyId)) return { ok: false, message: "No se encontró la empresa." };

  const membership = await getMembership(companyId, session.user.id);
  if (!membership || !["ADMIN", "ACCOUNTANT"].includes(membership.role)) {
    return { ok: false, message: "No tienes permiso para cargar un plan de cuentas." };
  }

  try {
    const count = await prisma.$transaction(async (transaction) => {
      const company = await transaction.company.findFirst({
        where: { id: companyId, isActive: true },
        select: { planTemplate: true },
      });
      if (!company || company.planTemplate !== "STANDARD") throw new Error("TEMPLATE_NOT_AVAILABLE");
      if (await transaction.account.count({ where: { companyId } }) !== 0) throw new Error("CHART_NOT_EMPTY");
      const created = await createStarterChart(transaction, companyId);
      await transaction.auditLog.create({
        data: {
          companyId,
          actorUserId: session.user.id,
          entityType: "Account",
          entityId: companyId,
          action: "STARTER_CHART_INSTALLED",
          after: { accountCount: created, template: "STANDARD_REFERENCE" },
        },
      });
      return created;
    });
    revalidatePath(`/companies/${companyId}/accounts`);
    return { ok: true, message: `Se cargaron ${count} cuentas de una plantilla referencial editable.` };
  } catch (error) {
    if (error instanceof Error && error.message === "CHART_NOT_EMPTY") {
      return { ok: false, message: "La empresa ya tiene cuentas. La plantilla no reemplaza ni mezcla un plan existente." };
    }
    if (error instanceof Error && error.message === "TEMPLATE_NOT_AVAILABLE") {
      return { ok: false, message: "Esta empresa está configurada con un plan personalizado." };
    }
    if (isUniqueConstraintError(error)) return { ok: false, message: "Ya existe un plan cargado en esta empresa." };
    console.error("Starter chart installation failed", error);
    return { ok: false, message: "No se pudo cargar la plantilla. Intenta nuevamente." };
  }
}

export async function setAccountActive(companyId: string, accountId: string, isActive: boolean): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, message: "Tu sesión expiró. Inicia sesión nuevamente." };
  if (!validCompanyId(companyId) || typeof accountId !== "string" || accountId.length > 64 || typeof isActive !== "boolean") {
    return { ok: false, message: "La cuenta indicada no es válida." };
  }
  const membership = await getMembership(companyId, session.user.id);
  if (!membership || !["ADMIN", "ACCOUNTANT"].includes(membership.role)) {
    return { ok: false, message: "No tienes permiso para modificar el plan de cuentas." };
  }
  const account = await prisma.account.findFirst({ where: { id: accountId, companyId } });
  if (!account) return { ok: false, message: "No se encontró la cuenta." };
  if (account.isActive === isActive) return { ok: true, message: isActive ? "La cuenta ya está activa." : "La cuenta ya está inactiva." };

  if (!isActive) {
    const activeChildren = await prisma.account.count({ where: { companyId, parentId: accountId, isActive: true } });
    if (activeChildren > 0) return { ok: false, message: "Desactiva primero las cuentas hijas activas." };
  } else if (account.parentId) {
    const parent = await prisma.account.findFirst({ where: { id: account.parentId, companyId }, select: { isActive: true } });
    if (!parent?.isActive) return { ok: false, message: "Activa primero la cuenta agrupadora." };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.account.update({ where: { id: accountId }, data: { isActive } });
      await transaction.auditLog.create({
        data: {
          companyId,
          actorUserId: session.user.id,
          entityType: "Account",
          entityId: accountId,
          action: isActive ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED",
          before: { isActive: account.isActive },
          after: { isActive },
        },
      });
    });
    revalidatePath(`/companies/${companyId}/accounts`);
    revalidatePath(`/companies/${companyId}/journals`);
    return { ok: true, message: isActive ? "Cuenta activada." : "Cuenta desactivada; los asientos históricos se conservan." };
  } catch (error) {
    console.error("Account status update failed", error);
    return { ok: false, message: "No se pudo actualizar el estado de la cuenta." };
  }
}

export async function createJournalDraft(companyId: string, input: unknown): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false, message: "Tu sesión expiró. Inicia sesión nuevamente." };
  if (!validCompanyId(companyId)) return { ok: false, message: "No se encontró la empresa." };

  const membership = await getMembership(companyId, session.user.id);
  if (!membership || !["ADMIN", "ACCOUNTANT", "OPERATOR"].includes(membership.role)) {
    return { ok: false, message: "No tienes permiso para crear asientos." };
  }

  const parsed = parseJournalDraftInput(input);
  if (!parsed.ok) return parsed;
  const entry = parsed.value;

  const [fiscalYear, period, accounts] = await Promise.all([
    prisma.fiscalYear.findFirst({
      where: { id: entry.fiscalYearId, companyId, status: "OPEN" },
      select: { id: true, year: true },
    }),
    prisma.accountingPeriod.findFirst({
      where: {
        id: entry.periodId,
        companyId,
        fiscalYearId: entry.fiscalYearId,
        status: "OPEN",
        startDate: { lte: entry.entryDate },
        endDate: { gte: entry.entryDate },
      },
      select: { id: true },
    }),
    prisma.account.findMany({
      where: {
        companyId,
        isActive: true,
        id: { in: [...new Set(entry.lines.map((line) => line.accountId))] },
        children: { none: {} },
      },
      select: { id: true },
    }),
  ]);

  if (!fiscalYear || !period) {
    return { ok: false, message: "La fecha debe corresponder a un período abierto del ejercicio seleccionado." };
  }
  if (accounts.length !== new Set(entry.lines.map((line) => line.accountId)).size) {
    return { ok: false, message: "Usa solo cuentas activas y de detalle pertenecientes a esta empresa." };
  }

  try {
    const saved = await prisma.$transaction(async (transaction) => {
      const journal = await transaction.journalEntry.create({
        data: {
          companyId,
          fiscalYearId: fiscalYear.id,
          periodId: period.id,
          entryDate: entry.entryDate,
          description: entry.description,
          status: "DRAFT",
          createdById: session.user.id,
          lines: {
            create: entry.lines.map((line) => ({
              companyId,
              accountId: line.accountId,
              debit: scaledAmountToDecimal(line.debit),
              credit: scaledAmountToDecimal(line.credit),
              description: line.description,
            })),
          },
        },
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          companyId,
          actorUserId: session.user.id,
          entityType: "JournalEntry",
          entityId: journal.id,
          action: "JOURNAL_DRAFT_CREATED",
          after: {
            entryDate: entry.entryDate.toISOString().slice(0, 10),
            periodId: period.id,
            description: entry.description,
            lineCount: entry.lines.length,
            totalDebit: scaledAmountToDecimal(entry.lines.reduce((sum, line) => sum + line.debit, 0n)),
          },
        },
      });
      return journal;
    });
    revalidatePath(`/companies/${companyId}/journals`);
    return { ok: true, message: `Borrador guardado (${saved.id.slice(-8)}).` };
  } catch (error) {
    console.error("Journal draft creation failed", error);
    return { ok: false, message: "No se pudo guardar el asiento. Intenta nuevamente." };
  }
}

async function getMembership(companyId: string, userId: string) {
  return prisma.companyMembership.findFirst({
    where: { companyId, userId, isActive: true, company: { isActive: true } },
    select: { role: true },
  });
}

function validCompanyId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 64;
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
