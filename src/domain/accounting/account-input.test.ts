import { describe, expect, it } from "vitest";
import { parseAccountInput } from "./account-input";

describe("parseAccountInput", () => {
  it("normalizes account labels and optional parent", () => {
    expect(parseAccountInput({
      code: " 1101 ", name: " Banco principal ", type: "ASSET", nature: "DEBIT", parentId: "",
    })).toEqual({
      ok: true,
      value: { code: "1101", name: "Banco principal", type: "ASSET", nature: "DEBIT", parentId: null },
    });
  });

  it.each([
    { code: "", name: "Caja", type: "ASSET", nature: "DEBIT" },
    { code: "1/1", name: "Caja", type: "ASSET", nature: "DEBIT" },
    { code: "1101", name: "x", type: "ASSET", nature: "DEBIT" },
    { code: "1101", name: "Caja", type: "UNKNOWN", nature: "DEBIT" },
    { code: "1101", name: "Caja", type: "ASSET", nature: "UNKNOWN" },
  ])("rejects malformed account input", (input) => {
    expect(parseAccountInput(input).ok).toBe(false);
  });
});
