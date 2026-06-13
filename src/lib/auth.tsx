import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "developer" | "recruiter";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      console.log("Auth state change event:", event);
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        console.log("User detected in session:", sess.user.id);
        // defer to avoid deadlock
        setTimeout(() => fetchRole(sess.user.id), 0);
      } else {
        console.log("No user in session");
        setRole(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchRole(s.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchRole(uid: string) {
    // 1. Hardcode superadmin check for specific email
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.email === 'support@developerconnect.in') {
      setRole("admin");
      return;
    }

    // Check if there's a pending role from Google Sign Up
    const pendingRole = localStorage.getItem("pending_role") as AppRole | null;
    if (pendingRole && currentUser) {
      console.log("Applying pending role from Google Sign Up:", pendingRole);
      localStorage.removeItem("pending_role");

      // Update user metadata with the role
      await supabase.auth.updateUser({
        data: { role: pendingRole }
      });

      setRole(pendingRole);
      return;
    }

    // 2. Try auth metadata first for speed and session consistency
    const metaRole = currentUser?.user_metadata?.role as AppRole;

    if (metaRole) {
      console.log("Saved Role (from meta):", metaRole);
      setRole(metaRole);
      return;
    }

    // 2. Fallback to user_roles table
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .maybeSingle();

    const dbRole = data?.role as AppRole | undefined;
    setRole(dbRole ?? null);
  }

  async function signOut() {
    console.log("Signing out user:", user?.id);
    await supabase.auth.signOut();
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
