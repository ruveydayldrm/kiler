"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface ClientUser {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
}

const UserContext = createContext<ClientUser | null>(null);

export const useUser = () => useContext(UserContext);

/**
 * Oturum bilgisi sunucudaki kök layout'tan gelir. Sunucu tarafı giriş/çıkıştan sonra
 * istemci tarafındaki oturum eski kalabilir; bu yüzden rota değişimlerinde hafif bir
 * /api/session kontrolü yapılır ve fark varsa sayfa tazelenir.
 */
export function UserProvider({ initialUser, children }: { initialUser: ClientUser | null; children: React.ReactNode }) {
  const [user, setUser] = useState(initialUser);
  const pathname = usePathname();
  const router = useRouter();
  const first = useRef(true);

  useEffect(() => setUser(initialUser), [initialUser]);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let cancelled = false;
    fetch("/api/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { user: ClientUser | null }) => {
        if (cancelled) return;
        if ((data.user?.id ?? null) !== (user?.id ?? null) || data.user?.role !== user?.role) {
          setUser(data.user);
          router.refresh();
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Yalnızca rota değişiminde çalışsın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
