import { isValidRut, normalizeRut } from "../chile/rut";

export type CompanySetupInput = {
  rut: string;
  legalName: string;
  tradeName?: string;
  fiscalYear: string | number;
  planTemplate: "standard" | "custom";
  taxRegime?: string;
  economicActivity?: string;
};

export type CompanySetupResult =
  | {
      ok: true;
      value: {
        rut: string;
        legalName: string;
        tradeName: string | null;
        fiscalYear: number;
        planTemplate: "STANDARD" | "CUSTOM";
        taxRegime: string | null;
        economicActivity: string | null;
      };
    }
  | { ok: false; message: string };

export function validateCompanySetup(input: unknown): CompanySetupResult {
  if (!input || typeof input !== "object") {
    return { ok: false, message: "Los datos de la empresa no son válidos." };
  }

  const candidate = input as Record<string, unknown>;
  if (
    typeof candidate.rut !== "string" ||
    typeof candidate.legalName !== "string" ||
    (candidate.tradeName !== undefined && typeof candidate.tradeName !== "string") ||
    (candidate.taxRegime !== undefined && typeof candidate.taxRegime !== "string") ||
    (candidate.economicActivity !== undefined && typeof candidate.economicActivity !== "string") ||
    (typeof candidate.fiscalYear !== "string" && typeof candidate.fiscalYear !== "number") ||
    typeof candidate.planTemplate !== "string"
  ) {
    return { ok: false, message: "Los datos de la empresa no son válidos." };
  }

  const typedInput = candidate as unknown as CompanySetupInput;
  const rut = normalizeRut(typedInput.rut);
  const legalName = typedInput.legalName.trim();
  const tradeName = typedInput.tradeName?.trim() ?? "";
  const taxRegime = typedInput.taxRegime?.trim() ?? "";
  const economicActivity = typedInput.economicActivity?.trim() ?? "";
  const fiscalYear = Number(typedInput.fiscalYear);

  if (!isValidRut(rut)) {
    return { ok: false, message: "El RUT ingresado no es válido." };
  }
  if (legalName.length < 2 || legalName.length > 160) {
    return { ok: false, message: "La razón social debe tener entre 2 y 160 caracteres." };
  }
  if (tradeName.length > 160 || taxRegime.length > 120 || economicActivity.length > 160) {
    return { ok: false, message: "Uno de los datos opcionales excede el largo permitido." };
  }
  if (!Number.isInteger(fiscalYear) || fiscalYear < 2000 || fiscalYear > 2100) {
    return { ok: false, message: "El ejercicio inicial debe ser un año entre 2000 y 2100." };
  }
  if (typedInput.planTemplate !== "standard" && typedInput.planTemplate !== "custom") {
    return { ok: false, message: "Selecciona una opción válida para el plan de cuentas." };
  }

  return {
    ok: true,
    value: {
      rut,
      legalName,
      tradeName: tradeName || null,
      fiscalYear,
      planTemplate: typedInput.planTemplate === "standard" ? "STANDARD" : "CUSTOM",
      taxRegime: taxRegime || null,
      economicActivity: economicActivity || null,
    },
  };
}

export function buildMonthlyPeriods(year: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new RangeError("El ejercicio debe estar entre 2000 y 2100.");
  }

  return Array.from({ length: 12 }, (_, index) => ({
    number: index + 1,
    startDate: new Date(Date.UTC(year, index, 1)),
    endDate: new Date(Date.UTC(year, index + 1, 0)),
  }));
}
