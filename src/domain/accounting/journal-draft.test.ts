import { describe, expect, it } from "vitest";
import { parseJournalDraftInput, parseScaledAmount, scaledAmountToDecimal } from "./journal-draft";

const validDraft = {
  entryDate: "2026-09-23",
  description: "Aporte inicial de capital",
  fiscalYearId: "year_1",
  periodId: "period_9",
  lines: [
    { accountId: "account_cash", debit: "1000", credit: "0", description: "Ingreso banco" },
    { accountId: "account_equity", debit: "0", credit: "1000.0000", description: "Capital" },
  ],
};

describe("journal draft decimal parsing", () => {
  it("parses exact decimal amounts without floating point", () => {
    expect(parseScaledAmount("123456789012345.6789")).toBe(1_234_567_890_123_456_789n);
    expect(parseScaledAmount("1.2")).toBe(12_000n);
    expect(scaledAmountToDecimal(12_340n)).toBe("1.2340");
  });

  it.each(["-1", "1e3", "1,25", "1.12345", "1000000000000000", ""]) (
    "rejects unsupported amount %s",
    (amount) => expect(parseScaledAmount(amount)).toBeNull(),
  );

  it("accepts a balanced draft and rejects an unbalanced one", () => {
    expect(parseJournalDraftInput(validDraft).ok).toBe(true);
    const unbalanced = { ...validDraft, lines: [validDraft.lines[0], { ...validDraft.lines[1], credit: "999" }] };
    expect(parseJournalDraftInput(unbalanced)).toMatchObject({ ok: false, message: "El asiento está descuadrado." });
  });

  it("rejects impossible dates and excessive line counts", () => {
    expect(parseJournalDraftInput({ ...validDraft, entryDate: "2026-02-30" }).ok).toBe(false);
    expect(parseJournalDraftInput({ ...validDraft, lines: Array(51).fill(validDraft.lines[0]) }).ok).toBe(false);
  });
});
