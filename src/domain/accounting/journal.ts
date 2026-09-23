export type JournalLineInput = {
  accountId: string;
  debit: bigint;
  credit: bigint;
};

export type JournalValidationResult =
  | { ok: true; totalDebit: bigint; totalCredit: bigint }
  | { ok: false; reason: string; totalDebit: bigint; totalCredit: bigint };

export function validateJournal(lines: JournalLineInput[]): JournalValidationResult {
  if (lines.length < 2) {
    return {
      ok: false,
      reason: "Un asiento debe contener al menos dos líneas.",
      totalDebit: 0n,
      totalCredit: 0n,
    };
  }

  let totalDebit = 0n;
  let totalCredit = 0n;

  for (const line of lines) {
    if (line.accountId.trim().length === 0) {
      return {
        ok: false,
        reason: "Todas las líneas requieren una cuenta contable.",
        totalDebit,
        totalCredit,
      };
    }

    if (line.debit < 0n || line.credit < 0n) {
      return {
        ok: false,
        reason: "Débitos y créditos no pueden ser negativos.",
        totalDebit,
        totalCredit,
      };
    }

    const hasDebit = line.debit > 0n;
    const hasCredit = line.credit > 0n;

    if (hasDebit === hasCredit) {
      return {
        ok: false,
        reason: "Cada línea debe contener débito o crédito, pero no ambos.",
        totalDebit,
        totalCredit,
      };
    }

    totalDebit += line.debit;
    totalCredit += line.credit;
  }

  if (totalDebit !== totalCredit) {
    return {
      ok: false,
      reason: "El asiento está descuadrado.",
      totalDebit,
      totalCredit,
    };
  }

  return { ok: true, totalDebit, totalCredit };
}

export function assertPostableJournal(lines: JournalLineInput[]): void {
  const validation = validateJournal(lines);

  if (!validation.ok) {
    throw new Error(validation.reason);
  }
}
