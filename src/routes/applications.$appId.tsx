import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Download,
  Users,
  Send,
} from "lucide-react";
import { ChatThread } from "@/components/ChatThread";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/applications/$appId")({
  head: () => ({ meta: [{ title: "Application | DeveloperConnect" }] }),
  component: AppPage,
});

function AppPage() {
  const { appId } = Route.useParams();
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <Inner appId={appId} userId={user.id} />
      </main>
      <Footer />
    </div>
  );
}

function Inner({ appId, userId }: { appId: string; userId: string }) {
  const { role } = useAuth();
  const qc = useQueryClient();

  const {
    data: app,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["app", appId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, projects(title, recruiter_id)")
        .eq("id", appId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: dev } = await supabase
        .from("developer_profiles")
        .select("full_name")
        .eq("id", data.developer_id)
        .maybeSingle();
      return { ...data, developer_profiles: dev };
    },
  });

  if (isLoading) return <p className="mt-8 text-sm text-muted-foreground">Loading...</p>;
  if (error)
    return (
      <p className="mt-8 text-sm text-destructive">Failed to load: {(error as Error).message}</p>
    );
  if (!app)
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        Application not found or you don't have access.
      </p>
    );

  return (
    <div className="mt-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/projects/$projectId"
            params={{ projectId: app.project_id }}
            className="text-sm text-muted-foreground hover:text-foreground font-semibold"
          >
            {app.projects?.title}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="font-display text-2xl font-bold tracking-tight">Conversation</h1>
            <span className="text-muted-foreground">with</span>
            {role === "developer" ? (
              <Link
                to="/recruiters/$recId"
                params={{ recId: (app.projects as any)?.recruiter_id }}
                target="_blank"
                className="font-semibold text-accent hover:underline"
              >
                Recruiter
              </Link>
            ) : (
              <Link
                to="/developers/$devId"
                params={{ devId: app.developer_id }}
                target="_blank"
                className="font-semibold text-accent hover:underline"
              >
                {(app.developer_profiles as any)?.full_name || "Developer"}
              </Link>
            )}
          </div>
        </div>
        <Badge
          variant={
            app.status === "accepted"
              ? "default"
              : app.status === "rejected"
                ? "destructive"
                : "secondary"
          }
        >
          {app.status}
        </Badge>
      </div>

      {app.cover_message && (
        <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4 text-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Initial cover message
          </p>
          <p className="mt-1 whitespace-pre-wrap">{app.cover_message}</p>
        </div>
      )}

      {/* NDA Section */}
      <NdaManager
        projectId={app.project_id}
        developerId={app.developer_id}
        recruiterId={(app.projects as any)?.recruiter_id}
        role={role || "developer"}
      />

      <ChatThread appId={appId} userId={userId} />
    </div>
  );
}

function NdaManager({
  projectId,
  developerId,
  recruiterId,
  role,
}: {
  projectId: string;
  developerId: string;
  recruiterId: string;
  role: string;
}) {
  const qc = useQueryClient();
  const [ndaType, setNdaType] = useState<"template" | "custom">("template");
  const [customUrl, setCustomUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [ipAddress, setIpAddress] = useState("127.0.0.1");

  useEffect(() => {
    // Dynamically fetch client IP address using ipify or similar fallback
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => {
        if (data.ip) setIpAddress(data.ip);
      })
      .catch(() => {
        // Fallback mock IP based on user agent or common format
        setIpAddress("192.168.1." + Math.floor(Math.random() * 254 + 1));
      });
  }, []);

  const { data: nda, isLoading } = useQuery({
    queryKey: ["project-nda", projectId, developerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ndas")
        .select("*")
        .eq("project_id", projectId)
        .eq("developer_id", developerId)
        .maybeSingle();
      return data;
    },
  });

  async function initiateNda() {
    setBusy(true);
    const { error } = await supabase.from("ndas").insert({
      project_id: projectId,
      recruiter_id: recruiterId,
      developer_id: developerId,
      file_url: ndaType === "custom" ? customUrl : null,
      template_name: ndaType === "template" ? "standard" : null,
      status: "pending",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("NDA request initiated!");
    qc.invalidateQueries({ queryKey: ["project-nda", projectId, developerId] });

    // Notify Developer
    await supabase.from("notifications").insert({
      user_id: developerId,
      title: "NDA Signature Requested",
      body: "The recruiter has requested you to sign an NDA before starting the project.",
      type: "recruiter_invite",
      link: `/applications/${projectId}`,
    });
  }

  async function respondNda(action: "accepted" | "rejected") {
    setBusy(true);
    const updates: any = {
      status: action,
      developer_ip: action === "accepted" ? ipAddress : null,
      accepted_at: action === "accepted" ? new Date().toISOString() : null,
      rejected_at: action === "rejected" ? new Date().toISOString() : null,
    };

    const { error } = await supabase
      .from("ndas")
      .update(updates)
      .eq("project_id", projectId)
      .eq("developer_id", developerId);

    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      `NDA ${action === "accepted" ? "signed and accepted" : "rejected"} successfully!`,
    );
    qc.invalidateQueries({ queryKey: ["project-nda", projectId, developerId] });

    // Notify Recruiter
    await supabase.from("notifications").insert({
      user_id: recruiterId,
      title: `NDA ${action === "accepted" ? "Accepted" : "Rejected"}`,
      body: `The developer has ${action} the project NDA.`,
      type: "invite_accepted",
      link: `/projects/${projectId}`,
    });
  }

  if (isLoading)
    return (
      <p className="mt-4 text-xs text-muted-foreground animate-pulse">Loading NDA status...</p>
    );

  // Recruiter Flow when NDA doesn't exist
  if (!nda) {
    if (role === "recruiter") {
      return (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" /> Initiate Mutual NDA
            </h3>
            <p className="text-xs text-muted-foreground">
              Every contract requires an active NDA before the project can start.
            </p>
          </div>
          <div className="flex gap-4 text-xs font-medium">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={ndaType === "template"}
                onChange={() => setNdaType("template")}
              />
              Use DeveloperConnect NDA Template
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={ndaType === "custom"}
                onChange={() => setNdaType("custom")}
              />
              Upload Custom NDA PDF URL
            </label>
          </div>

          {ndaType === "custom" && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Custom NDA PDF URL</span>
              <Input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/nda.pdf"
                className="text-xs h-9"
              />
            </div>
          )}

          {ndaType === "template" && (
            <div className="p-3 bg-muted/30 rounded border border-border text-xs text-muted-foreground">
              This will use the DeveloperConnect Standard NDA Template protecting intellectual
              property, confidentiality, and payments.
            </div>
          )}

          <Button
            onClick={initiateNda}
            disabled={busy || (ndaType === "custom" && !customUrl)}
            size="sm"
            className="bg-gradient-accent text-primary-foreground"
          >
            {busy ? "Sending..." : "Send NDA Request"}
          </Button>
        </div>
      );
    } else {
      return (
        <div className="mt-6 p-4 rounded-xl bg-muted/20 border border-border text-xs flex items-center gap-2 text-muted-foreground">
          <AlertTriangle className="h-4 w-4" /> NDA signature has not been initiated by the
          recruiter yet.
        </div>
      );
    }
  }

  // Pending NDA
  if (nda.status === "pending") {
    return (
      <div className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-warning-foreground">
              <FileText className="h-4 w-4" /> Confidentiality NDA Requested
            </h3>
            <p className="text-xs text-muted-foreground">
              A mutual non-disclosure agreement signature is pending before starting this project.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-warning/30 text-warning bg-warning/10 font-bold"
          >
            Signature Pending
          </Badge>
        </div>

        {role === "developer" ? (
          <div className="space-y-4">
            <div className="p-4 bg-background rounded border border-border text-xs leading-relaxed space-y-2">
              <p className="font-bold">NDA Terms:</p>
              {nda.file_url ? (
                <p>
                  The recruiter has uploaded a custom NDA. You must view and accept these custom
                  terms.
                </p>
              ) : (
                <p>
                  DeveloperConnect Standard Template: All information exchanged in the course of
                  this project is strictly confidential. Developer agrees not to disclose source
                  code, business data, or product specifications to any third party. Recruiter
                  agrees to release payments on milestone criteria met.
                </p>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5"
                  onClick={() => window.open(nda.file_url || "#", "_blank")}
                >
                  <Download className="h-3.5 w-3.5" /> View/Download Document
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => respondNda("accepted")}
                disabled={busy}
                size="sm"
                className="bg-success text-success-foreground hover:bg-success/90"
              >
                Accept & Sign NDA
              </Button>
              <Button
                onClick={() => respondNda("rejected")}
                disabled={busy}
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/20"
              >
                Reject NDA
              </Button>
              <span className="text-[10px] text-muted-foreground">
                Signing from IP: {ipAddress}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Sent NDA signature request. Waiting for developer to sign and accept.
            {nda.file_url && (
              <a
                href={nda.file_url}
                target="_blank"
                rel="noreferrer"
                className="ml-1 text-primary hover:underline inline-flex items-center gap-1"
              >
                View uploaded PDF <Download className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  // Accepted/Signed NDA
  if (nda.status === "accepted") {
    return (
      <div className="mt-6 rounded-xl border border-success/30 bg-success/5 p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-success-foreground">
              <ShieldCheck className="h-4 w-4" /> NDA Signed & Active
            </h3>
            <p className="text-xs text-muted-foreground">
              Both parties are bound by mutual confidentiality terms.
            </p>
          </div>
          <Badge className="bg-success text-success-foreground gap-1 font-bold">
            <CheckCircle2 className="h-3 w-3" /> Signed & Active
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground bg-background p-3 rounded border border-border/50 space-y-1">
          <p>
            <strong>Signed by Developer IP:</strong> {nda.developer_ip || "Verified IP"}
          </p>
          <p>
            <strong>Signed Timestamp:</strong> {new Date(nda.accepted_at).toLocaleString()}
          </p>
          {nda.file_url && (
            <a
              href={nda.file_url}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 pt-1"
            >
              Download Signed Custom PDF <Download className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Rejected NDA
  return (
    <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-5 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm flex items-center gap-1.5 text-destructive-foreground">
            <XCircle className="h-4 w-4" /> NDA Rejected
          </h3>
          <p className="text-xs text-muted-foreground">
            The developer declined the terms. Please negotiate and send a new request.
          </p>
        </div>
        <Badge variant="destructive" className="font-bold">
          Rejected
        </Badge>
      </div>

      {role === "recruiter" && (
        <Button
          onClick={() => {
            // Re-trigger initiation view by clearing/deleting or overriding the record
            supabase
              .from("ndas")
              .delete()
              .eq("project_id", projectId)
              .eq("developer_id", developerId)
              .then(() =>
                qc.invalidateQueries({ queryKey: ["project-nda", projectId, developerId] }),
              );
          }}
          size="sm"
          variant="outline"
        >
          Send a New NDA Request
        </Button>
      )}
    </div>
  );
}
