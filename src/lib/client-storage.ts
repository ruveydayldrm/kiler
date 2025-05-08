// localStorage erişimi — gizli sekme, kapalı depolama vb. durumlarda sessizce başarısız olur.

export const STORAGE_KEYS = {
  pantry: "kiler.pantry.v1",
  alwaysHave: "kiler.alwaysHave.v1",
  shopping: "kiler.shopping.v1",
  chat: "kiler.chat.v1",
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* depolama kapalı olabilir */
  }
}

export function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* yoksay */
  }
}

/** JSON API çağrısı; hata durumunda sunucunun Türkçe mesajını fırlatır. */
export async function api<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || "Bir şeyler ters gitti. Lütfen tekrar deneyin.");
  return data;
}
