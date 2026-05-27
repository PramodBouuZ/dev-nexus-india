import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldCheck, ExternalLink, CheckCircle2, XCircle, Clock,
  Users, Search, Download, Edit2, BarChart3, TrendingUp, AlertTriangle, UserMinus, UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { DocumentChecklist } from "@/components/DocumentChecklist";
import { StatusTimeline } from "@/components/StatusTimeline";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | DeveloperConnect" },
      { name: "robots", content: "noindex, nofollow" }
    ]
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  if (role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 mx-auto max-w-2xl p-10 text-center">
          <h1 className="font-display text-2xl font-bold">Admin only</h1>
          <p className="mt-2 text-muted-foreground">You don't have access to this page.</p>
        </main>
        <Footer />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Manage platform users, moderate profiles, and monitor growth.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/"><ExternalLink className="mr-2 h-4 w-4" /> View Site</Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-4">
            <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4" /> Analytics</TabsTrigger>
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" /> User Management</TabsTrigger>
            <TabsTrigger value="verifications"><ShieldCheck className="mr-2 h-4 w-4" /> Verifications</TabsTrigger>
            <TabsTrigger value="projects"><Clock className="mr-2 h-4 w-4" /> Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6 space-y-6">
            <PlatformStats />
            <ActivityChart />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="verifications" className="mt-6">
            <VerificationQueue adminId={user.id} />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="mt-4 text-lg font-medium">Project Moderation</h3>
              <p className="text-sm text-muted-foreground">Coming soon: Advanced project flagging and approval system.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

// --- ANALYTICS ---

function PlatformStats() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [devs, recs, projs, contracts, pending] = await Promise.all([
        supabase.from("developer_profiles").select("id", { count: "exact", head: true }),
        supabase.from("recruiter_profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("contracts").select("id", { count: "exact", head: true }),
        supabase.from("verification_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      const [vDevs, vRecs] = await Promise.all([
        supabase.from("developer_profiles").select("id", { count: "exact", head: true }).eq("is_verified", true),
        supabase.from("recruiter_profiles").select("id", { count: "exact", head: true }).eq("is_verified", true),
      ]);

      return {
        devs: devs.count ?? 0,
        recs: recs.count ?? 0,
        projs: projs.count ?? 0,
        contracts: contracts.count ?? 0,
        pending: pending.count ?? 0,
        verifiedDevs: vDevs.count ?? 0,
        verifiedRecs: vRecs.count ?? 0,
      };
    },
  });

  if (!data) return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
    </div>
  );

  const stats = [
    { label: "Total Developers", value: data.devs, sub: `${data.verifiedDevs} verified`, icon: Users },
    { label: "Total Recruiters", value: data.recs, sub: `${data.verifiedRecs} verified`, icon: ShieldCheck },
    { label: "Active Projects", value: data.projs, sub: "Open for applications", icon: TrendingUp },
    { label: "Pending Verifications", value: data.pending, sub: "Action required", icon: AlertTriangle, color: "text-amber-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map(s => (
        <Card key={s.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
            <s.icon className={`h-4 w-4 ${s.color || "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ActivityChart() {
  // Simulated data for demonstration
  const data = [
    { day: "Mon", users: 45, engagements: 12 },
    { day: "Tue", users: 52, engagements: 18 },
    { day: "Wed", users: 48, engagements: 15 },
    { day: "Thu", users: 61, engagements: 22 },
    { day: "Fri", users: 55, engagements: 20 },
    { day: "Sat", users: 38, engagements: 8 },
    { day: "Sun", users: 42, engagements: 10 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Activity</CardTitle>
        <CardDescription>Growth in user signups and project engagements over the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.6 0.18 250)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="oklch(0.6 0.18 250)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.2 0 0 / 0.1)" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "oklch(0.5 0 0)" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "oklch(0.5 0 0)" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "oklch(1 0 0)", borderRadius: "8px", border: "1px solid oklch(0.9 0 0)" }}
              />
              <Area type="monotone" dataKey="users" stroke="oklch(0.6 0.18 250)" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
              <Area type="monotone" dataKey="engagements" stroke="oklch(0.7 0.15 190)" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// --- USER MANAGEMENT ---

function UserManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, email, role, created_at, is_suspended")
        .order("created_at", { ascending: false });

      const ids = profs?.map(p => p.id) ?? [];
      const [devs, recs] = await Promise.all([
        supabase.from("developer_profiles").select("id, is_verified, headline, phone, skills, full_name").in("id", ids),
        supabase.from("recruiter_profiles").select("id, is_verified, company_name, industry, full_name").in("id", ids),
      ]);

      return profs?.map(p => {
        const dev = devs?.find(d => d.id === p.id);
        const rec = recs?.find(r => r.id === p.id);
        return {
          ...p,
          full_name: dev?.full_name || rec?.full_name || "N/A",
          developer: dev || null,
          recruiter: rec || null,
        };
      }) || [];
    }
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => {
      const matchesSearch = !search ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.developer?.headline?.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === "all" || u.role === roleFilter;

      let matchesStatus = true;
      if (statusFilter === "verified") matchesStatus = u.developer?.is_verified === true || u.recruiter?.is_verified === true;
      if (statusFilter === "unverified") matchesStatus = !(u.developer?.is_verified || u.recruiter?.is_verified);
      if (statusFilter === "suspended") matchesStatus = u.is_suspended === true;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const exportCSV = () => {
    if (!filteredUsers.length) return;
    const headers = ["ID", "Name", "Email", "Role", "Joined", "Verified", "Suspended"];
    const rows = filteredUsers.map(u => [
      u.id,
      u.full_name || "N/A",
      u.email || "N/A",
      u.role || "N/A",
      new Date(u.created_at).toLocaleDateString(),
      (u.developer?.is_verified || u.recruiter?.is_verified) ? "Yes" : "No",
      u.is_suspended ? "Yes" : "No"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `developerconnect_users_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function toggleSuspension(id: string, current: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: !current } as any)
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(current ? "User account reinstated" : "User account suspended");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email or headline..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="developer">Developers</SelectItem>
              <SelectItem value="recruiter">Recruiters</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users found matching your filters.</td></tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className={u.is_suspended ? "bg-muted/20" : ""}>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{u.full_name || "N/A"}</span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(u.developer?.is_verified || u.recruiter?.is_verified) && (
                          <Badge className="bg-success/10 text-success border-success/20">
                            <ShieldCheck className="mr-1 h-3 w-3" /> Verified
                          </Badge>
                        )}
                        {u.is_suspended && (
                          <Badge variant="destructive">Suspended</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {u.role === "developer" && u.developer && (
                          <EditDeveloperDialog developer={u.developer} user={u} onUpdate={() => qc.invalidateQueries({ queryKey: ["admin-users"] })} />
                        )}
                        {u.role === "recruiter" && u.recruiter && (
                           <EditRecruiterDialog recruiter={u.recruiter} user={u} onUpdate={() => qc.invalidateQueries({ queryKey: ["admin-users"] })} />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={u.is_suspended ? "text-success hover:text-success hover:bg-success/10" : "text-destructive hover:text-destructive hover:bg-destructive/10"}
                          onClick={() => toggleSuspension(u.id, u.is_suspended || false)}
                          title={u.is_suspended ? "Reinstate User" : "Suspend User"}
                        >
                          {u.is_suspended ? <UserCheck className="h-4 w-4" /> : <UserMinus className="h-4 w-4" />}
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
    </div>
  );
}

// --- VERIFICATIONS ---

function VerificationQueue({ adminId }: { adminId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-vr-queue"],
    queryFn: async () => {
      const { data: reqs } = await supabase
        .from("verification_requests")
        .select("*")
        .order("created_at", { ascending: true });
      if (!reqs?.length) return [];
      const ids = [...new Set(reqs.map(r => r.developer_id))];
      const { data: devs } = await supabase.from("developer_profiles").select("id, headline, skills, experience_years, full_name").in("id", ids);

      return reqs.map(r => ({
        ...r,
        dev: devs?.find(d => d.id === r.developer_id) ?? null,
      }));
    },
  });

  const pending = data?.filter(r => r.status === "pending") ?? [];
  const recent = data?.filter(r => r.status !== "pending").slice(0, 20) ?? [];

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading queue...</p>;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Pending ({pending.length})</h2>
        </div>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No pending requests. 🎉</p>
        ) : (
          <div className="mt-4 space-y-3">
            {pending.map(r => <RequestCard key={r.id} request={r} adminId={adminId} onChange={() => qc.invalidateQueries({ queryKey: ["admin-vr-queue"] })} />)}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-semibold">Recently reviewed</h2>
          <div className="mt-4 space-y-3">
            {recent.map(r => <RequestCard key={r.id} request={r} adminId={adminId} onChange={() => qc.invalidateQueries({ queryKey: ["admin-vr-queue"] })} compact />)}
          </div>
        </section>
      )}
    </div>
  );
}

function RequestCard({ request, adminId, onChange, compact = false }: { request: any; adminId: string; onChange: () => void; compact?: boolean }) {
  const [adminNotes, setAdminNotes] = useState(request.admin_notes ?? "");
  const [busy, setBusy] = useState(false);

  async function decide(status: "approved" | "rejected") {
    setBusy(true);
    const { error } = await supabase
      .from("verification_requests")
      .update({
        status,
        admin_notes: adminNotes.trim() || null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", request.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(status === "approved" ? "Approved & badge granted" : "Request rejected");
    onChange();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{request.dev?.full_name ?? "Unnamed"}</h3>
            <StatusPill status={request.status} />
          </div>
          {request.dev?.headline && <p className="mt-1 text-sm text-muted-foreground">{request.dev.headline}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted {new Date(request.created_at).toLocaleDateString()}
            {request.reviewed_at && ` · Reviewed ${new Date(request.reviewed_at).toLocaleDateString()}`}
            {typeof request.dev?.experience_years === "number" && ` · ${request.dev.experience_years}y exp`}
          </p>
        </div>
      </div>

      {!compact && (
        <>
          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <LinkPill label="GitHub" url={request.github_url} />
            <LinkPill label="Portfolio" url={request.portfolio_url} />
            <LinkPill label="LinkedIn" url={request.linkedin_url} />
          </div>

          {request.notes && (
            <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Developer notes</p>
              <p className="mt-1 whitespace-pre-wrap">{request.notes}</p>
            </div>
          )}

          {request.dev?.skills?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {request.dev.skills.slice(0, 8).map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
          )}
          {Array.isArray(request.documents) && request.documents.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Documents checklist</p>
              <div className="mt-2">
                <DocumentChecklist value={request.documents} readOnly />
              </div>
            </div>
          )}

          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Status timeline</p>
            <div className="mt-3">
              <StatusTimeline history={request.status_history ?? []} />
            </div>
          </div>
        </>
      )}

      {request.status === "pending" ? (
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Admin note (optional, shown to developer)</Label>
            <Textarea rows={2} maxLength={500} value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="e.g. Great GitHub history, approved." />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => decide("approved")} className="bg-gradient-accent text-primary-foreground hover:opacity-90">
              <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
            </Button>
            <Button size="sm" disabled={busy} variant="outline" onClick={() => decide("rejected")}>
              <XCircle className="mr-1 h-4 w-4" /> Reject
            </Button>
          </div>
        </div>
      ) : request.admin_notes ? (
        <p className="mt-3 text-xs text-muted-foreground">Admin note: {request.admin_notes}</p>
      ) : null}
    </div>
  );
}

// --- MODERATION DIALOGS ---

function EditDeveloperDialog({ developer, user, onUpdate }: { developer: any; user: any; onUpdate: () => void }) {
  const [form, setForm] = useState({
    full_name: developer.full_name || user.full_name || "",
    headline: developer.headline || "",
    skills: (developer.skills || []).join(", "),
    is_verified: developer.is_verified || false,
    phone: developer.phone || "",
  });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    const { error } = await supabase
      .from("developer_profiles")
      .update({
        full_name: form.full_name,
        headline: form.headline,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
        is_verified: form.is_verified,
        phone: form.phone,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Developer profile updated");
    setOpen(false);
    onUpdate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Edit Developer"><Edit2 className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Moderate Developer Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Headline</Label>
            <Input value={form.headline} onChange={e => setForm({...form, headline: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Skills (comma separated)</Label>
            <Textarea value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="is_v" checked={form.is_verified} onCheckedChange={v => setForm({...form, is_verified: !!v})} />
            <Label htmlFor="is_v">Verified Profile Badge</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={busy}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditRecruiterDialog({ recruiter, user, onUpdate }: { recruiter: any; user: any; onUpdate: () => void }) {
  const [form, setForm] = useState({
    full_name: recruiter.full_name || user.full_name || "",
    company_name: recruiter.company_name || "",
    industry: recruiter.industry || "",
    is_verified: recruiter.is_verified || false,
  });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    const { error } = await supabase
      .from("recruiter_profiles")
      .update({
        full_name: form.full_name,
        company_name: form.company_name,
        industry: form.industry,
        is_verified: form.is_verified,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Recruiter profile updated");
    setOpen(false);
    onUpdate();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Edit Recruiter"><Edit2 className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Moderate Recruiter Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="is_vr" checked={form.is_verified} onCheckedChange={v => setForm({...form, is_verified: !!v})} />
            <Label htmlFor="is_vr">Verified Company Badge</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={busy}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- HELPERS ---

function LinkPill({ label, url }: { label: string; url: string | null }) {
  if (!url) return <div className="rounded-lg border border-dashed border-border p-2 text-xs text-muted-foreground">{label}: —</div>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border border-border bg-background p-2 text-xs hover:bg-muted">
      <span className="truncate"><span className="text-muted-foreground">{label}: </span>{url.replace(/^https?:\/\//, "")}</span>
      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
    </a>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="mr-1 h-3 w-3" /> Approved</Badge>;
  if (status === "rejected") return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
  return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
}
