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
  setUserRole: (newRole: AppRole) => Promise<void>;
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
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (currentUser?.email === "info.bouuz@gmail.com") {
      setRole("admin");
      return;
    }

    // Check if there's a pending role from Google Sign Up
    const pendingRole = localStorage.getItem("pending_role") as AppRole | null;
    if (pendingRole && currentUser) {
      console.log("Applying pending role from Google Sign Up:", pendingRole);
      localStorage.removeItem("pending_role");
      await setUserRole(pendingRole);
      return;
    }

    // 2. Try auth metadata first for speed and session consistency
    const metaRole = currentUser?.user_metadata?.role as AppRole;

    if (metaRole) {
      console.log("Saved Role (from meta):", metaRole);
      setRole(metaRole);
      return;
    }

    // 3. Fallback to user_roles table
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .maybeSingle();

    let dbRole = data?.role as AppRole | undefined;

    // 4. Fallback check developer_profiles and recruiter_profiles
    if (!dbRole) {
      const [{ data: devProf }, { data: recProf }] = await Promise.all([
        supabase.from("developer_profiles").select("id").eq("id", uid).maybeSingle(),
        supabase.from("recruiter_profiles").select("id").eq("id", uid).maybeSingle(),
      ]);

      if (devProf) dbRole = "developer";
      else if (recProf) dbRole = "recruiter";
    }

    if (dbRole) {
      if (currentUser && !metaRole) {
        await supabase.auth.updateUser({
          data: { role: dbRole },
        });
      }
      setRole(dbRole);
    } else {
      setRole(null);
    }
  }

  async function setUserRole(newRole: AppRole) {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    const u = currentUser || user;
    if (!u) return;

    console.log("Setting user role to:", newRole, "for user:", u.id);

    // 1. Update user metadata with the role
    const { error: metaErr } = await supabase.auth.updateUser({
      data: { role: newRole },
    });
    if (metaErr) console.error("Error updating user metadata role:", metaErr.message);

    // 2. Ensure user_roles record exists
    const { error: roleErr } = await supabase.from("user_roles").upsert({
      user_id: u.id,
      role: newRole,
    } as any);
    if (roleErr) console.error("Error upserting user_roles:", roleErr.message);

    // 3. Ensure profile record exists in developer_profiles or recruiter_profiles
    const fullName = u.user_metadata?.full_name || u.email?.split("@")[0] || "User";
    if (newRole === "developer") {
      const { error: devErr } = await supabase.from("developer_profiles").upsert({
        id: u.id,
        full_name: fullName,
        avatar_url: u.user_metadata?.avatar_url || null,
      } as any);
      if (devErr) console.error("Error creating developer profile:", devErr.message);
    } else if (newRole === "recruiter") {
      const { error: recErr } = await supabase.from("recruiter_profiles").upsert({
        id: u.id,
        full_name: fullName,
        company_name: "Company",
        avatar_url: u.user_metadata?.avatar_url || null,
      } as any);
      if (recErr) console.error("Error creating recruiter profile:", recErr.message);
    }

    setRole(newRole);
  }

  async function signOut() {
    console.log("Signing out user:", user?.id);
    await supabase.auth.signOut();
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut, setUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
