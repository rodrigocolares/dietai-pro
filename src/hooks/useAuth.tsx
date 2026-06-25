import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type Role = "super_admin" | "admin" | "nutricionista" | "cliente";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  rolesLoading: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);

  const loadRoles = async (uid: string) => {
    setRolesLoading(true);
    try {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (error) {
        console.error("[auth] loadRoles error:", error);
        setRoles([]);
      } else {
        const list = (data ?? []).map((r: { role: Role }) => r.role);
        if (list.length === 0) {
          console.warn("[auth] user has no roles, defaulting to 'cliente'", uid);
          const { error: insErr } = await supabase
            .from("user_roles")
            .insert({ user_id: uid, role: "cliente" });
          if (insErr) console.error("[auth] failed to create default role:", insErr);
          setRoles(["cliente"]);
        } else {
          setRoles(list);
        }
      }
    } catch (e) {
      console.error("[auth] loadRoles exception:", e);
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadRoles(sess.user.id), 0);
      } else {
        setRoles([]);
        setRolesLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadRoles(session.user.id);
      setLoading(false);
    }).catch((e) => {
      console.error("[auth] getSession error:", e);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshRoles = async () => {
    if (user) await loadRoles(user.id);
  };

  return (
    <Ctx.Provider value={{ user, session, roles, loading, rolesLoading, signOut, refreshRoles }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
