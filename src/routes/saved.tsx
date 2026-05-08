import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShieldCheck, MapPin, IndianRupee, Briefcase, Heart } from "lucide-react";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "Saved — Developer Connect" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { user, loading } = useAuth();

  const { data } = useQuery({
    queryKey: ["my-favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      const devIds = (favs ?? []).filter((f) => f.kind === "developer").map((f) => f.target_id);
      const projIds = (favs ?? []).filter((f) => f.kind === "project").map((f) => f.target_id);
      const [{ data: devs }, { data: profs }, { data: projs }] = await Promise.all([
        devIds.length
          ? supabase.from("developer_profiles").select("id, headline, skills, hourly_rate_inr, location, is_verified").in("id", devIds)
          : Promise.resolve({ data: [] as any[] }),
        devIds.length
          ? supabase.from("profiles").select("id, full_name").in("id", devIds)
          : Promise.resolve({ data: [] as any[] }),
        projIds.length
          ? supabase.from("projects").select("id, title, description, tech_stack, budget_min_inr, budget_max_inr, project_type, status").in("id", projIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      return {
        developers: (devs ?? []).map((d: any) => ({ ...d, full_name: profs?.find((p: any) => p.id === d.id)?.full_name })),
        projects: projs ?? [],
      };
    },
  });

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  const developers = data?.developers ?? [];
  const projects = data?.projects ?? [];
  const empty = developers.length === 0 && projects.length === 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500 fill-current" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Saved</h1>
        </div>
        <p className="mt-1 text-muted-foreground">Your shortlisted developers and bookmarked projects.</p>

        {empty && (
          <div className="mt-12 rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">Nothing saved yet. Tap the heart on a developer or project to shortlist them.</p>
          </div>
        )}

        {developers.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">Developers ({developers.length})</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {developers.map((d: any) => (
                <div key={d.id} className="relative rounded-xl border border-border bg-card p-5 shadow-card">
                  <div className="absolute right-3 top-3"><FavoriteButton kind="developer" targetId={d.id} /></div>
                  <Link to="/developers/$devId" params={{ devId: d.id }} className="block">
                    <div className="flex items-center gap-1.5 pr-8">
                      <h3 className="truncate font-semibold">{d.full_name ?? "Developer"}</h3>
                      {d.is_verified && <ShieldCheck className="h-4 w-4 text-accent" />}
                    </div>
                    {d.headline && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{d.headline}</p>}
                    {d.location && (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{d.location}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(d.skills ?? []).slice(0, 4).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                    {d.hourly_rate_inr && (
                      <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium"><IndianRupee className="h-3 w-3" />{d.hourly_rate_inr}/hr</p>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold">Projects ({projects.length})</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p: any) => (
                <div key={p.id} className="relative rounded-xl border border-border bg-card p-5 shadow-card">
                  <div className="absolute right-3 top-3"><FavoriteButton kind="project" targetId={p.id} /></div>
                  <Link to="/projects/$projectId" params={{ projectId: p.id }} className="block">
                    <Badge variant="outline" className="text-xs capitalize"><Briefcase className="mr-1 h-3 w-3" />{p.project_type}</Badge>
                    <h3 className="mt-2 line-clamp-2 pr-8 font-semibold">{p.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(p.tech_stack ?? []).slice(0, 4).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                    {p.budget_min_inr && (
                      <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium"><IndianRupee className="h-3 w-3" />{p.budget_min_inr.toLocaleString()}{p.budget_max_inr ? `–${p.budget_max_inr.toLocaleString()}` : ""}</p>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
