export function normalizeRut(value: string): string {
  return value.replace(/[^0-9kK]/g, "").toUpperCase();
}

export function calculateRutVerifier(body: string): string | null {
  if (!/^\d{1,8}$/.test(body)) {
    return null;
  }

  let multiplier = 2;
  let sum = 0;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const result = 11 - (sum % 11);

  if (result === 11) return "0";
  if (result === 10) return "K";
  return String(result);
}

export function isValidRut(value: string): boolean {
  const normalized = normalizeRut(value);

  if (!/^\d{1,8}[0-9K]$/.test(normalized)) {
    return false;
  }

  const body = normalized.slice(0, -1);
  const verifier = normalized.slice(-1);

  return calculateRutVerifier(body) === verifier;
}

export function formatRut(value: string): string {
  const normalized = normalizeRut(value);

  if (normalized.length < 2) {
    return normalized;
  }

  const body = normalized.slice(0, -1);
  const verifier = normalized.slice(-1);
  const formattedBody = Number(body).toLocaleString("es-CL");

  return `${formattedBody}-${verifier}`;
}
