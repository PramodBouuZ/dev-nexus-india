import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Github, Globe, IndianRupee, Clock, MapPin, ShieldCheck } from "lucide-react";
import { Stars } from "@/components/Stars";

export const Route = createFileRoute("/developers")({
  head: () => ({ meta: [{ title: "Find developers — Developer Connect" }, { name: "description", content: "Browse vetted Indian part-time developers by skill, rate, and availability." }] }),
  component: DevList,
});

function DevList() {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["devs"],
    queryFn: async () => {
      const { data: devs } = await supabase.from("developer_profiles").select("*").order("is_verified", { ascending: false });
      if (!devs?.length) return [];
      const ids = devs.map(d => d.id);
      const [{ data: profs }, { data: reviews }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids),
        supabase.from("reviews").select("reviewee_id, rating").in("reviewee_id", ids),
      ]);
      return devs.map(d => {
        const mine = reviews?.filter(r => r.reviewee_id === d.id) ?? [];
        const avg = mine.length ? mine.reduce((s, r) => s + r.rating, 0) / mine.length : 0;
        return {
          ...d,
          profile: profs?.find(p => p.id === d.id) ?? null,
          rating_avg: avg,
          rating_count: mine.length,
        };
      });
    },
  });

  const filtered = data?.filter(d => {
    if (!q) return true;
    const hay = `${d.profile?.full_name ?? ""} ${d.headline ?? ""} ${d.skills?.join(" ") ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Find developers</h1>
          <p className="mt-1 text-muted-foreground">Browse vetted part-time developers across India.</p>
        </div>
        <div className="mt-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name, skill, headline" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered?.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No developers found.</p>}
          {filtered?.map(d => (
            <Link key={d.id} to="/developers/$devId" params={{ devId: d.id }}
              className="block rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-accent/40 hover:shadow-elegant">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-accent text-primary-foreground font-display text-sm font-bold">
                  {d.profile?.full_name?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate font-semibold">{d.profile?.full_name ?? "Developer"}</h3>
                    {d.is_verified && <ShieldCheck className="h-4 w-4 text-accent" />}
                  </div>
                  {d.location && <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {d.location}</p>}
                  {d.rating_count > 0 && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <Stars value={d.rating_avg} size={12} />
                      <span className="text-xs text-muted-foreground">{d.rating_avg.toFixed(1)} · {d.rating_count}</span>
                    </div>
                  )}
                </div>
              </div>
              {d.headline && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{d.headline}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.skills?.slice(0, 4).map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                {d.hourly_rate_inr && <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{d.hourly_rate_inr.toLocaleString()}/hr</span>}
                {d.availability_hours_per_week && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{d.availability_hours_per_week} hrs/wk</span>}
              </div>
              {(d.github_url || d.portfolio_url) && (
                <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {d.github_url && <a href={d.github_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Github className="h-4 w-4" /></a>}
                  {d.portfolio_url && <a href={d.portfolio_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><Globe className="h-4 w-4" /></a>}
                </div>
              )}
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
