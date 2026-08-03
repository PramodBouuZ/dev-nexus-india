import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DeveloperProfileDialog } from "@/components/DeveloperProfileDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Plus,
  Users,
  FileText,
  MessageSquare,
  ShieldCheck,
  Search,
  UserCog,
  Mail,
  Clock as ClockIcon,
  Phone,
  Globe,
  Github,
  Send,
  TrendingUp,
  Star,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractsList } from "@/components/ContractsList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteActions } from "@/components/InviteActions";
import { ReviewDialog } from "@/components/ReviewDialog";
import { logProjectActivityServerFn, sendTimelineEmailServerFn } from "@/utils/email-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NdaManager } from "./applications.$appId";
import { ProjectStages } from "@/components/ProjectStages";
import { ChatThread } from "@/components/ChatThread";
import {
  Check,
  Trash2,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ChevronRight,
  Activity,
  Play
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | DeveloperConnect" }] }),
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
        <PendingReviews userId={user.id} />
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

function PendingReviews({ userId }: { userId: string }) {
  const { data: pending } = useQuery({
    queryKey: ["needs-review", userId],
    queryFn: async () => {
      const { data } = await supabase.rpc("needs_review", { user_id: userId });
      if (!data?.length) return [];

      const otherPartyIds = data.map((r) => r.other_party_id);
      const [{ data: devs }, { data: recs }] = await Promise.all([
        supabase.from("developer_profiles").select("id, full_name").in("id", otherPartyIds),
        supabase
          .from("recruiter_profiles")
          .select("id, company_name, full_name")
          .in("id", otherPartyIds),
      ]);

      const projectsIds = data.map((r) => r.project_id);
      const { data: projects } = await supabase
        .from("projects")
        .select("id, title")
        .in("id", projectsIds);

      return data.map((r) => {
        const party =
          devs?.find((d) => d.id === r.other_party_id) ||
          recs?.find((rc) => rc.id === r.other_party_id);
        const proj = projects?.find((p) => p.id === r.project_id);
        return {
          ...r,
          targetName: (party as any)?.company_name || (party as any)?.full_name || "Partner",
          projectTitle: proj?.title || "Project",
        };
      });
    },
    staleTime: 1000 * 60 * 5,
  });

  const [reviewing, setReviewing] = useState<{
    contractId: string;
    targetId: string;
    targetName: string;
  } | null>(null);

  if (!pending?.length) return null;

  return (
    <div className="mb-8 p-6 bg-accent/10 border border-accent/20 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-primary-foreground">
          <Star className="h-5 w-5 fill-current" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Reviews Pending</h3>
          <p className="text-sm text-muted-foreground">
            Please share your experience to help our community grow.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {pending.map((r) => (
          <div
            key={r.contract_id}
            className="flex items-center justify-between p-4 bg-card border border-border rounded-xl"
          >
            <div>
              <p className="font-semibold">{r.targetName}</p>
              <p className="text-xs text-muted-foreground">For: {r.projectTitle}</p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                setReviewing({
                  contractId: r.contract_id,
                  targetId: r.other_party_id,
                  targetName: r.targetName,
                })
              }
            >
              Review Now
            </Button>
          </div>
        ))}
      </div>
      {reviewing && (
        <ReviewDialog
          open={!!reviewing}
          onOpenChange={(open) => !open && setReviewing(null)}
          contractId={reviewing.contractId}
          targetId={reviewing.targetId}
          targetName={reviewing.targetName}
        />
      )}
    </div>
  );
}

function NotificationCenter({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications", userId] });
    toast.success("Notification marked as read");
  }

  async function markAllRead() {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is_null("read_at");
    qc.invalidateQueries({ queryKey: ["notifications", userId] });
    toast.success("All notifications marked as read");
  }

  async function deleteNotification(id: string) {
    await supabase.from("notifications").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications", userId] });
    toast.success("Notification deleted");
  }

  if (isLoading) {
    return (
      <div className="space-y-3 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const unreadCount = notifications?.filter((n) => !n.read_at).length ?? 0;
  const displayNotifs = filter === "all" ? (notifications ?? []) : (notifications?.filter((n) => !n.read_at) ?? []);

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3">
        <div className="flex gap-2 text-xs font-semibold">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All ({notifications?.length ?? 0})
          </Button>
          <Button
            size="sm"
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
            className="relative"
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={markAllRead}
            className="text-xs h-8 border-success/30 text-success hover:bg-success/5"
          >
            Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {displayNotifs.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-dashed text-muted-foreground bg-muted/5">
            No notifications found.
          </div>
        ) : (
          displayNotifs.map((n) => {
            // Determine dynamic Lucide Icon based on type
            let IconComponent = Briefcase;
            let iconBg = "bg-primary/10 text-primary";

            if (n.type === "new_matching_project") {
              IconComponent = Briefcase;
              iconBg = "bg-indigo-500/10 text-indigo-500";
            } else if (n.type === "recruiter_invite" || n.type === "invite_accepted") {
              IconComponent = Send;
              iconBg = "bg-emerald-500/10 text-emerald-500";
            } else if (n.type === "new_message") {
              IconComponent = MessageSquare;
              iconBg = "bg-teal-500/10 text-teal-500";
            } else if (n.type === "project_assigned" || n.type === "stage_update" || n.type === "stage_completed") {
              IconComponent = ShieldCheck;
              iconBg = "bg-sky-500/10 text-sky-500";
            } else if (n.type === "contact_request" || n.type === "contact_approved") {
              IconComponent = Users;
              iconBg = "bg-amber-500/10 text-amber-500";
            }

            return (
              <div
                key={n.id}
                className={`flex items-start justify-between rounded-xl border border-border p-4 shadow-sm transition-all duration-200 hover:shadow-elegant ${
                  !n.read_at ? "bg-accent/5 border-l-2 border-l-accent" : "bg-card"
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {n.title}
                      </h4>
                      {!n.read_at && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-words">
                      {n.message || (n as any).body}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-3 shrink-0">
                  {n.link && (
                    <Button asChild size="sm" variant="outline" className="h-7 text-[10px]">
                      <Link to={n.link as any} onClick={() => !n.read_at && markAsRead(n.id)}>
                        View
                      </Link>
                    </Button>
                  )}
                  {!n.read_at && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-success"
                      onClick={() => markAsRead(n.id)}
                      title="Mark as Read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteNotification(n.id)}
                    title="Delete Notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

function RecruiterDashboard({ userId }: { userId: string }) {
  const { data: savedDevs } = useQuery({
    queryKey: ["saved-devs", userId],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favorites")
        .select("target_id")
        .eq("user_id", userId)
        .eq("kind", "developer");
      if (!favs?.length) return [];
      const ids = favs.map((f) => f.target_id);
      const { data: devs } = await supabase
        .from("developer_profiles")
        .select("id, full_name, avatar_url, headline, is_verified")
        .in("id", ids);
      return devs ?? [];
    },
  });

  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel(`recruiter-dashboard-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invites", filter: `recruiter_id=eq.${userId}` },
        async (payload) => {
          if (payload.eventType === "UPDATE") {
            const next = payload.new as { developer_id: string; status: string };
            const prev = payload.old as { status: string };
            if (
              next.status !== prev.status &&
              (next.status === "accepted" || next.status === "rejected")
            ) {
              const { data: dev } = await supabase
                .from("developer_profiles")
                .select("full_name")
                .eq("id", next.developer_id)
                .maybeSingle();
              const name = dev?.full_name ?? "A developer";
              if (next.status === "accepted") {
                toast.success(`${name} accepted your invite`);
              } else {
                toast(`${name} declined your invite`);
              }
            }
          }
          qc.invalidateQueries({ queryKey: ["sent-invites", userId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "applications" },
        async (payload) => {
          const { data: proj } = await supabase
            .from("projects")
            .select("recruiter_id")
            .eq("id", payload.new.project_id)
            .maybeSingle();
          if (proj?.recruiter_id === userId) {
            toast.success("New application received!");
            qc.invalidateQueries({ queryKey: ["my-projects", userId] });
            qc.invalidateQueries({ queryKey: ["incoming-apps", userId] });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_access_requests",
          filter: `target_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") toast.info("New contact access request received");
          qc.invalidateQueries({ queryKey: ["incoming-contact-reqs", userId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_access_requests",
          filter: `requester_id=eq.${userId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["sent-contact-reqs", userId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_assignments",
          filter: `recruiter_id=eq.${userId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["assigned-devs", userId] });
          qc.invalidateQueries({ queryKey: ["my-projects", userId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications", userId] });
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
        .from("projects")
        .select("*")
        .eq("recruiter_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: userData } = useQuery({
    queryKey: ["user-meta", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("subscription_tier")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
  });

  const { data: monthlyCount } = useQuery({
    queryKey: ["monthly-project-count", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("count_monthly_projects", { _user_id: userId });
      if (error) throw error;
      return data as number;
    },
  });

  const { data: contracts } = useQuery({
    queryKey: ["my-contracts-rec", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("contracts")
        .select("*, projects(title)")
        .eq("recruiter_id", userId);
      return data ?? [];
    },
  });

  const { data: assignedDevs } = useQuery({
    queryKey: ["assigned-devs", userId],
    queryFn: async () => {
      const { data: assignments } = await supabase
        .from("project_assignments")
        .select("*, projects(title)")
        .eq("recruiter_id", userId);
      if (!assignments?.length) return [];
      const devIds = assignments.map((a) => a.developer_id);
      const { data: devs } = await supabase
        .from("developer_profiles")
        .select("id, full_name, avatar_url, headline")
        .in("id", devIds);
      return assignments.map((a) => ({
        ...a,
        dev: devs?.find((d) => d.id === a.developer_id),
      }));
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
      const devIds = Array.from(new Set(list.map((i) => i.developer_id)));
      const projIds = Array.from(
        new Set(list.map((i) => i.project_id).filter(Boolean) as string[]),
      );
      const [{ data: devs }, { data: projs }] = await Promise.all([
        supabase
          .from("developer_profiles")
          .select("id, full_name, avatar_url, headline, skills, is_verified, location")
          .in("id", devIds),
        projIds.length
          ? supabase.from("projects").select("id, title").in("id", projIds)
          : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      ]);
      return list.map((i) => ({
        ...i,
        dev: devs?.find((d) => d.id === i.developer_id) ?? null,
        project: i.project_id ? (projs?.find((p) => p.id === i.project_id) ?? null) : null,
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
      const ids = reqs.map((r) => r.target_id);
      const [{ data: devs }, { data: recs }, { data: phones }, { data: recPhones }] =
        await Promise.all([
          supabase
            .from("developer_profiles")
            .select("id, full_name, avatar_url, headline")
            .in("id", ids),
          supabase
            .from("recruiter_profiles")
            .select("id, full_name, company_name, avatar_url")
            .in("id", ids),
          supabase
            .from("developer_phones" as any)
            .select("developer_id, phone")
            .in("developer_id", ids),
          supabase
            .from("recruiter_phones" as any)
            .select("recruiter_id, phone")
            .in("recruiter_id", ids),
        ]);
      return reqs.map((r) => {
        const dev = devs?.find((d) => d.id === r.target_id);
        const rec = recs?.find((rc) => rc.id === r.target_id);
        const phone =
          (phones as any[] | null)?.find((p: any) => p.developer_id === r.target_id)?.phone ??
          (recPhones as any[] | null)?.find((p: any) => p.recruiter_id === r.target_id)?.phone;
        return {
          ...r,
          dev: dev || rec,
          phone: phone ?? null,
        };
      });
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
      const ids = reqs.map((r) => r.requester_id);
      const [{ data: devs }, { data: recs }, { data: phones }, { data: recPhones }] =
        await Promise.all([
          supabase
            .from("developer_profiles")
            .select("id, full_name, avatar_url, headline, skills")
            .in("id", ids),
          supabase
            .from("recruiter_profiles")
            .select("id, full_name, company_name, avatar_url")
            .in("id", ids),
          supabase
            .from("developer_phones" as any)
            .select("developer_id, phone")
            .in("developer_id", ids),
          supabase
            .from("recruiter_phones" as any)
            .select("recruiter_id, phone")
            .in("recruiter_id", ids),
        ]);
      return reqs.map((r) => {
        const dev = devs?.find((d) => d.id === r.requester_id);
        const rec = recs?.find((rc) => rc.id === r.requester_id);
        const phone =
          (phones as any[] | null)?.find((p: any) => p.developer_id === r.requester_id)?.phone ??
          (recPhones as any[] | null)?.find((p: any) => p.recruiter_id === r.requester_id)?.phone;
        return {
          ...r,
          dev: dev || rec,
          phone: phone ?? null,
        };
      });
    },
  });

  const { data: incomingApplications } = useQuery({
    queryKey: ["incoming-apps", userId],
    queryFn: async () => {
      // First get recruiter's projects
      const { data: myProjs } = await supabase
        .from("projects")
        .select("id, title")
        .eq("recruiter_id", userId);
      if (!myProjs?.length) return [];
      const projIds = myProjs.map((p) => p.id);
      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .in("project_id", projIds)
        .order("created_at", { ascending: false });
      if (!apps?.length) return [];
      const devIds = apps.map((a) => a.developer_id);
      const { data: devs } = await supabase
        .from("developer_profiles")
        .select("id, full_name, avatar_url, headline, skills")
        .in("id", devIds);
      return apps.map((a) => ({
        ...a,
        dev: devs?.find((d) => d.id === a.developer_id),
        projectTitle: myProjs.find((p) => p.id === a.project_id)?.title,
      }));
    },
  });

  async function respondToRequest(reqId: string, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("contact_access_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", reqId);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "approved" ? "Contact shared" : "Request rejected");
      qc.invalidateQueries({ queryKey: ["incoming-contact-reqs", userId] });
    }
  }

  return (
    <>
      <DashboardHeader title="Recruiter dashboard" subtitle="Manage your projects and hires.">
        <Button asChild variant="outline">
          <Link to="/profile">
            <UserCog className="mr-1 h-4 w-4" /> Edit profile
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/developers">
            <Search className="mr-1 h-4 w-4" /> Find developers
          </Link>
        </Button>
        <Button asChild className="bg-gradient-accent text-primary-foreground hover:opacity-90">
          <Link to="/projects/new">
            <Plus className="mr-1 h-4 w-4" /> Post project
          </Link>
        </Button>
      </DashboardHeader>

      <div className="mt-8 grid gap-4 md:grid-cols-4 sm:grid-cols-2">
        <StatCard
          icon={Briefcase}
          label="Active projects"
          value={
            projects?.filter(
              (p) =>
                p.status === "open" || p.status === "in_progress" || p.status === "in_discussion",
            ).length ?? 0
          }
        />
        <StatCard icon={Users} label="Assigned Developers" value={assignedDevs?.length ?? 0} />
        <StatCard icon={TrendingUp} label="Invites Sent" value={invites?.length ?? 0} />
        {userData?.subscription_tier === "free" ? (
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 shadow-card">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Projects Used
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {monthlyCount ?? 0} / 10
                </Badge>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${Math.min(((monthlyCount ?? 0) / 10) * 100, 100)}%` }}
                />
              </div>
              <Link to="/pricing" className="text-[10px] text-accent hover:underline font-medium">
                Upgrade for unlimited
              </Link>
            </div>
          </div>
        ) : (
          <StatCard icon={FileText} label="Total projects" value={projects?.length ?? 0} />
        )}
      </div>

      <Tabs defaultValue="workspace" className="mt-10">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="workspace" className="font-semibold text-accent hover:text-accent-foreground">Workspace 🚀</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
          <TabsTrigger value="saved">Saved Developers</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace">
          <RecruiterWorkspace userId={userId} />
        </TabsContent>

        <TabsContent value="projects">
          <section className="mt-6">
            <h2 className="font-display text-xl font-semibold">Your projects</h2>
            <div className="mt-4 space-y-3">
              {!projects || projects.length === 0 ? (
                <EmptyState
                  title="No projects yet"
                  desc="Post your first project to start matching with developers."
                  actionLabel="Post project"
                  actionTo="/projects/new"
                />
              ) : (
                projects.map((p) => (
                  <Link
                    key={p.id}
                    to="/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="block rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-accent/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{p.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {p.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.tech_stack?.slice(0, 5).map((t) => (
                            <Badge key={t} variant="secondary">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge
                        variant={
                          p.status === "open"
                            ? "default"
                            : p.status === "assigned"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {p.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="assigned">
          <section className="mt-6">
            <h2 className="font-display text-xl font-semibold">Assigned Developers</h2>
            <div className="mt-4 space-y-3">
              {!assignedDevs || assignedDevs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No developers assigned yet.</p>
              ) : (
                assignedDevs.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-border bg-card p-5 shadow-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={a.dev?.avatar_url ?? undefined} />
                          <AvatarFallback>{a.dev?.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <DeveloperProfileDialog
                            developerId={a.developer_id}
                            trigger={
                              <span className="font-semibold hover:text-accent cursor-pointer">
                                {a.dev?.full_name}
                              </span>
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Assigned to:{" "}
                            <span className="font-medium text-foreground">{a.projects?.title}</span>
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Assigned</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="saved">
          <section className="mt-6">
            <h2 className="font-display text-xl font-semibold">Saved developers</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {!savedDevs || savedDevs.length === 0 ? (
                <p className="col-span-full text-sm text-muted-foreground">
                  No developers saved yet.
                </p>
              ) : (
                savedDevs.map((d) => (
                  <DeveloperProfileDialog
                    key={d.id}
                    developerId={d.id}
                    trigger={
                      <div className="group block rounded-xl border border-border bg-card p-4 shadow-card hover:border-accent/40 transition-all hover:shadow-elegant cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={d.avatar_url ?? undefined} />
                            <AvatarFallback>{d.full_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold truncate group-hover:text-accent transition-colors">
                                {d.full_name}
                              </p>
                              {d.is_verified && <ShieldCheck className="h-3 w-3 text-accent" />}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{d.headline}</p>
                          </div>
                        </div>
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="invites">
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Developers you invited</h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/developers">
                  <Search className="mr-1 h-3.5 w-3.5" /> Find more
                </Link>
              </Button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {!invites || invites.length === 0 ? (
                <div className="md:col-span-2">
                  <EmptyState
                    title="No invites sent yet"
                    desc="Browse developers and invite them to work with you."
                    actionLabel="Find developers"
                    actionTo="/developers"
                  />
                </div>
              ) : (
                invites.map((i) => (
                  <div
                    key={i.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-card"
                  >
                    <div className="flex items-start gap-3">
                      <DeveloperProfileDialog
                        developerId={i.developer_id}
                        trigger={
                          <div className="group cursor-pointer">
                            <Avatar className="h-12 w-12 transition-transform group-hover:scale-105">
                              {i.dev?.avatar_url && (
                                <AvatarImage
                                  src={i.dev.avatar_url}
                                  alt={i.dev?.full_name ?? "Developer"}
                                />
                              )}
                              <AvatarFallback className="bg-gradient-accent text-primary-foreground font-display text-sm font-bold">
                                {i.dev?.full_name?.[0] ?? "?"}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <DeveloperProfileDialog
                            developerId={i.developer_id}
                            trigger={
                              <span className="font-semibold hover:text-accent transition-colors cursor-pointer">
                                {i.dev?.full_name ?? "Developer"}
                              </span>
                            }
                          />
                          {i.dev?.is_verified && (
                            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                          )}
                          <Badge
                            variant={
                              i.status === "accepted"
                                ? "default"
                                : i.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="capitalize"
                          >
                            {i.status}
                          </Badge>
                        </div>
                        {i.dev?.headline && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {i.dev.headline}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {i.dev?.skills?.slice(0, 4).map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-[10px]">
                              {s}
                            </Badge>
                          ))}
                        </div>
                        {i.project?.title && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            For:{" "}
                            <span className="font-medium text-foreground">{i.project.title}</span>
                          </p>
                        )}
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Sent {new Date(i.created_at).toLocaleDateString()}
                        </p>
                        {i.status === "pending" && (
                          <InviteActions
                            inviteId={i.id}
                            developerName={i.dev?.full_name ?? "Developer"}
                            currentMessage={i.message}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="applications">
          <section className="mt-6">
            <h2 className="font-display text-xl font-semibold">Applications Received</h2>
            <div className="mt-4 space-y-3">
              {!incomingApplications || incomingApplications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No applications received yet.</p>
              ) : (
                incomingApplications.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-border bg-card p-5 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <DeveloperProfileDialog
                          developerId={a.developer_id}
                          trigger={
                            <div className="group block cursor-pointer">
                              <Avatar className="h-12 w-12 transition-transform group-hover:scale-105">
                                <AvatarImage src={a.dev?.avatar_url ?? undefined} />
                                <AvatarFallback>{a.dev?.full_name?.[0]}</AvatarFallback>
                              </Avatar>
                            </div>
                          }
                        />
                        <div>
                          <DeveloperProfileDialog
                            developerId={a.developer_id}
                            trigger={
                              <span className="font-semibold hover:text-accent transition-colors cursor-pointer">
                                {a.dev?.full_name}
                              </span>
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Applied to:{" "}
                            <span className="font-medium text-foreground">{a.projectTitle}</span>
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {a.dev?.skills?.slice(0, 3).map((s: string) => (
                              <Badge key={s} variant="secondary" className="text-[10px]">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant={
                            a.status === "accepted"
                              ? "default"
                              : a.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {a.status}
                        </Badge>
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                          <Link to="/applications/$appId" params={{ appId: a.id }}>
                            View Application
                          </Link>
                        </Button>
                      </div>
                    </div>
                    {a.cover_message && (
                      <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground italic">
                        "{a.cover_message}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="contacts">
          <section className="mt-6">
            <div className="space-y-10">
              {/* Incoming requests to recruiter */}
              <div>
                <h2 className="font-display text-xl font-semibold">Received Contact Requests</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Developers who want to connect with you.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {!incomingRequests || incomingRequests.length === 0 ? (
                    <p className="col-span-full text-sm text-muted-foreground">
                      No received requests yet.
                    </p>
                  ) : (
                    incomingRequests.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-xl border border-border bg-card p-4 shadow-card"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <DeveloperProfileDialog
                              developerId={r.requester_id}
                              trigger={
                                <div className="group block cursor-pointer">
                                  <Avatar className="h-10 w-10 transition-transform group-hover:scale-105">
                                    <AvatarImage src={r.dev?.avatar_url ?? undefined} />
                                    <AvatarFallback>{r.dev?.full_name?.[0]}</AvatarFallback>
                                  </Avatar>
                                </div>
                              }
                            />
                            <div>
                              <DeveloperProfileDialog
                                developerId={r.requester_id}
                                trigger={
                                  <span className="text-sm font-semibold hover:text-accent cursor-pointer">
                                    {r.dev?.full_name}
                                  </span>
                                }
                              />
                              <p className="text-[10px] text-muted-foreground">
                                Requested {new Date(r.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {r.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => respondToRequest(r.id, "approved")}
                                className="h-7 text-[10px] border-success/30 text-success hover:bg-success/10 px-2"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => respondToRequest(r.id, "rejected")}
                                className="h-7 text-[10px] text-destructive hover:bg-destructive/10 px-2"
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <Badge variant={r.status === "approved" ? "default" : "destructive"}>
                              {r.status}
                            </Badge>
                          )}
                        </div>
                        {r.message && (
                          <p className="mt-2 text-xs text-muted-foreground italic">"{r.message}"</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Outgoing requests from recruiter */}
              <div>
                <h2 className="font-display text-xl font-semibold">Sent Contact Requests</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Developers you've requested contact details from.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {!sentRequests || sentRequests.length === 0 ? (
                    <p className="col-span-full text-sm text-muted-foreground">
                      No sent requests yet.
                    </p>
                  ) : (
                    sentRequests.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-xl border border-border bg-card p-4 shadow-card"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <DeveloperProfileDialog
                              developerId={r.target_id}
                              trigger={
                                <div className="group block cursor-pointer">
                                  <Avatar className="h-10 w-10 transition-transform group-hover:scale-105">
                                    <AvatarImage src={r.dev?.avatar_url ?? undefined} />
                                    <AvatarFallback>{r.dev?.full_name?.[0]}</AvatarFallback>
                                  </Avatar>
                                </div>
                              }
                            />
                            <div>
                              <DeveloperProfileDialog
                                developerId={r.target_id}
                                trigger={
                                  <span className="text-sm font-semibold hover:text-accent transition-colors cursor-pointer">
                                    {r.dev?.full_name}
                                  </span>
                                }
                              />
                              <p className="text-[10px] text-muted-foreground">
                                Requested {new Date(r.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              r.status === "approved"
                                ? "default"
                                : r.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {r.status}
                          </Badge>
                        </div>
                        {r.status === "approved" && (
                          <div className="mt-3 space-y-1.5 rounded-md border border-success/30 bg-success/5 p-3 text-sm">
                            <div className="flex items-center gap-2 text-xs font-medium text-success-foreground">
                              <ShieldCheck className="h-3.5 w-3.5" /> Contact unlocked
                            </div>
                            {r.email && (
                              <a
                                href={`mailto:${r.email}`}
                                className="flex items-center gap-2 hover:underline"
                              >
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {r.email}
                              </a>
                            )}
                            {r.phone && (
                              <a
                                href={`tel:${r.phone}`}
                                className="flex items-center gap-2 hover:underline"
                              >
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {r.phone}
                              </a>
                            )}
                            {!r.email && !r.phone && (
                              <p className="text-xs text-muted-foreground">
                                No contact details added yet by the developer.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationCenter userId={userId} />
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

export function RecruiterWorkspace({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedDevId, setSelectedDevId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<"chat" | "milestones">("chat");
  const [busy, setBusy] = useState(false);

  // Fetch all projects of the recruiter
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ["workspace-projects", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("recruiter_id", userId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Set default selected project ID
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  const project = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Fetch active assignment if any
  const { data: activeAssignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ["workspace-assignment", selectedProjectId],
    enabled: !!selectedProjectId,
    queryFn: async () => {
      const { data } = await supabase
        .from("project_assignments")
        .select("*")
        .eq("project_id", selectedProjectId)
        .maybeSingle();
      return data;
    },
  });

  // Fetch all applications/candidates for the selected project
  const { data: applicants = [], isLoading: loadingApplicants } = useQuery({
    queryKey: ["workspace-applicants", selectedProjectId],
    enabled: !!selectedProjectId,
    queryFn: async () => {
      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .eq("project_id", selectedProjectId)
        .order("created_at", { ascending: false });
      if (!apps?.length) return [];

      const devIds = apps.map((a) => a.developer_id);
      const { data: devs } = await supabase
        .from("developer_profiles")
        .select("id, full_name, avatar_url, headline, skills, is_verified")
        .in("id", devIds);

      return apps.map((a) => ({
        ...a,
        dev: devs?.find((d) => d.id === a.developer_id) || null,
      }));
    },
  });

  // Automatically select viewed developer (either the assigned one or default to the first accepted/pending)
  useEffect(() => {
    if (activeAssignment) {
      setSelectedDevId(activeAssignment.developer_id);
      setWorkspaceTab("milestones");
    } else {
      const acceptedCandidates = applicants.filter((a) => a.status === "accepted");
      if (acceptedCandidates.length > 0) {
        setSelectedDevId(acceptedCandidates[0].developer_id);
        setWorkspaceTab("chat");
      } else if (applicants.length > 0) {
        setSelectedDevId(applicants[0].developer_id);
        setWorkspaceTab("chat");
      } else {
        setSelectedDevId(null);
      }
    }
  }, [activeAssignment, applicants]);

  // Find the current active candidate's application details
  const activeApp = applicants.find((a) => a.developer_id === selectedDevId);

  // Update Project Status
  async function handleUpdateProjectStatus(status: any) {
    const { error } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", selectedProjectId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Project status updated to ${status}`);
      qc.invalidateQueries({ queryKey: ["workspace-projects", userId] });
      qc.invalidateQueries({ queryKey: ["project", selectedProjectId] });
    }
  }

  // Accept/Hire Candidate
  async function handleHireCandidate(appId: string, developerId: string, proposedRate: number | null) {
    setBusy(true);
    const { error: appErr } = await supabase
      .from("applications")
      .update({ status: "accepted" })
      .eq("id", appId);

    if (appErr) {
      toast.error(appErr.message);
      setBusy(false);
      return;
    }

    // Create contract
    const { error: conErr } = await supabase.from("contracts").insert({
      project_id: selectedProjectId,
      application_id: appId,
      recruiter_id: userId,
      developer_id: developerId,
      agreed_rate_inr: proposedRate,
    });

    if (conErr) {
      toast.error(conErr.message);
      setBusy(false);
      return;
    }

    // Update project status to in_discussion
    await supabase.from("projects").update({ status: "in_discussion" }).eq("id", selectedProjectId);

    // Notify developer
    await supabase.from("notifications").insert({
      user_id: developerId,
      title: "Interest Accepted! 🎉",
      body: `Your application/interest for project "${project?.title}" has been accepted! You can now chat and sign the Mutual NDA.`,
      type: "application_accepted",
      link: `/applications/${appId}`,
    });

    toast.success("Candidate accepted/hired successfully! Chat and NDA unlocked.");
    qc.invalidateQueries({ queryKey: ["workspace-applicants", selectedProjectId] });
    qc.invalidateQueries({ queryKey: ["workspace-projects", userId] });
    setBusy(false);
  }

  // Assign Developer to Project
  async function handleAssignDeveloper(devId: string) {
    // Check NDA first
    const { data: nda } = await supabase
      .from("ndas")
      .select("status")
      .eq("project_id", selectedProjectId)
      .eq("developer_id", devId)
      .maybeSingle();

    if (!nda || nda.status !== "accepted") {
      toast.error("Mutual NDA must be signed by the developer before assigning the project.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.from("project_assignments").insert({
      project_id: selectedProjectId,
      developer_id: devId,
      recruiter_id: userId,
    });

    if (!error) {
      // Notify developer
      await supabase.from("notifications").insert({
        user_id: devId,
        title: "Project Assigned! 🚀",
        body: `You have been officially assigned to the project: ${project?.title}`,
        type: "project_assigned",
        link: `/projects/${selectedProjectId}`,
      });

      // Update project status to assigned
      await supabase.from("projects").update({ status: "assigned" }).eq("id", selectedProjectId);

      try {
        await logProjectActivityServerFn({
          data: {
            projectId: selectedProjectId,
            userId,
            activityType: "project_started",
            description: `Project assigned and started`,
          },
        });
        await sendTimelineEmailServerFn({
          data: {
            projectId: selectedProjectId,
            senderId: userId,
            type: "project_started",
          },
        });
      } catch (actErr) {
        console.error("Failed to log activity or send email:", actErr);
      }

      toast.success("Project assigned successfully!");
      qc.invalidateQueries({ queryKey: ["workspace-projects", userId] });
      qc.invalidateQueries({ queryKey: ["workspace-assignment", selectedProjectId] });
      qc.invalidateQueries({ queryKey: ["stages", selectedProjectId] });
    } else {
      toast.error(error.message);
    }
    setBusy(false);
  }

  if (loadingProjects) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-10 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-muted animate-pulse rounded-xl col-span-1" />
          <div className="h-64 bg-muted animate-pulse rounded-xl col-span-2" />
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          title="No projects posted yet"
          desc="Post a project first, then use this workspace to track candidate status, accept candidates, sign NDAs, assign tasks, and chat."
          actionLabel="Post a project"
          actionTo="/projects/new"
        />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Workspace Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 bg-card border border-border rounded-2xl shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="space-y-1 flex-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Active Workspace Project</span>
            <Select value={selectedProjectId} onValueChange={(val) => {
              setSelectedProjectId(val);
              setSelectedDevId(null);
            }}>
              <SelectTrigger className="font-semibold text-base h-10 w-full md:w-80 border-none shadow-none focus:ring-0 p-0 hover:text-accent">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-sm font-medium">
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {project && (
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Project Status</span>
              <Badge className="capitalize mt-0.5" variant={project.status === "assigned" ? "default" : "secondary"}>
                {project.status.replace("_", " ")}
              </Badge>
            </div>
            <Select value={project.status} onValueChange={handleUpdateProjectStatus}>
              <SelectTrigger className="h-9 w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open (Hiring)</SelectItem>
                <SelectItem value="in_discussion">In Discussion</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="completed">Completed 🏆</SelectItem>
                <SelectItem value="closed">Closed / Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & NDA & Developer Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Candidate / Active Developer Info Section */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" /> Candidate / Hired Developer
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold">
                {activeAssignment ? "Hired & Assigned" : "Select Candidate"}
              </Badge>
            </div>

            {/* List of candidates/applicants for the selected project */}
            {applicants.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <p>No applicants or invites for this project yet.</p>
                <Link to="/developers" className="text-accent hover:underline font-bold mt-2 block">
                  Find and Invite Developers →
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {applicants.map((a) => {
                  const isSelected = selectedDevId === a.developer_id;
                  const isAssigned = activeAssignment?.developer_id === a.developer_id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedDevId(a.developer_id)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-accent/5 border-accent shadow-sm"
                          : "bg-background border-border hover:border-border/80"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={a.dev?.avatar_url || undefined} />
                          <AvatarFallback>{a.dev?.full_name?.[0] || "D"}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-bold truncate">{a.dev?.full_name || "Independent Specialist"}</span>
                            {a.dev?.is_verified && <ShieldCheck className="h-3 w-3 text-accent" />}
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate block">{a.dev?.headline}</span>
                        </div>
                      </div>
                      <Badge className="capitalize text-[9px] px-1.5 py-0.2 shrink-0 ml-2" variant={a.status === "accepted" ? "default" : "outline"}>
                        {isAssigned ? "Assigned" : a.status}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected Developer Detailed Card */}
            {activeApp && activeApp.dev && (
              <div className="border border-border/60 bg-muted/20 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{activeApp.dev.full_name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{activeApp.dev.headline}</p>
                  </div>
                  <DeveloperProfileDialog
                    developerId={activeApp.developer_id}
                    trigger={
                      <Button size="sm" variant="outline" className="text-[10px] h-7 px-2">
                        View Profile
                      </Button>
                    }
                  />
                </div>

                {activeApp.cover_message && (
                  <div className="text-[11px] italic text-muted-foreground bg-background p-2.5 rounded border border-border/40 line-clamp-3">
                    "{activeApp.cover_message}"
                  </div>
                )}

                {/* Direct Action Buttons: Accept/Hire or Confirm Assignment */}
                <div className="pt-2 border-t border-border/40 flex flex-wrap items-center gap-2">
                  {activeApp.status === "pending" && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => handleHireCandidate(activeApp.id, activeApp.developer_id, activeApp.proposed_rate_inr)}
                      className="bg-gradient-accent text-primary-foreground font-bold text-xs"
                    >
                      {busy ? "Processing..." : "Hire & Accept Candidate"}
                    </Button>
                  )}

                  {activeApp.status === "accepted" && !activeAssignment && (
                    <div className="w-full space-y-2">
                      <div className="p-3 rounded-lg border border-warning/30 bg-warning/5 text-[11px] text-warning-foreground flex items-start gap-1.5 leading-normal">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-warning" />
                        <span>
                          Both parties have accepted interest! <strong>Step 1:</strong> Send & get the Mutual NDA signed by the developer (in the NDA manager below or chat). <strong>Step 2:</strong> Click "Assign Developer" to officially launch milestones tracking!
                        </span>
                      </div>
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => handleAssignDeveloper(activeApp.developer_id)}
                        className="w-full bg-success text-success-foreground hover:opacity-90 font-bold text-xs flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="h-4 w-4" /> {busy ? "Assigning..." : "Assign Developer to Project"}
                      </Button>
                    </div>
                  )}

                  {isAssignedActiveDev(activeApp.developer_id) && (
                    <div className="w-full p-2.5 rounded-lg border border-success/30 bg-success/5 text-[11px] text-success-foreground font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> This developer is officially assigned and working on this project!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* NDA Management Section (Embedded) */}
          {project && selectedDevId && activeApp && activeApp.status === "accepted" && (
            <NdaManager
              projectId={project.id}
              developerId={selectedDevId}
              recruiterId={userId}
              role="recruiter"
              applicationId={activeApp.id}
            />
          )}
        </div>

        {/* RIGHT COLUMN: Chat / Stages Tabbed View (7 cols) */}
        <div className="lg:col-span-7">
          {activeApp ? (
            <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
              <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/10">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={workspaceTab === "chat" ? "default" : "ghost"}
                    onClick={() => setWorkspaceTab("chat")}
                    className="text-xs font-semibold gap-1.5"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Messages & NDA
                  </Button>
                  <Button
                    size="sm"
                    disabled={!activeAssignment}
                    variant={workspaceTab === "milestones" ? "default" : "ghost"}
                    onClick={() => setWorkspaceTab("milestones")}
                    className={`text-xs font-semibold gap-1.5 ${!activeAssignment ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <Activity className="h-3.5 w-3.5" /> Milestones & Stages
                  </Button>
                </div>
                {activeAssignment && (
                  <Badge variant="outline" className="border-success/30 text-success bg-success/5 text-[10px] font-bold">
                    Project Active
                  </Badge>
                )}
              </div>

              <div className="p-5">
                {workspaceTab === "chat" ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-sm">Unified Communication Center</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Discuss terms, review milestones, and exchange files directly with the candidate.</p>
                    </div>
                    <ChatThread appId={activeApp.id} userId={userId} />
                  </div>
                ) : (
                  activeAssignment && (
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-bold text-sm">Project Timeline & Milestones Workspace</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Build deliverables roadmap, set deadlines, track progress percentage, and update work status logs live.</p>
                      </div>
                      <ProjectStages projectId={project.id} />
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-dashed border-border rounded-2xl h-80 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <h4 className="font-bold text-sm">Unified Communication & Milestones Room</h4>
              <p className="text-xs max-w-xs mt-1">Select an applicant or hired developer in the left column to unlock messaging, NDA terms, and interactive milestones tracking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function isAssignedActiveDev(devId: string) {
    return activeAssignment && activeAssignment.developer_id === devId;
  }
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
      const { data } = await supabase
        .from("contracts")
        .select("*, projects(title)")
        .eq("developer_id", userId);
      return data ?? [];
    },
  });
  const { data: profile } = useQuery({
    queryKey: ["dev-profile", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      return data;
    },
  });

  const { data: assignedProjects } = useQuery({
    queryKey: ["assigned-projects", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_assignments")
        .select("*, projects(*)")
        .eq("developer_id", userId);
      return data ?? [];
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
      const ids = reqs.map((r) => r.requester_id);
      const [{ data: devs }, { data: recs }, { data: phones }, { data: recPhones }] =
        await Promise.all([
          supabase
            .from("developer_profiles")
            .select("id, full_name, avatar_url, headline, skills")
            .in("id", ids),
          supabase
            .from("recruiter_profiles")
            .select("id, company_name, logo_url, full_name")
            .in("id", ids),
          supabase
            .from("developer_phones" as any)
            .select("developer_id, phone")
            .in("developer_id", ids),
          supabase
            .from("recruiter_phones" as any)
            .select("recruiter_id, phone")
            .in("recruiter_id", ids),
        ]);
      return reqs.map((r) => {
        const dev = devs?.find((d) => d.id === r.requester_id);
        const rec = recs?.find((rc) => rc.id === r.requester_id);
        const phone =
          (phones as any[] | null)?.find((p: any) => p.developer_id === r.requester_id)?.phone ??
          (recPhones as any[] | null)?.find((p: any) => p.recruiter_id === r.requester_id)?.phone;
        return {
          ...r,
          recruiter: rec || dev,
          phone: phone ?? null,
        };
      });
    },
  });

  const { data: sentRequests } = useQuery({
    queryKey: ["sent-contact-reqs-dev", userId],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data: reqs } = await supabase
        .from("contact_access_requests")
        .select("*")
        .eq("requester_id", userId)
        .order("created_at", { ascending: false });
      if (!reqs?.length) return [];
      const ids = reqs.map((r) => r.target_id);
      const [{ data: devs }, { data: recs }, { data: phones }, { data: recPhones }] =
        await Promise.all([
          supabase
            .from("developer_profiles")
            .select("id, full_name, avatar_url, headline, skills")
            .in("id", ids),
          supabase
            .from("recruiter_profiles")
            .select("id, company_name, logo_url, full_name")
            .in("id", ids),
          supabase
            .from("developer_phones" as any)
            .select("developer_id, phone")
            .in("developer_id", ids),
          supabase
            .from("recruiter_phones" as any)
            .select("recruiter_id, phone")
            .in("recruiter_id", ids),
        ]);
      return reqs.map((r) => {
        const dev = devs?.find((d) => d.id === r.target_id);
        const rec = recs?.find((rc) => rc.id === r.target_id);
        const phone =
          (phones as any[] | null)?.find((p: any) => p.developer_id === r.target_id)?.phone ??
          (recPhones as any[] | null)?.find((p: any) => p.recruiter_id === r.target_id)?.phone;
        return {
          ...r,
          recruiter: rec || dev,
          phone: phone ?? null,
        };
      });
    },
  });

  const { data: incomingInvites } = useQuery({
    queryKey: ["incoming-invites", userId],
    queryFn: async () => {
      const { data: invs } = await supabase
        .from("invites")
        .select("*, projects(title, recruiter_id)")
        .eq("developer_id", userId)
        .order("created_at", { ascending: false });
      if (!invs?.length) return [];
      const recIds = invs.map((i) => i.recruiter_id);
      const { data: recs } = await supabase
        .from("recruiter_profiles")
        .select("id, company_name, logo_url, full_name")
        .in("id", recIds);
      return invs.map((i) => ({
        ...i,
        recruiter: recs?.find((r) => r.id === i.recruiter_id),
      }));
    },
  });

  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel(`developer-dashboard-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invites", filter: `developer_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") toast.success("You received a new project invite!");
          qc.invalidateQueries({ queryKey: ["incoming-invites", userId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_access_requests",
          filter: `target_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") toast.info("New contact access request received");
          qc.invalidateQueries({ queryKey: ["incoming-contact-reqs", userId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contact_access_requests",
          filter: `requester_id=eq.${userId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["sent-contact-reqs-dev", userId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
          filter: `developer_id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as { status: string };
          const prev = payload.old as { status: string };
          if (next.status !== prev.status) {
            toast.info(`Application status updated: ${next.status}`);
            qc.invalidateQueries({ queryKey: ["my-apps", userId] });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_assignments",
          filter: `developer_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT")
            toast.success("You have been assigned to a new project!");
          qc.invalidateQueries({ queryKey: ["assigned-projects", userId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications", userId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, qc]);

  async function respondToRequest(reqId: string, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("contact_access_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", reqId);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "approved" ? "Contact shared" : "Request rejected");
      qc.invalidateQueries({ queryKey: ["incoming-contact-reqs", userId] });
    }
  }

  async function respondToInvite(inviteId: string, status: "accepted" | "rejected") {
    const { data: invite } = await supabase
      .from("invites")
      .select("*")
      .eq("id", inviteId)
      .maybeSingle();
    if (!invite) return toast.error("Invite not found");

    const { error } = await supabase.from("invites").update({ status }).eq("id", inviteId);
    if (error) return toast.error(error.message);

    if (status === "accepted" && invite.project_id) {
      // Rule 2 Step 3: Create application & contract immediately to unlock chat
      const { data: app, error: appErr } = await supabase
        .from("applications")
        .insert({
          project_id: invite.project_id,
          developer_id: userId,
          status: "accepted",
          cover_message: `Invite accepted: ${invite.message || ""}`,
        })
        .select()
        .maybeSingle();

      if (!appErr && app) {
        await supabase.from("contracts").insert({
          project_id: invite.project_id,
          application_id: app.id,
          recruiter_id: invite.recruiter_id,
          developer_id: userId,
        });
        await supabase
          .from("projects")
          .update({ status: "in_discussion" })
          .eq("id", invite.project_id);

        try {
          await logProjectActivityServerFn({
            data: {
              projectId: invite.project_id,
              userId,
              activityType: "invitation_accepted",
              description: "Developer accepted invitation",
            },
          });
        } catch (actErr) {
          console.error("Failed to log activity:", actErr);
        }
      }
    } else if (status === "accepted" && !invite.project_id) {
      // General invite accepted, can we still unlock chat?
      // Rule 2 says: Automatically: Chat becomes unlocked, Messaging becomes active
      // Since chat currently relies on application_id, we might need a general conversation or a dummy application
      // Let's create a "General Inquiry" project/application if none exists?
      // Actually, Rule 2 Step 3 says "Messaging becomes active".
      // Our chat logic in ChatThread currently requires appId.
      // If no project_id, we might need to handle this differently.
      // For now, let's assume most invites have a project_id.
    }

    toast.success(status === "accepted" ? "Invite accepted" : "Invite declined");
    qc.invalidateQueries({ queryKey: ["incoming-invites", userId] });
    qc.invalidateQueries({ queryKey: ["my-apps", userId] });
  }

  async function toggleAvailability() {
    if (!profile) return;
    const { error } = await supabase
      .from("developer_profiles")
      .update({ is_available: !profile.is_available })
      .eq("id", userId);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["dev-profile", userId] });
  }

  return (
    <>
      <DashboardHeader
        title="Developer dashboard"
        subtitle="Track applications, hires, and your profile."
      >
        <Button asChild variant="outline">
          <Link to="/profile">Edit profile</Link>
        </Button>
        <Button asChild className="bg-gradient-accent text-primary-foreground hover:opacity-90">
          <Link to="/projects">Browse projects</Link>
        </Button>
      </DashboardHeader>

      {profile && !profile.is_verified && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm">
          <ShieldCheck className="h-4 w-4 text-warning-foreground" />
          <div>
            Complete your profile to get verified — verified devs are 3× more likely to get hired.
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-4 sm:grid-cols-2">
        <StatCard icon={FileText} label="Applications" value={applications?.length ?? 0} />
        <StatCard
          icon={Briefcase}
          label="Assigned projects"
          value={assignedProjects?.length ?? 0}
        />
        <StatCard icon={Users} label="Profile views" value={profile?.profile_views ?? 0} />
        <div className="rounded-xl border border-border bg-card p-5 shadow-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
              <ClockIcon className="h-4 w-4" />
            </span>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Availability
              </div>
              <div className="font-display text-sm font-bold">
                {profile?.is_available ? "Available" : "Busy"}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={toggleAvailability}>
            Toggle
          </Button>
        </div>
      </div>

      <Tabs defaultValue="applications" className="mt-10">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="invites">Invites</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <section className="mt-6">
            <h2 className="font-display text-xl font-semibold">Your applications</h2>
            <div className="mt-4 space-y-3">
              {!applications || applications.length === 0 ? (
                <EmptyState
                  title="No applications yet"
                  desc="Browse open projects and apply to start working."
                  actionLabel="Browse projects"
                  actionTo="/projects"
                />
              ) : (
                applications.map((a) => (
                  <Link
                    key={a.id}
                    to="/applications/$appId"
                    params={{ appId: a.id }}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-accent/40"
                  >
                    <div>
                      <h3 className="font-semibold">{a.projects?.title ?? "Project"}</h3>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {a.cover_message}
                      </p>
                    </div>
                    <Badge
                      variant={
                        a.status === "accepted"
                          ? "default"
                          : a.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {a.status}
                    </Badge>
                  </Link>
                ))
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="assigned">
          <section className="mt-6">
            <h2 className="font-display text-xl font-semibold">Assigned Projects</h2>
            <div className="mt-4 space-y-3">
              {!assignedProjects || assignedProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You haven't been assigned to any projects yet.
                </p>
              ) : (
                assignedProjects.map((a) => (
                  <Link
                    key={a.id}
                    to="/projects/$projectId"
                    params={{ projectId: a.project_id }}
                    className="block rounded-xl border border-border bg-card p-5 shadow-card hover:border-accent/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{(a.projects as any)?.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {(a.projects as any)?.description}
                        </p>
                      </div>
                      <Badge variant="secondary">Assigned</Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="invites">
          <section className="mt-6">
            <h2 className="font-display text-xl font-semibold">Project Invites</h2>
            <div className="mt-4 space-y-3">
              {!incomingInvites || incomingInvites.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invites yet.</p>
              ) : (
                incomingInvites.map((i) => (
                  <div
                    key={i.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={i.recruiter?.logo_url ?? undefined} />
                          <AvatarFallback>
                            {i.recruiter?.company_name?.[0] || i.recruiter?.full_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{i.recruiter?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {i.recruiter?.company_name}
                          </p>
                          {i.projects && (
                            <p className="mt-1 text-xs font-medium">Project: {i.projects.title}</p>
                          )}
                          {i.message && (
                            <p className="mt-2 text-sm text-muted-foreground italic">
                              "{i.message}"
                            </p>
                          )}
                          <p className="mt-2 text-[10px] text-muted-foreground">
                            {new Date(i.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {i.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => respondToInvite(i.id, "accepted")}
                            className="h-8 text-xs bg-gradient-accent text-primary-foreground"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => respondToInvite(i.id, "rejected")}
                            className="h-8 text-xs"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Badge
                          variant={
                            i.status === "accepted"
                              ? "default"
                              : i.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {i.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="contacts">
          <section className="mt-6">
            <div className="space-y-10">
              {/* Incoming requests to developer */}
              <div>
                <h2 className="font-display text-xl font-semibold">Received Contact Requests</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Recruiters who want to connect with you.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {!incomingRequests || incomingRequests.length === 0 ? (
                    <p className="col-span-full text-sm text-muted-foreground">
                      No received requests yet.
                    </p>
                  ) : (
                    incomingRequests.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-xl border border-border bg-card p-4 shadow-card"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={r.recruiter?.logo_url ?? undefined} />
                              <AvatarFallback>
                                {r.recruiter?.company_name?.[0] || r.recruiter?.full_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-sm">
                                {r.recruiter?.company_name || r.recruiter?.full_name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Requested {new Date(r.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {r.status === "pending" ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => respondToRequest(r.id, "approved")}
                                className="h-7 text-[10px] border-success/30 text-success hover:bg-success/10 px-2"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => respondToRequest(r.id, "rejected")}
                                className="h-7 text-[10px] text-destructive hover:bg-destructive/10 px-2"
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <Badge variant={r.status === "approved" ? "default" : "destructive"}>
                              {r.status}
                            </Badge>
                          )}
                        </div>
                        {r.message && (
                          <p className="mt-2 text-xs text-muted-foreground italic">"{r.message}"</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Outgoing requests from developer */}
              <div>
                <h2 className="font-display text-xl font-semibold">Sent Contact Requests</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Recruiters you've requested contact details from.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {!sentRequests || sentRequests.length === 0 ? (
                    <p className="col-span-full text-sm text-muted-foreground">
                      No sent requests yet.
                    </p>
                  ) : (
                    sentRequests.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-xl border border-border bg-card p-4 shadow-card"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={r.recruiter?.logo_url ?? undefined} />
                              <AvatarFallback>
                                {r.recruiter?.company_name?.[0] || r.recruiter?.full_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">
                                {r.recruiter?.company_name || r.recruiter?.full_name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                Requested {new Date(r.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              r.status === "approved"
                                ? "default"
                                : r.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {r.status}
                          </Badge>
                        </div>
                        {r.status === "approved" && (
                          <div className="mt-3 space-y-1.5 rounded-md border border-success/30 bg-success/5 p-3 text-sm">
                            <div className="flex items-center gap-2 text-xs font-medium text-success-foreground">
                              <ShieldCheck className="h-3.5 w-3.5" /> Contact unlocked
                            </div>
                            {r.email && (
                              <a
                                href={`mailto:${r.email}`}
                                className="flex items-center gap-2 hover:underline"
                              >
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {r.email}
                              </a>
                            )}
                            {r.phone && (
                              <a
                                href={`tel:${r.phone}`}
                                className="flex items-center gap-2 hover:underline"
                              >
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {r.phone}
                              </a>
                            )}
                            {!r.email && !r.phone && (
                              <p className="text-xs text-muted-foreground">
                                No contact details added yet by the recruiter.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationCenter userId={userId} />
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

function DashboardHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
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

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  desc,
  actionLabel,
  actionTo,
}: {
  title: string;
  desc: string;
  actionLabel: string;
  actionTo: string;
}) {
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

      const appIds = apps.map((a) => a.id);
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .in("application_id", appIds)
        .order("created_at", { ascending: false });

      const partnerIds =
        role === "developer"
          ? apps.map((a) => a.projects?.recruiter_id)
          : apps.map((a) => a.developer_id);
      const partners: any[] =
        role === "developer"
          ? ((
              await supabase
                .from("recruiter_profiles")
                .select("id, full_name, company_name")
                .in("id", partnerIds.filter(Boolean) as string[])
            ).data ?? [])
          : ((
              await supabase
                .from("developer_profiles")
                .select("id, full_name, avatar_url")
                .in("id", partnerIds.filter(Boolean) as string[])
            ).data ?? []);

      return apps
        .map((a) => {
          const lastMsg = msgs?.find((m) => m.application_id === a.id);
          const partnerId = role === "developer" ? a.projects?.recruiter_id : a.developer_id;
          const partner = partners?.find((p) => p.id === partnerId);
          const unreadCount =
            msgs?.filter((m) => m.application_id === a.id && m.sender_id !== userId && !m.read_at)
              .length ?? 0;

          return {
            appId: a.id,
            projectTitle: a.projects?.title,
            partnerName: partner?.company_name || partner?.full_name || "Partner",
            partnerAvatar: partner?.avatar_url ?? undefined,
            lastMsg:
              lastMsg?.body || (lastMsg?.attachments ? "Sent an attachment" : "No messages yet"),
            lastTime: lastMsg?.created_at || a.created_at,
            unreadCount,
          };
        })
        .sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
    },
  });

  const filtered = convs?.filter(
    (c) =>
      c.partnerName.toLowerCase().includes(q.toLowerCase()) ||
      c.projectTitle?.toLowerCase().includes(q.toLowerCase()),
  );

  if (isLoading)
    return (
      <div className="space-y-3 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );

  return (
    <div className="mt-6 space-y-3">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>
      {!filtered || filtered.length === 0 ? (
        <p className="text-center py-10 text-sm text-muted-foreground">No conversations found.</p>
      ) : (
        filtered.map((c) => (
          <Link
            key={c.appId}
            to="/applications/$appId"
            params={{ appId: c.appId }}
            className="block"
          >
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
                  <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-md">
                    {c.lastMsg}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(c.lastTime).toLocaleDateString()}
                </span>
                {c.unreadCount > 0 && (
                  <Badge className="h-5 min-w-5 justify-center px-1 rounded-full">
                    {c.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
