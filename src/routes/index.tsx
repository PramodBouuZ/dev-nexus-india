import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PoweredByBant } from "@/components/Brand";
import { TrustedBy } from "@/components/TrustedBy";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  Sparkles, Zap, ShieldCheck, Clock, IndianRupee, Code2, Users, ArrowRight,
  CheckCircle2, MapPin, Briefcase, MessageSquare, Send, Bell, Check, UserPlus,
  Rocket, Search, Layout, ListTodo,
} from "lucide-react";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hire Developers in India Part-Time or Full-Time | DeveloperConnect" },
      { name: "description", content: "DeveloperConnect is India's premium structured marketplace for hiring vetted part-time and full-time developers. Post projects, send invites, and collaborate securely with top Indian tech talent." },
      { name: "keywords", content: "hire developers in India, part-time developers India, freelance developers India, hire React developers India, hire Node.js developers, full stack developers India, tech hiring marketplace, remote developers India, startup hiring platform India, developer marketplace India" },
      { property: "og:title", content: "Hire Developers in India Part-Time or Full-Time | DeveloperConnect" },
      { property: "og:description", content: "DeveloperConnect is India's premium structured marketplace for hiring vetted part-time and full-time developers. Post projects, send invites, and collaborate securely." },
      { property: "og:url", content: "https://developerconnect.in/" },
      { tag: "link", rel: "canonical", href: "https://developerconnect.in/" },
    ],
  }),
  component: Landing,
});

type DevCard = {
  id: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  skills: string[] | null;
  hourly_rate_inr: number | null;
  is_verified: boolean;
  full_name: string | null;
};

type ProjectCard = {
  id: string;
  title: string;
  description: string;
  budget_min_inr: number | null;
  budget_max_inr: number | null;
  hours_per_week: number | null;
  tech_stack: string[] | null;
  project_type: string;
};

function InteractiveDashboardPreview() {
  const [step, setStep] = useState(0);
  const steps = [
    { label: "Recruiter posts a project", icon: Rocket },
    { label: "Developers apply", icon: Users },
    { label: "Recruiter reviews profiles", icon: Search },
    { label: "Invite sent", icon: Send },
    { label: "Developer receives notification", icon: Bell },
    { label: "Developer accepts invite", icon: Check },
    { label: "Chat window opens", icon: MessageSquare },
    { label: "Project assigned", icon: UserPlus },
    { label: "Collaboration starts", icon: Sparkles },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="relative mx-auto mt-16 max-w-5xl px-4 lg:px-0">
      <div className="glass-dark overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        {/* Browser Top Bar */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/50" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
            <div className="h-3 w-3 rounded-full bg-green-500/50" />
          </div>
          <div className="mx-auto flex h-6 w-1/2 items-center justify-center rounded bg-white/5 text-[10px] text-white/40">
            developerconnect.in/dashboard
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="grid h-[400px] grid-cols-[200px_1fr] md:h-[500px]">
          {/* Sidebar */}
          <div className="hidden border-r border-white/10 bg-white/2 px-4 py-6 md:block">
            <div className="space-y-4">
              {[Layout, ListTodo, Users, MessageSquare, Bell].map((Icon, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/40">
                  <Icon className="h-4 w-4" />
                  <div className="h-2 w-16 rounded bg-white/10" />
                </div>
              ))}
            </div>
          </div>

          {/* Main Area */}
          <div className="relative overflow-hidden p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="h-full"
              >
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white">{steps[step].label}</h3>
                      <div className="h-1 w-24 rounded bg-accent/50" />
                    </div>
                    <div className="rounded-full bg-accent/10 p-2">
                      {(() => {
                        const Icon = steps[step].icon;
                        return <Icon className="h-5 w-5 text-accent" />;
                      })()}
                    </div>
                  </div>

                  {/* Dynamic Content based on Step */}
                  <div className="flex-1 rounded-xl border border-white/5 bg-white/2 p-4">
                    {step === 0 && (
                      <div className="space-y-4">
                        <div className="h-4 w-3/4 rounded bg-white/10" />
                        <div className="h-20 w-full rounded bg-white/5" />
                        <div className="flex justify-end">
                          <div className="h-8 w-24 rounded bg-accent" />
                        </div>
                      </div>
                    )}
                    {step === 1 && (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 rounded bg-white/5 p-2">
                            <div className="h-8 w-8 rounded-full bg-white/10" />
                            <div className="flex-1 space-y-1">
                              <div className="h-3 w-24 rounded bg-white/10" />
                              <div className="h-2 w-32 rounded bg-white/5" />
                            </div>
                            <div className="h-6 w-12 rounded bg-white/10" />
                          </div>
                        ))}
                      </div>
                    )}
                    {step === 6 && (
                      <div className="flex h-full flex-col">
                        <div className="flex-1 space-y-2">
                          <div className="ml-auto w-2/3 rounded-lg bg-accent/20 p-2 text-[10px] text-white">
                            Hi, I loved your portfolio!
                          </div>
                          <div className="w-2/3 rounded-lg bg-white/10 p-2 text-[10px] text-white">
                            Thanks! Would love to discuss the project.
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
                          <div className="h-8 flex-1 rounded bg-white/5" />
                          <div className="h-8 w-8 rounded bg-accent flex items-center justify-center">
                            <Send className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Placeholder for other steps */}
                    {![0, 1, 6].includes(step) && (
                      <div className="flex h-full items-center justify-center">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="text-white/20"
                        >
                          {(() => {
                            const Icon = steps[step].icon;
                            return <Icon className="h-16 w-16" />;
                          })()}
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -left-12 -top-12 -z-10 h-64 w-64 rounded-full bg-accent/20 blur-[100px]" />
      <div className="absolute -right-12 -bottom-12 -z-10 h-64 w-64 rounded-full bg-primary-glow/20 blur-[100px]" />
    </div>
  );
}

function Landing() {
  const { user } = useAuth();

  const { data: developers = [] } = useQuery<DevCard[]>({
    queryKey: ["showcase-developers"],
    queryFn: async () => {
      const { data: devs } = await supabase
        .from("developer_profiles")
        .select("id, headline, bio, location, skills, hourly_rate_inr, is_verified, full_name")
        .order("is_verified", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(6);
      return (devs ?? []) as DevCard[];
    },
  });

  const { data: projects = [] } = useQuery<ProjectCard[]>({
    queryKey: ["showcase-projects"],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, title, description, budget_min_inr, budget_max_inr, hours_per_week, tech_stack, project_type")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(6);
      return (data ?? []) as ProjectCard[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [devs, projs, contracts] = await Promise.all([
        supabase.from("developer_profiles").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("contracts").select("*", { count: "exact", head: true }),
      ]);
      return {
        developers: devs.count ?? 0,
        projects: projs.count ?? 0,
        contracts: contracts.count ?? 0,
      };
    },
  });

  const { data: trendingSkills = [] } = useQuery({
    queryKey: ["trending-skills"],
    queryFn: async () => {
      const { data: ps } = await supabase
        .from("projects")
        .select("tech_stack, created_at")
        .order("created_at", { ascending: false })
        .limit(80);
      const counts = new Map<string, number>();
      for (const p of ps ?? []) {
        for (const s of (p.tech_stack ?? []) as string[]) {
          const k = s.trim();
          if (!k) continue;
          counts.set(k, (counts.get(k) ?? 0) + 1);
        }
      }
      return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, oklch(0.72 0.16 195 / 0.4), transparent 40%), radial-gradient(circle at 80% 70%, oklch(0.6 0.18 250 / 0.3), transparent 40%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8 lg:pt-32">
            <div className="mx-auto max-w-4xl text-center">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium backdrop-blur-sm"
              >
                <Sparkles className="h-3.5 w-3.5" /> Built for India's developer economy
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
              >
                Hire Developers in India <br />
                <span className="text-gradient-accent">Part-time or Full-time.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mx-auto mt-6 max-w-2xl text-base text-white/80 sm:text-lg"
              >
                Developer Connect is a structured marketplace built for fair pricing and fast hiring.
                Post your project, discover skilled developers, send invites, collaborate securely, and deliver projects faster.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              >
                <Button asChild size="lg" className="h-14 px-8 text-lg font-semibold bg-gradient-accent text-primary-foreground shadow-glow hover:opacity-90">
                  <Link to="/auth">
                    Post a Project <ArrowRight className="ml-1 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <Link to="/auth">I'm a Developer</Link>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex items-center justify-center gap-8 text-white/60"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  <span className="text-xs font-medium">Verified Developers</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-accent" />
                  <span className="text-xs font-medium">Secure Messaging</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  <span className="text-xs font-medium">Fast Hiring</span>
                </div>
              </motion.div>

              <InteractiveDashboardPreview />
            </div>
          </div>
        </section>

        <TrustedBy />

        {/* ANIMATED STATISTICS */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {(() => {
                const demo = { developers: 1250, projects: 480, contracts: 320 };
                const show = user
                  ? { developers: stats?.developers ?? 0, projects: stats?.projects ?? 0, contracts: stats?.contracts ?? 0 }
                  : {
                      developers: Math.max(demo.developers, stats?.developers ?? 0),
                      projects: Math.max(demo.projects, stats?.projects ?? 0),
                      contracts: Math.max(demo.contracts, stats?.contracts ?? 0),
                    };
                return (
                  <>
                    <Counter value={show.developers} label="Developers" />
                    <Counter value={show.projects} label="Projects Posted" />
                    <Counter value={show.contracts} label="Hiring Engagements" />
                    <div className="text-center">
                      <div className="font-display text-2xl font-bold tracking-tight md:text-3xl text-accent">
                        Growing
                      </div>
                      <div className="mt-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">Across India</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </section>

        {/* TECHNOLOGY BADGES */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Popular technologies</span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Hire developers for top skills</h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {[
                "React", "Next.js", "Node.js", "Python", "AI/ML", "Flutter",
                "Laravel", "PHP", "Java", "DevOps", "AWS", "MongoDB"
              ].map((skill) => (
                <motion.div
                  key={skill}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="px-6 py-3 rounded-xl border border-border bg-card text-sm font-bold shadow-sm flex items-center gap-2 cursor-default"
                >
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  {skill}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES CAROUSEL */}
        <section className="bg-muted/30 py-24 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to hire or get hired.</h2>
              <p className="mt-4 text-muted-foreground">
                DeveloperConnect provides the tools to streamline the entire recruitment lifecycle.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="flex animate-scroll hover:[animation-play-state:paused] gap-6 w-max px-4">
              {[...features, ...features].map((f, i) => (
                <div key={i} className="w-[300px] flex-shrink-0 group rounded-2xl border border-border bg-card p-8 shadow-card transition-all hover:border-accent/40 hover:shadow-elegant">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-accent text-primary-foreground shadow-sm">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How DeveloperConnect Works</h2>
              <p className="mt-4 text-muted-foreground">The seamless journey from account creation to project delivery.</p>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border hidden md:block -translate-x-1/2" />

              <div className="space-y-16">
                {[
                  { title: "Create Account", desc: "Join as a developer or recruiter in seconds with Google or email.", icon: UserPlus },
                  { title: "Build Your Profile", desc: "Showcase your skills, experience, and portfolio for maximum visibility.", icon: Layout },
                  { title: "Post Project or Apply", desc: "Recruiters post needs; developers find their next big opportunity.", icon: Rocket },
                  { title: "Send or Receive Invites", desc: "Direct connections via invites or structured application reviews.", icon: Send },
                  { title: "Start Discussion", desc: "Deep dive into requirements using our secure messaging system.", icon: MessageSquare },
                  { title: "Assign Project", desc: "Formalize the engagement with one click and set clear milestones.", icon: CheckCircle2 },
                  { title: "Deliver & Grow", desc: "Build amazing products, get paid fairly, and grow your reputation.", icon: Sparkles },
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    className={`relative flex items-center gap-8 md:gap-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                    initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                  >
                    <div className="flex-1 md:w-1/2">
                      <div className={`p-6 rounded-2xl border border-border bg-card shadow-card ${i % 2 === 0 ? "md:mr-12" : "md:ml-12"}`}>
                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent font-bold">
                            {i + 1}
                          </div>
                          <h3 className="font-display text-xl font-bold">{step.title}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                      </div>
                    </div>

                    {/* Timeline Node */}
                    <div className="absolute left-0 md:left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-accent text-white shadow-lg z-10 hidden md:flex">
                      <step.icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 hidden md:block md:w-1/2" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* JOURNEYS */}
        <section className="bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Recruiter Journey */}
              <div className="rounded-3xl bg-white p-8 shadow-card border border-border">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                  <Briefcase className="text-accent" /> Recruiter Journey
                </h3>
                <div className="space-y-6">
                  {[
                    "Post Project", "Receive Applications", "Review Developers",
                    "Send Invites", "Discuss Requirements", "Assign Project"
                  ].map((step, i, arr) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">
                        {i + 1}
                      </div>
                      <span className="font-medium">{step}</span>
                      {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground/30 ml-auto" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Developer Journey */}
              <div className="rounded-3xl bg-primary text-primary-foreground p-8 shadow-elegant">
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white">
                  <Code2 className="text-accent" /> Developer Journey
                </h3>
                <div className="space-y-6">
                  {[
                    "Create Profile", "Showcase Skills", "Apply for Projects",
                    "Receive Invites", "Connect with Recruiters", "Start Working"
                  ].map((step, i, arr) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-white text-xs font-bold">
                        {i + 1}
                      </div>
                      <span className="font-medium text-white/90">{step}</span>
                      {i < arr.length - 1 && <ArrowRight className="h-4 w-4 text-white/20 ml-auto" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIVE ACTIVITY FEED */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-lg">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Live Platform Activity</h2>
                <p className="mt-4 text-muted-foreground">
                  The marketplace is buzzing. See what's happening right now on DeveloperConnect across India.
                </p>
                <div className="mt-8 flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-muted flex items-center justify-center overflow-hidden">
                        <img src={`https://i.pravatar.cc/150?u=user${i}`} alt="Avatar" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground"><span className="text-accent font-bold">120+</span> active users online</p>
                </div>
              </div>

              <div className="w-full max-w-md">
                <LiveActivityFeed />
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="bg-muted/30 py-24 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Trusted by Founders & Developers</h2>
              <p className="mt-4 text-muted-foreground">See why industry leaders choose DeveloperConnect for their tech needs.</p>
            </div>
          </div>
          <div className="relative">
            <div className="flex animate-scroll-reverse hover:[animation-play-state:paused] gap-6 w-max px-4">
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="w-[350px] flex-shrink-0 group rounded-2xl border border-border bg-card p-8 shadow-card">
                  <div className="flex items-center gap-4 mb-6">
                    <img src={t.avatar} alt={t.name} className="h-12 w-12 rounded-full border border-border" />
                    <div>
                      <h4 className="font-bold text-sm">{t.name}</h4>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-sm italic text-muted-foreground leading-relaxed">"{t.quote}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DEVELOPER SHOWCASE */}
        <section className="bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">Featured developers</span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Top talent, ready to ship</h2>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  A glimpse of the developers building on Developer Connect right now.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/developers">
                  Browse all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {(developers.length ? developers : sampleDevelopers).map((d) => (
                <DeveloperShowcaseCard key={d.id} dev={d} />
              ))}
            </div>
          </div>
        </section>

        {/* PROJECT SHOWCASE */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Open projects</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">What teams are hiring for</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Real projects posted by recruiters. Apply in one click once you sign up.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/projects">
                See all projects <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(projects.length ? projects : sampleProjects).map((p) => (
              <ProjectShowcaseCard key={p.id} project={p} />
            ))}
          </div>
        </section>

        {/* SEO CONTENT SECTION */}
        <section className="bg-muted/50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight">Why hire developers from DeveloperConnect?</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Finding the right tech talent in India shouldn't take weeks. DeveloperConnect is a specialized <strong>developer marketplace platform</strong> designed to connect startups with vetted <strong>freelance developers in India</strong> and <strong>full-time developers</strong>.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span><strong>Hire React developers</strong> and <strong>Node.js developers</strong> with proven track records.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span>Access a curated pool of <strong>full stack developers</strong> and <strong>backend developers</strong> ready to ship.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span>Flexible hiring: Choose from <strong>part-time developers</strong> or dedicated remote talent.</span>
                  </li>
                </ul>
              </div>
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight">Benefits for Startups</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  As a leading <strong>startup hiring platform</strong>, we understand the need for speed and quality. Our <strong>software developers marketplace</strong> ensures you get matched with <strong>affordable developers in India</strong> without compromising on technical excellence.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="font-bold text-accent">Remote First</h4>
                    <p className="text-xs text-muted-foreground mt-1">Hire top <strong>remote developers</strong> from anywhere in India.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="font-bold text-accent">Vetted Quality</h4>
                    <p className="text-xs text-muted-foreground mt-1">Only the top 1% of <strong>web developers in India</strong> make the cut.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-20">
              <h3 className="text-center font-display text-2xl font-bold">Popular Hiring Categories</h3>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {["Frontend Developers", "Backend Developers", "Full Stack Developers", "Mobile App Developers", "DevOps Engineers", "UI/UX Designers", "React Native Developers", "Python Developers"].map(cat => (
                  <Badge key={cat} variant="outline" className="px-4 py-2 text-sm">{cat}</Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-hero p-12 text-center text-primary-foreground shadow-elegant md:p-24">
            <div
              className="absolute inset-0 opacity-40"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, oklch(0.72 0.16 195 / 0.5), transparent 50%)" }}
            />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Ready to Build Faster?</h2>
              <p className="mx-auto mt-8 text-lg text-white/80 md:text-xl">
                Connect with skilled developers or discover your next opportunity through DeveloperConnect. Join India's premium hiring marketplace.
              </p>
              <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="h-14 px-10 text-lg font-bold bg-gradient-accent text-primary-foreground shadow-glow hover:opacity-90">
                  <Link to="/auth">Post a Project</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <Link to="/auth">Create Developer Profile</Link>
                </Button>
              </div>
            </div>
            {/* Decorative background circle */}
            <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-accent/20 blur-[120px]" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Counter({ value, label, suffix = "+" }: { value: number; label: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = value;
    if (start === end) return;

    let totalDuration = 2000;
    let incrementTime = Math.max((totalDuration / end), 10);

    let timer = setInterval(() => {
      start = Math.min(start + Math.ceil(end / 100), end);
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, isInView]);

  return (
    <motion.div
      className="text-center"
      onViewportEnter={() => setIsInView(true)}
      viewport={{ once: true }}
    >
      <div className="font-display text-4xl font-bold tracking-tight md:text-5xl">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="mt-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
    </motion.div>
  );
}

function LiveActivityFeed() {
  const [activities, setActivities] = useState([
    { id: 1, text: "New project posted: 'Build a fintech dashboard'", time: "Just now", icon: Rocket, color: "text-blue-500" },
    { id: 2, text: "New developer joined: 'Frontend Specialist'", time: "2m ago", icon: UserPlus, color: "text-green-500" },
    { id: 3, text: "Invite accepted by 'Aarav Mehta'", time: "5m ago", icon: Check, color: "text-accent" },
    { id: 4, text: "Project assigned: 'Next.js Migration'", time: "12m ago", icon: CheckCircle2, color: "text-purple-500" },
    { id: 5, text: "Contact request approved", time: "18m ago", icon: ShieldCheck, color: "text-orange-500" },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      const texts = [
        "New project posted: 'AI Chatbot Integration'",
        "New developer joined from Bengaluru",
        "Invite sent to 'Neha Gupta'",
        "Contact request from 'Recruiter X'",
        "Project assigned: 'React Native App'",
      ];
      const icons = [Rocket, UserPlus, Send, MessageSquare, CheckCircle2];
      const newActivity = {
        id: Date.now(),
        text: texts[Math.floor(Math.random() * texts.length)],
        time: "Just now",
        icon: icons[Math.floor(Math.random() * icons.length)],
        color: "text-accent",
      };
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {activities.map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: 20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={{ opacity: 0, x: -20, height: 0 }}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm overflow-hidden"
          >
            <div className={`rounded-lg bg-muted p-2 ${a.color}`}>
              <a.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{a.text}</p>
              <p className="text-[10px] text-muted-foreground">{a.time}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function DeveloperShowcaseCard({ dev }: { dev: DevCard }) {
  const initials = (dev.full_name || dev.headline || "DC")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Card className="transition-all hover:border-accent/40 hover:shadow-elegant">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-accent font-display text-sm font-bold text-primary-foreground">
            {initials}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-display font-semibold">{dev.full_name ?? "Developer"}</p>
              {dev.is_verified && <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />}
            </div>
            <p className="truncate text-sm text-muted-foreground">{dev.headline ?? "Full-stack developer"}</p>
            {dev.location && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {dev.location}
              </p>
            )}
          </div>
        </div>
        {dev.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{dev.bio}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(dev.skills ?? []).slice(0, 4).map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
          <span className="font-display font-semibold">
            {dev.hourly_rate_inr ? `₹${dev.hourly_rate_inr}/hr` : "Rate on request"}
          </span>
          <Link to="/developers" className="text-xs font-medium text-accent hover:underline">
            View profile
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectShowcaseCard({ project }: { project: ProjectCard }) {
  const budget =
    project.budget_min_inr && project.budget_max_inr
      ? `₹${(project.budget_min_inr / 1000).toFixed(0)}k–₹${(project.budget_max_inr / 1000).toFixed(0)}k`
      : "Budget on request";
  return (
    <Card className="transition-all hover:border-accent/40 hover:shadow-elegant">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs capitalize">
            <Briefcase className="mr-1 h-3 w-3" /> {project.project_type.replace("_", " ")}
          </Badge>
          {project.hours_per_week && (
            <Badge variant="secondary" className="text-xs">{project.hours_per_week} hrs/wk</Badge>
          )}
        </div>
        <h3 className="mt-3 font-display text-lg font-semibold leading-tight">{project.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{project.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(project.tech_stack ?? []).slice(0, 4).map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
          <span className="font-display font-semibold">{budget}</span>
          <Link to="/projects" className="text-xs font-medium text-accent hover:underline">
            View project
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

const sampleDevelopers: DevCard[] = [
  { id: "s1", full_name: "Aarav Mehta", headline: "Senior React + Node engineer", bio: "8 years building SaaS platforms. Ex-Razorpay. Loves clean architecture.", location: "Bengaluru", skills: ["React", "Node.js", "PostgreSQL", "AWS"], hourly_rate_inr: 2200, is_verified: true },
  { id: "s2", full_name: "Priya Sharma", headline: "Mobile lead — React Native & Flutter", bio: "Shipped 30+ apps across fintech and health. Pixel-perfect UI obsessive.", location: "Pune", skills: ["React Native", "Flutter", "TypeScript"], hourly_rate_inr: 1800, is_verified: true },
  { id: "s3", full_name: "Rohit Iyer", headline: "Backend & DevOps specialist", bio: "Microservices, Kubernetes and observability. SRE mindset.", location: "Hyderabad", skills: ["Go", "Kubernetes", "Terraform", "GCP"], hourly_rate_inr: 2500, is_verified: false },
  { id: "s4", full_name: "Ananya Roy", headline: "AI/ML engineer — LLMs & RAG", bio: "Builds production LLM apps. Deep PyTorch + LangChain experience.", location: "Delhi NCR", skills: ["Python", "PyTorch", "LangChain"], hourly_rate_inr: 3000, is_verified: true },
  { id: "s5", full_name: "Karthik Nair", headline: "Full-stack — Next.js & Supabase", bio: "Goes from Figma to prod in a week. Indie-hacker turned consultant.", location: "Kochi", skills: ["Next.js", "Supabase", "Tailwind"], hourly_rate_inr: 1600, is_verified: false },
  { id: "s6", full_name: "Neha Gupta", headline: "Frontend lead — design-system focused", bio: "Builds accessible component libraries used by 20+ teams.", location: "Mumbai", skills: ["React", "TypeScript", "Storybook", "a11y"], hourly_rate_inr: 2000, is_verified: true },
];

const sampleProjects: ProjectCard[] = [
  { id: "p1", title: "Build a Razorpay-style admin dashboard", description: "We need a clean analytics dashboard with role-based access, payouts and reports. ~6 weeks of work.", budget_min_inr: 80000, budget_max_inr: 150000, hours_per_week: 25, tech_stack: ["React", "TypeScript", "PostgreSQL"], project_type: "fixed_price" },
  { id: "p2", title: "Migrate legacy WordPress site to Next.js", description: "Marketing site migration with CMS in Sanity. SEO must be preserved.", budget_min_inr: 50000, budget_max_inr: 90000, hours_per_week: 20, tech_stack: ["Next.js", "Sanity", "Tailwind"], project_type: "fixed_price" },
  { id: "p3", title: "iOS + Android app for D2C brand", description: "Cross-platform mobile app with auth, catalog, cart, and payments. Backend exists.", budget_min_inr: 120000, budget_max_inr: 200000, hours_per_week: 30, tech_stack: ["React Native", "TypeScript"], project_type: "hourly" },
  { id: "p4", title: "Build an internal LLM-powered support tool", description: "RAG chatbot over our help docs and tickets. Must work with OpenAI + local embeddings.", budget_min_inr: 90000, budget_max_inr: 160000, hours_per_week: 25, tech_stack: ["Python", "LangChain", "pgvector"], project_type: "fixed_price" },
  { id: "p5", title: "Stripe billing integration & invoicing", description: "Add subscriptions, proration, and PDF invoices to our SaaS app.", budget_min_inr: 40000, budget_max_inr: 70000, hours_per_week: 15, tech_stack: ["Node.js", "Stripe", "PostgreSQL"], project_type: "hourly" },
  { id: "p6", title: "Design system + Storybook setup", description: "Refactor our component library and set up Storybook with visual regression tests.", budget_min_inr: 60000, budget_max_inr: 100000, hours_per_week: 20, tech_stack: ["React", "Storybook", "Chromatic"], project_type: "fixed_price" },
];

const testimonials = [
  { name: "Saurabh Rai", role: "Founder, TechFlow", quote: "DeveloperConnect helped us find a part-time React lead in just 3 days. The quality of talent is exceptional.", avatar: "https://i.pravatar.cc/150?u=saurabh" },
  { name: "Anjali Gupta", role: "Recruiter, BrightScale", quote: "The most structured marketplace I've used. Direct invites and secure messaging make hiring seamless.", avatar: "https://i.pravatar.cc/150?u=anjali" },
  { name: "Vikram Malhotra", role: "Senior Developer", quote: "I love the focus on India's developer economy. The pricing is fair, and the projects are high-quality.", avatar: "https://i.pravatar.cc/150?u=vikram" },
  { name: "Rahul Deshmukh", role: "CTO, Fintech Solutions", quote: "Finally, a platform that understands the need for vetted remote developers in India.", avatar: "https://i.pravatar.cc/150?u=rahul" },
];

const features = [
  { title: "Find Skilled Developers", icon: Users, desc: "Search through a curated pool of vetted Indian talent specialized in modern tech stacks." },
  { title: "Post Projects Instantly", icon: Rocket, desc: "Define your requirements and get your project live in minutes to start receiving applications." },
  { title: "Direct Recruiter Invites", icon: Send, desc: "Found the perfect match? Send a direct invite to start a conversation immediately." },
  { title: "Developer Applications", icon: ListTodo, desc: "Developers can apply to your projects with personalized notes and portfolio links." },
  { title: "AI Requirement Analysis", icon: Sparkles, desc: "Our AI helps structure your project requirements for better matching and fair pricing." },
  { title: "Real-Time Notifications", icon: Bell, desc: "Stay updated with instant alerts for new applications, invites, and messages." },
  { title: "Secure Messaging", icon: MessageSquare, desc: "Collaborate safely with our built-in end-to-end communication system." },
  { title: "Contact Access Requests", icon: ShieldCheck, desc: "Control who sees your contact details with a structured permission-based flow." },
  { title: "Project Assignment", icon: CheckCircle2, desc: "Seamlessly assign projects to chosen developers and track the collaboration status." },
  { title: "Portfolio-Based Hiring", icon: Layout, desc: "Review real-world work and GitHub contributions instead of just reading resumes." },
  { title: "Flexible Hiring", icon: Clock, desc: "Hire for part-time (10-30 hrs/wk) or full-time engagements based on your needs." },
  { title: "Fair Pricing", icon: IndianRupee, desc: "Access benchmarked rate cards to ensure fair compensation for developers and value for recruiters." },
];
