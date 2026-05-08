// Smart matching utility — score developers against a project
export type DevForMatch = {
  id: string;
  skills: string[] | null;
  hourly_rate_inr: number | null;
  availability_hours_per_week: number | null;
  work_preference: string | null;
  is_verified: boolean;
};

export type ProjectForMatch = {
  tech_stack: string[] | null;
  budget_min_inr: number | null;
  budget_max_inr: number | null;
  hours_per_week: number | null;
  hiring_type: string | null;
  project_type: string | null;
};

const norm = (s: string) => s.toLowerCase().trim();

export function scoreMatch(
  dev: DevForMatch,
  project: ProjectForMatch,
  ratingAvg = 0,
  ratingCount = 0,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Skill overlap — up to 45 pts
  const need = (project.tech_stack ?? []).map(norm);
  const have = (dev.skills ?? []).map(norm);
  if (need.length) {
    const hit = need.filter((s) => have.includes(s)).length;
    const pct = hit / need.length;
    const pts = Math.round(pct * 45);
    score += pts;
    if (hit > 0) reasons.push(`${hit}/${need.length} skills match`);
  } else {
    score += 20; // no requirements — neutral
  }

  // Budget fit — up to 20 pts (hourly only)
  if (
    project.project_type === "hourly" &&
    dev.hourly_rate_inr &&
    project.budget_min_inr &&
    project.budget_max_inr
  ) {
    const r = dev.hourly_rate_inr;
    if (r >= project.budget_min_inr && r <= project.budget_max_inr) {
      score += 20;
      reasons.push("Rate within budget");
    } else if (r < project.budget_min_inr) {
      score += 14;
    } else {
      // overshoot tapered
      const over = (r - project.budget_max_inr) / project.budget_max_inr;
      score += Math.max(0, Math.round(20 * (1 - over)));
    }
  } else if (dev.hourly_rate_inr) {
    score += 10;
  }

  // Availability — up to 15 pts
  if (dev.availability_hours_per_week && project.hours_per_week) {
    if (dev.availability_hours_per_week >= project.hours_per_week) {
      score += 15;
      reasons.push("Available enough hours");
    } else {
      score += Math.round(15 * (dev.availability_hours_per_week / project.hours_per_week));
    }
  } else if (dev.availability_hours_per_week) {
    score += 8;
  }

  // Work preference vs hiring type — up to 10 pts
  const pref = (dev.work_preference ?? "both").toLowerCase();
  const ht = (project.hiring_type ?? "").toLowerCase();
  if (pref === "both") {
    score += 8;
  } else if (
    (pref === "part_time" && (ht === "part_time" || ht === "weekly")) ||
    (pref === "full_time" && (ht === "monthly" || ht === "ongoing"))
  ) {
    score += 10;
    reasons.push("Preference fits");
  } else {
    score += 3;
  }

  // Reputation — up to 10 pts
  if (ratingCount > 0) {
    const pts = Math.round((ratingAvg / 5) * 8 + Math.min(2, ratingCount / 5));
    score += pts;
    reasons.push(`${ratingAvg.toFixed(1)}★ (${ratingCount})`);
  }
  if (dev.is_verified) {
    score += 5;
    reasons.push("Verified");
  }

  return { score: Math.min(100, score), reasons };
}
