import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldCheck, ExternalLink, CheckCircle2, XCircle, Clock,
  Users, Search, Download, Edit2, BarChart3, TrendingUp, AlertTriangle, UserMinus, UserCheck,
  LayoutDashboard, Briefcase, FileText, Send, UserRound, MessageSquare, Bell, Trash2, Star, Eye, Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie } from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel | DeveloperConnect" },
      { name: "robots", content: "noindex, nofollow" }
    ]
  }),
  component: AdminPage,
});

type TabView = "overview" | "developers" | "recruiters" | "projects" | "applications" | "contacts" | "invites" | "chats" | "alerts";

function AdminPage() {
  const { user, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabView>("overview");

  if (loading) return <div className="flex h-screen items-center justify-center font-display font-medium text-muted-foreground animate-pulse">Initializing Admin...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-10 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
        <h1 className="font-display text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">Admin privileges required.</p>
        <Button asChild className="mt-6"><Link to="/">Return Home</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card hidden lg:block">
        <div className="flex h-16 items-center px-6 border-b">
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-accent text-primary-foreground shadow-glow">D</div>
            <span>AdminPanel</span>
          </Link>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-64px)]">
          <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Management</div>
          <SidebarItem icon={UserRound} label="Developers" active={activeTab === "developers"} onClick={() => setActiveTab("developers")} />
          <SidebarItem icon={Briefcase} label="Recruiters" active={activeTab === "recruiters"} onClick={() => setActiveTab("recruiters")} />
          <SidebarItem icon={FileText} label="Projects" active={activeTab === "projects"} onClick={() => setActiveTab("projects")} />
          <SidebarItem icon={Star} label="Applications" active={activeTab === "applications"} onClick={() => setActiveTab("applications")} />
          <SidebarItem icon={Users} label="Contact Requests" active={activeTab === "contacts"} onClick={() => setActiveTab("contacts")} />
          <SidebarItem icon={Send} label="Invites" active={activeTab === "invites"} onClick={() => setActiveTab("invites")} />
          <SidebarItem icon={MessageSquare} label="Chats" active={activeTab === "chats"} onClick={() => setActiveTab("chats")} />
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">System</div>
          <SidebarItem icon={Bell} label="Alerts" active={activeTab === "alerts"} onClick={() => setActiveTab("alerts")} />
          <SidebarItem icon={ExternalLink} label="Main Site" onClick={() => window.open('/', '_blank')} />
        </nav>
      </aside>

      <main className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-card/80 px-6 backdrop-blur-xl">
          <h2 className="font-display text-lg font-bold capitalize">{activeTab.replace('_', ' ')}</h2>
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => setActiveTab("alerts")} className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive animate-pulse" />
             </Button>
             <div className="hidden sm:flex items-center gap-3 pr-2 border-r">
                <div className="text-right">
                  <p className="text-xs font-bold leading-none">{user.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-muted-foreground">Platform Admin</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-accent text-primary-foreground flex items-center justify-center text-xs font-bold">AD</div>
             </div>
          </div>
        </header>

        <div className="p-6 overflow-y-auto">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "developers" && <DevelopersTab />}
          {activeTab === "recruiters" && <RecruitersTab />}
          {activeTab === "projects" && <ProjectsTab />}
          {activeTab === "applications" && <ApplicationsTab />}
          {activeTab === "contacts" && <ContactsTab />}
          {activeTab === "invites" && <InvitesTab />}
          {activeTab === "chats" && <ChatsTab />}
          {activeTab === "alerts" && <AlertsTab />}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

// --- OVERVIEW ---
function OverviewTab() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats-full"],
    queryFn: async () => {
      const [devs, recs, projs, apps, invites, contacts] = await Promise.all([
        supabase.from("developer_profiles").select("id", { count: "exact", head: true }),
        supabase.from("recruiter_profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("applications").select("id", { count: "exact", head: true }),
        supabase.from("invites").select("id", { count: "exact", head: true }),
        supabase.from("contact_access_requests").select("id", { count: "exact", head: true }),
      ]);
      const [vDevs, vRecs] = await Promise.all([
        supabase.from("developer_profiles").select("id", { count: "exact", head: true }).eq("is_verified", true),
        supabase.from("recruiter_profiles").select("id", { count: "exact", head: true }).eq("is_verified", true),
      ]);
      return { devs: devs.count || 0, recs: recs.count || 0, projs: projs.count || 0, apps: apps.count || 0, invites: invites.count || 0, contacts: contacts.count || 0, vDevs: vDevs.count || 0, vRecs: vRecs.count || 0 };
    }
  });

  const chartData = [ { name: "Mon", u: 40, p: 12 }, { name: "Tue", u: 65, p: 18 }, { name: "Wed", u: 58, p: 15 }, { name: "Thu", u: 82, p: 25 }, { name: "Fri", u: 74, p: 20 }, { name: "Sat", u: 45, p: 10 }, { name: "Sun", u: 52, p: 14 } ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Developers" value={stats?.devs || 0} sub={`${stats?.vDevs} verified`} icon={UserRound} trend="+12%" />
        <StatCard label="Total Recruiters" value={stats?.recs || 0} sub={`${stats?.vRecs} verified`} icon={Briefcase} trend="+5%" />
        <StatCard label="Active Projects" value={stats?.projs || 0} sub="Open for hire" icon={FileText} color="text-success" />
        <StatCard label="Pending Tasks" value={(stats?.devs || 0) - (stats?.vDevs || 0)} sub="Verification required" icon={AlertTriangle} color="text-amber-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Platform Growth</CardTitle><CardDescription>Daily active users and new projects</CardDescription></CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                  <defs><linearGradient id="gU" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/><stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="u" name="Users" stroke="#0ea5e9" fill="url(#gU)" strokeWidth={2} />
                  <Area type="monotone" dataKey="p" name="Projects" stroke="#10b981" fill="transparent" strokeWidth={2} />
               </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
           <CardHeader><CardTitle>Hiring Tech</CardTitle></CardHeader>
           <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{n:'React',v:45},{n:'Node',v:30},{n:'Python',v:25}]} dataKey="v" nameKey="n" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                    <Cell fill="#0ea5e9" /><Cell fill="#8b5cf6" /><Cell fill="#10b981" />
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
    </div>
  );
}

function StatCard({ label, value, icon: Icon, sub, trend, color }: { label: string; value: number; icon: any; sub?: string; trend?: string; color?: string }) {
  return (
    <Card><CardContent className="p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between"><div className={`p-2 rounded-lg bg-muted/50 ${color || "text-muted-foreground"}`}><Icon className="h-4 w-4" /></div>{trend && <Badge variant="outline" className="text-[10px] text-success border-success/20">+{trend}</Badge>}</div>
      <div className="mt-2"><p className="text-2xl font-bold">{value.toLocaleString()}</p><p className="text-xs font-medium text-muted-foreground">{label}</p></div>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </CardContent></Card>
  );
}

function VisitorAnalytics() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Global Traffic</CardTitle><CardDescription>Real-time visitors and device share.</CardDescription></div><div className="flex gap-2"><Badge variant="outline" className="bg-success/5 text-success">Live: 42 users</Badge></div></CardHeader>
      <CardContent><div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <AnalyticsMini title="Unique Visitors" val="4.2k" p={70} color="bg-accent" />
          <AnalyticsMini title="Avg. Duration" val="5m 12s" p={45} color="bg-success" />
          <AnalyticsMini title="Mobile Users" val="28%" p={28} color="bg-blue-500" />
          <AnalyticsMini title="Desktop Users" val="72%" p={72} color="bg-amber-500" />
      </div></CardContent>
    </Card>
  );
}
function AnalyticsMini({title,val,p,color}:{title:string,val:string,p:number,color:string}) {
  return (<div><p className="text-xs text-muted-foreground font-medium">{title}</p><p className="text-xl font-bold mt-1">{val}</p><div className="h-1 w-full bg-muted rounded-full mt-2 overflow-hidden"><div className={`h-full ${color}`} style={{width:`${p}%`}}></div></div></div>);
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
                <span className="text-muted-foreground">{item.visitors.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${(item.visitors / 4200) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[10px] text-destructive font-medium">{item.bounce}% exit</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivity() {
  const activities = [
    { user: "Sarah K.", action: "applied for", target: "React Lead", time: "2m ago", type: "app" },
    { user: "TechFlow", action: "posted", target: "Backend Dev", time: "15m ago", type: "proj" },
    { user: "Rahul M.", action: "verified as", target: "Developer", time: "1h ago", type: "verif" },
    { user: "CloudScale", action: "requested", target: "Contact Access", time: "3h ago", type: "contact" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Live platform events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((a, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className={`h-2 w-2 rounded-full ${a.type === 'app' ? 'bg-blue-500' : a.type === 'proj' ? 'bg-success' : a.type === 'verif' ? 'bg-accent' : 'bg-amber-500'}`} />
              <div className="flex-1">
                <span className="font-bold">{a.user}</span> {a.action} <span className="font-medium text-muted-foreground">{a.target}</span>
              </div>
              <div className="text-[10px] text-muted-foreground uppercase">{a.time}</div>
            </div>
          ))}
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground mt-2">View Full Audit Log</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- DEVELOPERS ---
function DevelopersTab() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const qc = useQueryClient();
  const { data: devs, isLoading } = useQuery({ queryKey: ["admin-developers"], queryFn: async () => { const { data } = await supabase.from("developer_profiles").select("*").order("created_at", { ascending: false }); return data || []; } });
  const filtered = devs?.filter(d => (!search || d.full_name?.toLowerCase().includes(search.toLowerCase())) && (filter === "all" || (filter === "verified" && d.is_verified) || (filter === "unverified" && !d.is_verified)));

  async function toggleVerify(id: string, current: boolean) {
    const { error } = await supabase.from("developer_profiles").update({ is_verified: !current } as any).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Unverified" : "Verified");
      qc.invalidateQueries({ queryKey: ["admin-developers"] });
    }
  }

  const exportCSV = () => {
    const headers = ["Name", "Email", "Headline", "Skills", "Exp", "Location", "Verified", "Joined"];
    const rows = filtered?.map(d => [d.full_name, d.email || 'N/A', d.headline, (d.skills || []).join("|"), d.experience_years, d.location, d.is_verified, d.created_at]) || [];
    const content = [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    link.download = "developers_export.csv";
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search developers by name..." className="pl-9 bg-card" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="verified">Verified</SelectItem><SelectItem value="unverified">Unverified</SelectItem></SelectContent></Select>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Export</Button>
        </div>
      </div>
      <div className="rounded-xl border bg-card overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground"><tr><th className="p-4">Developer</th><th className="p-4">Status</th><th className="p-4">Location</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y">
        {isLoading ? <tr><td colSpan={4} className="p-12 text-center animate-pulse">Loading talent pool...</td></tr> : filtered?.map(d => (
          <tr key={d.id} className="hover:bg-muted/30">
            <td className="p-4"><div><p className="font-bold">{d.full_name || "Anonymous"}</p><p className="text-xs text-muted-foreground truncate max-w-[250px]">{d.headline}</p></div></td>
            <td className="p-4">
              <button onClick={() => toggleVerify(d.id, d.is_verified)}>
                {d.is_verified ? <Badge className="bg-success/10 text-success border-success/20 cursor-pointer hover:bg-success/20 transition-colors"><CheckCircle2 className="mr-1 h-3 w-3" /> Verified</Badge> : <Badge variant="secondary" className="cursor-pointer hover:bg-muted transition-colors"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>}
              </button>
            </td>
            <td className="p-4 text-muted-foreground">{d.location || "Remote"}</td>
            <td className="p-4 text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" asChild title="View Profile"><Link to="/developers/" params={{ devId: d.id }}><Eye className="h-4 w-4" /></Link></Button><EditDeveloperDialog developer={d} user={{id: d.id}} onUpdate={() => qc.invalidateQueries({ queryKey: ["admin-developers"] })} /><Button variant="ghost" size="icon" className="text-destructive" title="Delete Profile"><Trash2 className="h-4 w-4" /></Button></div></td>
          </tr>
        ))}
      </tbody></table></div>
    </div>
  );
}

// --- RECRUITERS ---
function RecruitersTab() {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const { data: recs, isLoading } = useQuery({ queryKey: ["admin-recruiters"], queryFn: async () => { const { data } = await supabase.from("recruiter_profiles").select("*").order("created_at", { ascending: false }); return data || []; } });
  const filtered = recs?.filter(r => !search || r.company_name?.toLowerCase().includes(search.toLowerCase()));

  async function toggleVerify(id: string, current: boolean) {
    const { error } = await supabase.from("recruiter_profiles").update({ is_verified: !current } as any).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(current ? "Unverified" : "Verified");
      qc.invalidateQueries({ queryKey: ["admin-recruiters"] });
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search recruiters..." className="pl-9 bg-card" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="rounded-xl border bg-card overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground"><tr><th className="p-4">Company</th><th className="p-4">Status</th><th className="p-4">Industry</th><th className="p-4 text-right">Actions</th></tr></thead><tbody className="divide-y">
        {isLoading ? <tr><td colSpan={5} className="p-12 text-center animate-pulse">Loading partners...</td></tr> : filtered?.map(r => (
          <tr key={r.id}>
            <td className="p-4"><div className="font-bold">{r.company_name}</div><div className="text-xs text-muted-foreground">{r.full_name}</div></td>
            <td className="p-4">
              <button onClick={() => toggleVerify(r.id, r.is_verified)}>
                {r.is_verified ? <Badge className="bg-success/10 text-success border-success/20 cursor-pointer hover:bg-success/20 transition-colors"><CheckCircle2 className="mr-1 h-3 w-3" /> Verified</Badge> : <Badge variant="secondary" className="cursor-pointer hover:bg-muted transition-colors"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>}
              </button>
            </td>
            <td className="p-4 text-muted-foreground">{r.industry || 'Tech'}</td>
            <td className="p-4 text-right"><div className="flex justify-end gap-1"><EditRecruiterDialog recruiter={r} user={{id: r.id}} onUpdate={() => qc.invalidateQueries({ queryKey: ["admin-recruiters"] })} /><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></div></td>
          </tr>
        ))}
      </tbody></table></div>
    </div>
  );
}

// --- PROJECTS ---
function ProjectsTab() {
  const qc = useQueryClient();
  const { data: projs, isLoading } = useQuery({ queryKey: ["admin-projects"], queryFn: async () => { const { data } = await supabase.from("projects").select("*, recruiter_profiles(company_name)").order("created_at", { ascending: false }); return data || []; } });
  async function toggleFeatured(id: string, current: boolean) { const { error } = await supabase.from("projects").update({ is_featured: !current } as any).eq("id", id); if (error) toast.error(error.message); else { toast.success("Featured status updated"); qc.invalidateQueries({ queryKey: ["admin-projects"] }); } }
  return (
    <div className="grid gap-4 md:grid-cols-2">{isLoading ? <p>Loading projects...</p> : projs.map(p => (
      <Card key={p.id} className={p.is_featured ? "border-accent ring-1 ring-accent/20" : ""}>
        <CardHeader className="p-4 pb-2"><div className="flex justify-between items-start"><Badge variant="secondary" className="capitalize">{p.status}</Badge><div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => toggleFeatured(p.id, p.is_featured)}><Star className={`h-4 w-4 ${p.is_featured ? "fill-accent text-accent" : ""}`} /></Button><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></div></div><CardTitle className="text-base mt-2 line-clamp-1">{p.title}</CardTitle><CardDescription>{(p.recruiter_profiles as any)?.company_name}</CardDescription></CardHeader>
        <CardContent className="p-4 pt-0 flex justify-between items-center mt-2"><span className="text-xs font-bold text-accent">Budget: ₹{p.budget_min_inr?.toLocaleString()}</span><Button variant="link" size="sm" asChild className="p-0 h-auto"><Link to="/projects/" params={{ projectId: p.id }}>Details →</Link></Button></CardContent>
      </Card>
    ))}</div>
  );
}

// --- APPLICATIONS ---
function ApplicationsTab() {
  const { data: apps, isLoading } = useQuery({ queryKey: ["admin-applications"], queryFn: async () => { const { data } = await supabase.from("applications").select("*, projects(title), developer_profiles(full_name)").order("created_at", { ascending: false }); return data || []; } });
  return (
    <div className="rounded-xl border bg-card overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-muted/50 border-b text-xs font-semibold uppercase text-muted-foreground"><tr><th className="p-4">Project</th><th className="p-4">Developer</th><th className="p-4">Status</th></tr></thead><tbody className="divide-y">{isLoading ? <tr><td colSpan={3} className="p-10 text-center animate-pulse">Loading...</td></tr> : apps.map(a => (
      <tr key={a.id}><td className="p-4 font-medium truncate max-w-[200px]">{(a.projects as any)?.title}</td><td className="p-4">{(a.developer_profiles as any)?.full_name}</td><td className="p-4"><Badge variant="outline">{a.status}</Badge></td></tr>
    ))}</tbody></table></div>
  );
}

// --- CONTACTS ---
function ContactsTab() {
  const { data: contacts, isLoading } = useQuery({ queryKey: ["admin-contacts"], queryFn: async () => { const { data } = await supabase.from("contact_access_requests").select("*").order("created_at", { ascending: false }); return data || []; } });
  return (<div className="grid gap-4 sm:grid-cols-2">{isLoading ? <p>Loading requests...</p> : contacts.map(c => (<Card key={c.id}><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm font-bold">Request: {c.id.slice(0,8)}</p><p className="text-xs text-muted-foreground">Status: {c.status}</p></div><Badge className={c.status === 'approved' ? 'bg-success text-success-foreground' : ''}>{c.status}</Badge></CardContent></Card>))}</div>);
}

// --- INVITES ---
function InvitesTab() {
  const { data: invites, isLoading } = useQuery({ queryKey: ["admin-invites"], queryFn: async () => { const { data } = await supabase.from("invites").select("*, projects(title)").order("created_at", { ascending: false }); return data || []; } });
  return (<div className="rounded-xl border bg-card overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-muted/50 border-b text-xs font-semibold uppercase text-muted-foreground"><tr><th className="p-4">Project</th><th className="p-4">Status</th><th className="p-4">Created</th></tr></thead><tbody className="divide-y">{isLoading ? <tr><td colSpan={3} className="p-10 text-center">Loading...</td></tr> : invites.map(i => (<tr key={i.id}><td className="p-4 font-medium">{(i.projects as any)?.title}</td><td className="p-4"><Badge variant="outline">{i.status}</Badge></td><td className="p-4 text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</td></tr>))}</tbody></table></div>);
}

// --- CHATS ---
function ChatsTab() {
  const { data: messages, isLoading } = useQuery({ queryKey: ["admin-chats"], queryFn: async () => { const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(100); return data || []; } });
  return (<div className="space-y-4"><div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200"><AlertTriangle className="h-4 w-4" /><p className="text-xs font-medium">Platform-wide chat monitoring enabled for safety.</p></div><div className="space-y-2">{isLoading ? <p>Loading logs...</p> : messages.map(m => (<div key={m.id} className="p-3 rounded-lg border bg-card text-xs flex justify-between items-start gap-4"><div><span className="font-bold text-accent">{m.sender_id.slice(0,8)}</span>: {m.content}</div><span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(m.created_at).toLocaleTimeString()}</span></div>))}</div></div>);
}

// --- ALERTS ---
function AlertsTab() {
  const { data: alerts, isLoading } = useQuery({ queryKey: ["admin-alerts"], queryFn: async () => { const { data } = await supabase.from("admin_alerts").select("*").order("created_at", { ascending: false }).limit(50); return data || []; } });
  return (<div className="max-w-2xl mx-auto space-y-3">{isLoading ? <p>Loading alerts...</p> : alerts?.map(a => (<div key={a.id} className="flex gap-4 p-4 rounded-xl border bg-card shadow-sm"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">{a.type === 'registration' ? <UserRound className="h-5 w-5" /> : <Bell className="h-5 w-5" />}</div><div className="flex-1"><div className="flex items-center justify-between"><h4 className="font-bold text-sm">{a.title}</h4><span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span></div><p className="text-xs text-muted-foreground mt-1">{a.message}</p></div></div>))}</div>);
}

// --- MODALS ---
function EditDeveloperDialog({ developer, user, onUpdate }: { developer: any; user: any; onUpdate: () => void }) {
  const [form, setForm] = useState({
    full_name: developer.full_name || "",
    headline: developer.headline || "",
    skills: (developer.skills || []).join(", "),
    is_verified: developer.is_verified || false,
    bio: developer.bio || "",
    location: developer.location || "",
    hourly_rate_inr: developer.hourly_rate_inr || 0,
    experience_years: developer.experience_years || 0
  });
  const [open, setOpen] = useState(false);
  async function handleSave() {
    const { error } = await supabase.from("developer_profiles").update({
      full_name: form.full_name,
      headline: form.headline,
      skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      is_verified: form.is_verified,
      bio: form.bio,
      location: form.location,
      hourly_rate_inr: form.hourly_rate_inr,
      experience_years: form.experience_years
    }).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Profile Updated"); setOpen(false); onUpdate(); }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="icon" title="Edit Profile"><Edit2 className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Moderate Developer Profile</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
            <div className="space-y-1"><Label>Location</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
          </div>
          <div className="space-y-1"><Label>Headline</Label><Input value={form.headline} onChange={e => setForm({...form, headline: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Hourly Rate (INR)</Label><Input type="number" value={form.hourly_rate_inr} onChange={e => setForm({...form, hourly_rate_inr: parseInt(e.target.value) || 0})} /></div>
            <div className="space-y-1"><Label>Exp. Years</Label><Input type="number" value={form.experience_years} onChange={e => setForm({...form, experience_years: parseInt(e.target.value) || 0})} /></div>
          </div>
          <div className="space-y-1"><Label>Skills (comma separated)</Label><Input value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} /></div>
          <div className="space-y-1"><Label>Bio</Label><Textarea className="h-32" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} /></div>
          <div className="flex items-center space-x-2 pt-2"><Checkbox id="v" checked={form.is_verified} onCheckedChange={v => setForm({...form, is_verified: !!v})} /><Label htmlFor="v" className="font-bold text-success">Verified Badge Active</Label></div>
        </div>
        <DialogFooter><Button onClick={handleSave} className="w-full">Save Changes</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditRecruiterDialog({ recruiter, user, onUpdate }: { recruiter: any; user: any; onUpdate: () => void }) {
  const [form, setForm] = useState({
    company_name: recruiter.company_name || "",
    is_verified: recruiter.is_verified || false,
    industry: recruiter.industry || "",
    location: recruiter.location || "",
    company_description: recruiter.company_description || "",
    company_website: recruiter.company_website || ""
  });
  const [open, setOpen] = useState(false);
  async function handleSave() {
    const { error } = await supabase.from("recruiter_profiles").update({
      company_name: form.company_name,
      is_verified: form.is_verified,
      industry: form.industry,
      location: form.location,
      company_description: form.company_description,
      company_website: form.company_website
    }).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Company Updated"); setOpen(false); onUpdate(); }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="icon" title="Edit Company"><Edit2 className="h-4 w-4" /></Button></DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>Moderate Company Profile</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Company Name</Label><Input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} /></div>
            <div className="space-y-1"><Label>Industry</Label><Input value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} /></div>
          </div>
          <div className="space-y-1"><Label>Location</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
          <div className="space-y-1"><Label>Website</Label><Input value={form.company_website} onChange={e => setForm({...form, company_website: e.target.value})} /></div>
          <div className="space-y-1"><Label>Description</Label><Textarea className="h-24" value={form.company_description} onChange={e => setForm({...form, company_description: e.target.value})} /></div>
          <div className="flex items-center space-x-2 pt-2"><Checkbox id="rv" checked={form.is_verified} onCheckedChange={v => setForm({...form, is_verified: !!v})} /><Label htmlFor="rv" className="font-bold text-success">Verified Company Badge</Label></div>
        </div>
        <DialogFooter><Button onClick={handleSave} className="w-full">Save Changes</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
