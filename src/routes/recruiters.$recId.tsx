import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ContactAccess } from "@/components/ContactAccess";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, MapPin, Building2, Briefcase, ShieldCheck, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/recruiters/$recId")({
  head: ({ loaderData, params }) => {
    const title = `${loaderData?.rec?.company_name || "Recruiter"} | Hiring on DeveloperConnect`;
    const description = `Hire developers from ${loaderData?.rec?.company_name || "this recruiter"} on DeveloperConnect. Top Indian tech talent for part-time and full-time roles.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { tag: "link", rel: "canonical", href: `https://developerconnect.in/recruiters/${params.recId}` },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://developerconnect.in" },
              { "@type": "ListItem", "position": 2, "name": "Recruiters", "item": "https://developerconnect.in/projects" },
              { "@type": "ListItem", "position": 3, "name": loaderData?.rec?.company_name || "Recruiter", "item": `https://developerconnect.in/recruiters/${params.recId}` }
            ]
          })
        }
      ]
    };
  },
  loader: async ({ params }) => {
    const { data: rec } = await supabase.from("recruiter_profiles").select("company_name").eq("id", params.recId).maybeSingle();
    return { rec };
  },
  component: RecProfile,
});

function RecProfile() {
  const { recId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["rec-profile", recId],
    staleTime: 1000 * 60 * 10, // 10 minutes
    queryFn: async () => {
      const [{ data: rec }, { data: projs }] = await Promise.all([
        supabase.from("recruiter_profiles").select("*").eq("id", recId).maybeSingle(),
        supabase.from("projects").select("id, title, status, project_type, hours_per_week, tech_stack, created_at").eq("recruiter_id", recId).order("created_at", { ascending: false }).limit(10),
      ]);
      return { rec: rec as any, projs: projs ?? [] };
    },
  });

  if (isLoading) return <RecruiterSkeleton />;
  if (!data?.rec) return <RecruiterNotFound />;

  const { rec } = data;
  const openCount = (data?.projs ?? []).filter((p: any) => p.status === "open").length;
  const memberSince = rec.created_at ? new Date(rec.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short" }) : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
        {rec && (
          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-accent text-primary-foreground">
                    {data.rec.logo_url ? (
                      <img src={data.rec.logo_url} alt={`${data.rec.company_name ?? "Company"} logo`} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-8 w-8" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-2xl font-bold truncate">{rec.company_name ?? rec.full_name ?? "Company"}</h1>
                      {rec.is_verified && <Badge className="bg-success text-success-foreground gap-1"><ShieldCheck className="h-3 w-3" /> Verified Recruiter</Badge>}
                      {rec.hiring_status ? (
                        <Badge variant="outline" className="text-success border-success/30">Hiring</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Not hiring</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      {rec.avatar_url ? (
                        <img src={rec.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                      ) : null}
                      <span>Posted by {rec.full_name ?? "—"}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {rec.industry && <span>{rec.industry}</span>}
                      {rec.company_size && <span>{rec.company_size} people</span>}
                      {rec.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{rec.location}</span>}
                      {memberSince && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />Member since {memberSince}</span>}
                      {rec.company_website && <a className="inline-flex items-center gap-1 hover:text-accent" href={rec.company_website} target="_blank" rel="noreferrer"><Globe className="h-3 w-3" />Website</a>}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant={openCount > 0 ? "default" : "outline"} className="text-xs">
                        {openCount > 0 ? `${openCount} active project${openCount > 1 ? "s" : ""}` : "No active projects"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">Active Company</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {data.rec.company_description && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">About the company</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{data.rec.company_description}</p>
                </div>
              )}

              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active projects</h2>
                <div className="mt-3 space-y-2">
                  {data.projs.length === 0 && <p className="text-sm text-muted-foreground">No projects posted yet.</p>}
                  {data.projs.map((p: any) => (
                    <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }}
                      className="flex items-center justify-between rounded-lg border border-border p-3 text-sm hover:border-accent/40">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.title}</p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground capitalize">
                          <Briefcase className="h-3 w-3" /> {p.project_type.replace("_"," ")}
                        </p>
                      </div>
                      <Badge variant={p.status === "open" ? "default" : "outline"} className="capitalize">{p.status}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <ContactAccess targetUserId={recId} targetName={rec.company_name ?? "this recruiter"} />
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function RecruiterSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 animate-pulse rounded-xl bg-muted" />
            <div className="h-64 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function RecruiterNotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-10 text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Recruiter profile not found.</p>
        <Button asChild className="mt-6"><Link to="/projects">Browse all projects</Link></Button>
      </main>
      <Footer />
    </div>
  );
}
