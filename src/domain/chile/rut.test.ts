import { describe, expect, it } from "vitest";
import { calculateRutVerifier, formatRut, isValidRut, normalizeRut } from "./rut";

describe("RUT chileno", () => {
  it("normaliza puntos, guion y dígito K", () => {
    expect(normalizeRut("12.345.678-k")).toBe("12345678K");
  });

  it("calcula el dígito verificador con módulo 11", () => {
    expect(calculateRutVerifier("76123456")).toBe("0");
    expect(calculateRutVerifier("12345678")).toBe("5");
  });

  it("acepta un RUT matemáticamente válido", () => {
    expect(isValidRut("76.123.456-0")).toBe(true);
    expect(isValidRut("12.345.678-5")).toBe(true);
  });

  it("rechaza un dígito verificador incorrecto", () => {
    expect(isValidRut("76.123.456-1")).toBe(false);
  });

  it("formatea un RUT normalizado", () => {
    expect(formatRut("761234560")).toBe("76.123.456-0");
  });
});
