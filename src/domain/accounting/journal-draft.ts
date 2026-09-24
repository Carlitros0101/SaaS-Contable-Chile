import { validateJournal, type JournalLineInput } from "./journal";

const SCALE = 10_000n;
const MAX_MINOR_UNITS = 999_999_999_999_999_999_9n;

export type JournalDraftLine = JournalLineInput & { description: string | null };
export type JournalDraftInput = {
  entryDate: Date;
  description: string;
  fiscalYearId: string;
  periodId: string;
  lines: JournalDraftLine[];
};

export type JournalDraftParseResult =
  | { ok: true; value: JournalDraftInput }
  | { ok: false; message: string };

export function parseScaledAmount(input: unknown): bigint | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  if (!/^(?:0|[1-9]\d{0,14})(?:\.\d{1,4})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const scaled = BigInt(whole) * SCALE + BigInt(fraction.padEnd(4, "0"));
  return scaled <= MAX_MINOR_UNITS ? scaled : null;
}

export function scaledAmountToDecimal(value: bigint): string {
  const whole = value / SCALE;
  const fraction = (value % SCALE).toString().padStart(4, "0");
  return `${whole}.${fraction}`;
}

export function parseJournalDraftInput(input: unknown): JournalDraftParseResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, message: "Completa los datos del asiento." };
  }

  const value = input as Record<string, unknown>;
  const description = typeof value.description === "string" ? value.description.trim() : "";
  const entryDateText = typeof value.entryDate === "string" ? value.entryDate : "";
  const fiscalYearId = typeof value.fiscalYearId === "string" ? value.fiscalYearId : "";
  const periodId = typeof value.periodId === "string" ? value.periodId : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDateText)) {
    return { ok: false, message: "Ingresa una fecha contable válida." };
  }
  const entryDate = new Date(`${entryDateText}T00:00:00.000Z`);
  if (Number.isNaN(entryDate.getTime()) || entryDate.toISOString().slice(0, 10) !== entryDateText) {
    return { ok: false, message: "Ingresa una fecha contable válida." };
  }
  if (description.length < 3 || description.length > 240) {
    return { ok: false, message: "El concepto debe tener entre 3 y 240 caracteres." };
  }
  if (!fiscalYearId || fiscalYearId.length > 64 || !periodId || periodId.length > 64) {
    return { ok: false, message: "Selecciona un ejercicio y período contable." };
  }
  if (!Array.isArray(value.lines) || value.lines.length < 2 || value.lines.length > 50) {
    return { ok: false, message: "El asiento debe tener entre 2 y 50 líneas." };
  }

  const lines: JournalDraftLine[] = [];
  for (const rawLine of value.lines) {
    if (typeof rawLine !== "object" || rawLine === null) {
      return { ok: false, message: "Una línea del asiento no es válida." };
    }
    const line = rawLine as Record<string, unknown>;
    const accountId = typeof line.accountId === "string" ? line.accountId.trim() : "";
    const debit = parseScaledAmount(line.debit);
    const credit = parseScaledAmount(line.credit);
    const lineDescription = typeof line.description === "string" ? line.description.trim() : "";
    if (!accountId || accountId.length > 64 || debit === null || credit === null || lineDescription.length > 160) {
      return { ok: false, message: "Revisa la cuenta y los importes de cada línea (máximo 4 decimales)." };
    }
    lines.push({
      accountId,
      debit,
      credit,
      description: lineDescription || null,
    });
  }

  const totals = validateJournal(lines);
  if (!totals.ok) return { ok: false, message: totals.reason };

  return { ok: true, value: { entryDate, description, fiscalYearId, periodId, lines } };
}
