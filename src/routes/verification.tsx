import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, Clock, XCircle, CheckCircle2, Info } from "lucide-react";
import { DocumentChecklist, type VerificationDoc } from "@/components/DocumentChecklist";
import { StatusTimeline } from "@/components/StatusTimeline";

export const Route = createFileRoute("/verification")({
  head: () => ({ meta: [{ title: "Get verified — HireSpark" }] }),
  component: VerificationPage,
});

function VerificationPage() {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  if (role !== "developer") {
    return (
      <Shell>
        <h1 className="font-display text-2xl font-bold">Developers only</h1>
        <p className="mt-2 text-muted-foreground">Verification is for developer accounts.</p>
      </Shell>
    );
  }
  return (
    <Shell>
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Get verified</h1>
        <p className="mt-1 text-muted-foreground">
          Verified developers stand out to recruiters and earn trust faster.
        </p>
      </header>
      <VerificationContent userId={user.id} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">{children}</main>
      <Footer />
    </div>
  );
}

function VerificationContent({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-verification", userId],
    queryFn: async () => {
      const [{ data: dev }, { data: requests }] = await Promise.all([
        supabase.from("developer_profiles").select("is_verified").eq("id", userId).maybeSingle(),
        supabase.from("verification_requests").select("*").eq("developer_id", userId).order("created_at", { ascending: false }),
      ]);
      return {
        is_verified: !!dev?.is_verified,
        requests: requests ?? [],
        latest: requests?.[0] ?? null,
      };
    },
  });

  if (isLoading || !data) return <p className="mt-8 text-sm text-muted-foreground">Loading...</p>;

  const { is_verified, latest, requests } = data;

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current status</p>
            <div className="mt-1.5">
              {is_verified ? (
                <Badge className="bg-success text-success-foreground">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verified
                </Badge>
              ) : (
                <Badge variant="secondary">Unverified</Badge>
              )}
            </div>
          </div>
          {latest && <StatusBadge status={latest.status} />}
        </div>
      </div>

      {latest?.status === "pending" && <PendingNotice request={latest} userId={userId} onUpdated={() => qc.invalidateQueries({ queryKey: ["my-verification", userId] })} />}
      {latest?.status === "rejected" && <RejectedNotice request={latest} />}
      {(!latest || latest.status === "rejected") && (
        <RequestForm
          userId={userId}
          onSubmitted={() => qc.invalidateQueries({ queryKey: ["my-verification", userId] })}
          existing={latest?.status === "rejected" ? latest : null}
        />
      )}
      {is_verified && latest?.status === "approved" && (
        <div className="rounded-xl border border-success/30 bg-success/10 p-5 text-sm">
          <div className="flex items-center gap-2 font-medium text-success">
            <CheckCircle2 className="h-4 w-4" /> You're verified!
          </div>
          {latest.admin_notes && <p className="mt-2 whitespace-pre-wrap text-muted-foreground">Admin note: {latest.admin_notes}</p>}
        </div>
      )}

      {requests.length > 1 && (
        <section>
          <h2 className="font-display text-sm font-semibold text-muted-foreground">History</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {requests.slice(latest?.status === "pending" || latest?.status === "rejected" ? 1 : 0).map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="mr-1 h-3 w-3" /> Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
  return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
}

function PendingNotice({ request, userId, onUpdated }: { request: any; userId: string; onUpdated: () => void }) {
  async function withdraw() {
    if (!confirm("Withdraw your verification request?")) return;
    const { error } = await supabase.from("verification_requests").delete().eq("id", request.id);
    if (error) return toast.error(error.message);
    toast.success("Request withdrawn");
    onUpdated();
  }
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-5">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div className="flex-1 text-sm">
          <p className="font-medium">Your request is under review</p>
          <p className="mt-1 text-muted-foreground">
            Submitted {new Date(request.created_at).toLocaleDateString()}. We typically review within 2–3 business days.
          </p>
          <Button onClick={withdraw} size="sm" variant="outline" className="mt-3">Withdraw request</Button>
        </div>
      </div>
    </div>
  );
}

function RejectedNotice({ request }: { request: any }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm">
      <p className="font-medium text-destructive">Your last request was rejected</p>
      {request.admin_notes && <p className="mt-2 whitespace-pre-wrap">Reviewer feedback: {request.admin_notes}</p>}
      <p className="mt-2 text-muted-foreground">You can submit a new request below addressing the feedback.</p>
    </div>
  );
}

function RequestForm({ userId, existing, onSubmitted }: { userId: string; existing: any | null; onSubmitted: () => void }) {
  const [form, setForm] = useState({
    github_url: "",
    portfolio_url: "",
    linkedin_url: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      // Prefill from developer_profiles or last rejected request
      const { data: dev } = await supabase.from("developer_profiles").select("github_url, portfolio_url, linkedin_url").eq("id", userId).maybeSingle();
      setForm({
        github_url: existing?.github_url ?? dev?.github_url ?? "",
        portfolio_url: existing?.portfolio_url ?? dev?.portfolio_url ?? "",
        linkedin_url: existing?.linkedin_url ?? dev?.linkedin_url ?? "",
        notes: existing?.notes ?? "",
      });
    })();
  }, [userId, existing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.github_url && !form.portfolio_url && !form.linkedin_url) {
      toast.error("Please provide at least one link (GitHub, portfolio, or LinkedIn).");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("verification_requests").insert({
      developer_id: userId,
      github_url: form.github_url || null,
      portfolio_url: form.portfolio_url || null,
      linkedin_url: form.linkedin_url || null,
      notes: form.notes || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Verification request submitted!");
    onSubmitted();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
      <div>
        <h2 className="font-display text-lg font-semibold">Submit for verification</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share links to your work. Stronger evidence = faster approval.{" "}
          <Link to="/profile" className="underline underline-offset-2">Update your profile</Link> first if needed.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="github_url">GitHub profile</Label>
        <Input id="github_url" type="url" placeholder="https://github.com/yourname" value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="portfolio_url">Portfolio / website</Label>
        <Input id="portfolio_url" type="url" placeholder="https://your-portfolio.com" value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="linkedin_url">LinkedIn</Label>
        <Input id="linkedin_url" type="url" placeholder="https://linkedin.com/in/yourname" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Tell us about your experience (optional)</Label>
        <Textarea id="notes" rows={4} maxLength={1000} placeholder="Notable projects, years of experience, specialties..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-accent text-primary-foreground hover:opacity-90">
        {busy ? "Submitting..." : "Submit for review"}
      </Button>
    </form>
  );
}
