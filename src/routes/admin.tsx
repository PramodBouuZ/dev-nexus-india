import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { ShieldCheck, ExternalLink, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { DocumentChecklist } from "@/components/DocumentChecklist";
import { StatusTimeline } from "@/components/StatusTimeline";

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
        <p className="mt-1 text-muted-foreground">Review verification requests and manage developers.</p>

        <Tabs defaultValue="queue" className="mt-8">
          <TabsList>
            <TabsTrigger value="queue">Verification queue</TabsTrigger>
            <TabsTrigger value="all">All developers</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="queue" className="mt-6"><VerificationQueue adminId={user.id} /></TabsContent>
          <TabsContent value="all" className="mt-6"><AllDevelopers /></TabsContent>
          <TabsContent value="stats" className="mt-6"><PlatformStats /></TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function VerificationQueue({ adminId }: { adminId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-vr-queue"],
    queryFn: async () => {
      const { data: reqs } = await supabase
        .from("verification_requests")
        .select("*")
        .order("created_at", { ascending: true });
      if (!reqs?.length) return [];
      const ids = [...new Set(reqs.map(r => r.developer_id))];
      const [{ data: profs }, { data: devs }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", ids),
        supabase.from("developer_profiles").select("id, headline, skills, experience_years").in("id", ids),
      ]);
      return reqs.map(r => ({
        ...r,
        profile: profs?.find(p => p.id === r.developer_id) ?? null,
        dev: devs?.find(d => d.id === r.developer_id) ?? null,
      }));
    },
  });

  const pending = data?.filter(r => r.status === "pending") ?? [];
  const recent = data?.filter(r => r.status !== "pending").slice(0, 20) ?? [];

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading queue...</p>;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Pending ({pending.length})</h2>
        </div>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No pending requests. 🎉</p>
        ) : (
          <div className="mt-4 space-y-3">
            {pending.map(r => <RequestCard key={r.id} request={r} adminId={adminId} onChange={() => qc.invalidateQueries({ queryKey: ["admin-vr-queue"] })} />)}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold">Recently reviewed</h2>
          <div className="mt-4 space-y-3">
            {recent.map(r => <RequestCard key={r.id} request={r} adminId={adminId} onChange={() => qc.invalidateQueries({ queryKey: ["admin-vr-queue"] })} compact />)}
          </div>
        </section>
      )}
    </div>
  );
}

function RequestCard({ request, adminId, onChange, compact = false }: { request: any; adminId: string; onChange: () => void; compact?: boolean }) {
  const [adminNotes, setAdminNotes] = useState(request.admin_notes ?? "");
  const [busy, setBusy] = useState(false);

  async function decide(status: "approved" | "rejected") {
    setBusy(true);
    const { error } = await supabase
      .from("verification_requests")
      .update({
        status,
        admin_notes: adminNotes.trim() || null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Approved & badge granted" : "Request rejected");
    onChange();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{request.profile?.full_name ?? "Unnamed"}</h3>
            <StatusPill status={request.status} />
          </div>
          <p className="text-xs text-muted-foreground">{request.profile?.email}</p>
          {request.dev?.headline && <p className="mt-1 text-sm text-muted-foreground">{request.dev.headline}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted {new Date(request.created_at).toLocaleDateString()}
            {request.reviewed_at && ` · Reviewed ${new Date(request.reviewed_at).toLocaleDateString()}`}
            {typeof request.dev?.experience_years === "number" && ` · ${request.dev.experience_years}y exp`}
          </p>
        </div>
      </div>

      {!compact && (
        <>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <LinkPill label="GitHub" url={request.github_url} />
            <LinkPill label="Portfolio" url={request.portfolio_url} />
            <LinkPill label="LinkedIn" url={request.linkedin_url} />
          </div>

          {request.notes && (
            <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Developer notes</p>
              <p className="mt-1 whitespace-pre-wrap">{request.notes}</p>
            </div>
          )}

          {request.dev?.skills?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {request.dev.skills.slice(0, 8).map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
          )}
        </>
      )}

      {request.status === "pending" ? (
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Admin note (optional, shown to developer)</Label>
            <Textarea rows={2} maxLength={500} value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="e.g. Great GitHub history, approved." />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => decide("approved")} className="bg-gradient-accent text-primary-foreground hover:opacity-90">
              <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
            </Button>
            <Button size="sm" disabled={busy} variant="outline" onClick={() => decide("rejected")}>
              <XCircle className="mr-1 h-4 w-4" /> Reject
            </Button>
          </div>
        </div>
      ) : request.admin_notes ? (
        <p className="mt-3 text-xs text-muted-foreground">Admin note: {request.admin_notes}</p>
      ) : null}
    </div>
  );
}

function LinkPill({ label, url }: { label: string; url: string | null }) {
  if (!url) return <div className="rounded-lg border border-dashed border-border p-2 text-xs text-muted-foreground">{label}: —</div>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-border bg-background p-2 text-xs hover:bg-muted">
      <span className="truncate"><span className="text-muted-foreground">{label}: </span>{url.replace(/^https?:\/\//, "")}</span>
      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
    </a>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="mr-1 h-3 w-3" /> Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
  return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
}

function AllDevelopers() {
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

  async function manualToggle(id: string, current: boolean) {
    const action = current ? "remove the verified badge from" : "manually grant the verified badge to";
    if (!confirm(`Are you sure you want to ${action} this developer? This bypasses the request flow.`)) return;
    const { error } = await supabase.from("developer_profiles").update({ is_verified: !current }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(current ? "Badge removed" : "Badge granted");
    qc.invalidateQueries({ queryKey: ["admin-devs"] });
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground">Manual override — for edge cases. Use the verification queue for normal reviews.</p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Headline</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.map(d => (
              <tr key={d.id} className="border-t border-border">
                <td className="p-3 font-medium">{d.profile?.full_name ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{d.profile?.email ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{d.headline ?? "—"}</td>
                <td className="p-3">
                  {d.is_verified ? (
                    <Badge className="bg-success text-success-foreground"><ShieldCheck className="mr-1 h-3 w-3" /> Verified</Badge>
                  ) : (
                    <Badge variant="secondary">Unverified</Badge>
                  )}
                </td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => manualToggle(d.id, d.is_verified)}>
                    {d.is_verified ? "Remove badge" : "Grant badge"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlatformStats() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [devs, recs, projs, contracts, pending] = await Promise.all([
        supabase.from("developer_profiles").select("id", { count: "exact", head: true }),
        supabase.from("recruiter_profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("contracts").select("id", { count: "exact", head: true }),
        supabase.from("verification_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        devs: devs.count ?? 0,
        recs: recs.count ?? 0,
        projs: projs.count ?? 0,
        contracts: contracts.count ?? 0,
        pending: pending.count ?? 0,
      };
    },
  });
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {[
        ["Developers", data.devs],
        ["Recruiters", data.recs],
        ["Projects", data.projs],
        ["Contracts", data.contracts],
        ["Pending verifications", data.pending],
      ].map(([label, v]) => (
        <div key={label as string} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 font-display text-3xl font-bold">{v}</div>
        </div>
      ))}
    </div>
  );
}
