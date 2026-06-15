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
import { FavoriteButton } from "@/components/FavoriteButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteDeveloperDialog } from "@/components/InviteDeveloperDialog";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: [
      { title: "Browse Skilled Developers in India | DeveloperConnect" },
      { name: "description", content: "Hire vetted part-time and full-time developers in India. Browse React, Node.js, Full Stack, and Mobile developers by skill and rate." },
      { name: "keywords", content: "hire developers India, freelance developers, part-time developers India, remote developers, react developers, nodejs developers" },
      { property: "og:title", content: "Browse Skilled Developers in India | DeveloperConnect" },
      { property: "og:description", content: "Hire vetted part-time and full-time developers in India. Browse React, Node.js, Full Stack, and Mobile developers by skill and rate." },
      { property: "og:url", content: "https://developerconnect.in/developers" },
      { tag: "link", rel: "canonical", href: "https://developerconnect.in/developers" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://developerconnect.in" },
            { "@type": "ListItem", "position": 2, "name": "Developers", "item": "https://developerconnect.in/developers" }
          ]
        })
      }
    ]
  }),
  component: DevList,
});

function DevList() {
  const { role } = useAuth();
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["devs"],
    queryFn: async () => {
      const { data: devs } = await supabase.from("developer_profiles").select("*").order("is_verified", { ascending: false });
      if (!devs?.length) return [];
      const ids = devs.map(d => d.id);
      const { data: reviews } = await supabase.from("reviews").select("reviewee_id, rating").in("reviewee_id", ids);
      return devs.map(d => {
        const mine = reviews?.filter(r => r.reviewee_id === d.id) ?? [];
        const avg = mine.length ? mine.reduce((s, r) => s + r.rating, 0) / mine.length : 0;
        return {
          ...d,
          rating_avg: avg,
          rating_count: mine.length,
        };
      });
    },
  });

  const filtered = data?.filter(d => {
    if (!q) return true;
    const hay = `${d.full_name ?? ""} ${d.headline ?? ""} ${d.skills?.join(" ") ?? ""}`.toLowerCase();
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
            <div key={d.id} className="relative">
              <div className="absolute right-3 top-3 z-10"><FavoriteButton kind="developer" targetId={d.id} /></div>
              <Link to="/developers/$devId" params={{ devId: d.id }}
                className="group block rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:border-accent/40 hover:shadow-elegant">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {d.avatar_url && <AvatarImage src={d.avatar_url} alt={d.full_name ?? "Developer"} />}
                  <AvatarFallback className="bg-gradient-accent text-primary-foreground font-display text-sm font-bold">
                    {d.full_name?.[0] ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate font-semibold group-hover:text-accent transition-colors">{d.full_name ?? "Developer"}</h3>
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
              {role === "recruiter" && (
                <div className="absolute bottom-3 right-3">
                  <InviteDeveloperDialog developerId={d.id} developerName={d.full_name ?? "this developer"} size="sm" />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
