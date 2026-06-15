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
import { Lock, Mail, Phone, ShieldCheck, X, Check, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

interface Props {
  /** The other party whose contact details we want */
  targetUserId: string;
  /** Display name for prompt */
  targetName?: string | null;
}

/**
 * Mutual approval contact-sharing widget.
 * - If approved: shows email + phone + whatsapp + telegram of the target.
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
    staleTime: 1000 * 60,
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

  // Check if target developer made contact public
  const { data: publicInfo } = useQuery({
    queryKey: ["dev-public-contact", targetUserId],
    enabled: !!user && user.id !== targetUserId,
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data: dev } = await supabase
        .from("developer_profiles")
        .select("contact_public")
        .eq("id", targetUserId)
        .maybeSingle();
      if (!dev || !(dev as any).contact_public) return null;
      // RLS on developer_phones lets anyone read when contact_public = true
      const { data: dp } = await supabase
        .from("developer_phones" as any).select("phone, whatsapp, telegram").eq("developer_id", targetUserId).maybeSingle();
      return {
        email: null as string | null,
        phone: (dp as any)?.phone ?? null,
        whatsapp: (dp as any)?.whatsapp ?? null,
        telegram: (dp as any)?.telegram ?? null
      };
    },
  });

  const showContact = isApproved || !!publicInfo;

  // Fetch contact details only when approved (RLS gates these tables)
  const { data: contactInfo } = useQuery({
    queryKey: ["contact-info", targetUserId, isApproved],
    enabled: isApproved && !publicInfo,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const [{ data: dp }, { data: rp }, { data: profile }] = await Promise.all([
        supabase.from("developer_phones" as any).select("phone, whatsapp, telegram").eq("developer_id", targetUserId).maybeSingle(),
        supabase.from("recruiter_phones" as any).select("phone, whatsapp, telegram").eq("recruiter_id", targetUserId).maybeSingle(),
        supabase.from("profiles").select("email").eq("id", targetUserId).maybeSingle()
      ]);
      return {
        email: profile?.email || null,
        phone: (dp as any)?.phone ?? (rp as any)?.phone ?? null,
        whatsapp: (dp as any)?.whatsapp ?? (rp as any)?.whatsapp ?? null,
        telegram: (dp as any)?.telegram ?? (rp as any)?.telegram ?? null
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

  async function revoke() {
    if (!req) return;
    if (!confirm("Are you sure you want to revoke contact access?")) return;
    setBusy(true);
    const { error } = await supabase
      .from("contact_access_requests")
      .delete()
      .eq("id", req.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Access revoked");
    qc.invalidateQueries({ queryKey: ["contact-req", user!.id, targetUserId] });
  }

  // ====== UI States ======
  const info = publicInfo ?? contactInfo;
  if (showContact) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-5 text-sm shadow-sm animate-in fade-in slide-in-from-top-1 duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-success-foreground uppercase tracking-wider text-[10px]">
            <ShieldCheck className="h-4 w-4" /> {publicInfo ? "Contact details (public)" : "Contact access approved"}
          </div>
          {isApproved && (
            <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors" onClick={revoke} disabled={busy}>
              Revoke Access
            </Button>
          )}
        </div>
        <div className="mt-4 space-y-3">
          {info?.email && (
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors border border-border">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Email Address</p>
                   <a href={`mailto:${info.email}`} className="text-sm font-medium hover:text-primary transition-colors">
                    {info.email}
                  </a>
                </div>
              </div>
            </div>
          )}
          {info?.phone && (
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors border border-border">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Phone Number</p>
                   <a href={`tel:${info.phone}`} className="text-sm font-medium hover:text-primary transition-colors">
                    {info.phone}
                  </a>
                </div>
              </div>
            </div>
          )}
          {info?.whatsapp && (
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground group-hover:text-green-500 transition-colors border border-border">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">WhatsApp</p>
                   <a href={`https://wa.me/${info.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="text-sm font-medium hover:text-green-500 transition-colors">
                    {info.whatsapp}
                  </a>
                </div>
              </div>
            </div>
          )}
          {info?.telegram && (
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground group-hover:text-blue-400 transition-colors border border-border">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Telegram</p>
                   <a href={`https://t.me/${info.telegram.replace('@','')}`} target="_blank" rel="noreferrer" className="text-sm font-medium hover:text-blue-400 transition-colors">
                    {info.telegram}
                  </a>
                </div>
              </div>
            </div>
          )}
          {!info?.email && !info?.phone && !info?.whatsapp && !info?.telegram && (
            <p className="text-muted-foreground py-2 italic">The other user has not added detailed contact information yet.</p>
          )}
        </div>
      </div>
    );
  }

  if (req?.status === "pending") {
    if (req.target_id === user.id) {
      // Current user must respond
      return (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5 text-sm shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <p className="font-bold text-foreground text-base">Contact Request</p>
          <p className="text-sm text-muted-foreground mt-1">{targetName ?? "Someone"} wants to access your contact details.</p>
          {req.message && (
            <div className="mt-3 p-3 bg-card border border-border rounded-xl text-xs italic text-muted-foreground">
               "{req.message}"
            </div>
          )}
          <div className="mt-4 flex gap-3">
            <Button size="sm" disabled={busy} onClick={() => respond("approved")}
              className="flex-1 bg-gradient-accent text-primary-foreground hover:opacity-90 shadow-sm">
              <Check className="mr-1.5 h-4 w-4" /> Approve
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => respond("rejected")} className="flex-1">
              <X className="mr-1.5 h-4 w-4" /> Reject
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground flex flex-col items-center text-center gap-3">
        <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border border-border animate-pulse">
           <Lock className="h-4 w-4" />
        </div>
        <p className="font-medium">Waiting for {targetName?.split(' ')[0] ?? 'user'}'s approval...</p>
      </div>
    );
  }

  if (req?.status === "rejected") {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive flex flex-col items-center text-center gap-3">
         <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border border-destructive/20">
           <X className="h-5 w-5" />
        </div>
        <p className="font-bold">Contact access denied.</p>
        <p className="text-xs opacity-80">Your request for contact details was declined by the user.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center text-center">
         <Lock className="h-5 w-5 text-muted-foreground mb-2" />
         <p className="text-xs font-medium text-muted-foreground">Contact details protected</p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="lg" className="w-full h-12 text-base font-semibold group border-primary/20 hover:border-primary/50 transition-all">
            <Lock className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" /> Request contact access
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[450px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Request contact details</DialogTitle>
            <DialogDescription className="text-sm">
              {targetName ?? "This user"} will receive a notification. Your contact details are revealed to each
              other <strong>only after they approve</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <Textarea
              placeholder="Optional message — Why do you want to connect? (e.g. 'I'd like to discuss a React project...')"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={4}
              className="rounded-2xl border-muted-foreground/20 focus:ring-accent resize-none p-4"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={sendRequest} disabled={busy}
              className="bg-gradient-accent text-primary-foreground hover:opacity-90 px-8 rounded-xl h-11">
              {busy ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
