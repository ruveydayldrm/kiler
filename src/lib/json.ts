// SQLite/PostgreSQL uyumluluğu için diziler ve nesneler JSON metni olarak saklanır.

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export const parseList = (value: string | null | undefined): string[] => {
  const parsed = parseJson<unknown>(value, []);
  return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
};

export const toJson = (value: unknown) => JSON.stringify(value ?? null);
