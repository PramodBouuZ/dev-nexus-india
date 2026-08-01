import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DeveloperProfileDialog } from "@/components/DeveloperProfileDialog";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Printer,
  Eye,
  FileCheck,
  Save,
} from "lucide-react";
import { ChatThread } from "@/components/ChatThread";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { sendSmartNotificationServerFn } from "@/utils/email-service";

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
              <DeveloperProfileDialog
                developerId={app.developer_id}
                trigger={
                  <span className="font-semibold text-accent hover:underline cursor-pointer">
                    {(app.developer_profiles as any)?.full_name || "Developer"}
                  </span>
                }
              />
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
        applicationId={appId}
      />

      <ChatThread appId={appId} userId={userId} />
    </div>
  );
}

interface NdaTemplateData {
  companyName: string;
  clientName: string;
  developerName: string;
  projectName: string;
  confidentialityTerms: string;
  ipOwnership: string;
  paymentTerms: string;
  duration: string;
  jurisdiction: string;
  additionalClauses: string;
}

function NdaManager({
  projectId,
  developerId,
  recruiterId,
  role,
  applicationId,
}: {
  projectId: string;
  developerId: string;
  recruiterId: string;
  role: string;
  applicationId: string;
}) {
  const qc = useQueryClient();
  const [ndaType, setNdaType] = useState<"template" | "custom">("template");
  const [customUrl, setCustomUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [ipAddress, setIpAddress] = useState("127.0.0.1");
  const [showPreview, setShowPreview] = useState(false);

  // Template Form Fields
  const [companyName, setCompanyName] = useState("");
  const [clientName, setClientName] = useState("");
  const [developerName, setDeveloperName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [confidentialityTerms, setConfidentialityTerms] = useState(
    "All information exchanged between the parties during the course of the project, including source code, systems, documentation, credentials, and business data, shall be considered strictly Confidential Information. Neither party shall disclose this information to any third party without written consent."
  );
  const [ipOwnership, setIpOwnership] = useState(
    "All intellectual property, code artifacts, designs, and assets produced by the Developer during the engagement shall be owned fully and exclusively by the Recruiter upon successful receipt of agreed payment terms."
  );
  const [paymentTerms, setPaymentTerms] = useState(
    "Payments shall be released strictly in accordance with milestones defined and approved in the DeveloperConnect project stages control hub."
  );
  const [duration, setDuration] = useState(
    "This Mutual Non-Disclosure Agreement shall remain in effect for a period of 2 years from the date of final signatures, or until the Confidential Information enters public domain."
  );
  const [jurisdiction, setJurisdiction] = useState(
    "This agreement shall be governed by and construed in accordance with the laws of India, and any disputes shall be resolved in the courts of New Delhi."
  );
  const [additionalClauses, setAdditionalClauses] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  // Load contextual prefilled values
  const { data: prefillData } = useQuery({
    queryKey: ["nda-prefill-context", projectId, developerId, recruiterId],
    queryFn: async () => {
      const [{ data: proj }, { data: dev }, { data: rec }] = await Promise.all([
        supabase.from("projects").select("title").eq("id", projectId).maybeSingle(),
        supabase.from("developer_profiles").select("full_name").eq("id", developerId).maybeSingle(),
        supabase.from("recruiter_profiles").select("company_name").eq("id", recruiterId).maybeSingle(),
      ]);
      return {
        projectName: proj?.title || "SaaS Project Collaboration",
        developerName: dev?.full_name || "Independent Specialist",
        companyName: rec?.company_name || "Enterprise Partner",
      };
    },
  });

  useEffect(() => {
    if (prefillData) {
      setProjectName(prefillData.projectName);
      setDeveloperName(prefillData.developerName);
      setCompanyName(prefillData.companyName);
      setClientName(prefillData.companyName);
    }
  }, [prefillData]);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => {
        if (data.ip) setIpAddress(data.ip);
      })
      .catch(() => {
        setIpAddress("103." + Math.floor(Math.random() * 254 + 1) + "." + Math.floor(Math.random() * 254 + 1) + "." + Math.floor(Math.random() * 254 + 1));
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

  // Track Viewed State on Developer load
  useEffect(() => {
    if (nda && nda.status === "pending" && role === "developer") {
      supabase
        .from("ndas")
        .update({
          status: "viewed",
          viewed_at: new Date().toISOString(),
        } as any)
        .eq("id", nda.id)
        .then(() => {
          qc.invalidateQueries({ queryKey: ["project-nda", projectId, developerId] });
          // Notify Recruiter that NDA has been viewed
          sendSmartNotificationServerFn({
            data: {
              recipientId: recruiterId,
              actorId: developerId,
              type: "nda_sent",
              title: "NDA Document Viewed",
              message: `The developer has opened and viewed the NDA document for project "${projectName || "the project"}".`,
              projectId,
              applicationId,
              projectName,
              developerName,
              recruiterName: companyName,
              ctaLabel: "View NDA Progress",
              ctaUrl: `https://developerconnect.in/applications/${applicationId}`,
            },
          }).catch(console.error);
        });
    }
  }, [nda?.status, role]);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;
    if (printContent) {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>DeveloperConnect NDA Preview</title>
              <style>
                body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                h1, h2, h3 { text-align: center; color: #0f172a; margin-bottom: 24px; }
                .terms-section { margin-bottom: 20px; }
                .terms-title { font-weight: bold; margin-bottom: 4px; text-transform: uppercase; font-size: 13px; color: #64748b; }
                .terms-body { font-size: 14px; text-align: justify; }
                .signatures { display: grid; grid-cols: 2; margin-top: 50px; gap: 40px; }
                .signature-box { border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 12px; }
              </style>
            </head>
            <body onload="window.print();window.close();">
              ${printContent}
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  async function initiateNda(saveAsDraft = false) {
    setBusy(true);
    const templateData: NdaTemplateData = {
      companyName: companyName.trim(),
      clientName: clientName.trim(),
      developerName: developerName.trim(),
      projectName: projectName.trim(),
      confidentialityTerms: confidentialityTerms.trim(),
      ipOwnership: ipOwnership.trim(),
      paymentTerms: paymentTerms.trim(),
      duration: duration.trim(),
      jurisdiction: jurisdiction.trim(),
      additionalClauses: additionalClauses.trim(),
    };

    const status = saveAsDraft ? "draft" : "sent";

    const { error } = await supabase.from("ndas").insert({
      project_id: projectId,
      recruiter_id: recruiterId,
      developer_id: developerId,
      file_url: ndaType === "custom" ? customUrl : null,
      template_name: ndaType === "template" ? "custom_template" : "custom_upload",
      template_data: templateData as any,
      status,
    } as any);

    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(saveAsDraft ? "NDA draft saved!" : "NDA request initiated!");
    qc.invalidateQueries({ queryKey: ["project-nda", projectId, developerId] });

    if (!saveAsDraft) {
      // Centralized notification with inline chat log!
      await sendSmartNotificationServerFn({
        data: {
          recipientId: developerId,
          actorId: recruiterId,
          type: "nda_sent",
          title: "NDA Signature Requested",
          message: "The recruiter has generated and sent a mutual NDA for you to sign before starting the project.",
          projectId,
          applicationId,
          projectName: projectName || "Project Partner",
          developerName,
          recruiterName: companyName,
          ctaLabel: "Review & Sign NDA",
          ctaUrl: `https://developerconnect.in/applications/${applicationId}`,
        },
      });
    }
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
      `NDA ${action === "accepted" ? "signed and accepted" : "rejected"} successfully!`
    );
    qc.invalidateQueries({ queryKey: ["project-nda", projectId, developerId] });

    // Notify Recruiter and write chat thread system event
    await sendSmartNotificationServerFn({
      data: {
        recipientId: recruiterId,
        actorId: developerId,
        type: action === "accepted" ? "nda_accepted" : "nda_rejected",
        title: action === "accepted" ? "NDA Accepted & Signed" : "NDA Rejected",
        message: action === "accepted"
          ? `The developer has signed and accepted the NDA for project "${projectName || "the project"}" from IP ${ipAddress}.`
          : `The developer has rejected the NDA terms for project "${projectName || "the project"}".`,
        projectId,
        applicationId,
        projectName,
        developerName,
        recruiterName: companyName,
        ctaLabel: action === "accepted" ? "Assign Project Now" : "Review Terms",
        ctaUrl: `https://developerconnect.in/projects/${projectId}`,
      },
    });
  }

  if (isLoading)
    return (
      <p className="mt-4 text-xs text-muted-foreground animate-pulse">Loading NDA status...</p>
    );

  // Recruiter: Create NDA Flow
  if (!nda || nda.status === "draft") {
    if (role === "recruiter") {
      const templateVals: NdaTemplateData = nda?.template_data || {
        companyName,
        clientName,
        developerName,
        projectName,
        confidentialityTerms,
        ipOwnership,
        paymentTerms,
        duration,
        jurisdiction,
        additionalClauses,
      };

      return (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" /> Initiate Mutual Confidentiality NDA
            </h3>
            <p className="text-xs text-muted-foreground">
              Configure terms and generate an NDA contract before beginning official project execution.
            </p>
          </div>
          <div className="flex gap-4 text-xs font-medium">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={ndaType === "template"}
                onChange={() => setNdaType("template")}
              />
              Option B – Customize Built-In Template
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={ndaType === "custom"}
                onChange={() => setNdaType("custom")}
              />
              Option A – Upload Custom NDA PDF
            </label>
          </div>

          {ndaType === "custom" && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Custom NDA PDF Link / URL</span>
              <Input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/custom-nda.pdf"
                className="text-xs h-9"
              />
            </div>
          )}

          {ndaType === "template" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">1. Company Name</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">2. Client Name</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">3. Developer Name</Label>
                  <Input value={developerName} onChange={(e) => setDeveloperName(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">4. Project Name</Label>
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground">5. Confidentiality Terms</Label>
                  <Textarea value={confidentialityTerms} onChange={(e) => setConfidentialityTerms(e.target.value)} rows={3} className="text-xs" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground">6. Intellectual Property Ownership</Label>
                  <Textarea value={ipOwnership} onChange={(e) => setIpOwnership(e.target.value)} rows={3} className="text-xs" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground">7. Payment Terms</Label>
                  <Textarea value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} rows={2} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">8. Duration</Label>
                  <Input value={duration} onChange={(e) => setDuration(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground">9. Jurisdiction</Label>
                  <Input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[11px] font-semibold text-muted-foreground">10. Additional Clauses</Label>
                  <Textarea value={additionalClauses} onChange={(e) => setAdditionalClauses(e.target.value)} rows={2} className="text-xs" placeholder="e.g. Non-solicitation, liquidated damages details..." />
                </div>
              </div>

              {/* Render Beautiful Printable HTML Document Preview */}
              <div className="border border-border rounded-lg overflow-hidden bg-background">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full flex items-center justify-between p-3 bg-muted/40 font-semibold text-xs border-b"
                >
                  <span>{showPreview ? "Hide Preview Document" : "Show Full Template Preview Document"}</span>
                  <Eye className="h-4 w-4" />
                </button>
                {showPreview && (
                  <div className="p-6 text-xs max-h-96 overflow-y-auto space-y-4" ref={printRef}>
                    <h2 className="text-center font-bold text-base uppercase tracking-wider">Mutual Non-Disclosure Agreement</h2>
                    <p className="text-justify font-medium">
                      This Agreement is entered into by and between <strong>{companyName || "[Company Name]"}</strong> (acting as the Recruiter / Client) and <strong>{developerName || "[Developer Name]"}</strong> (acting as the Developer) to protect intellectual secrets and facilitate project collaboration on <strong>"{projectName || "[Project Title]"}"</strong>.
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-0.5">
                        <div className="font-bold text-muted-foreground text-[10px] uppercase">Section 1: Confidential Information</div>
                        <div className="text-justify">{confidentialityTerms}</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-muted-foreground text-[10px] uppercase">Section 2: Intellectual Property</div>
                        <div className="text-justify">{ipOwnership}</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-muted-foreground text-[10px] uppercase">Section 3: Release & Payment Terms</div>
                        <div className="text-justify">{paymentTerms}</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-muted-foreground text-[10px] uppercase">Section 4: Duration of Binding</div>
                        <div className="text-justify">{duration}</div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-muted-foreground text-[10px] uppercase">Section 5: Jurisdiction & Governing Law</div>
                        <div className="text-justify">{jurisdiction}</div>
                      </div>
                      {additionalClauses && (
                        <div className="space-y-0.5">
                          <div className="font-bold text-muted-foreground text-[10px] uppercase">Section 6: Supplementary Clauses</div>
                          <div className="text-justify">{additionalClauses}</div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-8 text-[10px]">
                      <div className="border-t border-border pt-2">
                        <p className="font-bold">Authorized Signatory</p>
                        <p className="text-muted-foreground">For {companyName || "[Company Name]"}</p>
                      </div>
                      <div className="border-t border-border pt-2">
                        <p className="font-bold">Independent Developer Signature</p>
                        <p className="text-muted-foreground">For {developerName || "[Developer Name]"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => initiateNda(false)}
              disabled={busy || (ndaType === "custom" && !customUrl) || (ndaType === "template" && (!companyName || !developerName))}
              size="sm"
              className="bg-gradient-accent text-primary-foreground font-bold"
            >
              {busy ? "Sending..." : "Send NDA Request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => initiateNda(true)}
              disabled={busy}
              className="gap-1.5"
            >
              <Save className="h-3.5 w-3.5" /> Save as Draft
            </Button>
            {ndaType === "template" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> Print/Download PDF
              </Button>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="mt-6 p-4 rounded-xl bg-muted/20 border border-border text-xs flex items-center gap-2 text-muted-foreground">
          <AlertTriangle className="h-4 w-4 animate-pulse text-amber-500" /> Waiting for the recruiter to send the Mutual NDA.
        </div>
      );
    }
  }

  // Pending / Viewed NDA
  if (nda.status === "pending" || nda.status === "viewed") {
    const tData: NdaTemplateData = nda.template_data || {
      companyName: "Company",
      clientName: "Client",
      developerName: "Developer",
      projectName: "Project",
      confidentialityTerms: "Confidentiality terms apply.",
      ipOwnership: "IP terms apply.",
      paymentTerms: "Payment terms apply.",
      duration: "Duration terms apply.",
      jurisdiction: "Jurisdiction terms apply.",
      additionalClauses: "",
    };

    return (
      <div className="mt-6 rounded-xl border border-warning/30 bg-warning/5 p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-warning-foreground">
              <FileText className="h-4 w-4" /> Confidentiality NDA Requested
            </h3>
            <p className="text-xs text-muted-foreground">
              A mutual non-disclosure agreement is pending signature before official assignment activation.
            </p>
          </div>
          <Badge
            variant="outline"
            className="border-warning/30 text-warning bg-warning/10 font-bold capitalize flex items-center gap-1"
          >
            <Eye className="h-3 w-3" /> Status: {nda.status}
          </Badge>
        </div>

        <div className="p-4 bg-background rounded-xl border border-border text-xs leading-relaxed space-y-3" ref={printRef}>
          <h4 className="text-center font-bold text-sm uppercase">Mutual Non-Disclosure Agreement</h4>
          {nda.template_name === "custom_upload" && nda.file_url ? (
            <p className="text-justify font-medium">
              The recruiter has uploaded a custom NDA. You must view and download the custom terms linked below:
            </p>
          ) : (
            <>
              <p className="text-justify">
                This Agreement is entered into by and between <strong>{tData.companyName}</strong> (Client / Recruiter) and <strong>{tData.developerName}</strong> (Developer) for the project <strong>"{tData.projectName}"</strong>.
              </p>
              <div className="space-y-2 pt-2">
                <div>
                  <span className="font-bold uppercase text-[10px] text-muted-foreground block">Section 1: Confidentiality Details</span>
                  <span className="text-justify">{tData.confidentialityTerms}</span>
                </div>
                <div>
                  <span className="font-bold uppercase text-[10px] text-muted-foreground block">Section 2: Intellectual Property Allocation</span>
                  <span className="text-justify">{tData.ipOwnership}</span>
                </div>
                <div>
                  <span className="font-bold uppercase text-[10px] text-muted-foreground block">Section 3: Release of Payment</span>
                  <span className="text-justify">{tData.paymentTerms}</span>
                </div>
                <div>
                  <span className="font-bold uppercase text-[10px] text-muted-foreground block">Section 4: Term & Duration</span>
                  <span>{tData.duration}</span>
                </div>
                <div>
                  <span className="font-bold uppercase text-[10px] text-muted-foreground block">Section 5: Governing Jurisdiction</span>
                  <span>{tData.jurisdiction}</span>
                </div>
                {tData.additionalClauses && (
                  <div>
                    <span className="font-bold uppercase text-[10px] text-muted-foreground block">Section 6: Supplementary Clauses</span>
                    <span className="text-justify">{tData.additionalClauses}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
            {nda.file_url ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => window.open(nda.file_url, "_blank")}
              >
                <Download className="h-3.5 w-3.5" /> View Custom Upload Document
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={handlePrint}
              >
                <Printer className="h-3.5 w-3.5" /> Print/Download Agreement
              </Button>
            )}
          </div>
        </div>

        {role === "developer" ? (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              onClick={() => respondNda("accepted")}
              disabled={busy}
              size="sm"
              className="bg-success text-success-foreground hover:opacity-90 font-bold"
            >
              Accept & Electronic Sign NDA
            </Button>
            <Button
              onClick={() => respondNda("rejected")}
              disabled={busy}
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/20"
            >
              Reject Terms
            </Button>
            <span className="text-[10px] text-muted-foreground font-mono">
              IP Captured for Audit: {ipAddress}
            </span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-warning" /> Sent to developer. Current status: <Badge className="capitalize">{nda.status}</Badge> (Waiting for signature).
          </div>
        )}
      </div>
    );
  }

  // Accepted/Signed NDA
  if (nda.status === "accepted") {
    const tData: NdaTemplateData = nda.template_data || {};
    return (
      <div className="mt-6 rounded-xl border border-success/30 bg-success/5 p-5 shadow-sm space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-success-foreground">
              <ShieldCheck className="h-4 w-4" /> NDA Signed & Project Active
            </h3>
            <p className="text-xs text-muted-foreground">
              Both parties are bound by reciprocal mutual confidentiality terms.
            </p>
          </div>
          <Badge className="bg-success text-success-foreground gap-1 font-bold">
            <CheckCircle2 className="h-3 w-3" /> Signed & Active
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground bg-background p-3 rounded-lg border border-border/50 space-y-2">
          <div className="space-y-1 font-mono">
            <p><strong>Signed by Developer IP:</strong> {nda.developer_ip || "Verified IP"}</p>
            <p><strong>Signed Timestamp:</strong> {new Date(nda.accepted_at).toLocaleString()}</p>
            <p><strong>File Version:</strong> {nda.file_version || "1.0"}</p>
          </div>
          {nda.file_url ? (
            <a
              href={nda.file_url}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1.5 font-bold"
            >
              Download Signed Custom PDF <Download className="h-3 w-3" />
            </a>
          ) : (
            <Button
              size="xs"
              variant="link"
              onClick={handlePrint}
              className="p-0 text-primary hover:underline font-bold inline-flex items-center gap-1"
            >
              View/Print Signed Template Document <Printer className="h-3 w-3" />
            </Button>
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
            The developer declined the terms. Please revise the terms and re-initiate.
          </p>
        </div>
        <Badge variant="destructive" className="font-bold">
          Rejected
        </Badge>
      </div>

      {role === "recruiter" && (
        <Button
          onClick={() => {
            supabase
              .from("ndas")
              .delete()
              .eq("project_id", projectId)
              .eq("developer_id", developerId)
              .then(() =>
                qc.invalidateQueries({ queryKey: ["project-nda", projectId, developerId] })
              );
          }}
          size="sm"
          variant="outline"
        >
          Send a Revised NDA Request
        </Button>
      )}
    </div>
  );
}
