import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ContactAccess } from "@/components/ContactAccess";
import { Stars } from "@/components/Stars";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteDeveloperDialog } from "@/components/InviteDeveloperDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Github,
  Globe,
  Linkedin,
  IndianRupee,
  Clock,
  MapPin,
  ShieldCheck,
  Calendar,
  Briefcase,
  CheckCircle2,
  Users,
  Mail,
  MessageSquare,
  Award,
  GraduationCap,
  Languages,
  Percent,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

interface DeveloperProfileDialogProps {
  developerId: string;
  trigger: React.ReactNode;
}

export function DeveloperProfileDialog({ developerId, trigger }: DeveloperProfileDialogProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    enabled: open && !!developerId,
    queryKey: ["dev-profile", developerId],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      if (!developerId) return { dev: null, revs: [], avg: 0, projects: [], completion: 0 };
      const [{ data: dev }, { data: revs }, { data: projects }] = await Promise.all([
        supabase.from("developer_profiles").select("*").eq("id", developerId).maybeSingle(),
        supabase
          .from("reviews")
          .select("*")
          .eq("reviewee_id", developerId)
          .order("created_at", { ascending: false }),
        supabase
          .from("contracts")
          .select("*, projects(title, status)")
          .eq("developer_id", developerId)
          .order("created_at", { ascending: false }),
      ]);

      // Increment view count asynchronously
      supabase.rpc("increment_profile_view", { _developer_id: developerId }).then(() => {});

      const avg = revs?.length ? revs.reduce((s, r) => s + r.rating, 0) / revs.length : 0;

      // Calculate profile completion
      let completion = 20; // base for having an account
      if (dev?.full_name) completion += 10;
      if (dev?.headline) completion += 10;
      if (dev?.bio) completion += 15;
      if (dev?.skills?.length) completion += 15;
      if (dev?.avatar_url) completion += 10;
      if (dev?.experience_years) completion += 10;
      if (dev?.github_url || dev?.portfolio_url || dev?.linkedin_url) completion += 10;

      return { dev, revs: revs ?? [], avg, projects: projects ?? [], completion };
    },
  });

  const dev = data?.dev;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl gap-0 border border-border bg-background shadow-lg">
        {isLoading ? (
          <div className="p-10 space-y-6">
            <div className="h-48 animate-pulse rounded-2xl bg-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          </div>
        ) : !dev ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Profile Not Found</h3>
            <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
              This developer profile is currently unavailable or doesn't exist.
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1">
            {/* Header / Banner area */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-teal-500/20 to-primary/20" />
              <div className="px-6 pb-4">
                <div className="relative -mt-12 flex flex-col sm:flex-row sm:items-end sm:gap-6">
                  <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                    {dev.avatar_url && (
                      <AvatarImage src={dev.avatar_url} alt={dev.full_name ?? "Developer"} />
                    )}
                    <AvatarFallback className="bg-gradient-accent text-3xl font-display font-bold text-primary-foreground">
                      {dev.full_name?.[0] ?? "D"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-4 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl font-bold tracking-tight">
                        {dev.full_name ?? "Developer"}
                      </h2>
                      {dev.is_verified && (
                        <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20 transition-colors gap-1">
                          <ShieldCheck className="h-3.5 w-3.5" /> Verified
                        </Badge>
                      )}
                      <FavoriteButton
                        kind="developer"
                        targetId={developerId}
                        variant="ghost"
                        size="icon"
                        className="ml-auto sm:ml-0"
                      />
                    </div>
                    {dev.headline && (
                      <p className="text-base text-muted-foreground font-medium mt-1">
                        {dev.headline}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      {dev.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> {dev.location}
                        </span>
                      )}
                      {dev.experience_years != null && (
                        <span className="inline-flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5" /> {dev.experience_years} years exp.
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {dev.response_rate ?? 100}% response rate
                      </span>
                      {data.revs.length > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <Stars value={data.avg} size={12} /> {data.avg.toFixed(1)} (
                          {data.revs.length} reviews)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <InviteDeveloperDialog
                    developerId={developerId}
                    developerName={dev.full_name ?? "this developer"}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-12 p-6 border-t border-border bg-background">
              {/* Main Content Tabs */}
              <div className="lg:col-span-8 space-y-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-6 space-x-6 overflow-x-auto no-scrollbar">
                    {["Overview", "Skills", "Portfolio", "Projects", "Reviews", "Experience"].map(
                      (tab) => (
                        <TabsTrigger
                          key={tab}
                          value={tab.toLowerCase()}
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 text-xs font-medium transition-all"
                        >
                          {tab}
                        </TabsTrigger>
                      ),
                    )}
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
                    <Section title="About Me">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {dev.bio || "No biography provided."}
                      </p>
                    </Section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Section title="Languages" icon={Languages}>
                        <div className="flex flex-wrap gap-2">
                          {(dev.languages as any[])?.length ? (
                            (dev.languages as any[]).map((l: any) => (
                              <Badge
                                key={l.name || l}
                                variant="outline"
                                className="px-2.5 py-0.5 text-xs"
                              >
                                {l.name || l}{" "}
                                {l.level && (
                                  <span className="ml-1 text-[9px] opacity-60">({l.level})</span>
                                )}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground">Not specified.</p>
                          )}
                        </div>
                      </Section>
                      <Section title="Profile Completion" icon={Percent}>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Profile health</span>
                            <span className="font-medium text-primary">{data.completion}%</span>
                          </div>
                          <Progress value={data.completion} className="h-1.5" />
                        </div>
                      </Section>
                    </div>

                    <Section title="Recent Work History">
                      {data.projects.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No public work history available.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {data.projects.slice(0, 3).map((p: any) => (
                            <div
                              key={p.id}
                              className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card/50"
                            >
                              <div className="mt-1 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <CheckCircle2 className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-foreground">
                                  {p.projects?.title}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Completed:{" "}
                                  {new Date(p.ended_at || p.created_at).toLocaleDateString()}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge variant="outline" className="text-[9px] uppercase">
                                    {p.projects?.status}
                                  </Badge>
                                  {p.agreed_rate_inr && (
                                    <span className="text-xs font-medium text-primary">
                                      ₹{p.agreed_rate_inr.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>
                  </TabsContent>

                  <TabsContent value="skills" className="space-y-6 focus-visible:outline-none">
                    <Section title="Tech Stack & Skills">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                            Top Skills
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {(dev.skills ?? []).map((s: string) => (
                              <Badge
                                key={s}
                                variant="secondary"
                                className="px-2.5 py-1 text-xs bg-primary/5 text-primary border-primary/10"
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {dev.developer_type && (
                          <div>
                            <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                              Specialization
                            </h3>
                            <div className="flex items-center gap-2 text-base font-medium text-foreground">
                              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                                <ShieldCheck className="h-4 w-4" />
                              </div>
                              {dev.developer_type.replace("_", " ")}
                            </div>
                          </div>
                        )}
                      </div>
                    </Section>

                    <Section title="Certifications" icon={Award}>
                      {(dev.certifications as any[])?.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(dev.certifications as any[]).map((c: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-3 rounded-lg border border-border"
                            >
                              <Award className="h-4 w-4 text-accent shrink-0" />
                              <div>
                                <p className="text-xs font-medium">{c.name}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {c.issuer} • {c.year}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No certifications listed.</p>
                      )}
                    </Section>

                    <Section title="Education" icon={GraduationCap}>
                      {(dev.education as any[])?.length ? (
                        <div className="space-y-4">
                          {(dev.education as any[]).map((e: any, i: number) => (
                            <div key={i} className="flex gap-3">
                              <div className="mt-1 shrink-0">
                                <GraduationCap className="h-4.5 w-4.5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold">{e.degree}</p>
                                <p className="text-xs text-muted-foreground">{e.institution}</p>
                                <p className="text-[10px] text-muted-foreground">{e.year}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No education details listed.
                        </p>
                      )}
                    </Section>
                  </TabsContent>

                  <TabsContent value="portfolio" className="space-y-6 focus-visible:outline-none">
                    <Section title="Portfolio Showcase">
                      {(dev.portfolio_screenshots as string[])?.length ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(dev.portfolio_screenshots as string[]).map((img: string, i: number) => (
                            <div
                              key={i}
                              className="group relative aspect-video overflow-hidden rounded-xl border border-border bg-muted"
                            >
                              <img
                                src={img}
                                alt={`Portfolio ${i + 1}`}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-2xl border-border">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/40 mb-3" />
                          <p className="text-xs text-muted-foreground">
                            No portfolio screenshots uploaded yet.
                          </p>
                        </div>
                      )}
                    </Section>

                    {dev.portfolio_url && (
                      <Button variant="outline" className="w-full gap-2 py-4 text-xs" asChild>
                        <a href={dev.portfolio_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" /> Visit Full Portfolio Website
                        </a>
                      </Button>
                    )}
                  </TabsContent>

                  <TabsContent value="projects" className="space-y-6 focus-visible:outline-none">
                    <Section title="Project History">
                      {data.projects.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No projects recorded on the platform yet.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {data.projects.map((p: any) => (
                            <div
                              key={p.id}
                              className="group rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors shadow-sm"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold group-hover:text-primary transition-colors">
                                    {p.projects?.title}
                                  </h4>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1">
                                      <Calendar className="h-3.5 w-3.5" /> Started{" "}
                                      {new Date(p.started_at).toLocaleDateString()}
                                    </span>
                                    {p.ended_at && (
                                      <span className="inline-flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Completed{" "}
                                        {new Date(p.ended_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge
                                    variant={p.status === "completed" ? "success" : "default"}
                                    className="capitalize text-[10px]"
                                  >
                                    {p.status}
                                  </Badge>
                                  {p.agreed_rate_inr && (
                                    <span className="text-sm font-bold text-foreground">
                                      ₹{p.agreed_rate_inr.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>
                  </TabsContent>

                  <TabsContent value="reviews" className="space-y-6 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="md:col-span-1 rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center shadow-sm">
                        <span className="text-4xl font-bold tracking-tight">
                          {data.avg.toFixed(1)}
                        </span>
                        <div className="mt-2">
                          <Stars value={data.avg} size={18} />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground font-medium">
                          Based on {data.revs.length} reviews
                        </p>
                      </div>
                      <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                          Rating Breakdown
                        </h4>
                        <div className="space-y-3">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = data.revs.filter((r) => r.rating === star).length;
                            const percentage = data.revs.length
                              ? (count / data.revs.length) * 100
                              : 0;
                            return (
                              <div key={star} className="flex items-center gap-4 text-xs">
                                <span className="w-12 font-medium">{star} stars</span>
                                <Progress value={percentage} className="h-1.5 flex-1" />
                                <span className="w-8 text-right text-muted-foreground">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <Section title="Client Testimonials">
                      {data.revs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No reviews yet.</p>
                      ) : (
                        <div className="space-y-6">
                          {data.revs.map((r, i) => (
                            <div
                              key={i}
                              className="rounded-2xl border border-border bg-card/50 p-6 shadow-sm"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                                      {r.reviewer_id?.[0]?.toUpperCase() ?? "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-xs font-semibold">Verified Client</p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {new Date(r.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <Stars value={r.rating} size={14} />
                              </div>

                              {r.comment && (
                                <p className="text-sm text-foreground/90 leading-relaxed italic">
                                  "{r.comment}"
                                </p>
                              )}

                              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <ReviewStat
                                  label="Technical"
                                  score={r.technical_skills_rating || r.rating}
                                />
                                <ReviewStat
                                  label="Communication"
                                  score={r.communication_rating || r.rating}
                                />
                                <ReviewStat
                                  label="Quality"
                                  score={r.delivery_quality_rating || r.rating}
                                />
                                <ReviewStat
                                  label="Timeline"
                                  score={r.timeline_adherence_rating || r.rating}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Section>
                  </TabsContent>

                  <TabsContent value="experience" className="space-y-6 focus-visible:outline-none">
                    <Section title="Work Experience">
                      <p className="text-xs text-muted-foreground italic mb-6">
                        Detailed experience and background.
                      </p>
                      <div className="space-y-8">
                        <div className="relative pl-8 border-l-2 border-primary/20 space-y-8">
                          <div className="relative">
                            <div className="absolute -left-[41px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background" />
                            <h4 className="text-sm font-bold">Freelance Software Developer</h4>
                            <p className="text-xs text-primary font-medium">
                              DeveloperConnect • 2024 - Present
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                              Providing expert development services for various clients across
                              India. Specializing in React, Node.js and full-stack architecture.
                            </p>
                          </div>
                        </div>
                      </div>
                    </Section>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar Info */}
              <aside className="lg:col-span-4 space-y-6">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <IndianRupee className="h-4.5 w-4.5 text-primary" /> Pricing & Rates
                  </h3>
                  <dl className="space-y-4">
                    <StatRow
                      label="Hourly Rate"
                      value={dev.hourly_rate_inr ? `₹${dev.hourly_rate_inr.toLocaleString()}` : "—"}
                      highlight
                    />
                    <Separator />
                    <StatRow
                      label="Weekly Rate"
                      value={dev.weekly_rate_inr ? `₹${dev.weekly_rate_inr.toLocaleString()}` : "—"}
                    />
                    <StatRow
                      label="Monthly Rate"
                      value={
                        dev.monthly_rate_inr ? `₹${dev.monthly_rate_inr.toLocaleString()}` : "—"
                      }
                    />
                    <StatRow
                      label="Min. Project"
                      value={dev.project_min_inr ? `₹${dev.project_min_inr.toLocaleString()}` : "—"}
                    />
                  </dl>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-primary" /> Availability
                  </h3>
                  <dl className="space-y-4">
                    <StatRow
                      label="Work Mode"
                      value={(dev.work_preference ?? "—").toString().replace("_", " ")}
                    />
                    <StatRow
                      label="Daily Capacity"
                      value={dev.hours_per_day ? `${dev.hours_per_day} hrs/day` : "—"}
                    />
                    <StatRow
                      label="Weekly Capacity"
                      value={
                        dev.availability_hours_per_week
                          ? `${dev.availability_hours_per_week} hrs/week`
                          : "—"
                      }
                    />
                    <StatRow
                      label="Work Days"
                      value={dev.available_days?.length ? dev.available_days.join(", ") : "—"}
                    />
                    {dev.time_slots && <StatRow label="Preferred Slots" value={dev.time_slots} />}
                  </dl>
                  <div className="mt-6">
                    {dev.is_available ? (
                      <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-success/10 text-success font-semibold text-xs border border-success/20">
                        <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Ready for
                        new projects
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted text-muted-foreground font-semibold text-xs border border-border">
                        Currently fully booked
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <Percent className="h-4.5 w-4.5 text-primary" /> Platform Stats
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-xl font-bold">{dev.completed_projects ?? 0}</p>
                      <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">
                        Completed
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-xl font-bold">{dev.active_projects ?? 0}</p>
                      <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">
                        Active
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-xl font-bold">{dev.total_invitations_received ?? 0}</p>
                      <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">
                        Invites
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/50 text-center">
                      <p className="text-xl font-bold">{dev.response_rate ?? 100}%</p>
                      <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-wider">
                        Response
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground px-1">
                    <span>Total profile views</span>
                    <span className="font-medium text-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {dev.profile_views ?? 0}
                    </span>
                  </div>
                </div>

                {(dev.github_url || dev.portfolio_url || dev.linkedin_url) && (
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                    <h3 className="font-bold text-sm mb-4">Connect</h3>
                    <div className="space-y-2">
                      {dev.github_url && (
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-10 text-xs"
                          asChild
                        >
                          <a href={dev.github_url} target="_blank" rel="noreferrer">
                            <Github className="h-3.5 w-3.5" /> GitHub
                          </a>
                        </Button>
                      )}
                      {dev.linkedin_url && (
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-10 text-xs text-blue-600 border-blue-100 hover:bg-blue-50"
                          asChild
                        >
                          <a href={dev.linkedin_url} target="_blank" rel="noreferrer">
                            <Linkedin className="h-3.5 w-3.5 fill-current" /> LinkedIn
                          </a>
                        </Button>
                      )}
                      {dev.portfolio_url && (
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3 h-10 text-xs text-teal-600 border-teal-100 hover:bg-teal-50"
                          asChild
                        >
                          <a href={dev.portfolio_url} target="_blank" rel="noreferrer">
                            <Globe className="h-3.5 w-3.5" /> Portfolio
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <MessageSquare className="h-4.5 w-4.5 text-primary" /> Contact Information
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    To protect privacy, contact details are hidden until access is requested and
                    approved.
                  </p>
                  <ContactAccess
                    targetUserId={developerId}
                    targetName={dev.full_name ?? "this developer"}
                  />
                </div>
              </aside>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewStat({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground tracking-tighter">
        <span>{label}</span>
        <span>{score}/5</span>
      </div>
      <Progress value={score * 20} className="h-1" />
    </div>
  );
}

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`text-xs font-semibold capitalize ${highlight ? "text-sm text-primary font-bold" : "text-foreground"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function Section({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: any;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="h-4.5 w-4.5 text-primary" />}
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
          {title}
        </h2>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Separator() {
  return <div className="h-px w-full bg-border my-2" />;
}
