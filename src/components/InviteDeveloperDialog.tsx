import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface Props {
  developerId: string;
  developerName: string;
  variant?: "default" | "outline";
  size?: "sm" | "default";
  className?: string;
}

export function InviteDeveloperDialog({ developerId, developerName, variant, size, className }: Props) {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState<string>("none");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: projects } = useQuery({
    enabled: open && role === "recruiter" && !!user,
    queryKey: ["my-open-projects", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, title, status")
        .eq("recruiter_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: existing } = useQuery({
    enabled: open && !!user,
    queryKey: ["invite-existing", user?.id, developerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("invites")
        .select("id, status, created_at")
        .eq("recruiter_id", user!.id)
        .eq("developer_id", developerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!open) { setMessage(""); setProjectId("none"); }
  }, [open]);

  if (role !== "recruiter") return null;

  async function send() {
    if (!user) return;
    if (!message.trim()) return toast.error("Add a short message");
    setBusy(true);
    const { error } = await supabase.from("invites").insert({
      recruiter_id: user.id,
      developer_id: developerId,
      project_id: projectId === "none" ? null : projectId,
      message: message.trim(),
    });

    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Invite sent to ${developerName}`);
    qc.invalidateQueries({ queryKey: ["invite-existing"] });
    qc.invalidateQueries({ queryKey: ["sent-invites"] });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant ?? "default"}
          size={size}
          className={className ?? "bg-gradient-accent text-primary-foreground hover:opacity-90"}
        >
          <Send className="mr-1.5 h-3.5 w-3.5" /> Invite to work
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite {developerName} to work together</DialogTitle>
          <DialogDescription>
            Send a personal message. Optionally tie it to one of your open projects.
          </DialogDescription>
        </DialogHeader>
        {existing && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            You last invited this developer on {new Date(existing.created_at).toLocaleDateString()} — status: <span className="font-medium capitalize">{existing.status}</span>.
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Project (optional)</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger><SelectValue placeholder="No specific project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific project</SelectItem>
                {projects?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              rows={5}
              value={message}
              maxLength={1000}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${developerName}, I came across your profile and would love to chat about a role we're hiring for...`}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={busy || !message.trim()}
            onClick={send}
            className="bg-gradient-accent text-primary-foreground hover:opacity-90"
          >
            {busy ? "Sending..." : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
