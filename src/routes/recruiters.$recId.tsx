import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ContactAccess } from "@/components/ContactAccess";
import { ArrowLeft, Globe, MapPin, Building2, Briefcase } from "lucide-react";

export const Route = createFileRoute("/recruiters/$recId")({
  head: () => ({ meta: [{ title: "Recruiter profile — Developer Connect" }] }),
  component: RecProfile,
});

function RecProfile() {
  const { recId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["rec-profile", recId],
    queryFn: async () => {
      const [{ data: prof }, { data: rec }, { data: projs }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").eq("id", recId).maybeSingle(),
        supabase.from("recruiter_profiles").select("*").eq("id", recId).maybeSingle(),
        supabase.from("projects").select("id, title, status, project_type, hours_per_week, tech_stack").eq("recruiter_id", recId).order("created_at", { ascending: false }).limit(10),
      ]);
      return { prof, rec, projs: projs ?? [] };
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
        {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && (!data?.prof || !data?.rec) && <p className="mt-8 text-sm text-muted-foreground">Recruiter not found.</p>}
        {data?.prof && data?.rec && (
          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-accent text-primary-foreground">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="font-display text-2xl font-bold">{data.rec.company_name ?? data.prof.full_name ?? "Company"}</h1>
                    <p className="text-sm text-muted-foreground">Posted by {data.prof.full_name ?? "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {data.rec.industry && <span>{data.rec.industry}</span>}
                      {data.rec.company_size && <span>{data.rec.company_size} people</span>}
                      {data.rec.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{data.rec.location}</span>}
                      {data.rec.company_website && <a className="inline-flex items-center gap-1 hover:text-accent" href={data.rec.company_website} target="_blank" rel="noreferrer"><Globe className="h-3 w-3" />Website</a>}
                    </div>
                  </div>
                </div>
              </div>

              {data.rec.company_description && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">About</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{data.rec.company_description}</p>
                </div>
              )}

              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active projects</h2>
                <div className="mt-3 space-y-2">
                  {data.projs.length === 0 && <p className="text-sm text-muted-foreground">No projects posted yet.</p>}
                  {data.projs.map(p => (
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
              <ContactAccess targetUserId={recId} targetName={data.rec.company_name ?? "this recruiter"} />
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
