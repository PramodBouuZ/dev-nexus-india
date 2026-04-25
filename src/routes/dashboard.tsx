import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Users, FileText, MessageSquare, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — HireSpark" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, role, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth" />;
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {role === "recruiter" ? <RecruiterDashboard userId={user.id} /> : <DeveloperDashboard userId={user.id} />}
      </main>
      <Footer />
    </div>
  );
}

function FullPageSpinner() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>;
}

function RecruiterDashboard({ userId }: { userId: string }) {
  const { data: projects } = useQuery({
    queryKey: ["my-projects", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects").select("*").eq("recruiter_id", userId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: contracts } = useQuery({
    queryKey: ["my-contracts-rec", userId],
    queryFn: async () => {
      const { data } = await supabase.from("contracts").select("*, projects(title)").eq("recruiter_id", userId);
      return data ?? [];
    },
  });

  return (
    <>
      <DashboardHeader title="Recruiter dashboard" subtitle="Manage your projects and hires.">
        <Button asChild className="bg-gradient-accent text-primary-foreground hover:opacity-90">
          <Link to="/projects/new"><Plus className="mr-1 h-4 w-4" /> Post project</Link>
        </Button>
      </DashboardHeader>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard icon={Briefcase} label="Active projects" value={projects?.filter(p => p.status === "open" || p.status === "in_progress").length ?? 0} />
        <StatCard icon={Users} label="Active hires" value={contracts?.filter(c => c.status === "active").length ?? 0} />
        <StatCard icon={FileText} label="Total projects" value={projects?.length ?? 0} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Your projects</h2>
        <div className="mt-4 space-y-3">
          {!projects || projects.length === 0 ? (
            <EmptyState title="No projects yet" desc="Post your first project to start matching with developers." actionLabel="Post project" actionTo="/projects/new" />
          ) : projects.map(p => (
            <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }}
              className="block rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-accent/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tech_stack?.slice(0, 5).map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                  </div>
                </div>
                <Badge variant={p.status === "open" ? "default" : "outline"}>{p.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function DeveloperDashboard({ userId }: { userId: string }) {
  const { data: applications } = useQuery({
    queryKey: ["my-apps", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("*, projects(title, status, recruiter_id)")
        .eq("developer_id", userId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: contracts } = useQuery({
    queryKey: ["my-contracts-dev", userId],
    queryFn: async () => {
      const { data } = await supabase.from("contracts").select("*, projects(title)").eq("developer_id", userId);
      return data ?? [];
    },
  });
  const { data: profile } = useQuery({
    queryKey: ["dev-profile", userId],
    queryFn: async () => {
      const { data } = await supabase.from("developer_profiles").select("*").eq("id", userId).maybeSingle();
      return data;
    },
  });

  return (
    <>
      <DashboardHeader title="Developer dashboard" subtitle="Track applications, hires, and your profile.">
        <Button asChild variant="outline"><Link to="/profile">Edit profile</Link></Button>
        <Button asChild className="bg-gradient-accent text-primary-foreground hover:opacity-90">
          <Link to="/projects">Browse projects</Link>
        </Button>
      </DashboardHeader>

      {profile && !profile.is_verified && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
          <ShieldCheck className="h-4 w-4 text-warning-foreground" />
          <div>Complete your profile to get verified — verified devs are 3× more likely to get hired.</div>
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard icon={FileText} label="Applications" value={applications?.length ?? 0} />
        <StatCard icon={Briefcase} label="Active contracts" value={contracts?.filter(c => c.status === "active").length ?? 0} />
        <StatCard icon={MessageSquare} label="Pending" value={applications?.filter(a => a.status === "pending").length ?? 0} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Your applications</h2>
        <div className="mt-4 space-y-3">
          {!applications || applications.length === 0 ? (
            <EmptyState title="No applications yet" desc="Browse open projects and apply to start working." actionLabel="Browse projects" actionTo="/projects" />
          ) : applications.map(a => (
            <Link key={a.id} to="/applications/$appId" params={{ appId: a.id }}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-accent/40">
              <div>
                <h3 className="font-semibold">{a.projects?.title ?? "Project"}</h3>
                <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{a.cover_message}</p>
              </div>
              <Badge variant={a.status === "accepted" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}>{a.status}</Badge>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function DashboardHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground"><Icon className="h-4 w-4" /></span>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, desc, actionLabel, actionTo }: { title: string; desc: string; actionLabel: string; actionTo: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <Button asChild className="mt-5 bg-gradient-accent text-primary-foreground hover:opacity-90">
        <Link to={actionTo}>{actionLabel}</Link>
      </Button>
    </div>
  );
}
