import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Trash2, CheckCircle2, Clock, Eye, Pause, Circle, Calendar, Percent,
  ArrowUp, ArrowDown, Check, XCircle, AlertTriangle, AlertCircle, FileText, User, HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { logProjectActivityServerFn, sendTimelineEmailServerFn } from "@/utils/email-service";

type StageStatus =
  | "planned"
  | "pending"
  | "in_progress"
  | "under_review"
  | "waiting_for_approval"
  | "completed"
  | "blocked"
  | "delayed"
  | "cancelled";

const STATUS_META: Record<
  StageStatus,
  { label: string; icon: React.ComponentType<{ className?: string }>; cls: string; color: string }
> = {
  planned: {
    label: "Pending",
    icon: Circle,
    cls: "bg-muted text-muted-foreground border-border",
    color: "text-muted-foreground",
  },
  pending: {
    label: "Pending",
    icon: Circle,
    cls: "bg-muted text-muted-foreground border-border",
    color: "text-muted-foreground",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    cls: "bg-accent/15 text-accent-foreground border-accent/30",
    color: "text-accent",
  },
  under_review: {
    label: "Waiting Approval",
    icon: Eye,
    cls: "bg-warning/15 text-warning-foreground border-warning/30",
    color: "text-warning",
  },
  waiting_for_approval: {
    label: "Waiting Approval",
    icon: Eye,
    cls: "bg-warning/15 text-warning-foreground border-warning/30",
    color: "text-warning",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    cls: "bg-success/15 text-success-foreground border-success/30",
    color: "text-success",
  },
  blocked: {
    label: "Delayed",
    icon: Pause,
    cls: "bg-destructive/15 text-destructive border-destructive/30",
    color: "text-destructive",
  },
  delayed: {
    label: "Delayed",
    icon: Pause,
    cls: "bg-destructive/15 text-destructive border-destructive/30",
    color: "text-destructive",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    cls: "bg-muted text-muted-foreground border-border line-through",
    color: "text-muted-foreground",
  },
};

export function ProjectStages({ projectId }: { projectId: string }) {
  const { user, role } = useAuth();
  const qc = useQueryClient();

  // Form states for adding stage
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [progressPercent, setProgressPercent] = useState("0");
  const [busy, setBusy] = useState(false);

  // Queries
  const { data: stages = [], isLoading } = useQuery({
    queryKey: ["stages", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_stages")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  const { data: activities = [], isLoading: loadingActivities } = useQuery({
    queryKey: ["project-activities", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("project_activities")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Realtime updates subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-realtime-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_stages", filter: `project_id=eq.${projectId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["stages", projectId] });
          qc.invalidateQueries({ queryKey: ["project", projectId] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_activities", filter: `project_id=eq.${projectId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["project-activities", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, qc]);

  if (!user) return null;

  const isRecruiter = role === "recruiter";
  const isAdmin = role === "admin";

  // Timeline-related stats for Project Dashboard
  const totalStages = stages.length;
  const completedStagesCount = stages.filter((s) => s.status === "completed").length;
  const pendingStagesCount = stages.filter((s) => s.status !== "completed" && s.status !== "cancelled").length;

  // Calculate Overall Progress %
  const overallProgress =
    totalStages > 0
      ? Math.round(
          stages.reduce((acc, curr) => acc + (curr.progress_percent || 0), 0) / totalStages
        )
      : 0;

  // Identify Current Stage
  const currentStage = stages.find((s) => s.status === "in_progress" || s.status === "waiting_for_approval") ||
    stages.find((s) => s.status !== "completed" && s.status !== "cancelled") ||
    null;

  // Identify Next Stage
  const currentStageIdx = currentStage ? stages.findIndex((s) => s.id === currentStage.id) : -1;
  const nextStage =
    currentStageIdx !== -1 && currentStageIdx + 1 < stages.length
      ? stages[currentStageIdx + 1]
      : null;

  // Estimated Completion Date (Due Date of last milestone)
  const estCompletionDate =
    stages.length > 0 && stages[stages.length - 1].deadline
      ? new Date(stages[stages.length - 1].deadline!).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  // 1. Add Stage Action (Recruiter Only)
  async function addStage(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setBusy(true);

    const isTimelineCreatedEvent = stages.length === 0;
    const pos = stages.length;

    const { data: newStage, error } = await supabase
      .from("project_stages")
      .insert({
        project_id: projectId,
        name: name.trim().slice(0, 80),
        comment: comment.trim() || null,
        updated_by: user.id,
        position: pos,
        progress_percent: parseInt(progressPercent, 10) || 0,
        start_date: startDate || null,
        deadline: deadline || null,
        status: (parseInt(progressPercent, 10) === 100 ? "completed" : "planned") as any,
      })
      .select()
      .single();

    setBusy(false);
    if (error) return toast.error(error.message);

    setName("");
    setComment("");
    setStartDate("");
    setDeadline("");
    setProgressPercent("0");
    qc.invalidateQueries({ queryKey: ["stages", projectId] });
    toast.success("Stage added");

    // Retrieve other party for notifications
    const { data: project } = await supabase
      .from("projects")
      .select("recruiter_id, title, applications(developer_id, status)")
      .eq("id", projectId)
      .maybeSingle();

    if (project) {
      const acceptedApp = (project.applications as any)?.find((a: any) => a.status === "accepted");
      const targetId = user.id === project.recruiter_id ? acceptedApp?.developer_id : project.recruiter_id;

      if (targetId) {
        // Log activity history
        const actType = isTimelineCreatedEvent ? "timeline_created" : "stage_added";
        const desc = isTimelineCreatedEvent
          ? `Recruiter created project timeline`
          : `Recruiter added stage: "${newStage.name}"`;

        await logProjectActivityServerFn({
          data: { projectId, userId: user.id, activityType: actType, description: desc },
        });

        // Trigger in-app notification
        await supabase.from("notifications").insert({
          user_id: targetId,
          title: isTimelineCreatedEvent ? "Project Timeline Created" : "New milestone added",
          body: isTimelineCreatedEvent
            ? `A project timeline was created for "${project.title}"`
            : `A new milestone "${newStage.name}" was added to "${project.title}"`,
          type: "stage_update",
          link: `/projects/${projectId}`,
        });

        // Trigger secure Resend email
        await sendTimelineEmailServerFn({
          data: {
            projectId,
            senderId: user.id,
            type: isTimelineCreatedEvent ? "timeline_created" : "timeline_updated",
            stageName: newStage.name,
            detailText: isTimelineCreatedEvent ? "Timeline created." : `Added milestone: "${newStage.name}"`,
          },
        });
      }
    }
  }

  // 2. Reorder Stages (Move Up / Move Down)
  async function reorderStage(idx: number, direction: "up" | "down") {
    if (!user) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= stages.length) return;

    const currentStage = stages[idx];
    const otherStage = stages[targetIdx];

    // Swap positions
    const { error: err1 } = await supabase
      .from("project_stages")
      .update({ position: otherStage.position })
      .eq("id", currentStage.id);

    const { error: err2 } = await supabase
      .from("project_stages")
      .update({ position: currentStage.position })
      .eq("id", otherStage.id);

    if (err1 || err2) {
      toast.error("Failed to reorder stages");
      return;
    }

    qc.invalidateQueries({ queryKey: ["stages", projectId] });
    toast.success("Stages reordered");

    // Log Activity
    await logProjectActivityServerFn({
      data: {
        projectId,
        userId: user.id,
        activityType: "stage_reordered",
        description: `Reordered stages: "${currentStage.name}" moved ${direction}`,
      },
    });

    // Notify other party
    const { data: project } = await supabase
      .from("projects")
      .select("recruiter_id, applications(developer_id, status)")
      .eq("id", projectId)
      .maybeSingle();

    if (project) {
      const acceptedApp = (project.applications as any)?.find((a: any) => a.status === "accepted");
      const targetId = user.id === project.recruiter_id ? acceptedApp?.developer_id : project.recruiter_id;

      if (targetId) {
        await sendTimelineEmailServerFn({
          data: {
            projectId,
            senderId: user.id,
            type: "timeline_updated",
            detailText: `Timeline order updated.`,
          },
        });
      }
    }
  }

  // 3. Update Stage Fields
  async function updateStageField(
    id: string,
    fields: Partial<{
      name: string;
      comment: string | null;
      status: StageStatus;
      progress_percent: number;
      start_date: string | null;
      deadline: string | null;
    }>
  ) {
    if (!user) return;

    const { data: oldStage } = await supabase
      .from("project_stages")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!oldStage) return;

    const updatedFields: any = { ...fields, updated_by: user.id };

    // Automatic adjustment when 100% complete
    if (fields.progress_percent === 100) {
      updatedFields.status = "completed";
    } else if (fields.status === "completed") {
      updatedFields.progress_percent = 100;
    } else if (fields.progress_percent !== undefined && fields.progress_percent < 100 && oldStage.status === "completed") {
      updatedFields.status = "in_progress";
    }

    const { error } = await supabase
      .from("project_stages")
      .update(updatedFields)
      .eq("id", id);

    if (error) return toast.error(error.message);

    qc.invalidateQueries({ queryKey: ["stages", projectId] });
    toast.success("Stage updated");

    // Fetch details of updated project
    const { data: project } = await supabase
      .from("projects")
      .select("recruiter_id, title, applications(developer_id, status)")
      .eq("id", projectId)
      .maybeSingle();

    if (project) {
      const acceptedApp = (project.applications as any)?.find((a: any) => a.status === "accepted");
      const targetId = user.id === project.recruiter_id ? acceptedApp?.developer_id : project.recruiter_id;

      if (targetId) {
        let updateMsg = `Milestone "${fields.name || oldStage.name}" was updated.`;
        let actType = "stage_updated";
        let emailType: any = "timeline_updated";

        if (fields.status && fields.status !== oldStage.status) {
          updateMsg = `Milestone "${oldStage.name}" is now ${STATUS_META[fields.status].label}`;
          if (fields.status === "completed") {
            actType = "stage_completed";
            emailType = "stage_completed";
          }
        } else if (fields.progress_percent !== undefined && fields.progress_percent !== oldStage.progress_percent) {
          updateMsg = `Milestone "${oldStage.name}" progress updated to ${fields.progress_percent}%`;
          actType = "progress_updated";
          if (fields.progress_percent === 100) {
            actType = "stage_completed";
            emailType = "stage_completed";
          }
        } else if (fields.deadline && fields.deadline !== oldStage.deadline) {
          updateMsg = `Milestone "${oldStage.name}" deadline updated to ${fields.deadline}`;
          actType = "deadline_updated";
          emailType = "deadline_changed";
        }

        // Log Activity
        await logProjectActivityServerFn({
          data: { projectId, userId: user.id, activityType: actType, description: updateMsg },
        });

        // Trigger in-app notification
        await supabase.from("notifications").insert({
          user_id: targetId,
          title: "Timeline updated",
          body: updateMsg,
          type: "stage_update",
          link: `/projects/${projectId}`,
        });

        // Trigger Resend email
        await sendTimelineEmailServerFn({
          data: {
            projectId,
            senderId: user.id,
            type: emailType,
            stageName: oldStage.name,
            detailText: updateMsg,
          },
        });

        // Automatic project completion check
        if (fields.status === "completed" || updatedFields.status === "completed") {
          const allCompleted = stages.every((s) => (s.id === id ? true : s.status === "completed"));
          if (allCompleted) {
            await supabase.from("projects").update({ status: "completed" }).eq("id", projectId);

            // Log project completed activity
            await logProjectActivityServerFn({
              data: {
                projectId,
                userId: user.id,
                activityType: "project_completed",
                description: `Project marked as Completed! All milestones finished.`,
              },
            });

            // Trigger notification
            await supabase.from("notifications").insert({
              user_id: targetId,
              title: "Project Completed! 🏆",
              body: `All milestones completed! The project "${project.title}" has been marked as completed.`,
              type: "project_update",
              link: `/projects/${projectId}`,
            });

            // Email project completed
            await sendTimelineEmailServerFn({
              data: {
                projectId,
                senderId: user.id,
                type: "project_completed",
              },
            });

            toast.success("All stages completed! Project marked as completed.");
          }
        }
      }
    }
  }

  // 4. Delete Stage (Recruiter Only)
  async function removeStage(id: string, name: string) {
    if (!confirm("Are you sure you want to delete this stage?")) return;

    const { error } = await supabase.from("project_stages").delete().eq("id", id);
    if (error) return toast.error(error.message);

    qc.invalidateQueries({ queryKey: ["stages", projectId] });
    toast.success("Stage deleted");

    // Log Activity
    await logProjectActivityServerFn({
      data: {
        projectId,
        userId: user.id,
        activityType: "stage_deleted",
        description: `Recruiter deleted stage: "${name}"`,
      },
    });

    // Notify other party
    const { data: project } = await supabase
      .from("projects")
      .select("recruiter_id, applications(developer_id, status)")
      .eq("id", projectId)
      .maybeSingle();

    if (project) {
      const acceptedApp = (project.applications as any)?.find((a: any) => a.status === "accepted");
      const targetId = user.id === project.recruiter_id ? acceptedApp?.developer_id : project.recruiter_id;

      if (targetId) {
        await sendTimelineEmailServerFn({
          data: {
            projectId,
            senderId: user.id,
            type: "timeline_updated",
            detailText: `Timeline updated: milestone "${name}" was removed.`,
          },
        });
      }
    }
  }

  return (
    <section className="space-y-8 mt-8">
      {/* PROFESSIONAL LIVE PROGRESS DASHBOARD */}
      <CardDashboard
        progress={overallProgress}
        currentStageName={currentStage?.name || "None"}
        nextStageName={nextStage?.name || "None"}
        estCompletion={estCompletionDate}
        completed={completedStagesCount}
        pending={pendingStagesCount}
      />

      {/* STAGE VISUAL STEPPER TRACKER */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-bold mb-4">Live Progress Stepper</h3>
        {stages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add project stages to initialize the live progress stepper tracker.</p>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-x-auto pb-4">
            {stages.map((s, idx) => {
              const meta = STATUS_META[s.status as StageStatus] || STATUS_META.planned;
              const Icon = meta.icon;
              const isCompleted = s.status === "completed";
              const isInProgress = s.status === "in_progress" || s.status === "under_review" || s.status === "waiting_for_approval";

              return (
                <div key={s.id} className="flex flex-1 items-center gap-3 min-w-[150px]">
                  <div className="flex flex-col items-center md:items-start gap-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center border font-bold text-xs ${
                          isCompleted
                            ? "bg-success/20 border-success text-success"
                            : isInProgress
                              ? "bg-accent/20 border-accent text-accent animate-pulse"
                              : "bg-muted border-border text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? "✔" : idx + 1}
                      </div>
                      <span className="text-sm font-semibold truncate max-w-[110px]">{s.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground pl-9">
                      {s.status === "completed"
                        ? "Completed"
                        : isInProgress
                          ? `${s.progress_percent}% Done`
                          : "Pending"}
                    </span>
                  </div>
                  {idx < stages.length - 1 && (
                    <div className="hidden md:block flex-1 h-[2px] bg-border min-w-[20px]" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PROJECT PROGRESS & TIMELINE LIST */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold">Project Milestones & Timeline</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Define scope, track progress, set deadlines, and leave notes.
            </p>
          </div>
        </div>

        <ol className="mt-6 space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading stages...</p>}
          {!isLoading && stages.length === 0 && (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No milestones defined yet. The recruiter can create the timeline below.
            </p>
          )}

          {stages.map((s, idx) => {
            const meta = STATUS_META[s.status as StageStatus] || STATUS_META.planned;
            const Icon = meta.icon;
            return (
              <li
                key={s.id}
                className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 shadow-sm transition-all hover:border-accent/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold text-foreground">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isRecruiter ? (
                          <Input
                            className="h-8 font-semibold text-sm max-w-xs focus:bg-muted/30"
                            value={s.name}
                            onChange={(e) => updateStageField(s.id, { name: e.target.value })}
                            onBlur={(e) => updateStageField(s.id, { name: e.target.value })}
                          />
                        ) : (
                          <h4 className="font-bold text-sm">{s.name}</h4>
                        )}
                        <Badge className={`${meta.cls} gap-1 text-xs font-semibold px-2 py-0.5`}>
                          <Icon className="h-3 w-3 shrink-0" /> {meta.label}
                        </Badge>
                      </div>

                      {/* Notes / Comments Section */}
                      {isRecruiter ? (
                        <Textarea
                          className="mt-1 text-xs text-muted-foreground w-full sm:w-[450px] min-h-[50px] focus:bg-muted/30"
                          value={s.comment || ""}
                          placeholder="Add work notes or scope description..."
                          onChange={(e) => updateStageField(s.id, { comment: e.target.value || null })}
                          onBlur={(e) => updateStageField(s.id, { comment: e.target.value || null })}
                        />
                      ) : (
                        <div className="space-y-2">
                          {s.comment && (
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap italic mt-1 bg-muted/20 p-2.5 rounded border border-border/30">
                              "{s.comment}"
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">Update Work Notes:</span>
                            <Input
                              className="h-7 text-xs max-w-xs"
                              placeholder="Add developer progress notes..."
                              defaultValue={s.comment || ""}
                              onBlur={(e) => updateStageField(s.id, { comment: e.target.value || null })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
                    {/* Status Changer */}
                    <Select
                      disabled={isAdmin}
                      value={s.status}
                      onValueChange={(v) => updateStageField(s.id, { status: v as StageStatus })}
                    >
                      <SelectTrigger className="h-8 w-[150px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(STATUS_META).map((k) => (
                          <SelectItem key={k} value={k}>
                            {STATUS_META[k as StageStatus].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Reordering and Deletion (Recruiter Only) */}
                    {isRecruiter && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          disabled={idx === 0}
                          onClick={() => reorderStage(idx, "up")}
                          title="Move milestone up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          disabled={idx === stages.length - 1}
                          onClick={() => reorderStage(idx, "down")}
                          title="Move milestone down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => removeStage(s.id, s.name)}
                          title="Delete milestone"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress % and Dates (Start Date & Due Date) */}
                <div className="pl-11 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/50 pt-3 text-xs">
                  {/* Completion Percentage */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-muted-foreground shrink-0 font-medium">
                      <Percent className="h-3.5 w-3.5" /> Progress:
                    </div>
                    <Select
                      disabled={isAdmin}
                      value={String(s.progress_percent || 0)}
                      onValueChange={(val) =>
                        updateStageField(s.id, { progress_percent: parseInt(val, 10) })
                      }
                    >
                      <SelectTrigger className="h-7 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"].map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Start Date */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-muted-foreground shrink-0 font-medium">
                      <Calendar className="h-3.5 w-3.5" /> Start:
                    </div>
                    {isRecruiter ? (
                      <Input
                        disabled={isAdmin}
                        type="date"
                        value={s.start_date || ""}
                        onChange={(e) => updateStageField(s.id, { start_date: e.target.value || null })}
                        className="h-7 w-32 text-xs"
                      />
                    ) : (
                      <span className="font-semibold text-foreground">{s.start_date || "—"}</span>
                    )}
                  </div>

                  {/* Due Date / Deadline */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-muted-foreground shrink-0 font-medium">
                      <Calendar className="h-3.5 w-3.5" /> Due:
                    </div>
                    {isRecruiter ? (
                      <Input
                        disabled={isAdmin}
                        type="date"
                        value={s.deadline || ""}
                        onChange={(e) => updateStageField(s.id, { deadline: e.target.value || null })}
                        className="h-7 w-32 text-xs"
                      />
                    ) : (
                      <span className="font-semibold text-foreground">{s.deadline || "—"}</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {/* ADD NEW MILESTONE STAGE FORM (Recruiter Only) */}
        {isRecruiter && (
          <form
            onSubmit={addStage}
            className="mt-8 space-y-4 rounded-xl border border-dashed border-border p-5 bg-muted/20"
          >
            <h4 className="font-bold text-sm flex items-center gap-1.5 text-accent">
              <Plus className="h-4 w-4" /> Add Milestone Stage
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-semibold">Stage Name *</span>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. UI Wireframing, Database Schema, Production Release"
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-semibold">Notes / Scope</span>
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Design components and pages scope..."
                  maxLength={300}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-semibold">Start Date</span>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground font-semibold">Due Date (Deadline)</span>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <span className="text-xs text-muted-foreground font-semibold">Initial Progress %</span>
                <Select value={progressPercent} onValueChange={setProgressPercent}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["0", "10", "20", "30", "40", "50", "60", "70", "80", "90", "100"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              disabled={busy}
              size="sm"
              className="bg-gradient-accent text-primary-foreground font-bold shadow-md hover:opacity-90 mt-2"
            >
              <Plus className="mr-1 h-4 w-4" /> {busy ? "Adding..." : "Add milestone"}
            </Button>
          </form>
        )}
      </div>

      {/* CHRONOLOGICAL PROJECT ACTIVITY HISTORY */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-1.5">
          <FileText className="h-5 w-5 text-accent" /> Timeline Activity History
        </h3>
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
          {loadingActivities ? (
            <p className="text-xs text-muted-foreground animate-pulse">Loading history logs...</p>
          ) : activities.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No activities logged yet.</p>
          ) : (
            activities.map((act) => {
              const dateStr = new Date(act.created_at).toLocaleString();
              return (
                <div key={act.id} className="flex gap-3 text-xs items-start border-b border-border/30 pb-3">
                  <div className="bg-muted p-1.5 rounded text-accent shrink-0">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{act.description}</p>
                    <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

// --- CARD DASHBOARD SUMMARY COMPONENT ---
function CardDashboard({
  progress,
  currentStageName,
  nextStageName,
  estCompletion,
  completed,
  pending,
}: {
  progress: number;
  currentStageName: string;
  nextStageName: string;
  estCompletion: string;
  completed: number;
  pending: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Overall Progress Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col justify-between">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overall Progress</span>
          <div className="text-3xl font-display font-bold text-accent mt-1">{progress}%</div>
        </div>
        <div className="mt-4">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground mt-2 block">
            Average of all defined project milestone stages
          </span>
        </div>
      </div>

      {/* Current and Next Milestone */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col justify-between">
        <div className="space-y-2">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Current Stage</span>
            <span className="text-sm font-bold text-foreground line-clamp-1 mt-0.5">{currentStageName}</span>
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Next Stage</span>
            <span className="text-sm font-bold text-muted-foreground line-clamp-1 mt-0.5">{nextStageName}</span>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground block pt-2 border-t border-border/40">
          Tracking next pending deliverables
        </span>
      </div>

      {/* Completion & Tasks Stats */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-muted-foreground">Estimated Finish:</span>
            <span className="font-bold text-foreground">{estCompletion}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-muted-foreground">Completed Tasks:</span>
            <Badge className="bg-success/10 text-success border-success/20 font-bold">{completed}</Badge>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-muted-foreground">Pending Tasks:</span>
            <Badge variant="outline" className="font-bold">{pending}</Badge>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground block pt-2 border-t border-border/40">
          Deadlines computed based on timeline dates
        </span>
      </div>
    </div>
  );
}
