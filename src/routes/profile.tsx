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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile | DeveloperConnect" }] }),
  component: ProfilePage,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
    hourly_rate_inr: "", weekly_rate_inr: "", monthly_rate_inr: "", project_min_inr: "",
    availability_hours_per_week: "", hours_per_day: "", time_slots: "",
    experience_years: "",
    github_url: "", portfolio_url: "", linkedin_url: "", location: "",
    work_preference: "both" as "part_time" | "full_time" | "both",
    developer_type: "fullstack",
    phone: "",
    available_days: [] as string[],
    contact_public: false,
    avatar_url: null as string | null,
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
        weekly_rate_inr: dev?.weekly_rate_inr?.toString() ?? "",
        monthly_rate_inr: dev?.monthly_rate_inr?.toString() ?? "",
        project_min_inr: dev?.project_min_inr?.toString() ?? "",
        availability_hours_per_week: dev?.availability_hours_per_week?.toString() ?? "",
        hours_per_day: dev?.hours_per_day?.toString() ?? "",
        time_slots: dev?.time_slots ?? "",
        experience_years: dev?.experience_years?.toString() ?? "",
        github_url: dev?.github_url ?? "",
        portfolio_url: dev?.portfolio_url ?? "",
        linkedin_url: dev?.linkedin_url ?? "",
        location: dev?.location ?? "",
        work_preference: (dev?.work_preference as any) ?? "both",
        developer_type: (dev?.developer_type as any) ?? "fullstack",
        phone: dev?.phone ?? "",
        available_days: dev?.available_days ?? [],
        contact_public: (dev as any)?.contact_public ?? false,
        avatar_url: prof?.avatar_url ?? null,
      });
    })();
  }, [userId]);

  function toggleDay(d: string) {
    setForm((f) => ({
      ...f,
      available_days: f.available_days.includes(d)
        ? f.available_days.filter((x) => x !== d)
        : [...f.available_days, d],
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const skills = form.skills.split(",").map(s => s.trim()).filter(Boolean);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("profiles").update({ full_name: form.full_name, avatar_url: form.avatar_url }).eq("id", userId),
      supabase.from("developer_profiles").upsert({
        id: userId,
        headline: form.headline,
        bio: form.bio,
        skills,
        hourly_rate_inr: form.hourly_rate_inr ? Number(form.hourly_rate_inr) : null,
        weekly_rate_inr: form.weekly_rate_inr ? Number(form.weekly_rate_inr) : null,
        monthly_rate_inr: form.monthly_rate_inr ? Number(form.monthly_rate_inr) : null,
        project_min_inr: form.project_min_inr ? Number(form.project_min_inr) : null,
        availability_hours_per_week: form.availability_hours_per_week ? Number(form.availability_hours_per_week) : null,
        hours_per_day: form.hours_per_day ? Number(form.hours_per_day) : null,
        time_slots: form.time_slots || null,
        experience_years: form.experience_years ? Number(form.experience_years) : null,
        github_url: form.github_url || null,
        portfolio_url: form.portfolio_url || null,
        linkedin_url: form.linkedin_url || null,
        location: form.location || null,
        work_preference: form.work_preference,
        developer_type: form.developer_type as any,
        phone: form.phone || null,
        available_days: form.available_days,
        contact_public: form.contact_public,
      } as any),
    ]);
    setBusy(false);
    if (e1 || e2) { toast.error((e1 || e2)!.message); return; }
    toast.success("Profile saved!");
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
      <Section title="Basics">
        <ImageUpload
          userId={userId}
          value={form.avatar_url}
          onChange={(url) => setForm({ ...form, avatar_url: url })}
          shape="circle"
          fallback="user"
          folder="avatar"
          label="Profile photo (shown to recruiters)"
        />
        <Field label="Full name"><Input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></Field>
        <Field label="Headline"><Input value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} placeholder="Full-stack engineer · React, Node, Postgres" maxLength={140} /></Field>
        <Field label="Bio"><Textarea rows={4} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} maxLength={2000} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Developer type">
            <Select value={form.developer_type} onValueChange={(v) => setForm({ ...form, developer_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEV_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Looking for">
            <Select value={form.work_preference} onValueChange={(v) => setForm({ ...form, work_preference: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="part_time">Part-time</SelectItem>
                <SelectItem value="full_time">Full-time</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="Skills (comma separated)"><Input value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="React, TypeScript, Node.js" /></Field>
      </Section>

      <Section title="Availability">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Hours / day"><Input type="number" min={0} max={24} value={form.hours_per_day} onChange={e => setForm({ ...form, hours_per_day: e.target.value })} /></Field>
          <Field label="Hours / week"><Input type="number" min={0} max={80} value={form.availability_hours_per_week} onChange={e => setForm({ ...form, availability_hours_per_week: e.target.value })} /></Field>
          <Field label="Experience (yrs)"><Input type="number" min={0} value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} /></Field>
        </div>
        <div>
          <Label>Available days</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {DAYS.map(d => (
              <label key={d} className="flex items-center gap-1.5 text-sm">
                <Checkbox checked={form.available_days.includes(d)} onCheckedChange={() => toggleDay(d)} />
                {d}
              </label>
            ))}
          </div>
        </div>
        <Field label="Time slots (optional)"><Input value={form.time_slots} onChange={e => setForm({ ...form, time_slots: e.target.value })} placeholder="e.g. 6 PM – 10 PM IST" /></Field>
      </Section>

      <Section title="Pricing (set your minimums)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Hourly (₹)"><Input type="number" min={0} value={form.hourly_rate_inr} onChange={e => setForm({ ...form, hourly_rate_inr: e.target.value })} /></Field>
          <Field label="Weekly (₹)"><Input type="number" min={0} value={form.weekly_rate_inr} onChange={e => setForm({ ...form, weekly_rate_inr: e.target.value })} /></Field>
          <Field label="Monthly (₹)"><Input type="number" min={0} value={form.monthly_rate_inr} onChange={e => setForm({ ...form, monthly_rate_inr: e.target.value })} /></Field>
          <Field label="Project starting (₹)"><Input type="number" min={0} value={form.project_min_inr} onChange={e => setForm({ ...form, project_min_inr: e.target.value })} /></Field>
        </div>
      </Section>

      <Section title="Contact & links (kept private until you approve)">
        <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
          <Checkbox
            checked={form.contact_public}
            onCheckedChange={(v) => setForm({ ...form, contact_public: !!v })}
          />
          <span>
            <span className="font-medium">Make my contact public to all recruiters</span>
            <span className="block text-xs text-muted-foreground">
              When enabled, any signed-in recruiter can view your email and phone without sending a request.
            </span>
          </span>
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone (private)"><Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 ..." /></Field>
          <Field label="Location"><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Bengaluru" /></Field>
        </div>
        <Field label="GitHub URL"><Input type="url" value={form.github_url} onChange={e => setForm({ ...form, github_url: e.target.value })} /></Field>
        <Field label="Portfolio URL"><Input type="url" value={form.portfolio_url} onChange={e => setForm({ ...form, portfolio_url: e.target.value })} /></Field>
        <Field label="LinkedIn URL"><Input type="url" value={form.linkedin_url} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} /></Field>
      </Section>

      <Button type="submit" disabled={busy} className="w-full bg-gradient-accent text-primary-foreground hover:opacity-90">{busy ? "Saving..." : "Save profile"}</Button>
    </form>
  );
}

function RecruiterForm({ userId }: { userId: string }) {
  const [form, setForm] = useState({
    full_name: "", company_name: "", company_website: "", company_description: "",
    company_size: "", industry: "", location: "", phone: "",
    avatar_url: null as string | null,
    logo_url: null as string | null,
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
        phone: rec?.phone ?? "",
        avatar_url: prof?.avatar_url ?? null,
        logo_url: (rec as any)?.logo_url ?? null,
      });
    })();
  }, [userId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from("profiles").update({ full_name: form.full_name, avatar_url: form.avatar_url }).eq("id", userId),
      supabase.from("recruiter_profiles").upsert({
        id: userId,
        company_name: form.company_name,
        company_website: form.company_website || null,
        company_description: form.company_description || null,
        company_size: form.company_size || null,
        industry: form.industry || null,
        location: form.location || null,
        phone: form.phone || null,
        logo_url: form.logo_url,
      } as any),
    ]);
    setBusy(false);
    if (e1 || e2) { toast.error((e1 || e2)!.message); return; }
    toast.success("Profile saved!");
  }

  return (
    <form onSubmit={save} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-card">
      <Section title="Your profile">
        <ImageUpload
          userId={userId}
          value={form.avatar_url}
          onChange={(url) => setForm({ ...form, avatar_url: url })}
          shape="circle"
          fallback="user"
          folder="avatar"
          label="Your photo"
        />
        <Field label="Your name"><Input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></Field>
      </Section>
      <Section title="Company">
        <ImageUpload
          userId={userId}
          value={form.logo_url}
          onChange={(url) => setForm({ ...form, logo_url: url })}
          shape="square"
          fallback="company"
          folder="logo"
          label="Company logo (shown to developers)"
        />
        <Field label="Company name"><Input required value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></Field>
        <Field label="Company website"><Input type="url" value={form.company_website} onChange={e => setForm({ ...form, company_website: e.target.value })} /></Field>
        <Field label="About the company"><Textarea rows={3} value={form.company_description} onChange={e => setForm({ ...form, company_description: e.target.value })} maxLength={1000} /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Industry"><Input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="Fintech" /></Field>
          <Field label="Size"><Input value={form.company_size} onChange={e => setForm({ ...form, company_size: e.target.value })} placeholder="10–50" /></Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Location"><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Bengaluru" /></Field>
          <Field label="Phone (private)"><Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 ..." /></Field>
        </div>
      </Section>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-accent text-primary-foreground hover:opacity-90">{busy ? "Saving..." : "Save profile"}</Button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 border-b border-border pb-5 last:border-0 last:pb-0">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
