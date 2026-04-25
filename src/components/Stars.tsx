import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarsProps {
  value: number;
  max?: number;
  size?: number;
  className?: string;
  onChange?: (v: number) => void;
}

export function Stars({ value, max = 5, size = 16, className, onChange }: StarsProps) {
  const interactive = !!onChange;
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(value);
        return (
          <button
            type="button"
            key={i}
            disabled={!interactive}
            onClick={() => onChange?.(i + 1)}
            className={cn(
              "transition-transform",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default",
            )}
            aria-label={`${i + 1} star${i === 0 ? "" : "s"}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                filled ? "fill-warning text-warning" : "fill-transparent text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
