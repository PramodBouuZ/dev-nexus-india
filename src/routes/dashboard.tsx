import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Briefcase, Plus, Users, FileText, MessageSquare, ShieldCheck, Search,
  UserCog, Mail, Clock as ClockIcon, Phone, Globe, Github, Send, TrendingUp
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractsList } from "@/components/ContractsList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteActions } from "@/components/InviteActions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | DeveloperConnect" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, role, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/auth" />;

  console.log("Dashboard Role:", role);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {role === "recruiter" ? (
          <RecruiterDashboard userId={user.id} />
        ) : role === "developer" ? (
          <DeveloperDashboard userId={user.id} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <h1 className="text-2xl font-bold">Unauthorized</h1>
            <p className="text-muted-foreground">You do not have a valid role assigned.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function FullPageSpinner() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading...</div>;
}

function RecruiterDashboard({ userId }: { userId: string }) {
  const { data: savedDevs } = useQuery({
    queryKey: ["saved-devs", userId],
    queryFn: async () => {
      const { data: favs } = await supabase.from("favorites").select("target_id").eq("user_id", userId).eq("kind", "developer");
      if (!favs?.length) return [];
      const ids = favs.map(f => f.target_id);
      const { data: devs } = await supabase.from("developer_profiles").select("id, full_name, avatar_url, headline, is_verified").in("id", ids);
      return devs ?? [];
    }
  });

  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel(`invites-rec-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "invites", filter: `recruiter_id=eq.${userId}` },
        async (payload) => {
          const next = payload.new as { developer_id: string; status: string };
          const prev = payload.old as { status: string };
          if (next.status !== prev.status && (next.status === "accepted" || next.status === "rejected")) {
            const { data: dev } = await supabase
              .from("developer_profiles").select("full_name").eq("id", next.developer_id).maybeSingle();
            const name = dev?.full_name ?? "A developer";
            if (next.status === "accepted") {
              toast.success(`${name} accepted your invite`);
            } else {
              toast(`${name} declined your invite`);
            }
            qc.invalidateQueries({ queryKey: ["sent-invites", userId] });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, qc]);

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

  const { data: invites } = useQuery({
    queryKey: ["sent-invites", userId],
    queryFn: async () => {
      const { data: invs } = await supabase
        .from("invites")
        .select("id, message, status, created_at, developer_id, project_id")
        .eq("recruiter_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      const list = invs ?? [];
      if (!list.length) return [];
      const devIds = Array.from(new Set(list.map(i => i.developer_id)));
      const projIds = Array.from(new Set(list.map(i => i.project_id).filter(Boolean) as string[]));
      const [{ data: devs }, { data: projs }] = await Promise.all([
        supabase.from("developer_profiles").select("id, full_name, avatar_url, headline, skills, is_verified, location").in("id", devIds),
        projIds.length
          ? supabase.from("projects").select("id, title").in("id", projIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      ]);
      return list.map(i => ({
        ...i,
        dev: devs?.find(d => d.id === i.developer_id) ?? null,
        project: i.project_id ? (projs?.find(p => p.id === i.project_id) ?? null) : null,
      }));
    },
  });

  const { data: sentRequests } = useQuery({
    queryKey: ["sent-contact-reqs", userId],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data: reqs } = await supabase
        .from("contact_access_requests")
        .select("*")
        .eq("requester_id", userId)
        .order("created_at", { ascending: false });
      if (!reqs?.length) return [];
      const ids = reqs.map(r => r.target_id);
      const [{ data: devs }, { data: profs }, { data: phones }] = await Promise.all([
        supabase.from("developer_profiles").select("id, full_name, avatar_url, headline").in("id", ids),
        supabase.from("profiles").select("id, email").in("id", ids),
        supabase.from("developer_phones" as any).select("developer_id, phone").in("developer_id", ids),
      ]);
      return reqs.map(r => ({
        ...r,
        dev: devs?.find(d => d.id === r.target_id),
        email: profs?.find(p => p.id === r.target_id)?.email ?? null,
        phone: (phones as any[] | null)?.find((p: any) => p.developer_id === r.target_id)?.phone ?? null,
      }));
    }
  });

  return (
    <>
      <DashboardHeader title="Recruiter dashboard" subtitle="Manage your projects and hires.">
        <Button asChild variant="outline"><Link to="/profile"><UserCog className="mr-1 h-4 w-4" /> Edit profile</Link></Button>
        <Button asChild variant="outline"><Link to="/developers"><Search className="mr-1 h-4 w-4" /> Find developers</Link></Button>
        <Button asChild className="bg-gradient-accent text-primary-foreground hover:opacity-90">
          <Link to="/projects/new"><Plus className="mr-1 h-4 w-4" /> Post project</Link>
        </Button>
      </DashboardHeader>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard icon={Briefcase} label="Active projects" value={projects?.filter(p => p.status === "open" || p.status === "in_progress").length ?? 0} />
        <StatCard icon={Users} label="Active hires" value={contracts?.filter(c => c.status === "active").length ?? 0} />
        <StatCard icon={FileText} label="Total projects" value={projects?.length ?? 0} />
        <StatCard icon={TrendingUp} label="Engagement" value={sentRequests?.length ?? 0} />
      </div>

      <Tabs defaultValue="projects" className="mt-10">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
          <TabsTrigger value="saved">Saved Developers</TabsTrigger>
          <TabsTrigger value="contacts">Contact Requests</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <section className="mt-6">
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
        </TabsContent>

        <TabsContent value="saved">
          <section className="mt-6">
            <h2 className="font-display text-xl font-semibold">Saved developers</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {!savedDevs || savedDevs.length === 0 ? (
                <p className="col-span-full text-sm text-muted-foreground">No developers saved yet.</p>
              ) : savedDevs.map(d => (
                <Link key={d.id} to="/developers/$devId" params={{ devId: d.id }} className="block rounded-xl border border-border bg-card p-4 shadow-card hover:border-accent/40">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={d.avatar_url ?? undefined} />
                      <AvatarFallback>{d.full_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{d.full_name}</p>
                        {d.is_verified && <ShieldCheck className="h-3 w-3 text-accent" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{d.headline}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="invites">
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Developers you invited</h2>
              <Button asChild variant="ghost" size="sm"><Link to="/developers"><Search className="mr-1 h-3.5 w-3.5" /> Find more</Link></Button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {!invites || invites.length === 0 ? (
                <div className="md:col-span-2">
                  <EmptyState title="No invites sent yet" desc="Browse developers and invite them to work with you." actionLabel="Find developers" actionTo="/developers" />
                </div>
              ) : invites.map(i => (
                <div key={i.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start gap-3">
                    <Link to="/developers/$devId" params={{ devId: i.developer_id }}>
                      <Avatar className="h-12 w-12">
                        {i.dev?.avatar_url && <AvatarImage src={i.dev.avatar_url} alt={i.dev?.full_name ?? "Developer"} />}
                        <AvatarFallback className="bg-gradient-accent text-primary-foreground font-display text-sm font-bold">
                          {i.dev?.full_name?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link to="/developers/$devId" params={{ devId: i.developer_id }} className="font-semibold hover:text-accent">
                          {i.dev?.full_name ?? "Developer"}
                        </Link>
                        {i.dev?.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-accent" />}
                        <Badge variant={i.status === "accepted" ? "default" : i.status === "rejected" ? "destructive" : "secondary"} className="capitalize">
                          {i.status}
                        </Badge>
                      </div>
                      {i.dev?.headline && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{i.dev.headline}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {i.dev?.skills?.slice(0, 4).map((s: string) => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
                      </div>
                      {i.project?.title && (
                        <p className="mt-2 text-xs text-muted-foreground">For: <span className="font-medium text-foreground">{i.project.title}</span></p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">Sent {new Date(i.created_at).toLocaleDateString()}</p>
                      {i.status === "pending" && (
                        <InviteActions inviteId={i.id} developerName={i.dev?.full_name ?? "Developer"} currentMessage={i.message} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="contacts">
          <section className="mt-6">
            <h2 className="font-display text-xl font-semibold">Contact requests sent</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {!sentRequests || sentRequests.length === 0 ? (
                <p className="col-span-full text-sm text-muted-foreground">No requests sent yet.</p>
              ) : sentRequests.map(r => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={r.dev?.avatar_url ?? undefined} />
                        <AvatarFallback>{r.dev?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{r.dev?.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">Requested {new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>{r.status}</Badge>
                  </div>
                  {r.status === "approved" && (
                    <div className="mt-3 space-y-1.5 rounded-md border border-success/30 bg-success/5 p-3 text-sm">
                      <div className="flex items-center gap-2 text-xs font-medium text-success-foreground">
                        <ShieldCheck className="h-3.5 w-3.5" /> Contact unlocked
                      </div>
                      {r.email && (
                        <a href={`mailto:${r.email}`} className="flex items-center gap-2 hover:underline">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {r.email}
                        </a>
                      )}
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="flex items-center gap-2 hover:underline">
                          <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {r.phone}
                        </a>
                      )}
                      {!r.email && !r.phone && (
                        <p className="text-xs text-muted-foreground">No contact details added yet by the developer.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="chats">
           <ChatConversations userId={userId} role="recruiter" />
        </TabsContent>
      </Tabs>

      <div className="mt-10">
        <ContractsList userId={userId} role="recruiter" />
      </div>
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

  const { data: incomingRequests } = useQuery({
    queryKey: ["incoming-contact-reqs", userId],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data: reqs } = await supabase
        .from("contact_access_requests")
        .select("*")
        .eq("target_id", userId)
        .order("created_at", { ascending: false });
      if (!reqs?.length) return [];
      const ids = reqs.map(r => r.requester_id);
      const [{ data: recs }, { data: profs }, { data: phones }] = await Promise.all([
        supabase.from("recruiter_profiles").select("id, company_name, logo_url, full_name").in("id", ids),
        supabase.from("profiles").select("id, email").in("id", ids),
        supabase.from("recruiter_phones" as any).select("recruiter_id, phone").in("recruiter_id", ids),
      ]);
      return reqs.map(r => ({
        ...r,
        recruiter: recs?.find(rc => rc.id === r.requester_id),
        email: profs?.find(p => p.id === r.requester_id)?.email ?? null,
        phone: (phones as any[] | null)?.find((p: any) => p.recruiter_id === r.requester_id)?.phone ?? null,
      }));
    }
  });

  const qc = useQueryClient();
  async function respond(reqId: string, status: "approved" | "rejected") {
    const { error } = await supabase.from("contact_access_requests").update({ status, responded_at: new Date().toISOString() }).eq("id", reqId);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "approved" ? "Contact shared" : "Request rejected");
      qc.invalidateQueries({ queryKey: ["incoming-contact-reqs", userId] });
    }
  }

  async function toggleAvailability() {
    if (!profile) return;
    const { error } = await supabase.from("developer_profiles").update({ is_available: !profile.is_available }).eq("id", userId);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["dev-profile", userId] });
  }

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

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <StatCard icon={FileText} label="Applications" value={applications?.length ?? 0} />
        <StatCard icon={Briefcase} label="Active projects" value={contracts?.filter(c => c.status === "active").length ?? 0} />
        <StatCard icon={Users} label="Profile views" value={profile?.profile_views ?? 0} />
        <div className="rounded-xl border border-border bg-card p-5 shadow-card flex items-center justify-between">
           <div className="flex items-center gap-3">
             <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground"><ClockIcon className="h-4 w-4" /></span>
             <div>
               <div className="text-xs uppercase tracking-wider text-muted-foreground">Availability</div>
               <div className="font-display text-sm font-bold">{profile?.is_available ? "Available" : "Busy"}</div>
             </div>
           </div>
           <Button variant="outline" size="sm" onClick={toggleAvailability}>Toggle</Button>
        </div>
      </div>

      <Tabs defaultValue="applications" className="mt-10">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="contacts">Contact Requests</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <section className="mt-6">
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
        </TabsContent>

        <TabsContent value="contacts">
          <section className="mt-6">
            <h2 className="font-display text-xl font-semibold">Contact requests</h2>
            <div className="mt-4 space-y-3">
              {!incomingRequests || incomingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending contact requests.</p>
              ) : incomingRequests.map(r => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={r.recruiter?.logo_url ?? undefined} />
                        <AvatarFallback>{r.recruiter?.company_name?.[0] || r.recruiter?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{r.recruiter?.company_name || r.recruiter?.full_name}</p>
                        {r.message && <p className="mt-1 text-xs text-muted-foreground italic">"{r.message}"</p>}
                        <p className="mt-1 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {r.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => respond(r.id, "approved")} className="h-8 text-xs border-success/30 text-success hover:bg-success/10">Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => respond(r.id, "rejected")} className="h-8 text-xs text-destructive hover:bg-destructive/10">Reject</Button>
                      </div>
                    ) : (
                      <Badge variant={r.status === "approved" ? "default" : "destructive"}>{r.status}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="chats">
          <ChatConversations userId={userId} role="developer" />
        </TabsContent>
      </Tabs>

      <div className="mt-10">
        <ContractsList userId={userId} role="developer" />
      </div>
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

function ChatConversations({ userId, role }: { userId: string; role: "developer" | "recruiter" }) {
  const [q, setQ] = useState("");
  const { data: convs, isLoading } = useQuery({
    queryKey: ["chat-convs", userId],
    queryFn: async () => {
      const q = supabase.from("applications").select("*, projects(title, recruiter_id)");
      if (role === "developer") q.eq("developer_id", userId);
      else q.eq("projects.recruiter_id", userId);

      const { data: apps } = await q.order("updated_at", { ascending: false });
      if (!apps?.length) return [];

      const appIds = apps.map(a => a.id);
      const { data: msgs } = await supabase.from("messages").select("*").in("application_id", appIds).order("created_at", { ascending: false });

      const partnerIds = role === "developer" ? apps.map(a => a.projects?.recruiter_id) : apps.map(a => a.developer_id);
      const partners: any[] = role === "developer"
        ? ((await supabase.from("recruiter_profiles").select("id, full_name, company_name").in("id", partnerIds.filter(Boolean) as string[])).data ?? [])
        : ((await supabase.from("developer_profiles").select("id, full_name, avatar_url").in("id", partnerIds.filter(Boolean) as string[])).data ?? []);

      return apps.map(a => {
        const lastMsg = msgs?.find(m => m.application_id === a.id);
        const partnerId = role === "developer" ? a.projects?.recruiter_id : a.developer_id;
        const partner = partners?.find(p => p.id === partnerId);
        const unreadCount = msgs?.filter(m => m.application_id === a.id && m.sender_id !== userId && !m.read_at).length ?? 0;

        return {
          appId: a.id,
          projectTitle: a.projects?.title,
          partnerName: partner?.company_name || partner?.full_name || "Partner",
          partnerAvatar: partner?.avatar_url ?? undefined,
          lastMsg: lastMsg?.body || (lastMsg?.attachments ? "Sent an attachment" : "No messages yet"),
          lastTime: lastMsg?.created_at || a.created_at,
          unreadCount
        };
      }).sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
    }
  });

  const filtered = convs?.filter(c =>
    c.partnerName.toLowerCase().includes(q.toLowerCase()) ||
    c.projectTitle?.toLowerCase().includes(q.toLowerCase())
  );

  if (isLoading) return <div className="space-y-3 mt-6">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>;

  return (
    <div className="mt-6 space-y-3">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search conversations..." value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
      </div>
      {!filtered || filtered.length === 0 ? (
        <p className="text-center py-10 text-sm text-muted-foreground">No conversations found.</p>
      ) : filtered.map(c => (
        <Link key={c.appId} to="/applications/$appId" params={{ appId: c.appId }} className="block">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card hover:border-accent/40 transition-colors">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={c.partnerAvatar} />
                <AvatarFallback>{c.partnerName[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                   <p className="font-semibold text-sm truncate">{c.partnerName}</p>
                   <span className="text-[10px] text-muted-foreground">for {c.projectTitle}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-md">{c.lastMsg}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-muted-foreground">{new Date(c.lastTime).toLocaleDateString()}</span>
              {c.unreadCount > 0 && <Badge className="h-5 min-w-5 justify-center px-1 rounded-full">{c.unreadCount}</Badge>}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
