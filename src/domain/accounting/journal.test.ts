import { describe, expect, it } from "vitest";
import { assertPostableJournal, validateJournal, type JournalLineInput } from "./journal";

const balancedEntry: JournalLineInput[] = [
  { accountId: "1101", debit: 150_000n, credit: 0n },
  { accountId: "2101", debit: 0n, credit: 150_000n },
];

describe("validateJournal", () => {
  it("accepts balanced entries and returns exact totals", () => {
    expect(validateJournal(balancedEntry)).toEqual({
      ok: true,
      totalDebit: 150_000n,
      totalCredit: 150_000n,
    });
  });

  it("rejects entries with fewer than two lines", () => {
    expect(validateJournal([balancedEntry[0]])).toMatchObject({
      ok: false,
      reason: "Un asiento debe contener al menos dos líneas.",
    });
  });

  it.each(["", "   "])("rejects a blank account identifier", (accountId) => {
    expect(validateJournal([
      { accountId, debit: 1n, credit: 0n },
      { accountId: "2101", debit: 0n, credit: 1n },
    ])).toMatchObject({
      ok: false,
      reason: "Todas las líneas requieren una cuenta contable.",
    });
  });

  it("rejects negative amounts", () => {
    expect(validateJournal([
      { accountId: "1101", debit: -1n, credit: 0n },
      { accountId: "2101", debit: 0n, credit: -1n },
    ])).toMatchObject({ ok: false, reason: "Débitos y créditos no pueden ser negativos." });
  });

  it.each([
    { accountId: "1101", debit: 0n, credit: 0n },
    { accountId: "1101", debit: 1n, credit: 1n },
  ])("requires each line to contain exactly one positive side", (line) => {
    expect(validateJournal([
      line,
      { accountId: "2101", debit: 0n, credit: 1n },
    ])).toMatchObject({
      ok: false,
      reason: "Cada línea debe contener débito o crédito, pero no ambos.",
    });
  });

  it("rejects unbalanced entries and preserves the compared totals", () => {
    expect(validateJournal([
      { accountId: "1101", debit: 100n, credit: 0n },
      { accountId: "2101", debit: 0n, credit: 99n },
    ])).toEqual({
      ok: false,
      reason: "El asiento está descuadrado.",
      totalDebit: 100n,
      totalCredit: 99n,
    });
  });
});

describe("assertPostableJournal", () => {
  it("does not throw for a valid entry", () => {
    expect(() => assertPostableJournal(balancedEntry)).not.toThrow();
  });

  it("throws the validation reason for an invalid entry", () => {
    expect(() => assertPostableJournal([
      { accountId: "1101", debit: 100n, credit: 0n },
      { accountId: "2101", debit: 0n, credit: 99n },
    ])).toThrow("El asiento está descuadrado.");
  });
});
