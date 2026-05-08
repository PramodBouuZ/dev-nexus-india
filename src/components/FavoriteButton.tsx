import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  kind: "developer" | "project";
  targetId: string;
  size?: "sm" | "icon" | "default";
  variant?: "ghost" | "outline" | "secondary";
  withLabel?: boolean;
  className?: string;
};

export function FavoriteButton({ kind, targetId, size = "icon", variant = "ghost", withLabel, className }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["fav", kind, targetId, user?.id];

  const { data: fav } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user!.id)
        .eq("kind", kind)
        .eq("target_id", targetId)
        .maybeSingle();
      return data;
    },
  });

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to save");
      return;
    }
    if (fav) {
      const { error } = await supabase.from("favorites").delete().eq("id", fav.id);
      if (error) return toast.error(error.message);
      toast.success("Removed from saved");
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id,
        kind,
        target_id: targetId,
      });
      if (error) return toast.error(error.message);
      toast.success("Saved");
    }
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["my-favorites", user.id] });
  }

  const active = !!fav;
  return (
    <Button
      type="button"
      size={withLabel ? "sm" : size}
      variant={variant}
      onClick={toggle}
      className={cn(active && "text-rose-500 hover:text-rose-600", className)}
      aria-label={active ? "Remove from saved" : "Save"}
    >
      <Heart className={cn("h-4 w-4", active && "fill-current")} />
      {withLabel && <span className="ml-1.5">{active ? "Saved" : "Save"}</span>}
    </Button>
  );
}
