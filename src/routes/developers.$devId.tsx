import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ContactAccess } from "@/components/ContactAccess";
import { Stars } from "@/components/Stars";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteDeveloperDialog } from "@/components/InviteDeveloperDialog";
import {
  ArrowLeft, Github, Globe, Linkedin, IndianRupee, Clock, MapPin, ShieldCheck, Calendar, Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/developers/$devId")({
  loader: async ({ params }) => {
    const { devId } = params;
    const { data: dev } = await supabase.from("developer_profiles").select("full_name, headline, bio, skills").eq("id", devId).maybeSingle();
    return { dev, devId };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.dev?.full_name || "Developer";
    const headline = loaderData?.dev?.headline || "Software Developer";
    const bio = loaderData?.dev?.bio || "Expert developer available for hire on DeveloperConnect.";
    const title = `${name} | ${headline} in India | DeveloperConnect`;
    const description = `${name} is a skilled ${headline} in India. ${bio.slice(0, 150)}...`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { name: "keywords", content: `${loaderData?.dev?.skills?.join(", ") || ""}, hire ${name}, developer India, part-time developer` },
        { tag: "link", rel: "canonical", href: `https://developerconnect.in/developers/${loaderData?.devId}` },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": name,
            "jobTitle": headline,
            "description": bio,
            "url": `https://developerconnect.in/developers/${loaderData?.devId}`,
            "knowsAbout": loaderData?.dev?.skills || []
          })
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://developerconnect.in"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Developers",
                "item": "https://developerconnect.in/developers"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": name,
                "item": `https://developerconnect.in/developers/${loaderData?.devId}`
              }
            ]
          })
        }
      ]
    };
  },
  component: DevProfile,
});

function DevProfile() {
  const { devId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["dev-profile", devId],
    queryFn: async () => {
      const [{ data: dev }, { data: revs }] = await Promise.all([
        supabase.from("developer_profiles").select("*").eq("id", devId).maybeSingle(),
        supabase.from("reviews").select("rating, comment, created_at, reviewer_id").eq("reviewee_id", devId).order("created_at", { ascending: false }),
      ]);
      const avg = revs?.length ? revs.reduce((s, r) => s + r.rating, 0) / revs.length : 0;
      return { dev, revs: revs ?? [], avg };
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <Link to="/developers" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to developers</Link>
        {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && !data?.dev && <p className="mt-8 text-sm text-muted-foreground">Developer not found.</p>}
        {data?.dev && (
          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    {data.dev.avatar_url && <AvatarImage src={data.dev.avatar_url} alt={data.dev.full_name ?? "Developer"} />}
                    <AvatarFallback className="bg-gradient-accent text-2xl font-display font-bold text-primary-foreground">
                      {data.dev.full_name?.[0] ?? "D"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-2xl font-bold">{data.dev.full_name ?? "Developer"}</h1>
                      {data.dev.is_verified && <Badge className="bg-success text-success-foreground gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>}
                      <FavoriteButton kind="developer" targetId={devId} variant="outline" size="sm" />
                    </div>
                    {data.dev.headline && <p className="text-muted-foreground">{data.dev.headline}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {data.dev.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {data.dev.location}</span>}
                      {data.dev.experience_years != null && <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {data.dev.experience_years} yrs experience</span>}
                      {data.revs.length > 0 && (
                        <span className="inline-flex items-center gap-1"><Stars value={data.avg} size={12} /> {data.avg.toFixed(1)} ({data.revs.length})</span>
                      )}
                    </div>
                    <div className="mt-4">
                      <InviteDeveloperDialog developerId={devId} developerName={data.dev.full_name ?? "this developer"} />
                    </div>
                  </div>
                </div>
              </div>

              {data.dev.bio && (
                <Section title="About">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{data.dev.bio}</p>
                </Section>
              )}

              {(data.dev.skills?.length ?? 0) > 0 && (
                <Section title="Skills">
                  <div className="flex flex-wrap gap-2">
                    {(data.dev.skills ?? []).map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </Section>
              )}

              <Section title="Reviews">
                {data.revs.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
                <div className="space-y-3">
                  {data.revs.map((r, i) => (
                    <div key={i} className="rounded-lg border border-border p-3 text-sm">
                      <Stars value={r.rating} size={14} />
                      {r.comment && <p className="mt-1 text-muted-foreground">{r.comment}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            <aside className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="font-semibold">Pricing</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <Row label="Hourly" value={data.dev.hourly_rate_inr ? `₹${data.dev.hourly_rate_inr.toLocaleString()}` : "—"} icon={IndianRupee} />
                  <Row label="Weekly" value={data.dev.weekly_rate_inr ? `₹${data.dev.weekly_rate_inr.toLocaleString()}` : "—"} />
                  <Row label="Monthly" value={data.dev.monthly_rate_inr ? `₹${data.dev.monthly_rate_inr.toLocaleString()}` : "—"} />
                  <Row label="Project min" value={data.dev.project_min_inr ? `₹${data.dev.project_min_inr.toLocaleString()}` : "—"} />
                </dl>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h3 className="font-semibold">Availability</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <Row label="Looking for" value={(data.dev.work_preference ?? "—").toString().replace("_"," ")} />
                  <Row label="Hours/day" value={data.dev.hours_per_day ?? "—"} icon={Clock} />
                  <Row label="Hours/week" value={data.dev.availability_hours_per_week ?? "—"} />
                  <Row label="Days" value={data.dev.available_days?.length ? data.dev.available_days.join(", ") : "—"} icon={Calendar} />
                  {data.dev.time_slots && <Row label="Slots" value={data.dev.time_slots} />}
                </dl>
              </div>

              {(data.dev.github_url || data.dev.portfolio_url || data.dev.linkedin_url) && (
                <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                  <h3 className="font-semibold">Links</h3>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm">
                    {data.dev.github_url && <a className="inline-flex items-center gap-1 hover:text-accent" href={data.dev.github_url} target="_blank" rel="noreferrer"><Github className="h-4 w-4" /> GitHub</a>}
                    {data.dev.portfolio_url && <a className="inline-flex items-center gap-1 hover:text-accent" href={data.dev.portfolio_url} target="_blank" rel="noreferrer"><Globe className="h-4 w-4" /> Portfolio</a>}
                    {data.dev.linkedin_url && <a className="inline-flex items-center gap-1 hover:text-accent" href={data.dev.linkedin_url} target="_blank" rel="noreferrer"><Linkedin className="h-4 w-4" /> LinkedIn</a>}
                  </div>
                </div>
              )}

              <ContactAccess targetUserId={devId} targetName={data.dev.full_name ?? "this developer"} />
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Row({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="inline-flex items-center gap-1.5 text-muted-foreground">{Icon && <Icon className="h-3.5 w-3.5" />}{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </div>
  );
}
