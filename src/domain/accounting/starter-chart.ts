import type { Prisma } from "@/generated/prisma/client";
import type { AccountNatureValue, AccountTypeValue } from "./account-input";

export type StarterAccount = {
  code: string;
  name: string;
  type: AccountTypeValue;
  nature: AccountNatureValue;
  parentCode: string | null;
};

// Plantilla de partida referencial; requiere revisión y adaptación por empresa.
export const starterChart: StarterAccount[] = [
  { code: "1000", name: "Activos", type: "ASSET", nature: "DEBIT", parentCode: null },
  { code: "1100", name: "Activos corrientes", type: "ASSET", nature: "DEBIT", parentCode: "1000" },
  { code: "1101", name: "Efectivo y equivalentes de efectivo", type: "ASSET", nature: "DEBIT", parentCode: "1100" },
  { code: "1102", name: "Deudores comerciales y otras cuentas por cobrar", type: "ASSET", nature: "DEBIT", parentCode: "1100" },
  { code: "1103", name: "Inventarios", type: "ASSET", nature: "DEBIT", parentCode: "1100" },
  { code: "1104", name: "Impuestos por recuperar", type: "ASSET", nature: "DEBIT", parentCode: "1100" },
  { code: "1200", name: "Activos no corrientes", type: "ASSET", nature: "DEBIT", parentCode: "1000" },
  { code: "1201", name: "Propiedades, planta y equipo", type: "ASSET", nature: "DEBIT", parentCode: "1200" },
  { code: "1202", name: "Depreciación acumulada", type: "ASSET", nature: "CREDIT", parentCode: "1200" },
  { code: "2000", name: "Pasivos", type: "LIABILITY", nature: "CREDIT", parentCode: null },
  { code: "2100", name: "Pasivos corrientes", type: "LIABILITY", nature: "CREDIT", parentCode: "2000" },
  { code: "2101", name: "Proveedores y otras cuentas por pagar", type: "LIABILITY", nature: "CREDIT", parentCode: "2100" },
  { code: "2102", name: "Remuneraciones y beneficios por pagar", type: "LIABILITY", nature: "CREDIT", parentCode: "2100" },
  { code: "2103", name: "Impuestos por pagar", type: "LIABILITY", nature: "CREDIT", parentCode: "2100" },
  { code: "2200", name: "Pasivos no corrientes", type: "LIABILITY", nature: "CREDIT", parentCode: "2000" },
  { code: "2201", name: "Obligaciones financieras", type: "LIABILITY", nature: "CREDIT", parentCode: "2200" },
  { code: "3000", name: "Patrimonio", type: "EQUITY", nature: "CREDIT", parentCode: null },
  { code: "3101", name: "Capital", type: "EQUITY", nature: "CREDIT", parentCode: "3000" },
  { code: "3102", name: "Resultados acumulados", type: "EQUITY", nature: "CREDIT", parentCode: "3000" },
  { code: "3103", name: "Resultado del ejercicio", type: "EQUITY", nature: "CREDIT", parentCode: "3000" },
  { code: "4000", name: "Ingresos", type: "REVENUE", nature: "CREDIT", parentCode: null },
  { code: "4101", name: "Ingresos por ventas y servicios", type: "REVENUE", nature: "CREDIT", parentCode: "4000" },
  { code: "4102", name: "Otros ingresos", type: "REVENUE", nature: "CREDIT", parentCode: "4000" },
  { code: "5000", name: "Costos", type: "EXPENSE", nature: "DEBIT", parentCode: null },
  { code: "5101", name: "Costo de ventas y servicios", type: "EXPENSE", nature: "DEBIT", parentCode: "5000" },
  { code: "6000", name: "Gastos", type: "EXPENSE", nature: "DEBIT", parentCode: null },
  { code: "6101", name: "Gastos de administración", type: "EXPENSE", nature: "DEBIT", parentCode: "6000" },
  { code: "6102", name: "Gastos de ventas", type: "EXPENSE", nature: "DEBIT", parentCode: "6000" },
  { code: "6103", name: "Remuneraciones", type: "EXPENSE", nature: "DEBIT", parentCode: "6000" },
  { code: "6104", name: "Depreciación", type: "EXPENSE", nature: "DEBIT", parentCode: "6000" },
];

export async function createStarterChart(
  transaction: Prisma.TransactionClient,
  companyId: string,
): Promise<number> {
  const idByCode = new Map<string, string>();
  for (const account of starterChart) {
    const created = await transaction.account.create({
      data: {
        companyId,
        code: account.code,
        name: account.name,
        type: account.type,
        nature: account.nature,
        parentId: account.parentCode ? idByCode.get(account.parentCode) : null,
        isActive: true,
      },
      select: { id: true, code: true },
    });
    idByCode.set(created.code, created.id);
  }
  return idByCode.size;
}
