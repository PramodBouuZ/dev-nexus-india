import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, IndianRupee, ArrowLeft, CheckCircle2, XCircle, Briefcase, MapPin } from "lucide-react";
import { ContactAccess } from "@/components/ContactAccess";
import { ProjectStages } from "@/components/ProjectStages";
import { TopMatches } from "@/components/TopMatches";
import { FavoriteButton } from "@/components/FavoriteButton";

export const Route = createFileRoute("/projects/$projectId")({
  loader: async ({ params }) => {
    const { projectId } = params;
    const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
    return { project, projectId };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.project ? `${loaderData.project.title} | DeveloperConnect` : "Project | DeveloperConnect";
    const description = loaderData?.project
      ? `${loaderData.project.description.slice(0, 160)}...`
      : "View project details on DeveloperConnect.";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { tag: "link", rel: "canonical", href: `https://developerconnect.in/projects/${loaderData?.projectId}` },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": loaderData?.project?.title,
            "description": loaderData?.project?.description,
            "datePosted": loaderData?.project?.created_at,
            "employmentType": loaderData?.project?.project_type === "hourly" ? "PART_TIME" : "CONTRACTOR",
            "hiringOrganization": {
              "@type": "Organization",
              "name": "DeveloperConnect",
              "sameAs": "https://developerconnect.in"
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "IN"
              }
            }
          })
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://developerconnect.in"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Projects",
                "item": "https://developerconnect.in/projects"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": loaderData?.project?.title || "Project",
                "item": `https://developerconnect.in/projects/${loaderData?.projectId}`
              }
            ]
          })
        }
      ]
    };
  },
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { user, role } = useAuth();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
      return data;
    },
  });

  const { data: myApp } = useQuery({
    queryKey: ["my-app", projectId, user?.id],
    enabled: !!user && role === "developer",
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("*").eq("project_id", projectId).eq("developer_id", user!.id).maybeSingle();
      return data;
    },
  });

  if (isLoading) return <PageShell><p>Loading...</p></PageShell>;
  if (!project) return <PageShell><p>Project not found.</p></PageShell>;

  const isOwner = user?.id === project.recruiter_id;

  return (
    <PageShell>
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back to projects</Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge variant={project.project_type === "hourly" ? "secondary" : "outline"}>{project.project_type}</Badge>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{project.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              {user && user.id !== project.recruiter_id && (
                <FavoriteButton kind="project" targetId={projectId} variant="outline" />
              )}
              <Badge variant={project.status === "open" ? "default" : "outline"}>{project.status}</Badge>
            </div>
          </div>
          <div className="mt-6 whitespace-pre-wrap rounded-xl border border-border bg-card p-6 text-sm leading-relaxed shadow-card">
            {project.description}
          </div>

          <div className="mt-6">
            <h2 className="font-display text-lg font-semibold">Tech stack</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.tech_stack?.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
          </div>

          {isOwner && <TopMatches project={project} projectId={projectId} />}
          {isOwner && <ApplicantsList projectId={projectId} recruiterId={project.recruiter_id} />}
          {(project.status === "in_progress" || project.status === "completed") && user && (
            <ProjectStages projectId={projectId} />
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-semibold">Details</h3>
            <dl className="mt-4 space-y-3 text-sm">
              {project.budget_min_inr && project.budget_max_inr && (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground"><IndianRupee className="h-3.5 w-3.5" /> {project.project_type === "hourly" ? "Rate" : "Budget"}</dt>
                  <dd className="font-medium">₹{project.budget_min_inr.toLocaleString()}–{project.budget_max_inr.toLocaleString()}</dd>
                </div>
              )}
              {project.hours_per_week && (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Hours/week</dt>
                  <dd className="font-medium">{project.hours_per_week}</dd>
                </div>
              )}
              {project.duration_weeks && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="font-medium">{project.duration_weeks} weeks</dd>
                </div>
              )}
              {project.timeline && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Timeline</dt>
                  <dd className="font-medium">{project.timeline}</dd>
                </div>
              )}
              {project.work_mode && (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Work mode</dt>
                  <dd className="font-medium capitalize">{project.work_mode}</dd>
                </div>
              )}
              {project.hiring_type && (
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground"><Briefcase className="h-3.5 w-3.5" /> Hiring</dt>
                  <dd className="font-medium capitalize">{String(project.hiring_type).replace("_"," ")}</dd>
                </div>
              )}
            </dl>
          </div>

          {user && user.id !== project.recruiter_id && (
            <div className="space-y-3">
              <Link to="/recruiters/$recId" params={{ recId: project.recruiter_id }}
                className="block rounded-lg border border-border bg-card p-3 text-sm hover:border-accent/40">
                View recruiter profile →
              </Link>
              <ContactAccess targetUserId={project.recruiter_id} targetName="The recruiter" />
            </div>
          )}

          {!user && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-card text-sm">
              <p>Sign in as a developer to apply.</p>
              <Button asChild className="mt-3 w-full"><Link to="/auth">Sign in</Link></Button>
            </div>
          )}
          {user && role === "developer" && project.status === "open" && (
            myApp ? (
              <div className="rounded-xl border border-success/30 bg-success/10 p-5 text-sm">
                <p className="font-medium">You've applied. Status: <Badge>{myApp.status}</Badge></p>
                <Button asChild variant="outline" className="mt-3 w-full">
                  <Link to="/applications/$appId" params={{ appId: myApp.id }}>View application & chat</Link>
                </Button>
              </div>
            ) : (
              <ApplyForm projectId={projectId} />
            )
          )}
        </aside>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
      <Footer />
    </div>
  );
}

function ApplyForm({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cover, setCover] = useState("");
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("applications").insert({
      project_id: projectId,
      developer_id: user.id,
      cover_message: cover,
      proposed_rate_inr: rate ? Number(rate) : null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }

    // Notify recruiter
    const { data: proj } = await supabase.from("projects").select("recruiter_id, title").eq("id", projectId).maybeSingle();
    if (proj) {
      await supabase.from("notifications").insert({
        user_id: proj.recruiter_id,
        title: "New application",
        body: `A developer applied for ${proj.title}`,
        type: "new_application",
        link: `/projects/${projectId}`
      });
    }

    toast.success("Application submitted!");
    qc.invalidateQueries({ queryKey: ["my-app", projectId] });
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-semibold">Apply to this project</h3>
      <div className="mt-4 space-y-3">
        <div className="space-y-1.5"><Label>Cover message</Label><Textarea required rows={4} value={cover} onChange={e => setCover(e.target.value)} placeholder="Why you're a fit, similar work..." maxLength={2000} /></div>
        <div className="space-y-1.5"><Label>Proposed rate (₹)</Label><Input type="number" min={0} value={rate} onChange={e => setRate(e.target.value)} /></div>
      </div>
      <Button type="submit" disabled={busy} className="mt-4 w-full bg-gradient-accent text-primary-foreground hover:opacity-90">{busy ? "Sending..." : "Apply"}</Button>
    </form>
  );
}

function ApplicantsList({ projectId, recruiterId }: { projectId: string; recruiterId: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: apps } = useQuery({
    queryKey: ["project-apps", projectId],
    queryFn: async () => {
      const { data: appRows } = await supabase.from("applications")
        .select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      if (!appRows?.length) return [];
      const devIds = [...new Set(appRows.map(a => a.developer_id))];
      const { data: devs } = await supabase.from("developer_profiles").select("id, full_name, avatar_url, headline, hourly_rate_inr, skills, is_verified").in("id", devIds);

      return appRows.map(a => ({
        ...a,
        dev: devs?.find(d => d.id === a.developer_id) ?? null,
      }));
    },
  });

  async function decide(appId: string, developerId: string, action: "accept" | "reject") {
    const { data: proj } = await supabase.from("projects").select("title").eq("id", projectId).maybeSingle();

    if (action === "reject") {
      const { error } = await supabase.from("applications").update({ status: "rejected" }).eq("id", appId);
      if (error) return toast.error(error.message);

      await supabase.from("notifications").insert({
        user_id: developerId,
        title: "Application update",
        body: `Your application for ${proj?.title || "a project"} was declined.`,
        type: "application_rejected",
        link: `/applications/${appId}`
      });

      toast.success("Rejected");
    } else {
      const { error: e1 } = await supabase.from("applications").update({ status: "accepted" }).eq("id", appId);
      if (e1) return toast.error(e1.message);
      const app = apps?.find(a => a.id === appId);
      const { error: e2 } = await supabase.from("contracts").insert({
        project_id: projectId,
        application_id: appId,
        recruiter_id: recruiterId,
        developer_id: developerId,
        agreed_rate_inr: app?.proposed_rate_inr ?? null,
      });
      if (e2) return toast.error(e2.message);
      await supabase.from("projects").update({ status: "in_progress" }).eq("id", projectId);

      await supabase.from("notifications").insert({
        user_id: developerId,
        title: "Application accepted!",
        body: `You have been hired for ${proj?.title || "the project"}!`,
        type: "application_accepted",
        link: `/applications/${appId}`
      });

      toast.success("Hired! Contract created.");
    }
    qc.invalidateQueries({ queryKey: ["project-apps", projectId] });
    qc.invalidateQueries({ queryKey: ["project", projectId] });
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold">Applicants ({apps?.length ?? 0})</h2>
      <div className="mt-4 space-y-3">
        {apps?.length === 0 && <p className="text-sm text-muted-foreground">No applicants yet.</p>}
        {apps?.map(a => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link to="/developers/$devId" params={{ devId: a.developer_id }} className="font-semibold hover:text-accent">
                    {a.dev?.full_name ?? "Developer"}
                  </Link>
                  {a.dev?.is_verified && <Badge className="bg-success text-success-foreground">Verified</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{a.dev?.headline}</p>
                <p className="mt-3 text-sm">{a.cover_message}</p>
                {a.proposed_rate_inr && <p className="mt-2 text-xs text-muted-foreground">Proposed rate: ₹{a.proposed_rate_inr.toLocaleString()}</p>}
              </div>
              <Badge variant={a.status === "accepted" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}>{a.status}</Badge>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate({ to: "/applications/$appId", params: { appId: a.id } })}>Chat</Button>
              {a.status === "pending" && (
                <>
                  <Button size="sm" className="bg-gradient-accent text-primary-foreground hover:opacity-90" onClick={() => decide(a.id, a.developer_id, "accept")}><CheckCircle2 className="mr-1 h-4 w-4" /> Hire</Button>
                  <Button size="sm" variant="outline" onClick={() => decide(a.id, a.developer_id, "reject")}><XCircle className="mr-1 h-4 w-4" /> Reject</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
