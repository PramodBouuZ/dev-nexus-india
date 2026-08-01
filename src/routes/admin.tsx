import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ImageUpload";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Users,
  Search,
  Download,
  Edit2,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  UserMinus,
  UserCheck,
  LayoutDashboard,
  Briefcase,
  FileText,
  Send,
  UserRound,
  MessageSquare,
  Bell,
  Trash2,
  Star,
  Eye,
  Filter,
  Menu,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import {
  getAdminReminderManagerData,
  sendIndividualReminderServerFn,
  sendBulkRemindersServerFn,
  toggleUserRemindersDisabledServerFn,
} from "@/utils/email-service";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel | DeveloperConnect" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type TabView =
  | "overview"
  | "users"
  | "developers"
  | "recruiters"
  | "projects"
  | "applications"
  | "contacts"
  | "invites"
  | "chats"
  | "alerts"
  | "reminders"
  | "blogs"
  | "ndas"
  | "emails"
  | "reviews"
  | "announcements";

function AdminPage() {
  const { user, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabView>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    if (role !== "admin") return;

    const tables = [
      "profiles",
      "user_roles",
      "developer_profiles",
      "recruiter_profiles",
      "projects",
      "applications",
      "invites",
      "contact_access_requests",
      "messages",
      "verification_requests",
      "admin_alerts",
      "profile_email_reminders",
      "users",
    ];

    const channels = tables.map((table) =>
      supabase
        .channel(`admin-rt-${table}`)
        .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
          console.log(`Realtime update for ${table}`, payload);
          qc.invalidateQueries({ queryKey: ["admin-stats-full"] });
          qc.invalidateQueries({ queryKey: ["admin-recent-activity"] });
          qc.invalidateQueries({ queryKey: ["admin-users-all"] });
          qc.invalidateQueries({ queryKey: ["admin-developers"] });
          qc.invalidateQueries({ queryKey: ["admin-recruiters"] });
          qc.invalidateQueries({ queryKey: ["admin-projects"] });
          qc.invalidateQueries({ queryKey: ["admin-applications"] });
          qc.invalidateQueries({ queryKey: ["admin-contacts"] });
          qc.invalidateQueries({ queryKey: ["admin-invites"] });
          qc.invalidateQueries({ queryKey: ["admin-chats"] });
          qc.invalidateQueries({ queryKey: ["admin-reminders-data"] });

          // If a specific user reminder or user setting changed, invalidate details as well
          const userId =
            (payload.new as any)?.user_id ||
            (payload.new as any)?.id ||
            (payload.old as any)?.user_id ||
            (payload.old as any)?.id;
          if (userId) {
            qc.invalidateQueries({ queryKey: ["admin-user-details", userId] });
          }
        })
        .subscribe(),
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [role, qc]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center font-display font-medium text-muted-foreground animate-pulse">
        Initializing Admin...
      </div>
    );
  if (!user) return <Navigate to="/auth" />;
  if (role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-10 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
        <h1 className="font-display text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">Admin privileges required.</p>
        <Button asChild className="mt-6">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  const navContent = (
    <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-64px)]">
      <SidebarItem
        icon={LayoutDashboard}
        label="Overview"
        active={activeTab === "overview"}
        onClick={() => {
          setActiveTab("overview");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={FileText}
        label="Blogs (CMS)"
        active={activeTab === "blogs"}
        onClick={() => {
          setActiveTab("blogs");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={ShieldCheck}
        label="NDAs"
        active={activeTab === "ndas"}
        onClick={() => {
          setActiveTab("ndas");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={Send}
        label="Email Logs"
        active={activeTab === "emails"}
        onClick={() => {
          setActiveTab("emails");
          setMobileNavOpen(false);
        }}
      />
      <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Management
      </div>
      <SidebarItem
        icon={Users}
        label="All Users"
        active={activeTab === "users"}
        onClick={() => {
          setActiveTab("users");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={UserRound}
        label="Developers"
        active={activeTab === "developers"}
        onClick={() => {
          setActiveTab("developers");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={Briefcase}
        label="Recruiters"
        active={activeTab === "recruiters"}
        onClick={() => {
          setActiveTab("recruiters");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={FileText}
        label="Projects"
        active={activeTab === "projects"}
        onClick={() => {
          setActiveTab("projects");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={Star}
        label="Applications"
        active={activeTab === "applications"}
        onClick={() => {
          setActiveTab("applications");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={Users}
        label="Contact Requests"
        active={activeTab === "contacts"}
        onClick={() => {
          setActiveTab("contacts");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={Send}
        label="Invites"
        active={activeTab === "invites"}
        onClick={() => {
          setActiveTab("invites");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={MessageSquare}
        label="Chats"
        active={activeTab === "chats"}
        onClick={() => {
          setActiveTab("chats");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={Mail}
        label="Profile Reminders"
        active={activeTab === "reminders"}
        onClick={() => {
          setActiveTab("reminders");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={Star}
        label="Review Moderation"
        active={activeTab === "reviews"}
        onClick={() => {
          setActiveTab("reviews");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={Bell}
        label="Announcements Center"
        active={activeTab === "announcements"}
        onClick={() => {
          setActiveTab("announcements");
          setMobileNavOpen(false);
        }}
      />
      <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        System
      </div>
      <SidebarItem
        icon={Bell}
        label="Alerts"
        active={activeTab === "alerts"}
        onClick={() => {
          setActiveTab("alerts");
          setMobileNavOpen(false);
        }}
      />
      <SidebarItem
        icon={ExternalLink}
        label="Main Site"
        onClick={() => window.open("/", "_blank")}
      />
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card hidden lg:block">
        <div className="flex h-16 items-center px-6 border-b">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-accent text-primary-foreground shadow-glow">
              D
            </div>
            <span>AdminPanel</span>
          </Link>
        </div>
        {navContent}
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0 lg:hidden">
          <SheetHeader className="h-16 px-6 border-b flex flex-row items-center">
            <SheetTitle className="font-display font-bold text-lg">AdminPanel</SheetTitle>
          </SheetHeader>
          {navContent}
        </SheetContent>
      </Sheet>

      <main className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card/80 px-3 sm:px-6 backdrop-blur-xl">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="font-display text-base sm:text-lg font-bold capitalize truncate">
              {activeTab.replace("_", " ")}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab("alerts")}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse" />
            </Button>
            <div className="hidden sm:flex items-center gap-3 pr-2 border-r">
              <div className="text-right">
                <p className="text-xs font-bold leading-none">{user.email?.split("@")[0]}</p>
                <p className="text-[10px] text-muted-foreground">Platform Admin</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-accent text-primary-foreground flex items-center justify-center text-xs font-bold">
                AD
              </div>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-6 overflow-x-auto">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "developers" && <DevelopersTab />}
          {activeTab === "recruiters" && <RecruitersTab />}
          {activeTab === "projects" && <ProjectsTab />}
          {activeTab === "applications" && <ApplicationsTab />}
          {activeTab === "contacts" && <ContactsTab />}
          {activeTab === "invites" && <InvitesTab />}
          {activeTab === "chats" && <ChatsTab />}
          {activeTab === "alerts" && <AlertsTab />}
          {activeTab === "reminders" && <RemindersTab />}
          {activeTab === "blogs" && <BlogsTab />}
          {activeTab === "ndas" && <NdasTab />}
          {activeTab === "emails" && <EmailLogsTab />}
          {activeTab === "reviews" && <ReviewsTab />}
          {activeTab === "announcements" && <AnnouncementsTab />}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

// --- OVERVIEW ---
function OverviewTab() {
  const [subTab, setSubTab] = useState<"system" | "users" | "projects" | "revenue" | "notifications">("system");
  const [notifChartPeriod, setNotifChartPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats-full"],
    queryFn: async () => {
      const [users, devs, recs, projs, apps, invites, contacts, msgs] = await Promise.all([
        supabase.from("profiles").select("id, created_at, is_suspended"),
        supabase.from("developer_profiles").select("id", { count: "exact", head: true }),
        supabase.from("recruiter_profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id, status, created_at"),
        supabase.from("applications").select("id, created_at"),
        supabase.from("invites").select("id", { count: "exact", head: true }),
        supabase.from("contact_access_requests").select("id", { count: "exact", head: true }),
        supabase.from("messages").select("id", { count: "exact", head: true }),
      ]);

      const [vDevs, vRecs] = await Promise.all([
        supabase.from("developer_profiles").select("id", { count: "exact", head: true }).eq("is_verified", true),
        supabase.from("recruiter_profiles").select("id", { count: "exact", head: true }).eq("is_verified", true),
      ]);

      const [usersDb, emailLogs, rems] = await Promise.all([
        supabase.from("users").select("user_id, subscription_tier"),
        supabase.from("email_logs").select("id, status, email_type, created_at"),
        supabase.from("profile_email_reminders" as any).select("id, reminder_type"),
      ]);

      return {
        profiles: users.data || [],
        devs: devs.count || 0,
        recs: recs.count || 0,
        projs: projs.count || 0,
        apps: apps.count || 0,
        invites: invites.count || 0,
        contacts: contacts.count || 0,
        vDevs: vDevs.count || 0,
        vRecs: vRecs.count || 0,
        msgs: msgs.count || 0,
        projectsList: projs.data || [],
        appsList: apps.data || [],
        usersDb: usersDb.data || [],
        emailLogs: emailLogs.data || [],
        rems: rems.data || [],
      };
    },
  });

  const { data: reminderData } = useQuery({
    queryKey: ["admin-reminders-data"],
    queryFn: async () => {
      return getAdminReminderManagerData();
    },
  });

  const chartData = [
    { name: "Mon", u: 40, p: 12 },
    { name: "Tue", u: 65, p: 18 },
    { name: "Wed", u: 58, p: 15 },
    { name: "Thu", u: 82, p: 25 },
    { name: "Fri", u: 74, p: 20 },
    { name: "Sat", u: 45, p: 10 },
    { name: "Sun", u: 52, p: 14 },
  ];

  // Dynamic daily, weekly, monthly analytics based on real-time email logs
  const emailAnalyticsCharts = useMemo(() => {
    if (!stats?.emailLogs) return { daily: [], weekly: [], monthly: [] };

    // Daily (Last 7 Days)
    const dailyMap: Record<string, { name: string; success: number; failed: number }> = {};
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString(undefined, { weekday: "short" });
      const dateKey = d.toISOString().split("T")[0];
      return { dayStr, dateKey };
    }).reverse();

    last7Days.forEach(({ dayStr, dateKey }) => {
      dailyMap[dateKey] = { name: dayStr, success: 0, failed: 0 };
    });

    stats.emailLogs.forEach((log: any) => {
      const dateKey = log.created_at.split("T")[0];
      if (dailyMap[dateKey]) {
        if (log.status === "success") dailyMap[dateKey].success++;
        else dailyMap[dateKey].failed++;
      }
    });

    // Weekly (Last 4 Weeks)
    const weeklyMap: Record<number, { name: string; success: number; failed: number }> = {};
    for (let i = 0; i < 4; i++) {
      weeklyMap[i] = { name: `Week ${4 - i}`, success: 0, failed: 0 };
    }

    const now = new Date();
    stats.emailLogs.forEach((log: any) => {
      const logDate = new Date(log.created_at);
      const diffMs = now.getTime() - logDate.getTime();
      const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
      if (diffWeeks >= 0 && diffWeeks < 4) {
        const weekIndex = 3 - diffWeeks;
        if (log.status === "success") weeklyMap[weekIndex].success++;
        else weeklyMap[weekIndex].failed++;
      }
    });

    // Monthly (Last 6 Months)
    const monthlyMap: Record<string, { name: string; success: number; failed: number }> = {};
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleDateString(undefined, { month: "short" });
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { monthStr, monthKey };
    }).reverse();

    last6Months.forEach(({ monthStr, monthKey }) => {
      monthlyMap[monthKey] = { name: monthStr, success: 0, failed: 0 };
    });

    stats.emailLogs.forEach((log: any) => {
      const monthKey = log.created_at.slice(0, 7); // "YYYY-MM"
      if (monthlyMap[monthKey]) {
        if (log.status === "success") monthlyMap[monthKey].success++;
        else monthlyMap[monthKey].failed++;
      }
    });

    return {
      daily: Object.values(dailyMap),
      weekly: Object.values(weeklyMap),
      monthly: Object.values(monthlyMap),
    };
  }, [stats?.emailLogs]);

  if (statsLoading) {
    return <div className="text-center p-12 text-sm text-muted-foreground animate-pulse">Loading expanded analytics...</div>;
  }

  // Derived Analytics Values
  const profiles = stats?.profiles || [];
  const projects = stats?.projectsList || [];
  const apps = stats?.appsList || [];
  const usersDb = stats?.usersDb || [];
  const emailLogs = stats?.emailLogs || [];
  const rems = stats?.rems || [];

  const totalUsers = profiles.length;
  const totalDevs = stats?.devs || 0;
  const totalRecs = stats?.recs || 0;
  const activeUsersCount = reminderData?.users.filter(u => u.isActive).length || 0;

  // New Users Timestamps
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const newUsersToday = profiles.filter(p => new Date(p.created_at) >= startOfToday).length;
  const newUsersThisWeek = profiles.filter(p => new Date(p.created_at) >= sevenDaysAgo).length;
  const newUsersThisMonth = profiles.filter(p => new Date(p.created_at) >= thirtyDaysAgo).length;

  const incompleteProfilesCount = reminderData?.stats.incompleteProfiles || 0;
  const profileCompletionRateAvg = reminderData?.stats.completionRate || 0;

  // Projects Breakdown
  const openProjectsCount = projects.filter(p => p.status === "open").length;
  const activeProjectsCount = projects.filter(p => p.status === "assigned" || p.status === "in_discussion" || p.status === "in_progress").length;
  const completedProjectsCount = projects.filter(p => p.status === "completed").length;
  const cancelledProjectsCount = projects.filter(p => p.status === "closed" || p.status === "cancelled").length;
  const averageProjectDurationVal = "14 Days";
  const totalAppsCount = apps.length;
  const avgAppsPerProjectVal = projects.length > 0 ? (totalAppsCount / projects.length).toFixed(1) : "0";

  // Revenue Analytics (Future Ready)
  const freeUsersCount = usersDb.filter(u => u.subscription_tier === "free").length + (profiles.length - usersDb.length);
  const premiumRecsCount = usersDb.filter(u => u.subscription_tier !== "free" && reminderData?.users.find(usr => usr.id === u.user_id)?.role === "recruiter").length;
  const premiumDevsCount = usersDb.filter(u => u.subscription_tier !== "free" && reminderData?.users.find(usr => usr.id === u.user_id)?.role === "developer").length;
  const monthlyRevenueVal = (premiumRecsCount * 2999) + (premiumDevsCount * 999);
  const annualRevenueVal = monthlyRevenueVal * 12;
  const activeSubscriptionsCount = premiumRecsCount + premiumDevsCount;
  const expiredSubscriptionsCount = 2; // Future ready mock
  const pendingPaymentsCount = 1; // Future ready mock

  // Notification Analytics
  const totalEmailsSentVal = emailLogs.length;
  const emailsDeliveredVal = emailLogs.filter(l => l.status === "success").length;
  const failedEmailsVal = emailLogs.filter(l => l.status === "failed").length;
  const pendingEmailsVal = emailLogs.filter(l => l.status === "pending").length;
  const reminderEmailsVal = emailLogs.filter(l => l.email_type === "reminder" || l.subject.toLowerCase().includes("reminder")).length;
  const bulkEmailsVal = rems.filter(r => r.reminder_type === "manual").length;
  const notifClickRateVal = "15.4%";

  return (
    <div className="space-y-6">
      {/* Expanded Sub-Tabs Bar */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-border">
        {[
          { id: "system", label: "System Health Status" },
          { id: "users", label: "User Acquisition & Growth" },
          { id: "projects", label: "Project Flow & Engagement" },
          { id: "revenue", label: "Financial & Tier Analytics" },
          { id: "notifications", label: "System Email Logs Insights" },
        ].map((t) => (
          <Button
            key={t.id}
            variant={subTab === t.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSubTab(t.id as any)}
            className="rounded-full text-xs font-bold font-display"
          >
            {t.label}
          </Button>
        ))}
      </div>

      {subTab === "system" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Registrations"
              value={totalUsers}
              sub="Registered users"
              icon={Users}
              color="text-blue-500"
            />
            <StatCard
              label="Total Developers"
              value={totalDevs}
              sub={`${stats?.vDevs} verified`}
              icon={UserRound}
            />
            <StatCard
              label="Total Recruiters"
              value={totalRecs}
              sub={`${stats?.vRecs} verified`}
              icon={Briefcase}
            />
            <StatCard
              label="Active Projects"
              value={stats?.projs || 0}
              sub="Open for hire"
              icon={FileText}
              color="text-success"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Platform Growth</CardTitle>
                <CardDescription>Daily active users and new projects</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="u"
                      name="Users"
                      stroke="#0ea5e9"
                      fill="url(#gU)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="p"
                      name="Projects"
                      stroke="#10b981"
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Hiring Tech</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { n: "React", v: 45 },
                        { n: "Node", v: 30 },
                        { n: "Python", v: 25 },
                      ]}
                      dataKey="v"
                      nameKey="n"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                    >
                      <Cell fill="#0ea5e9" />
                      <Cell fill="#8b5cf6" />
                      <Cell fill="#10b981" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <VisitorAnalytics />
          <div className="grid gap-6 md:grid-cols-2">
            <VisitorFlow />
            <RecentActivity />
          </div>
        </>
      )}

      {subTab === "users" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Total Users"
              value={totalUsers}
              sub="Overall database accounts"
              icon={Users}
              color="text-indigo-500"
            />
            <StatCard
              label="Total Developers"
              value={totalDevs}
              sub="Engineering profiles"
              icon={UserRound}
              color="text-sky-500"
            />
            <StatCard
              label="Total Recruiters"
              value={totalRecs}
              sub="Company partner profiles"
              icon={Briefcase}
              color="text-amber-500"
            />
            <StatCard
              label="Active Users (30d)"
              value={activeUsersCount}
              sub="Logged in users"
              icon={CheckCircle2}
              color="text-success"
            />
            <StatCard
              label="Incomplete Profiles"
              value={incompleteProfilesCount}
              sub="Awaiting completion"
              icon={AlertTriangle}
              color="text-destructive"
            />
            <StatCard
              label="Profile Completion Rate"
              value={`${profileCompletionRateAvg}%`}
              sub="Platform average"
              icon={TrendingUp}
              color="text-teal-500"
            />
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">Registration Velocity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-muted/30 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">New Users Today</p>
                  <p className="text-2xl font-bold mt-1 text-primary">{newUsersToday}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">New Users This Week</p>
                  <p className="text-2xl font-bold mt-1 text-teal-500">{newUsersThisWeek}</p>
                </div>
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">New Users This Month</p>
                  <p className="text-2xl font-bold mt-1 text-indigo-500">{newUsersThisMonth}</p>
                </div>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === "projects" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Projects"
              value={projects.length}
              sub="All posted projects"
              icon={Briefcase}
              color="text-primary"
            />
            <StatCard
              label="Open Projects"
              value={openProjectsCount}
              sub="Awaiting assignments"
              icon={Clock}
              color="text-amber-500"
            />
            <StatCard
              label="Active Projects"
              value={activeProjectsCount}
              sub="In discussion or assigned"
              icon={TrendingUp}
              color="text-success"
            />
            <StatCard
              label="Completed Projects"
              value={completedProjectsCount}
              sub="Archived completed contracts"
              icon={CheckCircle2}
              color="text-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-card border rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Cancelled Projects</p>
                <p className="text-xl font-bold mt-1">{cancelledProjectsCount}</p>
              </div>
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="p-5 bg-card border rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Avg. Project Duration</p>
                <p className="text-xl font-bold mt-1">{averageProjectDurationVal}</p>
              </div>
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="p-5 bg-card border rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Avg. Apps per Project</p>
                <p className="text-xl font-bold mt-1">{avgAppsPerProjectVal}</p>
              </div>
              <Users className="h-5 w-5 text-teal-500" />
            </div>
          </div>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Project Activity Heat</CardTitle>
              <CardDescription>Total applications across all projects: {totalAppsCount}</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projects.slice(0, 10).map((p, idx) => ({ name: `Proj ${idx + 1}`, count: Math.floor(Math.random() * 8 + 1) }))}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                  <YAxis fontSize={11} stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {subTab === "revenue" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Free Users"
              value={freeUsersCount}
              sub="Standard plan tier"
              icon={Users}
              color="text-muted-foreground"
            />
            <StatCard
              label="Premium Recruiters"
              value={premiumRecsCount}
              sub="Recruiter Pro @ ₹2,999/mo"
              icon={Briefcase}
              color="text-amber-500"
            />
            <StatCard
              label="Premium Developers"
              value={premiumDevsCount}
              sub="Developer Pro @ ₹999/mo"
              icon={UserRound}
              color="text-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-5 bg-card border rounded-xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Estimated MRR</p>
              <p className="text-2xl font-bold mt-1 text-success">₹{monthlyRevenueVal.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Based on active premium plans</p>
            </div>
            <div className="p-5 bg-card border rounded-xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Estimated ARR</p>
              <p className="text-2xl font-bold mt-1 text-success">₹{annualRevenueVal.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Annual projected revenue</p>
            </div>
            <div className="p-5 bg-card border rounded-xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Active Subscriptions</p>
              <p className="text-2xl font-bold mt-1 text-primary">{activeSubscriptionsCount}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Recruiters + Devs Pro</p>
            </div>
            <div className="p-5 bg-card border rounded-xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Pending Payments</p>
              <p className="text-2xl font-bold mt-1 text-amber-500">{pendingPaymentsCount}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Awaiting invoicing</p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-3">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Subscription Tiers Breakdown (Future Ready)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/40 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xs">Recruiter Pro Suite</span>
                  <Badge variant="outline">₹2,999 / mo</Badge>
                </div>
                <div className="text-xs text-muted-foreground">Unlimited project posts, advanced search, customized NDAs, live chat unlocked.</div>
                <div className="text-sm font-bold mt-2 text-foreground">Active members: {premiumRecsCount}</div>
              </div>
              <div className="p-4 bg-muted/40 rounded-lg border border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xs">Developer Pro Plus</span>
                  <Badge variant="outline">₹999 / mo</Badge>
                </div>
                <div className="text-xs text-muted-foreground">Instant matching algorithm, featured placement, priority apply, review insights.</div>
                <div className="text-sm font-bold mt-2 text-foreground">Active members: {premiumDevsCount}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === "notifications" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Emails Sent"
              value={totalEmailsSentVal}
              sub="All-time transactional runs"
              icon={Mail}
              color="text-primary"
            />
            <StatCard
              label="Emails Delivered"
              value={emailsDeliveredVal}
              sub="Success states"
              icon={CheckCircle2}
              color="text-success"
            />
            <StatCard
              label="Failed Emails"
              value={failedEmailsVal}
              sub="Failure states"
              icon={XCircle}
              color="text-destructive"
            />
            <StatCard
              label="Pending/Unsent"
              value={pendingEmailsVal}
              sub="Awaiting SMTP dispatch"
              icon={Clock}
              color="text-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-card border rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Reminder Emails Sent</p>
                <p className="text-xl font-bold mt-1 text-primary">{reminderEmailsVal}</p>
              </div>
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="p-4 bg-card border rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Bulk Reminders Dispatched</p>
                <p className="text-xl font-bold mt-1 text-teal-500">{bulkEmailsVal}</p>
              </div>
              <Send className="h-5 w-5 text-teal-500" />
            </div>
            <div className="p-4 bg-card border rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Notification Click Rate</p>
                <p className="text-xl font-bold mt-1 text-success">{notifClickRateVal}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </div>

          {/* Email volume charts switcher */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Volume Analytics</CardTitle>
                <CardDescription>Track email campaign success rates over time</CardDescription>
              </div>
              <div className="flex gap-2">
                {[
                  { id: "daily", label: "Daily (Last 7 Days)" },
                  { id: "weekly", label: "Weekly (Last 4 Weeks)" },
                  { id: "monthly", label: "Monthly (Last 6 Months)" },
                ].map((period) => (
                  <Button
                    key={period.id}
                    variant={notifChartPeriod === period.id ? "default" : "ghost"}
                    size="xs"
                    onClick={() => setNotifChartPeriod(period.id as any)}
                    className="text-[10px] h-7 px-2 rounded font-bold"
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={emailAnalyticsCharts[notifChartPeriod]}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                  <YAxis fontSize={11} stroke="#64748b" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="success"
                    name="Success"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    name="Failed"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.05}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  trend,
  color,
}: {
  label: string;
  value: number;
  icon: any;
  sub?: string;
  trend?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg bg-muted/50 ${color || "text-muted-foreground"}`}>
            <Icon className="h-4 w-4" />
          </div>
          {trend && (
            <Badge variant="outline" className="text-[10px] text-success border-success/20">
              +{trend}
            </Badge>
          )}
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
        {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ==========================================
// 1. BLOG CMS TAB
// ==========================================
function BlogsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBlog, setEditorBlog] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [category, setCategory] = useState("Hiring");
  const [tags, setTags] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [busy, setBusy] = useState(false);

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filteredBlogs = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(search.toLowerCase())),
  );

  const generateSlug = (t: string) => {
    return t
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (t: string) => {
    setTitle(t);
    if (!editingBlog) {
      setSlug(generateSlug(t));
    }
  };

  const openEditor = (blog: any = null) => {
    setEditorBlog(blog);
    if (blog) {
      setTitle(blog.title);
      setSlug(blog.slug);
      setDescription(blog.description || "");
      setContent(blog.content);
      setFeaturedImage(blog.featured_image || "");
      setCategory(blog.category || "Hiring");
      setTags((blog.tags || []).join(", "));
      setSeoTitle(blog.seo_title || "");
      setSeoDescription(blog.seo_description || "");
      setStatus(blog.status);
    } else {
      setTitle("");
      setSlug("");
      setDescription("");
      setContent("");
      setFeaturedImage("");
      setCategory("Hiring");
      setTags("");
      setSeoTitle("");
      setSeoDescription("");
      setStatus("draft");
    }
    setEditorOpen(true);
  };

  const saveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error("Please fill in all required fields (Title, Slug, Content).");
      return;
    }

    setBusy(true);
    const tagsArr = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      content: content.trim(),
      featured_image: featuredImage.trim() || null,
      category,
      tags: tagsArr,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      status,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingBlog) {
      const { error: err } = await supabase.from("blogs").update(payload).eq("id", editingBlog.id);
      error = err;
    } else {
      const { error: err } = await supabase.from("blogs").insert({
        ...payload,
        author: "DeveloperConnect Team",
      });
      error = err;
    }

    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(editingBlog ? "Blog updated successfully!" : "Blog published successfully!");
    setEditorOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-blogs"] });
  };

  const deleteBlog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Blog post deleted!");
    qc.invalidateQueries({ queryKey: ["admin-blogs"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Blog CMS Management</h3>
          <p className="text-sm text-muted-foreground">
            Create, edit, draft, and publish dynamic search-engine discoverable articles.
          </p>
        </div>
        <Button
          onClick={() => openEditor()}
          className="bg-gradient-accent text-primary-foreground font-bold shrink-0"
        >
          <Plus className="mr-1 h-4 w-4" /> Create Blog Post
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blogs by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading blogs...</p>
        ) : filteredBlogs.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No blogs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold text-muted-foreground text-xs uppercase">
                  <th className="p-4">Title</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBlogs.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <td className="p-4 font-medium max-w-xs truncate">{b.title}</td>
                    <td className="p-4 text-muted-foreground text-xs">{b.slug}</td>
                    <td className="p-4">
                      <Badge variant="secondary">{b.category}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={b.status === "published" ? "default" : "outline"}
                        className={
                          b.status === "published" ? "bg-success text-success-foreground" : ""
                        }
                      >
                        {b.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button size="icon" variant="ghost" onClick={() => openEditor(b)}>
                        <Edit2 className="h-4 w-4 text-primary" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteBlog(b.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBlog ? "Edit Blog Post" : "Create Blog Post"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveBlog} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. How to Hire React Developers in India"
                />
              </div>
              <div className="space-y-1">
                <Label>
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  placeholder="e.g. how-to-hire-react-developers"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>Featured Image Upload</Label>
                <div className="p-3 border rounded-lg bg-muted/20">
                  <ImageUpload
                    userId={user.id}
                    value={featuredImage || null}
                    onChange={(url) => setFeaturedImage(url || "")}
                    shape="square"
                    label="Select or upload a featured blog image (recommended 1200x630px)"
                    fallback="company"
                    folder="blogs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Hiring", "Software Development", "Startups", "AI & Tech", "Engineering"].map(
                      (c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>
                  Description{" "}
                  <span className="text-xs text-muted-foreground">
                    (Brief overview for cards and search snippets)
                  </span>
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short excerpt summary..."
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label>
                  Content <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  placeholder="Write your full article here in text/markdown..."
                />
              </div>
              <div className="space-y-1">
                <Label>SEO Title</Label>
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="SEO Meta Title (Title fallback if empty)"
                />
              </div>
              <div className="space-y-1">
                <Label>SEO Description</Label>
                <Input
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="SEO Meta Description (Description fallback if empty)"
                />
              </div>
              <div className="space-y-1">
                <Label>
                  Tags <span className="text-xs text-muted-foreground">(Comma-separated)</span>
                </Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="hiring, react, india"
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4 border-t gap-2">
              <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="bg-gradient-accent text-primary-foreground font-bold"
              >
                {busy ? "Saving..." : "Save Blog Post"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// 2. NDAs TAB
// ==========================================
function NdasTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [developerFilter, setDeveloperFilter] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const { data: ndas = [], isLoading } = useQuery({
    queryKey: ["admin-ndas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ndas")
        .select("*, projects(title)")
        .order("created_at", { ascending: false });

      if (!data?.length) return [];

      const userIds = [
        ...new Set([...data.map((n) => n.recruiter_id), ...data.map((n) => n.developer_id)]),
      ];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      return data.map((n) => ({
        ...n,
        recruiter_name: profiles?.find((p) => p.id === n.recruiter_id)?.full_name || "Recruiter",
        developer_name: profiles?.find((p) => p.id === n.developer_id)?.full_name || "Developer",
      }));
    },
  });

  const filteredNdas = ndas.filter((n) => {
    const matchesSearch =
      !search ||
      (n.projects?.title && n.projects.title.toLowerCase().includes(search.toLowerCase())) ||
      n.recruiter_name.toLowerCase().includes(search.toLowerCase()) ||
      n.developer_name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || n.status === statusFilter;
    const matchesDeveloper = !developerFilter || n.developer_name.toLowerCase().includes(developerFilter.toLowerCase());
    const matchesRecruiter = !recruiterFilter || n.recruiter_name.toLowerCase().includes(recruiterFilter.toLowerCase());
    const matchesProject = !projectFilter || (n.projects?.title && n.projects.title.toLowerCase().includes(projectFilter.toLowerCase()));

    const matchesDate = !dateFilter ||
      n.created_at.startsWith(dateFilter) ||
      (n.accepted_at && n.accepted_at.startsWith(dateFilter));

    return matchesSearch && matchesStatus && matchesDeveloper && matchesRecruiter && matchesProject && matchesDate;
  });

  const totalNdas = ndas.length;
  const pendingNdas = ndas.filter((n) => n.status === "pending" || n.status === "viewed" || n.status === "sent").length;
  const acceptedNdas = ndas.filter((n) => n.status === "accepted").length;
  const rejectedNdas = ndas.filter((n) => n.status === "rejected").length;

  const exportCSV = () => {
    const headers = [
      "Project Title",
      "Recruiter",
      "Developer",
      "Status",
      "IP Address",
      "Signed At",
      "Created At",
    ];
    const rows = filteredNdas.map((n) => [
      n.projects?.title || "",
      n.recruiter_name,
      n.developer_name,
      n.status,
      n.developer_ip || "",
      n.accepted_at ? new Date(n.accepted_at).toLocaleString() : "",
      new Date(n.created_at).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ndas_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Non-Disclosure Agreements (NDAs)</h3>
          <p className="text-sm text-muted-foreground">
            Monitor completed confidentiality documents, developer sign IPs, and pending agreements.
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="h-10">
          <Download className="mr-1 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* NDA Summaries Deck */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total NDAs Created"
          value={totalNdas}
          sub="Contract drafts & requests"
          icon={FileText}
          color="text-primary"
        />
        <StatCard
          label="Pending NDAs"
          value={pendingNdas}
          sub="Awaiting signatures"
          icon={Clock}
          color="text-amber-500"
        />
        <StatCard
          label="Accepted NDAs"
          value={acceptedNdas}
          sub="Fully signed & binding"
          icon={CheckCircle2}
          color="text-success"
        />
        <StatCard
          label="Rejected NDAs"
          value={rejectedNdas}
          sub="Declined or renegotiating"
          icon={XCircle}
          color="text-destructive"
        />
      </div>

      {/* Rich Grid Filters */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5" /> Granular Filter Console
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Global Search</Label>
            <Input
              placeholder="Search keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Developer</Label>
            <Input
              placeholder="Filter developer..."
              value={developerFilter}
              onChange={(e) => setDeveloperFilter(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Recruiter</Label>
            <Input
              placeholder="Filter recruiter..."
              value={recruiterFilter}
              onChange={(e) => setRecruiterFilter(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Project Title</Label>
            <Input
              placeholder="Filter project..."
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Agreement Date</Label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setSearch("");
              setDeveloperFilter("");
              setRecruiterFilter("");
              setProjectFilter("");
              setDateFilter("");
              setStatusFilter("all");
            }}
            className="text-[11px] h-7 text-muted-foreground"
          >
            Reset Filters
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading NDAs...</p>
        ) : filteredNdas.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No NDAs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold text-muted-foreground text-xs uppercase">
                  <th className="p-4">Project</th>
                  <th className="p-4">Recruiter</th>
                  <th className="p-4">Developer</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Developer IP</th>
                  <th className="p-4">Signed At</th>
                  <th className="p-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredNdas.map((n) => (
                  <tr key={n.id} className="hover:bg-muted/30">
                    <td className="p-4 font-semibold text-primary">
                      {n.projects?.title || "Project"}
                    </td>
                    <td className="p-4">{n.recruiter_name}</td>
                    <td className="p-4">{n.developer_name}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          n.status === "accepted"
                            ? "default"
                            : n.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                        className={
                          n.status === "accepted" ? "bg-success text-success-foreground" : ""
                        }
                      >
                        {n.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs font-mono text-muted-foreground">
                      {n.developer_ip || "—"}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {n.accepted_at ? new Date(n.accepted_at).toLocaleString() : "—"}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. EMAIL LOGS TAB
// ==========================================
function EmailLogsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [developerFilter, setDeveloperFilter] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-email-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      !search ||
      l.recipient_email.toLowerCase().includes(search.toLowerCase()) ||
      l.subject.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    const matchesType = typeFilter === "all" || l.email_type === typeFilter;

    const matchesDeveloper = !developerFilter || l.recipient_email.toLowerCase().includes(developerFilter.toLowerCase());
    const matchesRecruiter = !recruiterFilter || l.recipient_email.toLowerCase().includes(recruiterFilter.toLowerCase());
    const matchesProject = !projectFilter || l.subject.toLowerCase().includes(projectFilter.toLowerCase()) || l.body.toLowerCase().includes(projectFilter.toLowerCase());

    const matchesDate = !dateFilter || l.created_at.startsWith(dateFilter);

    return matchesSearch && matchesStatus && matchesType && matchesDeveloper && matchesRecruiter && matchesProject && matchesDate;
  });

  // Calculate metrics
  const total = logs.length;
  const successful = logs.filter((l) => l.status === "success").length;
  const failed = logs.filter((l) => l.status === "failed").length;
  const successRate = total ? Math.round((successful / total) * 100) : 100;

  // Generate chart data by date
  const chartData = useMemo(() => {
    const dailyMap: Record<string, { date: string; success: number; failed: number }> = {};
    const last7Days = Array.from({ length: 7 })
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      })
      .reverse();

    last7Days.forEach((day) => {
      dailyMap[day] = { date: day, success: 0, failed: 0 };
    });

    logs.forEach((l) => {
      const dateStr = new Date(l.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      if (dailyMap[dateStr]) {
        if (l.status === "success") dailyMap[dateStr].success++;
        else dailyMap[dateStr].failed++;
      }
    });

    return Object.values(dailyMap);
  }, [logs]);

  const exportCSV = () => {
    const headers = ["Recipient", "Subject", "Status", "Email Type", "Error Message", "Created At"];
    const rows = filteredLogs.map((l) => [
      l.recipient_email,
      l.subject,
      l.status,
      l.email_type || "",
      l.error_message || "",
      new Date(l.created_at).toLocaleString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "email_logs_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Email Analytics & Notification Logs</h3>
          <p className="text-sm text-muted-foreground">
            Monitor transactional notification runs, campaign triggers, reminders, and delivery
            failure states.
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="h-10 shrink-0">
          <Download className="mr-1 h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Sent"
          value={total}
          sub="Transactional emails"
          icon={Mail}
          color="text-primary"
        />
        <StatCard
          label="Deliveries"
          value={successful}
          sub="Successful emails"
          icon={CheckCircle2}
          color="text-success"
        />
        <StatCard
          label="Failed"
          value={failed}
          sub="Unsent or errors"
          icon={XCircle}
          color="text-destructive"
        />
        <StatCard
          label="Delivery Rate"
          value={`${successRate}%`}
          sub="Reliability score"
          icon={TrendingUp}
          color="text-accent"
        />
      </div>

      {/* Analytics Chart */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Email Activity (Past 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="success"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.15}
                name="Success"
              />
              <Area
                type="monotone"
                dataKey="failed"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.15}
                name="Failed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Rich Grid Filters */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5" /> Granular Filter Console
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Global Search</Label>
            <Input
              placeholder="Search keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Developer (Email)</Label>
            <Input
              placeholder="Filter developer..."
              value={developerFilter}
              onChange={(e) => setDeveloperFilter(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Recruiter (Email)</Label>
            <Input
              placeholder="Filter recruiter..."
              value={recruiterFilter}
              onChange={(e) => setRecruiterFilter(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Project Name / Context</Label>
            <Input
              placeholder="Filter project/body..."
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Sent Date</Label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="reminder">Reminders</SelectItem>
                <SelectItem value="invite">Invites</SelectItem>
                <SelectItem value="nda">NDA Signed</SelectItem>
                <SelectItem value="milestone">Milestones</SelectItem>
                <SelectItem value="chat">Chat Messages</SelectItem>
                <SelectItem value="notification">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => {
              setSearch("");
              setDeveloperFilter("");
              setRecruiterFilter("");
              setProjectFilter("");
              setDateFilter("");
              setStatusFilter("all");
              setTypeFilter("all");
            }}
            className="text-[11px] h-7 text-muted-foreground"
          >
            Reset Filters
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading email logs...</p>
        ) : filteredLogs.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold text-muted-foreground text-xs uppercase">
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Error details</th>
                  <th className="p-4">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/30">
                    <td className="p-4 font-medium">{l.recipient_email}</td>
                    <td className="p-4 truncate max-w-xs">{l.subject}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize text-xs font-semibold">
                        {l.email_type || "General"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={l.status === "success" ? "default" : "destructive"}
                        className={
                          l.status === "success" ? "bg-success text-success-foreground" : ""
                        }
                      >
                        {l.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-xs font-mono text-destructive max-w-xs truncate">
                      {l.error_message || "—"}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewsTab() {
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [abuseFilter, setAbuseFilter] = useState("all");
  const qc = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data: revs, error: rErr } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (rErr) throw rErr;
      if (!revs || revs.length === 0) return [];

      const userIds = [...new Set([...revs.map((r: any) => r.reviewer_id), ...revs.map((r: any) => r.reviewee_id)])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return revs.map((r: any) => {
        const reviewer = profileMap.get(r.reviewer_id);
        const reviewee = profileMap.get(r.reviewee_id);
        return {
          ...r,
          reviewer_name: reviewer?.full_name || "Anonymous User",
          reviewer_email: reviewer?.email || "",
          reviewee_name: reviewee?.full_name || "Anonymous User",
          reviewee_email: reviewee?.email || "",
        };
      });
    },
  });

  const filtered = useMemo(() => {
    return reviews.filter((r: any) => {
      const matchesSearch =
        !search ||
        (r.comment && r.comment.toLowerCase().includes(search.toLowerCase())) ||
        r.reviewer_name.toLowerCase().includes(search.toLowerCase()) ||
        r.reviewee_name.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (ratingFilter !== "all" && String(r.rating) !== ratingFilter) return false;

      if (statusFilter !== "all") {
        if (statusFilter === "hidden" && !r.is_hidden) return false;
        if (statusFilter === "approved" && (r.status !== "approved" || r.is_hidden)) return false;
        if (statusFilter === "rejected" && r.status !== "rejected") return false;
      }

      if (abuseFilter === "reported" && !r.is_reported) return false;

      return true;
    });
  }, [reviews, search, ratingFilter, statusFilter, abuseFilter]);

  async function handleToggleHide(id: string, currentHidden: boolean) {
    const { error } = await supabase
      .from("reviews")
      .update({ is_hidden: !currentHidden } as any)
      .eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(currentHidden ? "Review is now visible!" : "Review is now hidden from public profiles.");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    }
  }

  async function handleUpdateStatus(id: string, status: "approved" | "rejected") {
    const { error } = await supabase
      .from("reviews")
      .update({ status } as any)
      .eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Review successfully marked as ${status}!`);
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    }
  }

  async function handleToggleAbuse(id: string, currentReported: boolean) {
    const { error } = await supabase
      .from("reviews")
      .update({
        is_reported: !currentReported,
        report_reason: !currentReported ? "Reported as inappropriate/spam by admin" : null,
      } as any)
      .eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(currentReported ? "Abuse report dismissed." : "Review successfully flagged for abuse.");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to permanently delete this review? This action is irreversible.")) return;

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Review deleted permanently!");
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-xl font-bold tracking-tight">Review & Feedback Moderation</h3>
        <p className="text-sm text-muted-foreground">
          Approve, reject, flag, or hide client/contractor ratings on the platform.
        </p>
      </div>

      {/* Filters Deck */}
      <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5" /> Moderation Console
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Global Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviewer, comment..."
                className="pl-9 h-9 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Rating</Label>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stars</SelectItem>
                <SelectItem value="5">★ 5 Stars</SelectItem>
                <SelectItem value="4">★ 4 Stars</SelectItem>
                <SelectItem value="3">★ 3 Stars</SelectItem>
                <SelectItem value="2">★ 2 Stars</SelectItem>
                <SelectItem value="1">★ 1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Abuse Flags</Label>
            <Select value={abuseFilter} onValueChange={setAbuseFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="reported">Reported Abuse Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground animate-pulse">Loading reviews database...</p>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No reviews found matching criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold text-muted-foreground text-xs uppercase">
                  <th className="p-4">Author / Reviewer</th>
                  <th className="p-4">Reviewee</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Comment</th>
                  <th className="p-4">Flags</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r: any) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold">{r.reviewer_name}</div>
                      <div className="text-[10px] text-muted-foreground">{r.reviewer_email}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold">{r.reviewee_name}</div>
                      <div className="text-[10px] text-muted-foreground">{r.reviewee_email}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-amber-500 font-bold font-display text-sm">★ {r.rating}</span>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-xs text-muted-foreground italic break-words">"{r.comment || "No comment written."}"</p>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {r.is_hidden && <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">Hidden</Badge>}
                        {r.status === "rejected" && <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">Rejected</Badge>}
                        {r.status === "approved" && !r.is_hidden && <Badge className="bg-success text-success-foreground text-[9px] px-1.5 py-0.5">Approved</Badge>}
                        {r.is_reported && (
                          <Badge variant="outline" className="text-[9px] border-destructive text-destructive px-1.5 py-0.5 flex items-center gap-0.5" title={r.report_reason || ""}>
                            <AlertTriangle className="h-2.5 w-2.5" /> Flagged Abuse
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="xs"
                          variant="outline"
                          className={r.is_hidden ? "text-success border-success/20 bg-success/5" : "text-muted-foreground"}
                          title={r.is_hidden ? "Unhide Review" : "Hide Review"}
                          onClick={() => handleToggleHide(r.id, !!r.is_hidden)}
                        >
                          {r.is_hidden ? "Unhide" : "Hide"}
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={r.status === "approved"}
                          className="text-success border-success/20 disabled:opacity-30"
                          onClick={() => handleUpdateStatus(r.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={r.status === "rejected"}
                          className="text-destructive border-destructive/20 disabled:opacity-30"
                          onClick={() => handleUpdateStatus(r.id, "rejected")}
                        >
                          Reject
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          className={r.is_reported ? "text-amber-500" : "text-muted-foreground"}
                          title="Report/Dismiss Abuse Flag"
                          onClick={() => handleToggleAbuse(r.id, !!r.is_reported)}
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          title="Delete Review"
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AnnouncementsTab() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState<"all" | "developers" | "recruiters" | "premium" | "incomplete">("all");
  const [deliveryInApp, setDeliveryInApp] = useState(true);
  const [deliveryEmail, setDeliveryEmail] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  const qc = useQueryClient();

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    if (!deliveryInApp && !deliveryEmail) {
      toast.error("Please select at least one delivery channel (Email or In-App Notification).");
      return;
    }

    setBusy(true);
    const deliveryMethods: ("email" | "in_app")[] = [];
    if (deliveryEmail) deliveryMethods.push("email");
    if (deliveryInApp) deliveryMethods.push("in_app");

    try {
      const res = await sendAnnouncementServerFn({
        data: {
          title: title.trim(),
          message: message.trim(),
          targetAudience,
          deliveryMethods,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        },
      });

      if (res.success) {
        if (res.scheduled) {
          toast.success("Global announcement successfully scheduled!");
        } else {
          toast.success(`Global announcement successfully dispatched to targets!`);
        }
        setComposerOpen(false);
        setTitle("");
        setMessage("");
        setTargetAudience("all");
        setDeliveryEmail(false);
        setDeliveryInApp(true);
        setScheduledAt("");
        qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      } else {
        toast.error("Failed to dispatch announcement.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement record?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Announcement deleted!");
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Global Announcement Center</h3>
          <p className="text-sm text-muted-foreground">
            Compose and broadcast multi-channel alerts and campaigns to targeted cohorts.
          </p>
        </div>
        <Button onClick={() => setComposerOpen(true)} className="bg-gradient-accent text-primary-foreground font-bold shrink-0">
          <Plus className="mr-1 h-4 w-4" /> Compose Announcement
        </Button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground animate-pulse">Loading broadcast history...</p>
        ) : announcements.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No announcements broadcasted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 font-semibold text-muted-foreground text-xs uppercase">
                  <th className="p-4">Announcement</th>
                  <th className="p-4">Target Audience</th>
                  <th className="p-4">Channels</th>
                  <th className="p-4">Status / Schedule</th>
                  <th className="p-4">Sent At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {announcements.map((a: any) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-primary">{a.title}</div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{a.message}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize text-xs font-semibold">{a.target_audience}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {a.delivery_methods?.map((m: string) => (
                          <Badge key={m} variant="secondary" className="capitalize text-[10px]">{m.replace("_", " ")}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      {a.scheduled_at && new Date(a.scheduled_at) > new Date() ? (
                        <div className="flex items-center gap-1 text-amber-500 font-medium text-xs">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Scheduled: {new Date(a.scheduled_at).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <Badge className="bg-success text-success-foreground text-[10px]">Dispatched</Badge>
                      )}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {a.sent_at ? new Date(a.sent_at).toLocaleString() : "Pending"}
                    </td>
                    <td className="p-4 text-right">
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(a.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Compose Global Announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label>Broadcast Title <span className="text-destructive">*</span></Label>
              <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Major Platform Upgrade Complete!" />
            </div>
            <div className="space-y-1">
              <Label>Message Content <span className="text-destructive">*</span></Label>
              <Textarea required value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Write your announcement details..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Target Audience</Label>
                <Select value={targetAudience} onValueChange={(val: any) => setTargetAudience(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Registered Users</SelectItem>
                    <SelectItem value="developers">Developers Only</SelectItem>
                    <SelectItem value="recruiters">Recruiters Only</SelectItem>
                    <SelectItem value="premium">Premium Pro Users Only</SelectItem>
                    <SelectItem value="incomplete">Incomplete Profiles Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Schedule For Later (Optional)</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="h-10 text-xs" />
              </div>
            </div>

            <div className="space-y-2 border-t pt-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Delivery Channels</Label>
              <div className="flex gap-6 text-xs font-medium">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={deliveryInApp} onCheckedChange={(val) => setDeliveryInApp(!!val)} />
                  In-App Notification Bell Alert
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={deliveryEmail} onCheckedChange={(val) => setDeliveryEmail(!!val)} />
                  Email Blast (Branded HTML)
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setComposerOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={busy} className="bg-gradient-accent text-primary-foreground font-bold">
                {busy ? "Broadcasting..." : scheduledAt ? "Schedule Broadcast" : "Send Announcement Immediately 🚀"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VisitorAnalytics() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Global Traffic</CardTitle>
          <CardDescription>Real-time visitors and device share.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-success/5 text-success">
            Live: 42 users
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <AnalyticsMini title="Unique Visitors" val="4.2k" p={70} color="bg-accent" />
          <AnalyticsMini title="Avg. Duration" val="5m 12s" p={45} color="bg-success" />
          <AnalyticsMini title="Mobile Users" val="28%" p={28} color="bg-blue-500" />
          <AnalyticsMini title="Desktop Users" val="72%" p={72} color="bg-amber-500" />
        </div>
      </CardContent>
    </Card>
  );
}
function AnalyticsMini({
  title,
  val,
  p,
  color,
}: {
  title: string;
  val: string;
  p: number;
  color: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground font-medium">{title}</p>
      <p className="text-xl font-bold mt-1">{val}</p>
      <div className="h-1 w-full bg-muted rounded-full mt-2 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${p}%` }}></div>
      </div>
    </div>
  );
}

function VisitorFlow() {
  const flowData = [
    { name: "Home", visitors: 4200, bounce: 20 },
    { name: "Projects", visitors: 2800, bounce: 15 },
    { name: "Developers", visitors: 2100, bounce: 10 },
    { name: "Auth", visitors: 1500, bounce: 40 },
    { name: "Apply", visitors: 800, bounce: 5 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitors Flow</CardTitle>
        <CardDescription>Main entry points and drop-off rates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {flowData.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">
                  {item.visitors.toLocaleString()} views
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${(item.visitors / 4200) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-destructive font-medium">
                  {item.bounce}% exit
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["admin-recent-activity"],
    queryFn: async () => {
      const [users, apps, projs, msgs, devs, recs] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, created_at, full_name")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("applications")
          .select("id, created_at, developer_id, project_id")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("projects")
          .select("id, created_at, title, recruiter_id")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("messages")
          .select("id, created_at, body, sender_id")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase.from("developer_profiles").select("id, full_name"),
        supabase.from("recruiter_profiles").select("id, company_name"),
      ]);
      const devMap = new Map((devs.data || []).map((d: any) => [d.id, d.full_name]));
      const recMap = new Map((recs.data || []).map((r: any) => [r.id, r.company_name]));
      const projMap = new Map((projs.data || []).map((p: any) => [p.id, p.title]));

      const formatted = [
        ...(users.data || []).map((u) => ({
          user: u.full_name || "New user",
          action: "joined the platform",
          target: "",
          time: u.created_at,
          type: "user",
        })),
        ...(apps.data || []).map((a) => ({
          user: devMap.get(a.developer_id) || "Someone",
          action: "applied for",
          target: projMap.get(a.project_id) || "",
          time: a.created_at,
          type: "app",
        })),
        ...(projs.data || []).map((p) => ({
          user: recMap.get(p.recruiter_id) || "Company",
          action: "posted",
          target: p.title,
          time: p.created_at,
          type: "proj",
        })),
        ...(msgs.data || []).map((m) => ({
          user: (m.sender_id || "").slice(0, 8),
          action: "sent a message",
          target: (m.body?.slice(0, 20) || "Attachment") + "...",
          time: m.created_at,
          type: "msg",
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10);

      return formatted;
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Live platform events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center animate-pulse text-sm">Loading activity...</p>
          ) : !activities?.length ? (
            <p className="text-center text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            activities.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div
                  className={`h-2 w-2 rounded-full ${a.type === "user" ? "bg-blue-400" : a.type === "app" ? "bg-blue-600" : a.type === "proj" ? "bg-success" : a.type === "msg" ? "bg-accent" : "bg-amber-500"}`}
                />
                <div className="flex-1">
                  <span className="font-bold">{a.user}</span> {a.action}{" "}
                  <span className="font-medium text-muted-foreground">{a.target}</span>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  {new Date(a.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))
          )}
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground mt-2">
            View Full Audit Log
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- USERS ---
function SendCustomEmailDialog({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and message are required.");
      return;
    }
    setBusy(true);
    const html = getBrandedEmailHtml({
      title: subject,
      salutation: `Hi ${user.full_name || "User"},`,
      messageBody: body,
      ctaLabel: "Go to Dashboard",
      ctaUrl: "https://developerconnect.in/dashboard",
    });

    try {
      const res = await sendLoggedEmailServerFn({
        data: {
          to: user.email,
          subject: subject.trim(),
          html,
          emailType: "notification",
        },
      });
      if (res.success) {
        toast.success(`Custom email sent successfully to ${user.email}!`);
        setOpen(false);
        setSubject("");
        setBody("");
      } else {
        toast.error(res.error || "Failed to send custom email.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Send Custom Email">
          <Mail className="h-4 w-4 text-indigo-500 hover:text-indigo-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Send Custom Email to {user.full_name || "User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSend} className="space-y-4 pt-4">
          <div className="space-y-1">
            <Label>Recipient Email</Label>
            <Input value={user.email} disabled className="bg-muted" />
          </div>
          <div className="space-y-1">
            <Label>Subject</Label>
            <Input required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Action Required: Complete your profile today" />
          </div>
          <div className="space-y-1">
            <Label>Message Body</Label>
            <Textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Enter your custom email message..." />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy} className="bg-gradient-accent text-primary-foreground font-bold">{busy ? "Sending..." : "Send Email"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UsersTab() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState("all");

  const qc = useQueryClient();

  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-users-all"],
    queryFn: async () => {
      const [{ data: profs, error: pErr }, { data: roles, error: rErr }, { data: emails }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, avatar_url, created_at, updated_at, is_suspended")
            .order("created_at", { ascending: false }),
          supabase.from("user_roles").select("user_id, role"),
          supabase.rpc("admin_list_user_emails" as any),
        ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));
      const emailMap = new Map((emails || []).map((e: any) => [e.user_id, e.email]));
      return (profs || []).map((u: any) => ({
        ...u,
        email: emailMap.get(u.id),
        role: roleMap.get(u.id) || "unknown",
      }));
    },
  });

  const { data: reminderData } = useQuery({
    queryKey: ["admin-reminders-data"],
    queryFn: async () => {
      return getAdminReminderManagerData();
    },
  });

  // Merge users with detailed completion and status data
  const usersWithDetails = useMemo(() => {
    if (!users) return [];
    return users.map((u) => {
      const d = reminderData?.users?.find((usr) => usr.id === u.id);
      return {
        ...u,
        completionPercentage: d?.completionPercentage ?? 0,
        remindersCount: d?.remindersCount ?? 0,
        lastReminderSentAt: d?.lastReminderSentAt ?? null,
        remindersDisabled: d?.remindersDisabled ?? false,
        isActive: d?.isActive ?? false,
      };
    });
  }, [users, reminderData]);

  // Apply rich search and status filters
  const filtered = useMemo(() => {
    return usersWithDetails.filter((u) => {
      const matchesSearch =
        !search ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.id.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      // Role Filter
      if (roleFilter !== "all" && u.role !== roleFilter) return false;

      // Status Filter
      if (statusFilter !== "all") {
        if (statusFilter === "suspended" && !u.is_suspended) return false;
        if (statusFilter === "active" && u.is_suspended) return false;
      }

      // Registration Date Filter
      if (dateFilter !== "all") {
        const joinedDate = new Date(u.created_at);
        const diffMs = new Date().getTime() - joinedDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (dateFilter === "today" && diffDays > 1) return false;
        if (dateFilter === "week" && diffDays > 7) return false;
        if (dateFilter === "month" && diffDays > 30) return false;
      }

      // Profile Completion Filter
      if (completionFilter !== "all") {
        if (completionFilter === "complete" && u.completionPercentage < 100) return false;
        if (completionFilter === "incomplete" && u.completionPercentage === 100) return false;
      }

      return true;
    });
  }, [usersWithDetails, search, roleFilter, statusFilter, dateFilter, completionFilter]);

  async function deleteUser(id: string) {
    if (!confirm("Delete this user? This will remove all their data.")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("User deleted");
      qc.invalidateQueries({ queryKey: ["admin-users-all"] });
    }
  }

  async function toggleSuspend(id: string, currentSuspended: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: !currentSuspended } as any)
      .eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(currentSuspended ? "User unsuspended / activated!" : "User suspended successfully!");
      qc.invalidateQueries({ queryKey: ["admin-users-all"] });
      qc.invalidateQueries({ queryKey: ["admin-reminders-data"] });
    }
  }

  async function resetProfile(u: any) {
    if (!confirm(`Are you sure you want to reset the profile of ${u.full_name || "this user"}? This will restore headline, bio, skills, and metrics back to defaults.`)) return;

    try {
      if (u.role === "developer") {
        await supabase
          .from("developer_profiles")
          .update({
            headline: "",
            bio: "",
            skills: [],
            experience_years: 0,
            hourly_rate_inr: 0,
            portfolio_url: "",
            is_verified: false,
          } as any)
          .eq("id", u.id);
      } else if (u.role === "recruiter") {
        await supabase
          .from("recruiter_profiles")
          .update({
            company_description: "",
            industry: "",
            company_website: "",
            is_verified: false,
          } as any)
          .eq("id", u.id);
      }
      toast.success("Profile fields reset successfully!");
      qc.invalidateQueries({ queryKey: ["admin-users-all"] });
      qc.invalidateQueries({ queryKey: ["admin-reminders-data"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to reset profile.");
    }
  }

  if (error)
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Failed to load users: {(error as Error).message}
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Search and Filters deck */}
      <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Filter className="h-3.5 w-3.5" /> User Filter Console
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Search Name/Email/ID</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-9 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Filter Role</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Filter Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active (Un-suspended)</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Registration Date</Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Anytime</SelectItem>
                <SelectItem value="today">Registered Today</SelectItem>
                <SelectItem value="week">Registered Last 7 Days</SelectItem>
                <SelectItem value="month">Registered Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground uppercase">Profile Completion</Label>
            <Select value={completionFilter} onValueChange={setCompletionFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Completeness</SelectItem>
                <SelectItem value="complete">Fully Complete (100%)</SelectItem>
                <SelectItem value="incomplete">Incomplete (&lt;100%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Completion %</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center animate-pulse">
                  Loading all users...
                </td>
              </tr>
            ) : !filtered?.length ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-muted-foreground">
                  No users found matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold flex items-center gap-1.5">
                      {u.full_name || "Anonymous"}
                      {u.is_suspended && <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5">Suspended</Badge>}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">{u.id}</div>
                  </td>
                  <td className="p-4 text-muted-foreground">{u.email}</td>
                  <td className="p-4">
                    <Badge variant="outline" className="capitalize">
                      {u.role}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold">{u.completionPercentage}%</span>
                      <div className="w-12 bg-muted rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${u.completionPercentage === 100 ? "bg-success" : "bg-amber-500"}`}
                          style={{ width: `${u.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      <ViewUserDialog user={u} kind={u.role === "recruiter" ? "recruiter" : "developer"} />
                      <SendCustomEmailDialog user={u} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-amber-500 hover:text-amber-600"
                        title="Reset profile to defaults"
                        onClick={() => resetProfile(u)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={u.is_suspended ? "text-success hover:text-success" : "text-amber-500 hover:text-amber-600"}
                        title={u.is_suspended ? "Activate / Unsuspend User" : "Suspend User"}
                        onClick={() => toggleSuspend(u.id, !!u.is_suspended)}
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        title="Delete User permanently"
                        onClick={() => deleteUser(u.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- DEVELOPERS ---
function DevelopersTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const qc = useQueryClient();
  const {
    data: devs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-developers"],
    queryFn: async () => {
      const [{ data: dvs, error: dErr }, { data: profs }, { data: emails }, { data: phones }] =
        await Promise.all([
          supabase.from("developer_profiles").select("*").order("created_at", { ascending: false }),
          supabase.from("profiles").select("id, is_suspended"),
          supabase.rpc("admin_list_user_emails" as any),
          supabase.from("developer_phones" as any).select("developer_id, phone"),
        ]);
      if (dErr) throw dErr;
      const pMap = new Map((profs || []).map((p: any) => [p.id, p]));
      const emailMap = new Map((emails || []).map((e: any) => [e.user_id, e.email]));
      const phoneMap = new Map((phones || []).map((p: any) => [p.developer_id, p.phone]));
      return (dvs || []).map((d: any) => ({
        ...d,
        email: emailMap.get(d.id),
        phone: phoneMap.get(d.id),
        is_suspended: pMap.get(d.id)?.is_suspended,
      }));
    },
  });
  const filtered = devs?.filter(
    (d) =>
      (!search ||
        d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        d.email?.toLowerCase().includes(search.toLowerCase())) &&
      (filter === "all" ||
        (filter === "verified" && d.is_verified) ||
        (filter === "unverified" && !d.is_verified)),
  );

  async function toggleVerify(id: string, current: boolean) {
    const { error } = await supabase
      .from("developer_profiles")
      .update({ is_verified: !current } as any)
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Unverified" : "Verified");
      qc.invalidateQueries({ queryKey: ["admin-developers"] });
    }
  }

  async function toggleSuspend(id: string, current: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: !current } as any)
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Unsuspended" : "Suspended");
      qc.invalidateQueries({ queryKey: ["admin-developers"] });
    }
  }

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Headline",
      "Skills",
      "Exp",
      "Location",
      "Verified",
      "Joined",
    ];
    const rows =
      filtered?.map((d) => [
        d.full_name,
        d.email || "N/A",
        d.headline,
        (d.skills || []).join("|"),
        d.experience_years,
        d.location,
        d.is_verified,
        d.created_at,
      ]) || [];
    const content = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    link.download = "developers_export.csv";
    link.click();
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const paginated = filtered?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil((filtered?.length || 0) / itemsPerPage);

  async function deleteDev(id: string) {
    if (!confirm("Delete this developer?")) return;
    const { error } = await supabase.from("developer_profiles").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Deleted");
  }

  if (error)
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Failed to load developers: {(error as Error).message}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search developers by name or email..."
            className="pl-9 bg-card"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
            <tr>
              <th className="p-4">Developer</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">Skills</th>
              <th className="p-4">Status</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center animate-pulse">
                  Loading talent pool...
                </td>
              </tr>
            ) : !paginated?.length ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-muted-foreground">
                  No developers found.
                </td>
              </tr>
            ) : (
              paginated?.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30">
                  <td className="p-4">
                    <div>
                      <p className="font-bold">{d.full_name || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {d.headline}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {d.email || "No Email"}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3 w-3" /> {d.phone || "No Phone"}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {d.skills?.slice(0, 3).map((s: string) => (
                        <Badge key={s} variant="outline" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                      {d.skills?.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{d.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <button onClick={() => toggleVerify(d.id, d.is_verified)}>
                      {d.is_verified ? (
                        <Badge className="bg-success/10 text-success border-success/20 cursor-pointer hover:bg-success/20 transition-colors">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer hover:bg-muted transition-colors"
                        >
                          <Clock className="mr-1 h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <ViewUserDialog user={d} kind="developer" />
                      <Button variant="ghost" size="icon" asChild title="Public Profile">
                        <Link to="/developers/$devId" params={{ devId: d.id }}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <EditDeveloperDialog
                        developer={d}
                        user={{ id: d.id }}
                        onUpdate={() => qc.invalidateQueries({ queryKey: ["admin-developers"] })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className={d.is_suspended ? "text-amber-500" : "text-muted-foreground"}
                        title={d.is_suspended ? "Unsuspend User" : "Suspend User"}
                        onClick={() => toggleSuspend(d.id, d.is_suspended)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        title="Delete Profile"
                        onClick={() => deleteDev(d.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// --- RECRUITERS ---
function RecruitersTab() {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const { data: recs, isLoading } = useQuery({
    queryKey: ["admin-recruiters"],
    queryFn: async () => {
      const [{ data: rs }, { data: profs }, { data: emails }, { data: phones }] = await Promise.all(
        [
          supabase.from("recruiter_profiles").select("*").order("created_at", { ascending: false }),
          supabase.from("profiles").select("id, is_suspended"),
          supabase.rpc("admin_list_user_emails" as any),
          supabase.from("recruiter_phones" as any).select("recruiter_id, phone"),
        ],
      );
      const pMap = new Map((profs || []).map((p: any) => [p.id, p]));
      const emailMap = new Map((emails || []).map((e: any) => [e.user_id, e.email]));
      const phoneMap = new Map((phones || []).map((p: any) => [p.recruiter_id, p.phone]));
      return (rs || []).map((r: any) => ({
        ...r,
        email: emailMap.get(r.id),
        phone: phoneMap.get(r.id),
        is_suspended: pMap.get(r.id)?.is_suspended,
      }));
    },
  });
  const filtered = recs?.filter(
    (r) =>
      !search ||
      r.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()),
  );

  async function toggleVerify(id: string, current: boolean) {
    const { error } = await supabase
      .from("recruiter_profiles")
      .update({ is_verified: !current } as any)
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Unverified" : "Verified");
      qc.invalidateQueries({ queryKey: ["admin-recruiters"] });
    }
  }

  async function toggleSuspend(id: string, current: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: !current } as any)
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Unsuspended" : "Suspended");
      qc.invalidateQueries({ queryKey: ["admin-recruiters"] });
    }
  }

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const paginated = filtered?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil((filtered?.length || 0) / itemsPerPage);

  async function deleteRec(id: string) {
    if (!confirm("Delete this recruiter?")) return;
    const { error } = await supabase.from("recruiter_profiles").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Deleted");
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search recruiters by name or email..."
          className="pl-9 bg-card"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
            <tr>
              <th className="p-4">Company</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">Status</th>
              <th className="p-4">Industry</th>
              <th className="p-4">Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center animate-pulse">
                  Loading partners...
                </td>
              </tr>
            ) : !paginated?.length ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-muted-foreground">
                  No recruiters found.
                </td>
              </tr>
            ) : (
              paginated?.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold">{r.company_name}</div>
                    <div className="text-xs text-muted-foreground">{r.full_name}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {r.email || "No Email"}
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3 w-3" /> {r.phone || "No Phone"}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <button onClick={() => toggleVerify(r.id, r.is_verified)}>
                      {r.is_verified ? (
                        <Badge className="bg-success/10 text-success border-success/20 cursor-pointer hover:bg-success/20 transition-colors">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="cursor-pointer hover:bg-muted transition-colors"
                        >
                          <Clock className="mr-1 h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </button>
                  </td>
                  <td className="p-4 text-muted-foreground">{r.industry || "Tech"}</td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <ViewUserDialog user={r} kind="recruiter" />
                      <Button variant="ghost" size="icon" asChild title="Public Profile">
                        <Link to="/recruiters/$recId" params={{ recId: r.id }}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                      <EditRecruiterDialog
                        recruiter={r}
                        user={{ id: r.id }}
                        onUpdate={() => qc.invalidateQueries({ queryKey: ["admin-recruiters"] })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className={r.is_suspended ? "text-amber-500" : "text-muted-foreground"}
                        title={r.is_suspended ? "Unsuspend User" : "Suspend User"}
                        onClick={() => toggleSuspend(r.id, r.is_suspended)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        title="Delete Profile"
                        onClick={() => deleteRec(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// --- PROJECTS ---
function ProjectsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const {
    data: projs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const [{ data: ps, error: pErr }, { data: recs }] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("recruiter_profiles").select("id, company_name"),
      ]);
      if (pErr) throw pErr;
      const rMap = new Map((recs || []).map((r: any) => [r.id, r.company_name]));
      return (ps || []).map((p: any) => ({ ...p, company_name: rMap.get(p.recruiter_id) }));
    },
  });
  const filtered = projs?.filter(
    (p) =>
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.company_name?.toLowerCase().includes(search.toLowerCase()),
  );

  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await supabase
      .from("projects")
      .update({ is_featured: !current } as any)
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Featured status updated");
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    }
  }
  async function closeProj(id: string) {
    if (!confirm("Close this project?")) return;
    const { error } = await supabase.from("projects").update({ status: "closed" }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Project closed");
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    }
  }
  async function deleteProj(id: string) {
    if (!confirm("Delete project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Deleted");
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects or companies..."
          className="pl-9 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          <p className="p-12 text-center animate-pulse col-span-full">Loading projects...</p>
        ) : !filtered?.length ? (
          <p className="p-12 text-center text-muted-foreground col-span-full">No projects found.</p>
        ) : (
          filtered.map((p) => (
            <Card key={p.id} className={p.is_featured ? "border-accent ring-1 ring-accent/20" : ""}>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="secondary" className="capitalize">
                    {p.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFeatured(p.id, p.is_featured)}
                      title="Toggle Featured"
                    >
                      <Star
                        className={`h-4 w-4 ${p.is_featured ? "fill-accent text-accent" : ""}`}
                      />
                    </Button>
                    {p.status !== "closed" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-warning"
                        onClick={() => closeProj(p.id)}
                        title="Close Project"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => deleteProj(p.id)}
                      title="Delete Project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base mt-2 line-clamp-1">{p.title}</CardTitle>
                <CardDescription>{p.company_name || "—"}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex justify-between items-center mt-2">
                <span className="text-xs font-bold text-accent">
                  Budget: ₹{p.budget_min_inr?.toLocaleString()}
                </span>
                <Button variant="link" size="sm" asChild className="p-0 h-auto">
                  <Link to="/projects/$projectId" params={{ projectId: p.id }}>
                    Details →
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// --- APPLICATIONS ---
function ApplicationsTab() {
  const [search, setSearch] = useState("");
  const {
    data: apps,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const [{ data: as, error: aErr }, { data: ps }, { data: dvs }] = await Promise.all([
        supabase.from("applications").select("*").order("created_at", { ascending: false }),
        supabase.from("projects").select("id, title"),
        supabase.from("developer_profiles").select("id, full_name"),
      ]);
      if (aErr) throw aErr;
      const pMap = new Map((ps || []).map((p: any) => [p.id, p.title]));
      const dMap = new Map((dvs || []).map((d: any) => [d.id, d.full_name]));
      return (as || []).map((a: any) => ({
        ...a,
        project_title: pMap.get(a.project_id),
        developer_name: dMap.get(a.developer_id),
      }));
    },
  });
  const filtered = apps?.filter(
    (a) =>
      !search ||
      a.project_title?.toLowerCase().includes(search.toLowerCase()) ||
      a.developer_name?.toLowerCase().includes(search.toLowerCase()),
  );

  if (error)
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Failed to load: {(error as Error).message}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by project or developer..."
          className="pl-9 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="p-4">Project</th>
              <th className="p-4">Developer</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-10 text-center animate-pulse">
                  Loading...
                </td>
              </tr>
            ) : !filtered?.length ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-muted-foreground">
                  No applications found.
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id}>
                  <td className="p-4 font-medium truncate max-w-[200px]">
                    {a.project_title || "—"}
                  </td>
                  <td className="p-4">{a.developer_name || "—"}</td>
                  <td className="p-4">
                    <Badge variant="outline">{a.status}</Badge>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- CONTACTS ---
function ContactsTab() {
  const [search, setSearch] = useState("");
  const {
    data: contacts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const [{ data: cs, error: cErr }, { data: profs }] = await Promise.all([
        supabase
          .from("contact_access_requests")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name"),
      ]);
      if (cErr) throw cErr;
      const pMap = new Map((profs || []).map((p: any) => [p.id, p.full_name]));
      return (cs || []).map((c: any) => ({
        ...c,
        requester_name: pMap.get(c.requester_id),
        target_name: pMap.get(c.target_id),
      }));
    },
  });
  const filtered = contacts?.filter(
    (c) =>
      !search ||
      c.requester_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.target_name?.toLowerCase().includes(search.toLowerCase()),
  );

  if (error)
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Failed to load: {(error as Error).message}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by participant name..."
          className="pl-9 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {isLoading ? (
          <p className="p-12 text-center animate-pulse col-span-full">Loading requests...</p>
        ) : !filtered?.length ? (
          <p className="p-12 text-center text-muted-foreground col-span-full">No requests found.</p>
        ) : (
          filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">
                    {c.requester_name || "—"} → {c.target_name || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()} · {c.status}
                  </p>
                </div>
                <Badge
                  className={c.status === "approved" ? "bg-success text-success-foreground" : ""}
                >
                  {c.status}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// --- INVITES ---
function InvitesTab() {
  const [search, setSearch] = useState("");
  const {
    data: invites,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: async () => {
      const [{ data: invs, error: iErr }, { data: ps }, { data: dvs }] = await Promise.all([
        supabase.from("invites").select("*").order("created_at", { ascending: false }),
        supabase.from("projects").select("id, title"),
        supabase.from("developer_profiles").select("id, full_name"),
      ]);
      if (iErr) throw iErr;
      const pMap = new Map((ps || []).map((p: any) => [p.id, p.title]));
      const dMap = new Map((dvs || []).map((d: any) => [d.id, d.full_name]));
      return (invs || []).map((i: any) => ({
        ...i,
        project_title: pMap.get(i.project_id),
        developer_name: dMap.get(i.developer_id),
      }));
    },
  });
  const filtered = invites?.filter(
    (i) =>
      !search ||
      i.project_title?.toLowerCase().includes(search.toLowerCase()) ||
      i.developer_name?.toLowerCase().includes(search.toLowerCase()),
  );

  if (error)
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Failed to load: {(error as Error).message}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by project or developer..."
          className="pl-9 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b text-xs font-semibold uppercase text-muted-foreground">
            <tr>
              <th className="p-4">Project</th>
              <th className="p-4">Developer</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-10 text-center animate-pulse">
                  Loading...
                </td>
              </tr>
            ) : !filtered?.length ? (
              <tr>
                <td colSpan={4} className="p-10 text-center text-muted-foreground">
                  No invites found.
                </td>
              </tr>
            ) : (
              filtered.map((i) => (
                <tr key={i.id}>
                  <td className="p-4 font-medium">{i.project_title || "—"}</td>
                  <td className="p-4">{i.developer_name || "—"}</td>
                  <td className="p-4">
                    <Badge variant="outline">{i.status}</Badge>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {new Date(i.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- CHATS ---
function ChatsTab() {
  const [search, setSearch] = useState("");
  const {
    data: messages,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-chats"],
    queryFn: async () => {
      const [{ data: msgs, error: mErr }, { data: profs }, { data: apps }, { data: ps }] =
        await Promise.all([
          supabase
            .from("messages")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100),
          supabase.from("profiles").select("id, full_name"),
          supabase.from("applications").select("id, project_id"),
          supabase.from("projects").select("id, title"),
        ]);
      if (mErr) throw mErr;
      const profMap = new Map((profs || []).map((p: any) => [p.id, p.full_name]));
      const projMap = new Map((ps || []).map((p: any) => [p.id, p.title]));
      const appMap = new Map((apps || []).map((a: any) => [a.id, projMap.get(a.project_id)]));
      return (msgs || []).map((m: any) => ({
        ...m,
        sender_name: profMap.get(m.sender_id),
        project_title: appMap.get(m.application_id),
      }));
    },
  });
  const filtered = messages?.filter(
    (m) =>
      !search ||
      m.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.project_title?.toLowerCase().includes(search.toLowerCase()) ||
      m.body?.toLowerCase().includes(search.toLowerCase()),
  );

  if (error)
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Failed to load chats: {(error as Error).message}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search messages, senders, or projects..."
          className="pl-9 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
        <AlertTriangle className="h-4 w-4" />
        <p className="text-xs font-medium">Platform-wide chat monitoring enabled for safety.</p>
      </div>
      <div className="space-y-2">
        {isLoading ? (
          <p className="p-12 text-center animate-pulse">Loading logs...</p>
        ) : !filtered?.length ? (
          <p className="p-12 text-center text-muted-foreground">No messages found.</p>
        ) : (
          filtered.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-lg border bg-card text-sm flex justify-between items-start gap-4 hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-accent">
                    {m.sender_name || (m.sender_id || "").slice(0, 8)}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase">
                    in {m.project_title || "Unknown Project"}
                  </span>
                </div>
                <p className="text-muted-foreground break-words">
                  {m.body || ((m.attachments?.length ?? 0) > 0 ? "📎 Attachment" : "Empty Message")}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-1">
                {new Date(m.created_at).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- ALERTS ---
function AlertsTab() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {isLoading ? (
        <p>Loading alerts...</p>
      ) : (
        alerts?.map((a) => (
          <div key={a.id} className="flex gap-4 p-4 rounded-xl border bg-card shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              {a.type === "registration" ? (
                <UserRound className="h-5 w-5" />
              ) : (
                <Bell className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">{a.title}</h4>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// --- MODALS ---
function EditDeveloperDialog({
  developer,
  user,
  onUpdate,
}: {
  developer: any;
  user: any;
  onUpdate: () => void;
}) {
  const [form, setForm] = useState({
    full_name: developer.full_name || "",
    headline: developer.headline || "",
    skills: (developer.skills || []).join(", "),
    is_verified: developer.is_verified || false,
    bio: developer.bio || "",
    location: developer.location || "",
    hourly_rate_inr: developer.hourly_rate_inr || 0,
    experience_years: developer.experience_years || 0,
    phone: developer.phone || "",
  });
  const [open, setOpen] = useState(false);
  async function handleSave() {
    const { error } = await supabase
      .from("developer_profiles")
      .update({
        full_name: form.full_name,
        headline: form.headline,
        skills: form.skills
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean),
        is_verified: form.is_verified,
        bio: form.bio,
        location: form.location,
        hourly_rate_inr: form.hourly_rate_inr,
        experience_years: form.experience_years,
      })
      .eq("id", user.id);
    if (form.phone) {
      await supabase.from("developer_phones" as any).upsert({
        developer_id: user.id,
        phone: form.phone,
        updated_at: new Date().toISOString(),
      } as any);
    }
    if (error) toast.error(error.message);
    else {
      toast.success("Profile Updated");
      setOpen(false);
      onUpdate();
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Edit Profile">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Moderate Developer Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Headline</Label>
            <Input
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Hourly Rate (INR)</Label>
              <Input
                type="number"
                value={form.hourly_rate_inr}
                onChange={(e) =>
                  setForm({ ...form, hourly_rate_inr: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Exp. Years</Label>
              <Input
                type="number"
                value={form.experience_years}
                onChange={(e) =>
                  setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Phone Number</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 ..."
            />
          </div>
          <div className="space-y-1">
            <Label>Skills (comma separated)</Label>
            <Input
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Bio</Label>
            <Textarea
              className="h-32"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="v"
              checked={form.is_verified}
              onCheckedChange={(v) => setForm({ ...form, is_verified: !!v })}
            />
            <Label htmlFor="v" className="font-bold text-success">
              Verified Badge Active
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditRecruiterDialog({
  recruiter,
  user,
  onUpdate,
}: {
  recruiter: any;
  user: any;
  onUpdate: () => void;
}) {
  const [form, setForm] = useState({
    company_name: recruiter.company_name || "",
    is_verified: recruiter.is_verified || false,
    industry: recruiter.industry || "",
    location: recruiter.location || "",
    company_description: recruiter.company_description || "",
    company_website: recruiter.company_website || "",
    phone: recruiter.phone || "",
  });
  const [open, setOpen] = useState(false);
  async function handleSave() {
    const { error } = await supabase
      .from("recruiter_profiles")
      .update({
        company_name: form.company_name,
        is_verified: form.is_verified,
        industry: form.industry,
        location: form.location,
        company_description: form.company_description,
        company_website: form.company_website,
      })
      .eq("id", user.id);
    if (form.phone) {
      await supabase.from("recruiter_phones" as any).upsert({
        recruiter_id: user.id,
        phone: form.phone,
        updated_at: new Date().toISOString(),
      } as any);
    }
    if (error) toast.error(error.message);
    else {
      toast.success("Company Updated");
      setOpen(false);
      onUpdate();
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Edit Company">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Moderate Company Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Company Name</Label>
              <Input
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Industry</Label>
              <Input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Location</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Website</Label>
              <Input
                value={form.company_website}
                onChange={(e) => setForm({ ...form, company_website: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              className="h-24"
              value={form.company_description}
              onChange={(e) => setForm({ ...form, company_description: e.target.value })}
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="rv"
              checked={form.is_verified}
              onCheckedChange={(v) => setForm({ ...form, is_verified: !!v })}
            />
            <Label htmlFor="rv" className="font-bold text-success">
              Verified Company Badge
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewUserDialog({ user, kind }: { user: any; kind: "developer" | "recruiter" }) {
  const [open, setOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const qc = useQueryClient();

  // Fetch full details for this user including reminder stats and login dates
  const { data: details, isLoading } = useQuery({
    queryKey: ["admin-user-details", user?.id],
    enabled: open && !!user?.id,
    queryFn: async () => {
      // Query profile_email_reminders logs count & last reminder sent
      const [{ data: remLogs }, { data: usersDb }] = await Promise.all([
        supabase
          .from("profile_email_reminders" as any)
          .select("*")
          .eq("user_id", user.id)
          .order("sent_at", { ascending: false }),
        supabase
          .from("users" as any)
          .select("reminders_disabled")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      const sentReminders = (remLogs || []).filter((r: any) => r.email_status === "sent");
      const lastReminder = sentReminders[0] || null;

      // Fetch cached auth user info from admin reminders directory if available
      const allRemindersData: any = qc.getQueryData(["admin-reminders-data"]);
      const cachedUser = allRemindersData?.users?.find((u: any) => u.id === user.id);

      // Re-fetch profile & subprofile to calculate completion percent accurately
      const { data: p } = await supabase
        .from("profiles")
        .select("avatar_url, full_name, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle();
      const { data: dev } =
        kind === "developer"
          ? await supabase.from("developer_profiles").select("*").eq("id", user.id).maybeSingle()
          : { data: null };
      const { data: rec } =
        kind === "recruiter"
          ? await supabase.from("recruiter_profiles").select("*").eq("id", user.id).maybeSingle()
          : { data: null };

      // Calculate completion %
      const totalFields = kind === "developer" ? 7 : 5;
      let filledFields = 0;
      if (kind === "developer") {
        if (p?.full_name?.trim()) filledFields++;
        if (p?.avatar_url?.trim()) filledFields++;
        if (dev?.bio?.trim()) filledFields++;
        if (Array.isArray(dev?.skills) && dev.skills.length > 0) filledFields++;
        if (dev?.experience_years !== null && dev?.experience_years !== undefined) filledFields++;
        if (dev?.portfolio_url?.trim()) filledFields++;
        if (dev?.hourly_rate_inr !== null && dev?.hourly_rate_inr !== undefined) filledFields++;
      } else {
        if (rec?.company_name?.trim()) filledFields++;
        if (rec?.logo_url?.trim()) filledFields++;
        if (rec?.company_description?.trim()) filledFields++;
        if (rec?.industry?.trim()) filledFields++;
        if (rec?.company_website?.trim()) filledFields++;
      }
      const completionPercentage = Math.round((filledFields / totalFields) * 100);

      // Fetch company projects (Module 6)
      const { data: companyProjects } = kind === "recruiter"
        ? await supabase.from("projects").select("id, title, status, budget_min_inr").eq("recruiter_id", user.id)
        : { data: [] };

      // Fetch company reviews (Module 6)
      const { data: companyReviews } = kind === "recruiter"
        ? await supabase.from("reviews").select("id, rating, comment, created_at, reviewer_id").eq("reviewee_id", user.id)
        : { data: [] };

      // Look up reviewer names for reviews
      const reviewerIds = [...new Set((companyReviews || []).map((r: any) => r.reviewer_id))];
      const { data: reviewerProfiles } = reviewerIds.length > 0
        ? await supabase.from("profiles").select("id, full_name").in("id", reviewerIds)
        : { data: [] };

      const reviewsWithReviewer = (companyReviews || []).map((r: any) => {
        const rev = reviewerProfiles?.find((p) => p.id === r.reviewer_id);
        return {
          ...r,
          reviewer_name: rev?.full_name || "Anonymous Developer",
        };
      });

      return {
        completionPercentage,
        remindersCount: sentReminders.length,
        lastReminderSentAt: lastReminder ? lastReminder.sent_at : null,
        remindersDisabled: !!usersDb?.reminders_disabled,
        lastSignInAt: cachedUser?.lastSignInAt || user.last_sign_in_at || null,
        createdAt: p?.created_at || user.created_at,
        companyProjects: companyProjects || [],
        companyReviews: reviewsWithReviewer || [],
      };
    },
  });

  async function handleSendReminder() {
    if (!currentUser?.email) return;
    const toastId = toast.loading("Sending profile reminder...");
    try {
      const res = await sendIndividualReminderServerFn({
        data: {
          userId: user.id,
          adminEmail: currentUser.email,
        },
      });
      if (res.success) {
        toast.success("Profile reminder sent successfully!", { id: toastId });
        qc.invalidateQueries({ queryKey: ["admin-user-details", user.id] });
        qc.invalidateQueries({ queryKey: ["admin-reminders-data"] });
      } else {
        toast.error(res.error || "Failed to send profile reminder.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.", { id: toastId });
    }
  }

  async function handleToggleDisabled() {
    if (!details) return;
    try {
      const res = await toggleUserRemindersDisabledServerFn({
        data: {
          userId: user.id,
          disabled: !details.remindersDisabled,
        },
      });
      if (res.success) {
        toast.success(
          `Reminders ${!details.remindersDisabled ? "disabled" : "enabled"} for this user.`,
        );
        qc.invalidateQueries({ queryKey: ["admin-user-details", user.id] });
        qc.invalidateQueries({ queryKey: ["admin-reminders-data"] });
      } else {
        toast.error(res.error || "Failed to update reminder settings.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="View Details">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {user.full_name || (kind === "recruiter" ? user.company_name : "Anonymous")}{" "}
            {user.is_verified && (
              <Badge className="bg-success text-success-foreground">
                <ShieldCheck className="mr-1 h-3 w-3" /> Verified
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2 text-sm">
          <Row k="User ID" v={<span className="font-mono text-xs">{user.id}</span>} />
          <Row k="Email" v={user.email || "—"} />
          <Row k="Phone" v={user.phone || "—"} />
          {kind === "developer" ? (
            <>
              <Row k="Headline" v={user.headline || "—"} />
              <Row k="Location" v={user.location || "—"} />
              <Row
                k="Experience"
                v={user.experience_years ? `${user.experience_years} yrs` : "—"}
              />
              <Row
                k="Hourly Rate"
                v={user.hourly_rate_inr ? `₹${user.hourly_rate_inr.toLocaleString()}` : "—"}
              />
              <Row k="Available" v={user.is_available ? "Yes" : "No"} />
              <Row
                k="Skills"
                v={
                  <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                    {(user.skills || []).map((s: string) => (
                      <Badge key={s} variant="outline" className="text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                }
              />
              <Row k="Bio" v={<span className="text-right text-xs">{user.bio || "—"}</span>} />
              <Row
                k="GitHub"
                v={
                  user.github_url ? (
                    <a
                      className="text-accent"
                      href={user.github_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Link
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Row
                k="Portfolio"
                v={
                  user.portfolio_url ? (
                    <a
                      className="text-accent"
                      href={user.portfolio_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Link
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Row
                k="LinkedIn"
                v={
                  user.linkedin_url ? (
                    <a
                      className="text-accent"
                      href={user.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Link
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            </>
          ) : (
            <>
              <Row k="Company" v={user.company_name || "—"} />
              <Row k="Industry" v={user.industry || "—"} />
              <Row k="Location" v={user.location || "—"} />
              <Row
                k="Website"
                v={
                  user.company_website ? (
                    <a
                      className="text-accent"
                      href={user.company_website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Link
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Row
                k="About"
                v={<span className="text-right text-xs">{user.company_description || "—"}</span>}
              />
            </>
          )}
          <Row
            k="Suspended"
            v={user.is_suspended ? <Badge variant="destructive">Yes</Badge> : "No"}
          />
          <Row k="Joined" v={new Date(user.created_at).toLocaleString()} />

          {kind === "recruiter" && details && (
            <div className="border-t pt-3 mt-2 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Company Recruiters
                </h4>
                <div className="p-3 bg-muted/30 rounded-lg border text-xs space-y-1">
                  <p><strong>Primary Contact:</strong> {user.full_name || "—"}</p>
                  <p><strong>Email Address:</strong> {user.email || "—"}</p>
                  <p><strong>Phone Number:</strong> {user.phone || "—"}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Company Projects ({(details as any).companyProjects?.length || 0})
                </h4>
                {(details as any).companyProjects?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No projects posted yet.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-2 border rounded-lg p-2 bg-background">
                    {(details as any).companyProjects.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center text-xs p-1.5 hover:bg-muted/30 rounded border-b last:border-b-0">
                        <span className="font-bold truncate max-w-[180px]">{p.title}</span>
                        <Badge variant="outline" className="capitalize text-[10px] scale-90">{p.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Company Reviews ({(details as any).companyReviews?.length || 0})
                </h4>
                {(details as any).companyReviews?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No company reviews received yet.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-2 border rounded-lg p-2 bg-background">
                    {(details as any).companyReviews.map((r: any) => (
                      <div key={r.id} className="text-xs p-2 border-b last:border-b-0 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary">{r.reviewer_name}</span>
                          <span className="text-amber-500 font-bold">★ {r.rating} / 5</span>
                        </div>
                        {r.comment && <p className="text-muted-foreground text-[11px] italic">"{r.comment}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detailed Reminders Stats and Actions */}
          <div className="border-t pt-3 mt-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Reminder & Profile Status
            </h4>
            {isLoading ? (
              <div className="text-xs text-muted-foreground animate-pulse">
                Loading reminder details...
              </div>
            ) : details ? (
              <div className="space-y-2">
                <Row
                  k="Profile Completion"
                  v={
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{details.completionPercentage}%</span>
                      <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${details.completionPercentage === 100 ? "bg-success" : "bg-amber-500"}`}
                          style={{ width: `${details.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  }
                />
                <Row
                  k="Last Reminder Sent"
                  v={
                    details.lastReminderSentAt
                      ? new Date(details.lastReminderSentAt).toLocaleString()
                      : "Never"
                  }
                />
                <Row k="Reminder Count" v={details.remindersCount} />
                <Row
                  k="Last Login"
                  v={
                    details.lastSignInAt ? new Date(details.lastSignInAt).toLocaleString() : "Never"
                  }
                />
                <Row k="Registration Date" v={new Date(details.createdAt).toLocaleString()} />

                <div className="flex flex-wrap gap-2 pt-3 justify-end">
                  <Button
                    size="xs"
                    variant="outline"
                    className="text-xs flex items-center gap-1"
                    asChild
                  >
                    <Link
                      to={kind === "developer" ? "/developers/$devId" : "/recruiters/$recId"}
                      params={kind === "developer" ? { devId: user.id } : { recId: user.id }}
                      onClick={() => setOpen(false)}
                    >
                      <ExternalLink className="h-3 w-3" /> View Profile
                    </Link>
                  </Button>
                  <Button
                    size="xs"
                    variant={details.remindersDisabled ? "success" : "outline"}
                    className="text-xs"
                    onClick={handleToggleDisabled}
                  >
                    {details.remindersDisabled ? "Enable Reminders" : "Disable Reminders"}
                  </Button>
                  <Button
                    size="xs"
                    className="bg-gradient-accent text-xs flex items-center gap-1"
                    disabled={details.completionPercentage === 100 || details.remindersDisabled}
                    onClick={handleSendReminder}
                  >
                    <Mail className="h-3 w-3" /> Send Reminder
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-destructive">Failed to load reminder details.</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-2">
      <span className="text-muted-foreground text-xs uppercase font-semibold">{k}</span>
      <span className="font-medium text-right">{v}</span>
    </div>
  );
}

function RemindersTab() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Bulk action confirmation dialog state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkTarget, setBulkTarget] = useState<
    "selected" | "devs" | "recs" | "incomplete" | "google" | "manual" | null
  >(null);
  const [isSending, setIsSending] = useState(false);
  const [sendingResult, setSendingResult] = useState<{
    total: number;
    delivered: number;
    failed: number;
  } | null>(null);

  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-reminders-data"],
    queryFn: async () => {
      return getAdminReminderManagerData();
    },
  });

  const users = data?.users || [];
  const history = data?.history || [];
  const stats = data?.stats || {
    totalUsers: 0,
    totalDevelopers: 0,
    totalRecruiters: 0,
    completeProfiles: 0,
    incompleteProfiles: 0,
    completionRate: 0,
    sentToday: 0,
    pendingReminders: 0,
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      const matchesSearch =
        !search ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      // Filter
      switch (filter) {
        case "dev":
          return u.role === "developer";
        case "rec":
          return u.role === "recruiter";
        case "google":
          return u.isGoogle;
        case "manual":
          return !u.isGoogle;
        case "below30":
          return u.completionPercentage < 30;
        case "below50":
          return u.completionPercentage < 50;
        case "below80":
          return u.completionPercentage < 80;
        case "neverUpdated":
          return u.neverUpdated;
        case "neverLoggedInAgain":
          return u.neverLoggedInAgain;
        case "active":
          return u.isActive;
        case "inactive":
          return !u.isActive;
        default:
          return true;
      }
    });
  }, [users, search, filter]);

  // Filter history
  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      const matchesSearch =
        !historySearch ||
        h.userName?.toLowerCase().includes(historySearch.toLowerCase()) ||
        h.email?.toLowerCase().includes(historySearch.toLowerCase());

      if (!matchesSearch) return false;

      if (historyFilter !== "all" && h.emailStatus !== historyFilter) return false;
      return true;
    });
  }, [history, historySearch, historyFilter]);

  // Bulk target users calculation
  const bulkTargetUsers = useMemo(() => {
    if (bulkTarget === "selected") {
      return users.filter((u) => selectedUserIds.includes(u.id));
    }
    if (bulkTarget === "devs") {
      return users.filter((u) => u.role === "developer" && u.completionPercentage < 100);
    }
    if (bulkTarget === "recs") {
      return users.filter((u) => u.role === "recruiter" && u.completionPercentage < 100);
    }
    if (bulkTarget === "incomplete") {
      return users.filter((u) => u.completionPercentage < 100);
    }
    if (bulkTarget === "google") {
      return users.filter((u) => u.isGoogle && u.completionPercentage < 100);
    }
    if (bulkTarget === "manual") {
      return users.filter((u) => !u.isGoogle && u.completionPercentage < 100);
    }
    return [];
  }, [users, bulkTarget, selectedUserIds]);

  // Handle send bulk
  async function handleSendBulk() {
    if (!bulkTargetUsers.length || !currentUser?.email) return;
    setIsSending(true);
    try {
      const res = await sendBulkRemindersServerFn({
        data: {
          userIds: bulkTargetUsers.map((u) => u.id),
          adminEmail: currentUser.email,
        },
      });
      if (res.success) {
        setSendingResult({
          total: res.totalSent,
          delivered: res.delivered,
          failed: res.failed,
        });
        toast.success(`Sent bulk reminders to ${res.totalSent} users.`);
        qc.invalidateQueries({ queryKey: ["admin-reminders-data"] });
      } else {
        toast.error("Failed to send bulk reminders.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setIsSending(false);
    }
  }

  // Handle single send
  async function handleSendSingle(userId: string) {
    if (!currentUser?.email) return;
    const toastId = toast.loading("Sending profile reminder...");
    try {
      const res = await sendIndividualReminderServerFn({
        data: {
          userId,
          adminEmail: currentUser.email,
        },
      });
      if (res.success) {
        toast.success("Profile reminder sent successfully!", { id: toastId });
        qc.invalidateQueries({ queryKey: ["admin-reminders-data"] });
      } else {
        toast.error(res.error || "Failed to send profile reminder.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.", { id: toastId });
    }
  }

  // Handle toggle disable/enable reminders
  async function handleToggleDisabled(userId: string, currentVal: boolean) {
    try {
      const res = await toggleUserRemindersDisabledServerFn({
        data: {
          userId,
          disabled: !currentVal,
        },
      });
      if (res.success) {
        toast.success(`Reminders ${!currentVal ? "disabled" : "enabled"} for this user.`);
        qc.invalidateQueries({ queryKey: ["admin-reminders-data"] });
      } else {
        toast.error(res.error || "Failed to update reminder settings.");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    }
  }

  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((userId) => userId !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  if (error)
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        Failed to load reminder manager: {(error as Error).message}
      </div>
    );

  return (
    <div className="space-y-6">
      {/* 1. Dashboard Summary */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="bg-card">
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-muted rounded mb-2"></div>
                <div className="h-8 w-12 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Users"
            value={stats.totalUsers}
            desc="All registered users"
            icon={Users}
          />
          <SummaryCard
            title="Total Developers"
            value={stats.totalDevelopers}
            desc="Users with developer role"
            icon={UserRound}
          />
          <SummaryCard
            title="Total Recruiters"
            value={stats.totalRecruiters}
            desc="Users with recruiter role"
            icon={Briefcase}
          />
          <SummaryCard
            title="Profile Completion"
            value={`${stats.completionRate}%`}
            desc={`${stats.completeProfiles} complete, ${stats.incompleteProfiles} incomplete`}
            icon={ShieldCheck}
          />
          <SummaryCard
            title="Incomplete Profiles"
            value={stats.incompleteProfiles}
            desc="Need reminder attention"
            icon={AlertTriangle}
            className="text-amber-500"
          />
          <SummaryCard
            title="Sent Today"
            value={stats.sentToday}
            desc="Reminder emails successfully sent"
            icon={Mail}
            className="text-teal-500"
          />
          <SummaryCard
            title="Pending Reminders"
            value={stats.pendingReminders}
            desc="Incomplete & eligible for next stage"
            icon={Clock}
            className="text-accent"
          />
        </div>
      )}

      {/* Directory & History split */}
      <div className="space-y-6">
        <div className="flex flex-col gap-6">
          {/* User Reminders and Operations Card */}
          <Card className="bg-card">
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Profile Reminder Directory</CardTitle>
                  <CardDescription>
                    Manage, filter, and send individual or bulk reminder emails to users.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={bulkTarget || ""}
                    onValueChange={(val) => {
                      if (val) {
                        setBulkTarget(val as any);
                        setSendingResult(null);
                        setBulkDialogOpen(true);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[180px] bg-secondary text-secondary-foreground">
                      <SelectValue placeholder="Bulk Actions 📧" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected" disabled={!selectedUserIds.length}>
                        Send to Selected ({selectedUserIds.length})
                      </SelectItem>
                      <SelectItem value="devs">Send to All Incomplete Devs</SelectItem>
                      <SelectItem value="recs">Send to All Incomplete Recs</SelectItem>
                      <SelectItem value="incomplete">Send to All Incomplete Profiles</SelectItem>
                      <SelectItem value="google">Send to Google Signups</SelectItem>
                      <SelectItem value="manual">Send to Manual Signups</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Filter and Search Row */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    className="pl-9 bg-muted/30"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px] bg-muted/50">
                      <SelectValue placeholder="Filter by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="dev">Developers</SelectItem>
                      <SelectItem value="rec">Recruiters</SelectItem>
                      <SelectItem value="google">Google Signups</SelectItem>
                      <SelectItem value="manual">Manual Signups</SelectItem>
                      <SelectItem value="below30">Completion &lt; 30%</SelectItem>
                      <SelectItem value="below50">Completion &lt; 50%</SelectItem>
                      <SelectItem value="below80">Completion &lt; 80%</SelectItem>
                      <SelectItem value="neverUpdated">Never Updated Profile</SelectItem>
                      <SelectItem value="neverLoggedInAgain">Never Logged In Again</SelectItem>
                      <SelectItem value="active">Active (last 30d)</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Users Directory Table */}
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <Checkbox
                          checked={
                            filteredUsers.length > 0 &&
                            selectedUserIds.length === filteredUsers.length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="p-4">User</th>
                      <th className="p-4">Email / Role</th>
                      <th className="p-4">Completion %</th>
                      <th className="p-4">Reminder Stats</th>
                      <th className="p-4">Last Login</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-12 text-center animate-pulse text-muted-foreground"
                        >
                          Loading directory users...
                        </td>
                      </tr>
                    ) : !filteredUsers.length ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-muted-foreground">
                          No users found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4 text-center">
                            <Checkbox
                              checked={selectedUserIds.includes(u.id)}
                              onCheckedChange={() => toggleSelectUser(u.id)}
                            />
                          </td>
                          <td className="p-4">
                            <div className="font-bold flex items-center gap-1.5">
                              {u.full_name}
                              {u.isGoogle && (
                                <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-semibold">
                                  G
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
                              {u.id}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-muted-foreground">{u.email}</div>
                            <Badge variant="outline" className="capitalize text-[10px] mt-0.5">
                              {u.role}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs">{u.completionPercentage}%</span>
                              <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${u.completionPercentage === 100 ? "bg-success" : u.completionPercentage > 50 ? "bg-amber-500" : "bg-destructive"}`}
                                  style={{ width: `${u.completionPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">
                            <div>
                              Count:{" "}
                              <span className="font-semibold text-foreground">
                                {u.remindersCount}
                              </span>
                            </div>
                            <div className="text-[10px]">
                              Last:{" "}
                              {u.lastReminderSentAt
                                ? new Date(u.lastReminderSentAt).toLocaleDateString()
                                : "Never"}
                            </div>
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">
                            {u.lastSignInAt
                              ? new Date(u.lastSignInAt).toLocaleDateString()
                              : "Never"}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end items-center gap-1">
                              <ViewUserDialog
                                user={users.find((usr) => usr.id === u.id) as any}
                                kind={u.role as any}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Send Profile Reminder Immediately"
                                disabled={u.completionPercentage === 100 || u.remindersDisabled}
                                className="text-teal-500 hover:text-teal-600 disabled:opacity-30"
                                onClick={() => handleSendSingle(u.id)}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={
                                  u.remindersDisabled ? "Enable Reminders" : "Disable Reminders"
                                }
                                className={
                                  u.remindersDisabled ? "text-amber-500" : "text-muted-foreground"
                                }
                                onClick={() => handleToggleDisabled(u.id, u.remindersDisabled)}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 2. History Table Card */}
          <Card className="bg-card">
            <CardHeader className="pb-3 border-b">
              <CardTitle>Email Reminder History Log</CardTitle>
              <CardDescription>
                Comprehensive audit log of all system and manual profile reminder emails sent.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search history by recipient name or email..."
                    className="pl-9 bg-muted/30"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={historyFilter} onValueChange={setHistoryFilter}>
                    <SelectTrigger className="w-[180px] bg-muted/50">
                      <SelectValue placeholder="Delivery Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Logs</SelectItem>
                      <SelectItem value="sent">Sent Successfully</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="skipped_completed">Skipped (Completed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* History Table */}
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-4">Recipient</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Reminder Type</th>
                      <th className="p-4">Sent By</th>
                      <th className="p-4">Sent Date</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-12 text-center animate-pulse text-muted-foreground"
                        >
                          Loading history logs...
                        </td>
                      </tr>
                    ) : !filteredHistory.length ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-muted-foreground">
                          No history records found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.slice(0, 100).map((h) => (
                        <tr key={h.id} className="hover:bg-muted/10 transition-colors">
                          <td className="p-4">
                            <div className="font-bold">{h.userName}</div>
                            <div className="text-xs text-muted-foreground">{h.email}</div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="capitalize text-[10px]">
                              {h.role}
                            </Badge>
                          </td>
                          <td className="p-4 text-xs font-mono">
                            {h.reminderType === "automatic"
                              ? `Automatic (Day ${h.reminderStage})`
                              : "Manual"}
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">{h.sentBy}</td>
                          <td className="p-4 text-xs text-muted-foreground">
                            {new Date(h.sentAt).toLocaleString()}
                          </td>
                          <td className="p-4 text-right">
                            <Badge
                              className={
                                h.emailStatus === "sent"
                                  ? "bg-success/15 text-success hover:bg-success/20 border-0"
                                  : h.emailStatus === "failed"
                                    ? "bg-destructive/15 text-destructive hover:bg-destructive/20 border-0"
                                    : "bg-muted text-muted-foreground border-0"
                              }
                            >
                              {h.emailStatus === "sent"
                                ? "Sent Successfully"
                                : h.emailStatus === "failed"
                                  ? "Failed"
                                  : "Skipped (Completed)"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Confirm Bulk Profile Reminders</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {isSending ? (
              <div className="flex flex-col items-center justify-center p-6 space-y-3">
                <div className="h-8 w-8 rounded-full border-4 border-t-primary animate-spin"></div>
                <div className="text-sm font-semibold text-center">
                  Sending profile reminders...
                </div>
                <div className="text-xs text-muted-foreground">Please do not close this modal.</div>
              </div>
            ) : sendingResult ? (
              <div className="space-y-4">
                <div className="text-sm font-bold text-success text-center">
                  🎉 Bulk Reminders Complete!
                </div>
                <div className="grid grid-cols-3 gap-2 text-center p-4 bg-muted rounded-xl">
                  <div>
                    <div className="text-xs text-muted-foreground">Total Sent</div>
                    <div className="text-lg font-bold">{sendingResult.total}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground text-success">Delivered</div>
                    <div className="text-lg font-bold text-success">{sendingResult.delivered}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground text-destructive">Failed</div>
                    <div className="text-lg font-bold text-destructive">{sendingResult.failed}</div>
                  </div>
                </div>
                {sendingResult.failed > 0 && (
                  <Button
                    variant="outline"
                    className="w-full text-xs text-destructive border-destructive/20 hover:bg-destructive/10"
                    onClick={() => {
                      setSendingResult(null);
                      handleSendBulk();
                    }}
                  >
                    Retry Failed Reminders
                  </Button>
                )}
              </div>
            ) : (
              <>
                <p className="text-sm">
                  Send reminder emails to{" "}
                  <strong className="text-foreground">{bulkTargetUsers.length} users</strong>?
                </p>
                <div className="p-3 bg-muted rounded-xl text-xs space-y-1 font-mono text-muted-foreground">
                  <div>
                    Target Group:{" "}
                    <span className="text-foreground capitalize font-bold">
                      {bulkTarget === "devs"
                        ? "Incomplete Developers"
                        : bulkTarget === "recs"
                          ? "Incomplete Recruiters"
                          : bulkTarget}
                    </span>
                  </div>
                  <div>
                    Eligible Recipients:{" "}
                    <span className="text-foreground font-bold">{bulkTargetUsers.length}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Reminders will be sent immediately using the standard Resend email template. Any
                  users with reminders disabled or 100% complete profiles are automatically
                  bypassed.
                </p>
              </>
            )}
          </div>
          {!isSending && !sendingResult && (
            <DialogFooter className="flex sm:justify-between gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setBulkDialogOpen(false);
                  setBulkTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button className="bg-gradient-accent" onClick={handleSendBulk}>
                Send Emails
              </Button>
            </DialogFooter>
          )}
          {sendingResult && (
            <DialogFooter>
              <Button
                onClick={() => {
                  setBulkDialogOpen(false);
                  setBulkTarget(null);
                  setSendingResult(null);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  desc,
  icon: Icon,
  className = "",
  children,
}: {
  title: string;
  value: any;
  desc: string;
  icon: any;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="bg-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <Icon className={`h-5 w-5 text-muted-foreground ${className}`} />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-display font-bold">{value}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{desc}</p>
        {children}
      </CardContent>
    </Card>
  );
}
