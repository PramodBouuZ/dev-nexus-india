import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — HireSpark" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  if (role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 mx-auto max-w-2xl p-10 text-center">
          <h1 className="font-display text-2xl font-bold">Admin only</h1>
          <p className="mt-2 text-muted-foreground">You don't have access to this page.</p>
        </main>
        <Footer />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">Admin panel</h1>
        <p className="mt-1 text-muted-foreground">Verify developers and oversee the platform.</p>
        <DevsToVerify />
        <PlatformStats />
      </main>
      <Footer />
    </div>
  );
}

function DevsToVerify() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-devs"],
    queryFn: async () => {
      const { data: devs } = await supabase.from("developer_profiles").select("*").order("created_at", { ascending: false });
      const ids = devs?.map(d => d.id) ?? [];
      const { data: profs } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      return devs?.map(d => ({ ...d, profile: profs?.find(p => p.id === d.id) ?? null })) ?? [];
    },
  });

  async function toggleVerify(id: string, current: boolean) {
    const { error } = await supabase.from("developer_profiles").update({ is_verified: !current }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Verification removed" : "Developer verified");
      qc.invalidateQueries({ queryKey: ["admin-devs"] });
    }
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold">Developers</h2>
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Headline</th><th className="p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {data?.map(d => (
              <tr key={d.id} className="border-t border-border">
                <td className="p-3 font-medium">{d.profile?.full_name ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{d.profile?.email ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{d.headline ?? "—"}</td>
                <td className="p-3">{d.is_verified ? <Badge className="bg-success text-success-foreground"><ShieldCheck className="mr-1 h-3 w-3" />Verified</Badge> : <Badge variant="secondary">Unverified</Badge>}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant={d.is_verified ? "outline" : "default"} onClick={() => toggleVerify(d.id, d.is_verified)}>
                    {d.is_verified ? "Unverify" : "Verify"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PlatformStats() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [devs, recs, projs, contracts] = await Promise.all([
        supabase.from("developer_profiles").select("id", { count: "exact", head: true }),
        supabase.from("recruiter_profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("contracts").select("id", { count: "exact", head: true }),
      ]);
      return { devs: devs.count ?? 0, recs: recs.count ?? 0, projs: projs.count ?? 0, contracts: contracts.count ?? 0 };
    },
  });
  if (!data) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold">Platform stats</h2>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[["Developers", data.devs], ["Recruiters", data.recs], ["Projects", data.projs], ["Contracts", data.contracts]].map(([label, v]) => (
          <div key={label as string} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-1 font-display text-3xl font-bold">{v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
