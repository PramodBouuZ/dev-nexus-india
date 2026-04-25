import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My profile — HireSpark" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Edit profile</h1>
        <p className="mt-1 text-muted-foreground">Keep your profile up to date to get better matches.</p>
        <div className="mt-8">
          {role === "recruiter" ? <RecruiterForm userId={user.id} /> : <DeveloperForm userId={user.id} />}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DeveloperForm({ userId }: { userId: string }) {
  const [form, setForm] = useState({
    full_name: "", headline: "", bio: "", skills: "",
    hourly_rate_inr: "", availability_hours_per_week: "", experience_years: "",
    github_url: "", portfolio_url: "", linkedin_url: "", location: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: prof }, { data: dev }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("developer_profiles").select("*").eq("id", userId).maybeSingle(),
      ]);
      setForm({
        full_name: prof?.full_name ?? "",
        headline: dev?.headline ?? "",
        bio: dev?.bio ?? "",
        skills: dev?.skills?.join(", ") ?? "",
        hourly_rate_inr: dev?.hourly_rate_inr?.toString() ?? "",
        availability_hours_per_week: dev?.availability_hours_per_week?.toString() ?? "",
        experience_years: dev?.experience_years?.toString() ?? "",
        github_url: dev?.github_url ?? "",
        portfolio_url: dev?.portfolio_url ?? "",
        linkedin_url: dev?.linkedin_url ?? "",
        location: dev?.location ?? "",
      });
    })();
  }, [userId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const skills = form.skills.split(",").map(s => s.trim()).filter(Boolean);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("profiles").update({ full_name: form.full_name }).eq("id", userId),
      supabase.from("developer_profiles").upsert({
        id: userId,
        headline: form.headline,
        bio: form.bio,
        skills,
        hourly_rate_inr: form.hourly_rate_inr ? Number(form.hourly_rate_inr) : null,
        availability_hours_per_week: form.availability_hours_per_week ? Number(form.availability_hours_per_week) : null,
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        github_url: form.github_url || null,
        portfolio_url: form.portfolio_url || null,
        linkedin_url: form.linkedin_url || null,
        location: form.location || null,
      }),
    ]);
    setBusy(false);
    if (e1 || e2) { toast.error((e1 || e2)!.message); return; }
    toast.success("Profile saved!");
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
      <Field label="Full name"><Input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></Field>
      <Field label="Headline"><Input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="Full-stack engineer · React, Node, Postgres" maxLength={140} /></Field>
      <Field label="Bio"><Textarea rows={4} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} maxLength={2000} /></Field>
      <Field label="Skills (comma separated)"><Input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="React, TypeScript, Node.js" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Hourly rate (₹)"><Input type="number" min={0} value={form.hourly_rate_inr} onChange={e => setForm({ ...form, hourly_rate_inr: e.target.value })} /></Field>
        <Field label="Availability (hrs/week)"><Input type="number" min={0} max={40} value={form.availability_hours_per_week} onChange={e => setForm({ ...form, availability_hours_per_week: e.target.value })} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Experience (years)"><Input type="number" min={0} value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} /></Field>
        <Field label="Location"><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Bengaluru" /></Field>
      </div>
      <Field label="GitHub URL"><Input type="url" value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })} /></Field>
      <Field label="Portfolio URL"><Input type="url" value={form.portfolio_url} onChange={e => setForm({ ...form, portfolio_url: e.target.value })} /></Field>
      <Field label="LinkedIn URL"><Input type="url" value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} /></Field>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-accent text-primary-foreground hover:opacity-90">{busy ? "Saving..." : "Save profile"}</Button>
    </form>
  );
}

function RecruiterForm({ userId }: { userId: string }) {
  const [form, setForm] = useState({
    full_name: "", company_name: "", company_website: "", company_description: "",
    company_size: "", industry: "", location: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: prof }, { data: rec }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("recruiter_profiles").select("*").eq("id", userId).maybeSingle(),
      ]);
      setForm({
        full_name: prof?.full_name ?? "",
        company_name: rec?.company_name ?? "",
        company_website: rec?.company_website ?? "",
        company_description: rec?.company_description ?? "",
        company_size: rec?.company_size ?? "",
        industry: rec?.industry ?? "",
        location: rec?.location ?? "",
      });
    })();
  }, [userId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("profiles").update({ full_name: form.full_name }).eq("id", userId),
      supabase.from("recruiter_profiles").upsert({
        id: userId,
        company_name: form.company_name,
        company_website: form.company_website || null,
        company_description: form.company_description || null,
        company_size: form.company_size || null,
        industry: form.industry || null,
        location: form.location || null,
      }),
    ]);
    setBusy(false);
    if (e1 || e2) { toast.error((e1 || e2)!.message); return; }
    toast.success("Profile saved!");
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
      <Field label="Your name"><Input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></Field>
      <Field label="Company name"><Input required value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></Field>
      <Field label="Company website"><Input type="url" value={form.company_website} onChange={e => setForm({ ...form, company_website: e.target.value })} /></Field>
      <Field label="About the company"><Textarea rows={3} value={form.company_description} onChange={e => setForm({ ...form, company_description: e.target.value })} maxLength={1000} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Industry"><Input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="Fintech" /></Field>
        <Field label="Size"><Input value={form.company_size} onChange={e => setForm({ ...form, company_size: e.target.value })} placeholder="10–50" /></Field>
      </div>
      <Field label="Location"><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Bengaluru" /></Field>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-accent text-primary-foreground hover:opacity-90">{busy ? "Saving..." : "Save profile"}</Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
