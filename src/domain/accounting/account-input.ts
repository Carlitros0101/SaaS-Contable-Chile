const accountTypes = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"] as const;
const accountNatures = ["DEBIT", "CREDIT"] as const;

export type AccountTypeValue = (typeof accountTypes)[number];
export type AccountNatureValue = (typeof accountNatures)[number];

export type AccountInput = {
  code: string;
  name: string;
  type: AccountTypeValue;
  nature: AccountNatureValue;
  parentId: string | null;
};

export type AccountInputResult =
  | { ok: true; value: AccountInput }
  | { ok: false; message: string };

export function parseAccountInput(input: unknown): AccountInputResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, message: "Completa los datos de la cuenta." };
  }

  const value = input as Record<string, unknown>;
  const code = typeof value.code === "string" ? value.code.trim() : "";
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const type = value.type;
  const nature = value.nature;
  const parentId = value.parentId === "" || value.parentId === undefined ? null : value.parentId;

  if (!/^[A-Za-z0-9][A-Za-z0-9.-]{0,19}$/.test(code)) {
    return { ok: false, message: "El código debe tener entre 1 y 20 caracteres alfanuméricos, puntos o guiones." };
  }
  if (name.length < 2 || name.length > 120) {
    return { ok: false, message: "El nombre debe tener entre 2 y 120 caracteres." };
  }
  if (!accountTypes.includes(type as AccountTypeValue)) {
    return { ok: false, message: "Selecciona una clasificación válida." };
  }
  if (!accountNatures.includes(nature as AccountNatureValue)) {
    return { ok: false, message: "Selecciona una naturaleza válida." };
  }
  if (parentId !== null && (typeof parentId !== "string" || parentId.length > 64)) {
    return { ok: false, message: "La cuenta agrupadora no es válida." };
  }

  return {
    ok: true,
    value: { code, name, type: type as AccountTypeValue, nature: nature as AccountNatureValue, parentId },
  };
}
