import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeProjectRequirement } from "@/utils/ai-analysis.functions";

export const Route = createFileRoute("/projects/new")({
  head: () => ({ meta: [{ title: "Post a project | DeveloperConnect" }] }),
  component: NewProject,
});

const DEV_TYPES = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "fullstack", label: "Full Stack" },
  { value: "mobile", label: "Mobile" },
  { value: "devops", label: "DevOps" },
  { value: "data", label: "Data" },
  { value: "ai_ml", label: "AI/ML" },
  { value: "designer", label: "Designer" },
  { value: "other", label: "Other" },
];

function NewProject() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeProjectRequirement);
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    tech_stack: string[];
    budget_min_inr: number;
    budget_max_inr: number;
    developer_type: string;
    timeline: string;
    reasoning: string;
  } | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    tech_stack: "",
    project_type: "fixed" as "fixed" | "hourly",
    hiring_type: "part_time" as "part_time" | "weekly" | "monthly" | "ongoing",
    developer_type: "fullstack",
    work_mode: "remote" as "remote" | "hybrid" | "onsite",
    timeline: "",
    budget_min_inr: "",
    budget_max_inr: "",
    hours_per_week: "",
    duration_weeks: "",
  });

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  if (role !== "recruiter") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 mx-auto max-w-2xl p-10 text-center">
          <h1 className="font-display text-2xl font-bold">Recruiter accounts only</h1>
          <p className="mt-2 text-muted-foreground">Only recruiters can post projects.</p>
        </main>
        <Footer />
      </div>
    );
  }

  async function runAnalysis() {
    if (!form.title.trim() || form.description.trim().length < 10) {
      toast.error("Add a title and at least a short description first");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await analyze({ data: { title: form.title, description: form.description } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setSuggestions(res.suggestions);
      toast.success("AI suggestions ready");
    } catch (e: any) {
      toast.error(e?.message || "Failed to analyze");
    } finally {
      setAnalyzing(false);
    }
  }

  function applySuggestions() {
    if (!suggestions) return;
    setForm((f) => ({
      ...f,
      tech_stack: suggestions.tech_stack.join(", "),
      budget_min_inr: String(suggestions.budget_min_inr),
      budget_max_inr: String(suggestions.budget_max_inr),
      developer_type: suggestions.developer_type,
      timeline: f.timeline || suggestions.timeline,
    }));
    toast.success("Applied AI suggestions");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const techArray = form.tech_stack.split(",").map(s => s.trim()).filter(Boolean);
    const { data, error } = await supabase.from("projects").insert({
      recruiter_id: user.id,
      title: form.title,
      description: form.description,
      tech_stack: techArray,
      project_type: form.project_type,
      hiring_type: form.hiring_type,
      developer_type: form.developer_type as any,
      work_mode: form.work_mode,
      timeline: form.timeline || null,
      budget_min_inr: form.budget_min_inr ? Number(form.budget_min_inr) : null,
      budget_max_inr: form.budget_max_inr ? Number(form.budget_max_inr) : null,
      hours_per_week: form.hours_per_week ? Number(form.hours_per_week) : null,
      duration_weeks: form.duration_weeks ? Number(form.duration_weeks) : null,
      ai_suggestions: suggestions ?? null,
    }).select().single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Project posted!");
    navigate({ to: "/projects/$projectId", params: { projectId: data.id } });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Post a project</h1>
        <p className="mt-1 text-muted-foreground">Describe what you need built. AI will help structure it.</p>

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
          <Field label="Project title">
            <Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Build a Stripe-integrated checkout for our SaaS" maxLength={120} />
          </Field>
          <Field label="Description">
            <Textarea required rows={6} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Scope, deliverables, timeline, references..." maxLength={4000} />
          </Field>

          {/* AI Analysis */}
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-accent" /> AI requirement analysis
              </div>
              <Button type="button" size="sm" variant="outline" onClick={runAnalysis} disabled={analyzing}>
                {analyzing ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Analyzing...</> : "Analyze"}
              </Button>
            </div>
            {suggestions && (
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Suggested stack</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {suggestions.tech_stack.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <SuggestionItem label="Budget" value={`₹${suggestions.budget_min_inr.toLocaleString()}–${suggestions.budget_max_inr.toLocaleString()}`} />
                  <SuggestionItem label="Developer" value={DEV_TYPES.find(d => d.value === suggestions.developer_type)?.label ?? suggestions.developer_type} />
                  <SuggestionItem label="Timeline" value={suggestions.timeline} />
                </div>
                <p className="text-xs text-muted-foreground">{suggestions.reasoning}</p>
                <Button type="button" size="sm" variant="secondary" onClick={applySuggestions}>Apply suggestions</Button>
              </div>
            )}
          </div>

          <Field label="Tech stack (comma separated)">
            <Input required value={form.tech_stack} onChange={e => setForm({ ...form, tech_stack: e.target.value })} placeholder="React, Node.js, Postgres" />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type of developer">
              <Select value={form.developer_type} onValueChange={(v) => setForm({ ...form, developer_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEV_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Hiring type">
              <Select value={form.hiring_type} onValueChange={(v) => setForm({ ...form, hiring_type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="weekly">Weekly engagement</SelectItem>
                  <SelectItem value="monthly">Monthly engagement</SelectItem>
                  <SelectItem value="ongoing">Ongoing / regular</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Pricing model">
              <Select value={form.project_type} onValueChange={(v) => setForm({ ...form, project_type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed price</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Work mode">
              <Select value={form.work_mode} onValueChange={(v) => setForm({ ...form, work_mode: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={form.project_type === "hourly" ? "Min hourly (₹)" : "Min budget (₹)"}>
              <Input type="number" min={0} value={form.budget_min_inr} onChange={e => setForm({ ...form, budget_min_inr: e.target.value })} />
            </Field>
            <Field label={form.project_type === "hourly" ? "Max hourly (₹)" : "Max budget (₹)"}>
              <Input type="number" min={0} value={form.budget_max_inr} onChange={e => setForm({ ...form, budget_max_inr: e.target.value })} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Hours per week (optional)"><Input type="number" min={0} max={80} value={form.hours_per_week} onChange={e => setForm({ ...form, hours_per_week: e.target.value })} /></Field>
            <Field label="Duration / timeline">
              <Input value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })} placeholder="e.g. 8 weeks" />
            </Field>
          </div>

          <Button type="submit" disabled={busy} className="w-full bg-gradient-accent text-primary-foreground hover:opacity-90">
            {busy ? "Posting..." : "Post project"}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function SuggestionItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background/50 p-2.5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}
