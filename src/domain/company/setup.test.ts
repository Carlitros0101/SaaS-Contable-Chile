import { describe, expect, it } from "vitest";
import { buildMonthlyPeriods, validateCompanySetup } from "./setup";

const validInput = {
  rut: "76.123.456-0",
  legalName: "Empresa de Prueba SpA",
  fiscalYear: "2024",
  planTemplate: "standard" as const,
};

describe("validateCompanySetup", () => {
  it("normalizes and accepts valid company data", () => {
    expect(validateCompanySetup(validInput)).toEqual({
      ok: true,
      value: {
        rut: "761234560",
        legalName: "Empresa de Prueba SpA",
        tradeName: null,
        fiscalYear: 2024,
        planTemplate: "STANDARD",
        taxRegime: null,
        economicActivity: null,
      },
    });
  });

  it("rejects invalid RUTs and malformed fiscal years", () => {
    expect(validateCompanySetup({ ...validInput, rut: "76.123.456-1" }).ok).toBe(false);
    expect(validateCompanySetup({ ...validInput, fiscalYear: "2024.5" }).ok).toBe(false);
  });

  it("rejects malformed server-action payloads", () => {
    expect(validateCompanySetup(null).ok).toBe(false);
    expect(validateCompanySetup({ ...validInput, legalName: 42 }).ok).toBe(false);
  });

  it("trims optional values and stores custom plan selection", () => {
    const result = validateCompanySetup({
      ...validInput,
      tradeName: "  Prueba  ",
      taxRegime: "  Pro Pyme  ",
      economicActivity: "  Servicios  ",
      planTemplate: "custom",
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        tradeName: "Prueba",
        taxRegime: "Pro Pyme",
        economicActivity: "Servicios",
        planTemplate: "CUSTOM",
      },
    });
  });
});

describe("buildMonthlyPeriods", () => {
  it("returns twelve UTC periods with correct leap-year boundaries", () => {
    const periods = buildMonthlyPeriods(2024);

    expect(periods).toHaveLength(12);
    expect(periods[0]).toEqual({
      number: 1,
      startDate: new Date("2024-01-01T00:00:00.000Z"),
      endDate: new Date("2024-01-31T00:00:00.000Z"),
    });
    expect(periods[1]?.endDate).toEqual(new Date("2024-02-29T00:00:00.000Z"));
    expect(periods[11]?.endDate).toEqual(new Date("2024-12-31T00:00:00.000Z"));
  });

  it("rejects invalid exercise years", () => {
    expect(() => buildMonthlyPeriods(1999)).toThrow(RangeError);
  });
});
