import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Stars } from "@/components/Stars";
import { toast } from "sonner";
import { Star } from "lucide-react";

interface Props {
  contractId: string;
  targetId: string;
  targetName: string;
  onSuccess?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewDialog({ contractId, targetId, targetName, onSuccess, open, onOpenChange }: Props) {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Categories for Developer reviewing Recruiter
  const [comm, setComm] = useState(5);
  const [pay, setPay] = useState(5);
  const [clarity, setClarity] = useState(5);
  const [prof, setProf] = useState(5);

  // Categories for Recruiter reviewing Developer
  const [tech, setTech] = useState(5);
  // Reusing comm for communication
  const [quality, setQuality] = useState(5);
  const [timeline, setTimeline] = useState(5);

  async function handleSubmit() {
    if (!user) return;
    setBusy(true);

    const reviewData: any = {
      contract_id: contractId,
      reviewer_id: user.id,
      reviewee_id: targetId,
      rating: rating,
      comment: comment.trim() || null,
      communication_rating: comm,
    };

    if (role === 'developer') {
      reviewData.payment_timeliness_rating = pay;
      reviewData.requirement_clarity_rating = clarity;
      reviewData.professionalism_rating = prof;
    } else {
      reviewData.technical_skills_rating = tech;
      reviewData.delivery_quality_rating = quality;
      reviewData.timeline_adherence_rating = timeline;
    }

    const { error } = await supabase.from("reviews").insert(reviewData);

    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Review submitted! Thank you.");
    qc.invalidateQueries({ queryKey: ["dev-profile"] });
    qc.invalidateQueries({ queryKey: ["rec-profile"] });
    onOpenChange(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rate your experience with {targetName}</DialogTitle>
          <DialogDescription>
            Your feedback helps maintain trust in the DeveloperConnect community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl">
             <Label className="mb-2 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Overall Rating</Label>
             <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className="p-1 transition-transform hover:scale-110">
                    <Star className={`h-8 w-8 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <CategoryRating label="Communication" value={comm} onChange={setComm} />
             {role === 'developer' ? (
               <>
                 <CategoryRating label="Payment Timeliness" value={pay} onChange={setPay} />
                 <CategoryRating label="Req. Clarity" value={clarity} onChange={setClarity} />
                 <CategoryRating label="Professionalism" value={prof} onChange={setProf} />
               </>
             ) : (
               <>
                 <CategoryRating label="Technical Skills" value={tech} onChange={setTech} />
                 <CategoryRating label="Delivery Quality" value={quality} onChange={setQuality} />
                 <CategoryRating label="Timeline Adherence" value={timeline} onChange={setTimeline} />
               </>
             )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Written Review</Label>
            <Textarea
              id="comment"
              placeholder="What was it like working with them?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={busy || rating === 0}
            className="bg-gradient-accent text-primary-foreground hover:opacity-90 px-8">
            {busy ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryRating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground font-medium">{label}</Label>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} onClick={() => onChange(s)} className="focus:outline-none">
            <Star className={`h-4 w-4 ${s <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
