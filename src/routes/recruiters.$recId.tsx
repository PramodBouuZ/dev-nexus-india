import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ContactAccess } from "@/components/ContactAccess";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/Stars";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Globe, MapPin, Building2, Briefcase, ShieldCheck,
  CalendarDays, Users, FileText, CheckCircle2, MessageSquare, ExternalLink,
  Award, TrendingUp, Mail
} from "lucide-react";

export const Route = createFileRoute("/recruiters/$recId")({
  head: ({ loaderData, params }: { loaderData?: { rec: { company_name: string | null; is_verified?: boolean } | null }; params: { recId: string } }) => {
    const companyName = loaderData?.rec?.company_name || "ABC Technologies";
    const title = `${companyName} Hiring Developers | DeveloperConnect`;
    const description = `${companyName} is hiring skilled developers for part-time and full-time projects. Connect and apply directly on DeveloperConnect.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: loaderData?.rec?.is_verified ? "index, follow" : "noindex, nofollow" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `https://developerconnect.in/recruiters/${params.recId}` },
        { property: "og:type", content: "business.business" },
        { tag: "link", rel: "canonical", href: `https://developerconnect.in/recruiters/${params.recId}` },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": companyName,
            "url": `https://developerconnect.in/recruiters/${params.recId}`,
            "logo": loaderData?.rec?.logo_url || "https://developerconnect.in/logo.png",
            "description": `Hire developers from ${companyName} on DeveloperConnect.`
          })
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://developerconnect.in" },
              { "@type": "ListItem", "position": 2, "name": "Recruiters", "item": "https://developerconnect.in/projects" },
              { "@type": "ListItem", "position": 3, "name": companyName, "item": `https://developerconnect.in/recruiters/${params.recId}` }
            ]
          })
        }
      ]
    };
  },
  loader: async ({ params }) => {
    const { data: rec } = await supabase.from("recruiter_profiles").select("company_name, is_verified, logo_url").eq("id", params.recId).maybeSingle();
    return { rec: rec as { company_name: string | null; is_verified: boolean; logo_url: string | null } | null };
  },
  component: RecProfile,
});

function RecProfile() {
  const { recId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["rec-profile", recId],
    staleTime: 1000 * 60 * 10, // 10 minutes
    queryFn: async () => {
      const [{ data: rec }, { data: projs }, { data: revs }] = await Promise.all([
        supabase.from("recruiter_profiles").select("*").eq("id", recId).maybeSingle(),
        supabase.from("projects").select("*").eq("recruiter_id", recId).order("created_at", { ascending: false }),
        supabase.from("reviews").select("*").eq("reviewee_id", recId).order("created_at", { ascending: false }),
      ]);

      const avg = revs?.length ? revs.reduce((s, r) => s + r.rating, 0) / revs.length : 0;

      return {
        rec: rec as any,
        projs: projs ?? [],
        revs: revs ?? [],
        avg
      };
    },
  });

  if (isLoading) return <RecruiterSkeleton />;
  if (!data?.rec) return <RecruiterNotFound />;

  const { rec } = data;
  const openCount = (data?.projs ?? []).filter((p: any) => p.status === "open").length;
  const memberSince = rec.created_at ? new Date(rec.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short" }) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
        </Link>

        {rec && (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              {/* Header Card */}
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="h-32 bg-gradient-to-r from-primary/10 to-accent/10" />
                <div className="px-6 pb-6">
                  <div className="relative -mt-12 flex flex-col sm:flex-row sm:items-end sm:gap-6">
                    <div className="flex h-24 w-24 border-4 border-card shadow-lg shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-accent text-primary-foreground">
                      {data.rec.logo_url ? (
                        <img src={data.rec.logo_url} alt={`${data.rec.company_name ?? "Company"} logo`} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-10 w-10" />
                      )}
                    </div>
                    <div className="mt-4 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="font-display text-3xl font-bold tracking-tight">{rec.company_name ?? "Company"}</h1>
                        {rec.is_verified && (
                          <Badge className="bg-success/10 text-success border-success/20 gap-1 hover:bg-success/20 transition-colors">
                            <ShieldCheck className="h-3.5 w-3.5" /> Verified Recruiter
                          </Badge>
                        )}
                        {rec.hiring_status ? (
                          <Badge variant="outline" className="text-success border-success/30">Hiring</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Not hiring</Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground font-medium">
                        <span>{rec.industry ?? "Technology"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {rec.industry && <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" /> {rec.industry}</span>}
                    {rec.company_size && <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {rec.company_size} people</span>}
                    {rec.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {rec.location}</span>}
                    {memberSince && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Member since {memberSince}</span>}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Button className="bg-gradient-accent text-primary-foreground hover:opacity-90 px-8" asChild>
                       <Link to="/projects">View all projects</Link>
                    </Button>
                  </div>
                </div>
              </div>

              {data.rec.company_description && (
                <Section title="About the company">
                  <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">{data.rec.company_description}</p>
                </Section>
              )}

              <Section title="Active Projects">
                <div className="space-y-3">
                  {data.projs.length === 0 && <p className="text-sm text-muted-foreground">No projects posted yet.</p>}
                  {data.projs.map((p: any) => (
                    <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-all shadow-sm">
                      <div className="min-w-0">
                        <p className="font-bold text-lg group-hover:text-primary transition-colors truncate">{p.title}</p>
                        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="capitalize">{p.project_type.replace("_"," ")}</span>
                          <span>•</span>
                          <span>{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center gap-3">
                        <Badge variant={p.status === "open" ? "default" : "outline"} className="capitalize px-4 py-1">{p.status}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </Section>

              <Section title="Client Reviews">
                {data.revs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl border-border">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">No reviews yet for this recruiter.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {data.revs.map((r: any, i: number) => (
                      <div key={i} className="rounded-2xl border border-border bg-card/50 p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {r.reviewer_id?.[0]?.toUpperCase() ?? "D"}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Verified Developer</p>
                              <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Stars value={r.rating} size={16} />
                        </div>

                        {r.comment && <p className="text-foreground/90 leading-relaxed italic">"{r.comment}"</p>}

                        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <ReviewStat label="Communication" score={r.communication_rating || r.rating} />
                          <ReviewStat label="Payment" score={r.payment_timeliness_rating || r.rating} />
                          <ReviewStat label="Clarity" score={r.requirement_clarity_rating || r.rating} />
                          <ReviewStat label="Professionalism" score={r.professionalism_rating || r.rating} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </div>

            <aside className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Hiring Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <StatBox label="Total Projects" value={data.projs.length} icon={FileText} />
                  <StatBox label="Active" value={openCount} icon={CheckCircle2} />
                  <StatBox label="Completed" value={(data.projs ?? []).filter((p: any) => p.status === 'completed').length} icon={Award} />
                  <StatBox label="Success Rate" value={rec.hiring_success_rate ?? "100%"} icon={TrendingUp} />
                </div>
              </div>

              {rec.company_website && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="font-bold text-lg mb-4">Company Links</h3>
                  <Button variant="outline" className="w-full justify-between gap-3 h-12" asChild>
                    <a href={rec.company_website} target="_blank" rel="noreferrer">
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-primary" /> Company Website
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </Button>
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Verified Recruiter
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This recruiter has been verified by DeveloperConnect to ensure authenticity and quality of listings.
                </p>
                <div className="pt-4 border-t border-border">
                  <ContactAccess targetUserId={recId} targetName={rec.company_name ?? "this recruiter"} />
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ReviewStat({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">
        <span>{label}</span>
        <span>{score}/5</span>
      </div>
      <Progress value={score * 20} className="h-1" />
    </div>
  );
}

function StatBox({ label, value, icon: Icon, isRating }: { label: string; value: any; icon: any; isRating?: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-muted/50 text-center flex flex-col items-center">
      <Icon className="h-4 w-4 text-primary/60 mb-2" />
      <p className="text-xl font-bold tracking-tight">{value}</p>
      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="font-display text-base font-bold uppercase tracking-widest text-muted-foreground/80 mb-6">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function RecruiterSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="h-4 w-32 animate-pulse rounded bg-muted mb-6" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            <div className="h-96 animate-pulse rounded-2xl bg-muted" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function RecruiterNotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-10 text-center">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
           <Building2 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Recruiter profile not found.</p>
        <Button asChild className="mt-8 px-8 py-6 h-auto text-lg"><Link to="/projects">Browse all projects</Link></Button>
      </main>
      <Footer />
    </div>
  );
}
