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
import { toast } from "sonner";

export const Route = createFileRoute("/projects/new")({
  head: () => ({ meta: [{ title: "Post a project — HireSpark" }] }),
  component: NewProject,
});

function NewProject() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    tech_stack: "",
    project_type: "fixed" as "fixed" | "hourly",
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
      budget_min_inr: form.budget_min_inr ? Number(form.budget_min_inr) : null,
      budget_max_inr: form.budget_max_inr ? Number(form.budget_max_inr) : null,
      hours_per_week: form.hours_per_week ? Number(form.hours_per_week) : null,
      duration_weeks: form.duration_weeks ? Number(form.duration_weeks) : null,
    }).select().single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Project posted!");
    navigate({ to: "/projects/$projectId", params: { projectId: data.id } });
  }

  // smart pricing suggestion
  const suggestion = suggestPrice(form.title, form.description, form.project_type);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Post a project</h1>
        <p className="mt-1 text-muted-foreground">Describe what you need built. We'll match you with developers.</p>

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
          <Field label="Project title">
            <Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Build a Stripe-integrated checkout for our SaaS" maxLength={120} />
          </Field>
          <Field label="Description">
            <Textarea required rows={6} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Scope, deliverables, timeline, references..." maxLength={4000} />
          </Field>
          <Field label="Tech stack (comma separated)">
            <Input required value={form.tech_stack} onChange={e => setForm({ ...form, tech_stack: e.target.value })} placeholder="React, Node.js, Postgres" />
          </Field>
          <Field label="Project type">
            <Select value={form.project_type} onValueChange={(v) => setForm({ ...form, project_type: v as "fixed" | "hourly" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed price</SelectItem>
                <SelectItem value="hourly">Part-time hourly</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {suggestion && (
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
              💡 <strong>Suggested {form.project_type === "hourly" ? "hourly rate" : "budget"}:</strong> ₹{suggestion.min.toLocaleString()}–₹{suggestion.max.toLocaleString()} <span className="text-muted-foreground">({suggestion.reason})</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label={form.project_type === "hourly" ? "Min hourly (₹)" : "Min budget (₹)"}>
              <Input type="number" min={0} value={form.budget_min_inr} onChange={e => setForm({ ...form, budget_min_inr: e.target.value })} />
            </Field>
            <Field label={form.project_type === "hourly" ? "Max hourly (₹)" : "Max budget (₹)"}>
              <Input type="number" min={0} value={form.budget_max_inr} onChange={e => setForm({ ...form, budget_max_inr: e.target.value })} />
            </Field>
          </div>
          {form.project_type === "hourly" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hours per week"><Input type="number" min={1} max={40} value={form.hours_per_week} onChange={e => setForm({ ...form, hours_per_week: e.target.value })} /></Field>
              <Field label="Duration (weeks)"><Input type="number" min={1} value={form.duration_weeks} onChange={e => setForm({ ...form, duration_weeks: e.target.value })} /></Field>
            </div>
          )}

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

function suggestPrice(title: string, desc: string, type: "fixed" | "hourly") {
  const text = `${title} ${desc}`.toLowerCase();
  if (!text.trim()) return null;
  if (type === "hourly") {
    if (/senior|architect|lead/.test(text)) return { min: 2500, max: 5000, reason: "Senior-level work" };
    if (/ai|ml|llm|machine learning/.test(text)) return { min: 2000, max: 4500, reason: "AI/ML specialty" };
    if (/devops|kubernetes|infra/.test(text)) return { min: 1800, max: 3500, reason: "DevOps work" };
    if (/bug|fix/.test(text)) return { min: 600, max: 1500, reason: "Bug fixing" };
    return { min: 1000, max: 2500, reason: "Standard development" };
  }
  if (/landing page|portfolio site/.test(text)) return { min: 15000, max: 50000, reason: "Landing page" };
  if (/api integration|integration/.test(text)) return { min: 25000, max: 80000, reason: "API integration" };
  if (/mvp|prototype/.test(text)) return { min: 80000, max: 300000, reason: "MVP build" };
  if (/dashboard|admin panel/.test(text)) return { min: 60000, max: 200000, reason: "Dashboard build" };
  if (/bug|fix/.test(text)) return { min: 5000, max: 25000, reason: "Bug fixing" };
  return { min: 30000, max: 150000, reason: "Standard project" };
}
