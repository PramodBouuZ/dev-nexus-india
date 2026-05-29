import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShieldCheck, MapPin, IndianRupee, Briefcase, Heart, Search } from "lucide-react";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [{ title: "Saved | DeveloperConnect" }] }),
  component: SavedPage,
});

function SavedPage() {
  const { user, loading } = useAuth();
  const [devQuery, setDevQuery] = useState("");
  const [projQuery, setProjQuery] = useState("");

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
      const [{ data: devs }, { data: projs }] = await Promise.all([
        devIds.length
          ? supabase.from("developer_profiles").select("id, full_name, headline, skills, hourly_rate_inr, location, is_verified").in("id", devIds)
          : Promise.resolve({ data: [] as any[] }),
        projIds.length
          ? supabase.from("projects").select("id, title, description, tech_stack, budget_min_inr, budget_max_inr, project_type, status").in("id", projIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      return {
        developers: devs ?? [],
        projects: projs ?? [],
      };
    },
  });

  const developers = data?.developers ?? [];
  const projects = data?.projects ?? [];

  const filteredDevs = useMemo(() => {
    const q = devQuery.trim().toLowerCase();
    if (!q) return developers;
    return developers.filter((d: any) =>
      [d.full_name, d.headline, d.location, ...(d.skills ?? [])]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(q)),
    );
  }, [developers, devQuery]);

  const filteredProjs = useMemo(() => {
    const q = projQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p: any) =>
      [p.title, p.description, p.project_type, ...(p.tech_stack ?? [])]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(q)),
    );
  }, [projects, projQuery]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500 fill-current" />
          <h1 className="font-display text-3xl font-bold tracking-tight">Saved</h1>
        </div>
        <p className="mt-1 text-muted-foreground">Your shortlisted developers and bookmarked projects.</p>

        <Tabs defaultValue="developers" className="mt-6">
          <TabsList>
            <TabsTrigger value="developers">Developers ({developers.length})</TabsTrigger>
            <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="developers" className="mt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={devQuery}
                onChange={(e) => setDevQuery(e.target.value)}
                placeholder="Search by name, skill, location…"
                className="pl-9"
              />
            </div>
            {filteredDevs.length === 0 ? (
              <EmptyState text={developers.length === 0 ? "No developers saved yet. Tap the heart on a developer to shortlist them." : "No developers match your search."} />
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDevs.map((d: any) => (
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
            )}
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={projQuery}
                onChange={(e) => setProjQuery(e.target.value)}
                placeholder="Search by title, tech, type…"
                className="pl-9"
              />
            </div>
            {filteredProjs.length === 0 ? (
              <EmptyState text={projects.length === 0 ? "No projects saved yet. Tap the heart on a project to bookmark it." : "No projects match your search."} />
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjs.map((p: any) => (
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
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
