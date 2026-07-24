import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AuthService, subscribe } from "./services";
import type { Role, User } from "./types";

interface AuthCtx {
  user: User | null;
  hasRole: (r: Role) => boolean;
  hasAnyRole: (rs: Role[]) => boolean;
  refresh: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    setUser(AuthService.currentUser());
    const unsub = subscribe(() => {
      setUser(AuthService.currentUser());
      force((x) => x + 1);
    });
    return unsub;
  }, []);

  const value: AuthCtx = {
    user,
    hasRole: (r) => !!user?.roles.includes(r),
    hasAnyRole: (rs) => !!user?.roles.some((x) => rs.includes(x)),
    refresh: () => setUser(AuthService.currentUser()),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

export function useLive<T>(getter: () => T): T {
  const [v, setV] = useState<T>(getter);
  useEffect(() => {
    setV(getter());
    return subscribe(() => setV(getter()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}