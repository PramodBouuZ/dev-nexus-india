import { Link } from "@tanstack/react-router";
import { Code2 } from "lucide-react";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const icon = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span className={`flex ${dim} items-center justify-center rounded-lg bg-gradient-accent text-primary-foreground shadow-glow`}>
      <Code2 className={icon} />
    </span>
  );
}

export function BrandWordmark() {
  return (
    <span className="font-display text-lg font-bold tracking-tight">
      Developer<span className="text-accent">Connect</span>
    </span>
  );
}

export function PoweredByBant({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${className}`}>
      <span className="text-muted-foreground">Powered by</span>
      <span className="font-display font-bold tracking-tight">
        <span className="text-[oklch(0.5_0.18_255)]">BANT</span>
        <span className="text-[oklch(0.78_0.15_85)]">Confirm</span>
      </span>
    </span>
  );
}

export function BrandLink() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <BrandMark />
      <BrandWordmark />
    </Link>
  );
}
