import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, CheckCircle2, Clock, Eye, Pause, Circle } from "lucide-react";
import { toast } from "sonner";

type StageStatus = "planned" | "in_progress" | "under_review" | "completed" | "blocked";

const STATUS_META: Record<StageStatus, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  planned:      { label: "Planned",      icon: Circle,        cls: "bg-muted text-muted-foreground" },
  in_progress:  { label: "In progress",  icon: Clock,         cls: "bg-accent/15 text-accent-foreground border border-accent/30" },
  under_review: { label: "Under review", icon: Eye,           cls: "bg-warning/15 text-warning-foreground border border-warning/30" },
  completed:    { label: "Completed",    icon: CheckCircle2,  cls: "bg-success/15 text-success-foreground border border-success/30" },
  blocked:      { label: "Blocked",      icon: Pause,         cls: "bg-destructive/15 text-destructive border border-destructive/30" },
};

export function ProjectStages({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ["stages", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("project_stages")
        .select("*").eq("project_id", projectId)
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  if (!user) return null;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setBusy(true);
    const pos = stages.length;
    const { error } = await supabase.from("project_stages").insert({
      project_id: projectId, name: name.trim().slice(0, 80),
      comment: comment.trim() || null, updated_by: user.id, position: pos,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setName(""); setComment("");
    qc.invalidateQueries({ queryKey: ["stages", projectId] });
    toast.success("Stage added");
  }

  async function setStatus(id: string, status: StageStatus) {
    if (!user) return;
    const { error } = await supabase.from("project_stages")
      .update({ status, updated_by: user.id }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["stages", projectId] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("project_stages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["stages", projectId] });
  }

  return (
    <section className="mt-10 rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Project progress</h2>
          <p className="mt-1 text-sm text-muted-foreground">Track milestones — both parties can add and update stages.</p>
        </div>
      </div>

      <ol className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && stages.length === 0 && (
          <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No stages yet. Add the first milestone below (e.g. "UI design", "Backend API", "Testing").
          </p>
        )}
        {stages.map((s, idx) => {
          const meta = STATUS_META[s.status as StageStatus];
          const Icon = meta.icon;
          return (
            <li key={s.id} className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-medium">{s.name}</h4>
                  <Badge className={meta.cls + " gap-1"}>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </Badge>
                </div>
                {s.comment && <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{s.comment}</p>}
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  Updated {new Date(s.updated_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Select value={s.status} onValueChange={(v) => setStatus(s.id, v as StageStatus)}>
                  <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_META) as StageStatus[]).map(k => (
                      <SelectItem key={k} value={k}>{STATUS_META[k].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" onClick={() => remove(s.id)} title="Remove stage">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      <form onSubmit={add} className="mt-6 space-y-3 rounded-lg border border-dashed border-border p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input required value={name} onChange={e => setName(e.target.value)} placeholder="Stage name (e.g. UI design)" maxLength={80} />
          <Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional note" maxLength={300} />
        </div>
        <Button type="submit" disabled={busy} size="sm" className="bg-gradient-accent text-primary-foreground hover:opacity-90">
          <Plus className="mr-1 h-4 w-4" /> {busy ? "Adding..." : "Add stage"}
        </Button>
      </form>
    </section>
  );
}
