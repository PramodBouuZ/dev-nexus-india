import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Sparkles, IndianRupee, Clock } from "lucide-react";
import { scoreMatch, type ProjectForMatch, type DevForMatch } from "@/lib/matching";

export function TopMatches({ project, projectId }: { project: ProjectForMatch; projectId: string }) {
  const { data: matches = [] } = useQuery({
    queryKey: ["matches", projectId],
    queryFn: async () => {
      const { data: devs } = await supabase
        .from("developer_profiles")
        .select("id, skills, hourly_rate_inr, availability_hours_per_week, work_preference, is_verified, headline, full_name");
      if (!devs?.length) return [];
      const ids = devs.map((d) => d.id);
      const { data: revs } = await supabase.from("reviews").select("reviewee_id, rating").in("reviewee_id", ids);
      const ratingMap = new Map<string, { avg: number; count: number }>();
      for (const id of ids) {
        const mine = (revs ?? []).filter((r) => r.reviewee_id === id);
        ratingMap.set(id, {
          avg: mine.length ? mine.reduce((s, r) => s + r.rating, 0) / mine.length : 0,
          count: mine.length,
        });
      }
      const ranked = devs
        .map((d) => {
          const r = ratingMap.get(d.id) ?? { avg: 0, count: 0 };
          const { score, reasons } = scoreMatch(d as DevForMatch, project, r.avg, r.count);
          return { ...d, full_name: d.full_name ?? "Developer", score, reasons };
        })
        .filter((d) => d.score >= 30)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
      return ranked;
    },
  });

  if (matches.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h2 className="font-display text-xl font-semibold">Top matched developers</h2>
      </div>
      <p className="text-xs text-muted-foreground">Ranked by skills, budget fit, availability and reputation.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {matches.map((m) => (
          <Link
            key={m.id}
            to="/developers/$devId"
            params={{ devId: m.id }}
            className="group rounded-xl border border-border bg-card p-4 shadow-card transition-all hover:border-accent/40 hover:shadow-elegant"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold group-hover:text-accent transition-colors">{m.full_name}</p>
                  {m.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />}
                </div>
                {m.headline && <p className="truncate text-xs text-muted-foreground">{m.headline}</p>}
              </div>
              <div className="shrink-0 rounded-full bg-gradient-accent px-2.5 py-1 text-xs font-bold text-primary-foreground">
                {m.score}% match
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {m.reasons.slice(0, 3).map((r, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">{r}</Badge>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              {m.hourly_rate_inr && (
                <span className="inline-flex items-center gap-1"><IndianRupee className="h-3 w-3" />{m.hourly_rate_inr}/hr</span>
              )}
              {m.availability_hours_per_week && (
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{m.availability_hours_per_week} hrs/wk</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
