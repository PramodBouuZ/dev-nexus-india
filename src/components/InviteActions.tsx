import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pencil, X } from "lucide-react";

interface Props {
  inviteId: string;
  developerName: string;
  currentMessage: string | null;
}

export function InviteActions({ inviteId, developerName, currentMessage }: Props) {
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [message, setMessage] = useState(currentMessage ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (editOpen) setMessage(currentMessage ?? ""); }, [editOpen, currentMessage]);

  async function saveAndResend() {
    if (!message.trim()) return toast.error("Message can't be empty");
    setBusy(true);
    const { error } = await supabase
      .from("invites")
      .update({ message: message.trim(), updated_at: new Date().toISOString() })
      .eq("id", inviteId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Invite to ${developerName} updated`);
    qc.invalidateQueries({ queryKey: ["sent-invites"] });
    setEditOpen(false);
  }

  async function cancel() {
    setBusy(true);
    const { error } = await supabase
      .from("invites")
      .update({ status: "withdrawn" })
      .eq("id", inviteId);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Invite cancelled");
    qc.invalidateQueries({ queryKey: ["sent-invites"] });
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
        <Pencil className="mr-1 h-3 w-3" /> Edit & resend
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
            <X className="mr-1 h-3 w-3" /> Cancel invite
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invite to {developerName}?</AlertDialogTitle>
            <AlertDialogDescription>
              They won't be able to accept it anymore. You can send a new invite later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep invite</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={cancel}>Cancel invite</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit invite to {developerName}</DialogTitle>
            <DialogDescription>Update your message and resend.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea rows={5} value={message} maxLength={1000} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Close</Button>
            <Button
              disabled={busy || !message.trim()}
              onClick={saveAndResend}
              className="bg-gradient-accent text-primary-foreground hover:opacity-90"
            >
              {busy ? "Saving..." : "Save & resend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
