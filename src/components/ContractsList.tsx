import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Stars } from "@/components/Stars";
import { toast } from "sonner";
import { CheckCircle2, MessageSquare, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

type Contract = {
  id: string;
  status: string;
  recruiter_id: string;
  developer_id: string;
  application_id: string | null;
  agreed_rate_inr: number | null;
  started_at: string;
  ended_at: string | null;
  projects: { title: string } | null;
};

interface Props {
  userId: string;
  role: "developer" | "recruiter";
}

export function ContractsList({ userId, role }: Props) {
  const qc = useQueryClient();
  const column = role === "recruiter" ? "recruiter_id" : "developer_id";

  const { data: contracts } = useQuery({
    queryKey: ["contracts-with-reviews", role, userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("contracts")
        .select("*, projects(title)")
        .eq(column, userId)
        .order("created_at", { ascending: false });
      const list = (data ?? []) as Contract[];
      if (!list.length) return [];
      const ids = list.map(c => c.id);
      const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .in("contract_id", ids);
      return list.map(c => ({
        ...c,
        myReview: reviews?.find(r => r.contract_id === c.id && r.reviewer_id === userId) ?? null,
        otherReview: reviews?.find(r => r.contract_id === c.id && r.reviewer_id !== userId) ?? null,
      }));
    },
  });

  async function markComplete(id: string) {
    const { error } = await supabase
      .from("contracts")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Contract marked complete. Leave a review!");
    qc.invalidateQueries({ queryKey: ["contracts-with-reviews"] });
  }

  if (!contracts || contracts.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold">Contracts</h2>
      <div className="mt-4 space-y-3">
        {contracts.map(c => {
          const otherUserId = role === "recruiter" ? c.developer_id : c.recruiter_id;
          return (
            <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{c.projects?.title ?? "Project"}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Started {new Date(c.started_at).toLocaleDateString()}
                    {c.ended_at && ` · Ended ${new Date(c.ended_at).toLocaleDateString()}`}
                    {c.agreed_rate_inr && ` · ₹${c.agreed_rate_inr.toLocaleString()}`}
                  </p>
                </div>
                <Badge variant={c.status === "active" ? "default" : c.status === "completed" ? "secondary" : "outline"}>
                  {c.status}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {c.application_id && (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/applications/$appId" params={{ appId: c.application_id }}>
                      <MessageSquare className="mr-1 h-3.5 w-3.5" /> Chat
                    </Link>
                  </Button>
                )}
                {c.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => markComplete(c.id)}>
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark complete
                  </Button>
                )}
                {c.status === "completed" && !c.myReview && (
                  <ReviewDialog contractId={c.id} revieweeId={otherUserId} />
                )}
                {c.myReview && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Stars value={c.myReview.rating} size={14} />
                    <span>your review</span>
                  </div>
                )}
              </div>

              {c.otherReview && (
                <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Stars value={c.otherReview.rating} size={14} />
                    <span className="text-xs text-muted-foreground">
                      {role === "recruiter" ? "Developer's review of you" : "Recruiter's review of you"}
                    </span>
                  </div>
                  {c.otherReview.comment && <p className="mt-1.5 whitespace-pre-wrap">{c.otherReview.comment}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ReviewDialog({ contractId, revieweeId }: { contractId: string; revieweeId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      contract_id: contractId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      comment: comment.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Review submitted!");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["contracts-with-reviews"] });
    qc.invalidateQueries({ queryKey: ["dev-reviews", revieweeId] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-accent text-primary-foreground hover:opacity-90">
          <Star className="mr-1 h-3.5 w-3.5" /> Leave review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How was your experience?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <Stars value={rating} size={28} onChange={setRating} />
          </div>
          <div className="space-y-2">
            <Label>Comment (optional)</Label>
            <Textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              placeholder="Share what went well or what could improve..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={busy}
            onClick={submit}
            className="bg-gradient-accent text-primary-foreground hover:opacity-90"
          >
            {busy ? "Submitting..." : "Submit review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
