import { describe, expect, it } from "vitest";
import { starterChart } from "./starter-chart";

describe("starter chart template", () => {
  it("has unique codes, valid parent order, and parent/child classification consistency", () => {
    const byCode = new Map<string, (typeof starterChart)[number]>();
    for (const account of starterChart) {
      expect(byCode.has(account.code)).toBe(false);
      if (account.parentCode) {
        const parent = byCode.get(account.parentCode);
        expect(parent).toBeDefined();
        expect(account.type).toBe(parent?.type);
      }
      byCode.set(account.code, account);
    }
    expect(starterChart.length).toBeGreaterThan(20);
  });
});
