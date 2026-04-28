import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Lock, Mail, Phone, ShieldCheck, X, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  /** The other party whose contact details we want */
  targetUserId: string;
  /** Display name for prompt */
  targetName?: string | null;
}

/**
 * Mutual approval contact-sharing widget.
 * - If approved: shows email + phone of the target.
 * - If pending and current user is target: shows approve/reject.
 * - If pending and current user is requester: shows "waiting".
 * - Otherwise: shows "Request contact access" button.
 */
export function ContactAccess({ targetUserId, targetName }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Latest request between current user and target (either direction)
  const { data: req } = useQuery({
    queryKey: ["contact-req", user?.id, targetUserId],
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
    queryFn: async () => {
      const { data } = await supabase
        .from("contact_access_requests")
        .select("*")
        .or(
          `and(requester_id.eq.${user!.id},target_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},target_id.eq.${user!.id})`,
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const isApproved = req?.status === "approved";

  // Fetch contact details only when approved
  const { data: contactInfo } = useQuery({
    queryKey: ["contact-info", targetUserId, isApproved],
    enabled: isApproved,
    queryFn: async () => {
      const [{ data: prof }, { data: dev }, { data: rec }] = await Promise.all([
        supabase.from("profiles").select("email").eq("id", targetUserId).maybeSingle(),
        supabase.from("developer_profiles").select("phone").eq("id", targetUserId).maybeSingle(),
        supabase.from("recruiter_profiles").select("phone").eq("id", targetUserId).maybeSingle(),
      ]);
      return {
        email: prof?.email ?? null,
        phone: dev?.phone ?? rec?.phone ?? null,
      };
    },
  });

  if (!user || user.id === targetUserId) return null;

  async function sendRequest() {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("contact_access_requests").insert({
      requester_id: user.id,
      target_id: targetUserId,
      message: message.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Contact request sent");
    setOpen(false);
    setMessage("");
    qc.invalidateQueries({ queryKey: ["contact-req", user.id, targetUserId] });
  }

  async function respond(status: "approved" | "rejected") {
    if (!req) return;
    setBusy(true);
    const { error } = await supabase
      .from("contact_access_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", req.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Contact shared" : "Request rejected");
    qc.invalidateQueries({ queryKey: ["contact-req", user!.id, targetUserId] });
  }

  // ====== UI States ======
  if (isApproved) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-sm">
        <div className="flex items-center gap-2 font-medium text-success-foreground">
          <ShieldCheck className="h-4 w-4" /> Contact access approved
        </div>
        <div className="mt-3 space-y-1.5 text-sm">
          {contactInfo?.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={`mailto:${contactInfo.email}`} className="hover:underline">
                {contactInfo.email}
              </a>
            </div>
          )}
          {contactInfo?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={`tel:${contactInfo.phone}`} className="hover:underline">
                {contactInfo.phone}
              </a>
            </div>
          )}
          {!contactInfo?.email && !contactInfo?.phone && (
            <p className="text-muted-foreground">The other user has not added contact details yet.</p>
          )}
        </div>
      </div>
    );
  }

  if (req?.status === "pending") {
    if (req.target_id === user.id) {
      // Current user must respond
      return (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 text-sm">
          <p className="font-medium">{targetName ?? "Someone"} requested your contact details</p>
          {req.message && <p className="mt-1 text-muted-foreground">"{req.message}"</p>}
          <div className="mt-3 flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => respond("approved")}
              className="bg-gradient-accent text-primary-foreground hover:opacity-90">
              <Check className="mr-1 h-4 w-4" /> Approve
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => respond("rejected")}>
              <X className="mr-1 h-4 w-4" /> Reject
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <Lock className="mr-1 inline h-3.5 w-3.5" /> Waiting for approval...
      </div>
    );
  }

  if (req?.status === "rejected") {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Contact request was rejected.
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Lock className="mr-1.5 h-3.5 w-3.5" /> Request contact access
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request contact details</DialogTitle>
          <DialogDescription>
            {targetName ?? "This user"} will be notified. Your contact details are revealed to each
            other only after they approve.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Optional message — why do you want to connect?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={sendRequest} disabled={busy}
            className="bg-gradient-accent text-primary-foreground hover:opacity-90">
            {busy ? "Sending..." : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
