import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Plus, Clock, IndianRupee } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Browse Freelance & Part-Time Projects in India | DeveloperConnect" },
      { name: "description", content: "Find the best freelance and part-time development projects in India. React, Node.js, and Full Stack opportunities for developers." },
      { name: "keywords", content: "freelance projects India, part-time software jobs, remote development projects, hire developers India" },
      { property: "og:title", content: "Browse Freelance & Part-Time Projects in India | DeveloperConnect" },
      { property: "og:description", content: "Find the best freelance and part-time development projects in India. React, Node.js, and Full Stack opportunities for developers." },
      { tag: "link", rel: "canonical", href: "https://developerconnect.in/projects" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://developerconnect.in" },
            { "@type": "ListItem", "position": 2, "name": "Projects", "item": "https://developerconnect.in/projects" }
          ]
        })
      }
    ]
  }),
  component: ProjectsList,
});

function ProjectsList() {
  const { role } = useAuth();
  const [q, setQ] = useState("");
  const { data: projects } = useQuery({
    queryKey: ["projects-open"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("status", "open").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = projects?.filter(p =>
    !q || p.title.toLowerCase().includes(q.toLowerCase()) ||
    p.tech_stack?.some(t => t.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Open projects</h1>
            <p className="mt-1 text-muted-foreground">Find part-time work that matches your stack.</p>
          </div>
          {role === "recruiter" && (
            <Button asChild className="bg-gradient-accent text-primary-foreground hover:opacity-90">
              <Link to="/projects/new"><Plus className="mr-1 h-4 w-4" /> Post project</Link>
            </Button>
          )}
        </div>

        <div className="mt-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search title or tech (React, Node, ...)" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {filtered?.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No open projects yet.</p>}
          {filtered?.map(p => (
            <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }}
              className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:border-accent/40 hover:shadow-elegant">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-lg font-semibold group-hover:text-accent-foreground">{p.title}</h3>
                <Badge variant={p.project_type === "hourly" ? "secondary" : "outline"}>{p.project_type}</Badge>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.tech_stack?.slice(0, 5).map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                {p.budget_min_inr && p.budget_max_inr && (
                  <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> {p.budget_min_inr.toLocaleString()}–{p.budget_max_inr.toLocaleString()}</span>
                )}
                {p.hours_per_week && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.hours_per_week} hrs/wk</span>}
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
