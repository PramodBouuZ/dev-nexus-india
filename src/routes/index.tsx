import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  CheckCircle2, MapPin, Briefcase,
} from "lucide-react";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hire Part-Time & Full-Time Developers in India | DeveloperConnect" },
      { name: "description", content: "DeveloperConnect helps startups and businesses hire skilled part-time and full-time developers in India. Find React, Node.js, Full Stack, Backend, Frontend, and freelance developers quickly." },
      { name: "keywords", content: "hire developers in India, part-time developers, freelance developers India, full stack developers, React developers, Node.js developers, remote developers, startup hiring platform, software developers marketplace, web developers India, hire React developer, hire backend developers, freelance marketplace India, developer hiring platform, hire remote developers, startup tech hiring, affordable developers India, developers for startups, developer marketplace platform" },
      { property: "og:title", content: "Hire Part-Time & Full-Time Developers in India | DeveloperConnect" },
      { property: "og:description", content: "DeveloperConnect helps startups and businesses hire skilled part-time and full-time developers in India. Find React, Node.js, Full Stack, Backend, Frontend, and freelance developers quickly." },
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
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" /> Built for India's developer economy
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Hire developers in India <br />
                <span className="text-gradient-accent">part-time or full-time.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base text-white/80 sm:text-lg">
                Developer Connect is a structured marketplace built for fair pricing and fast hiring.
                Post your project, get matched with vetted Indian developers, and ship faster.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="bg-gradient-accent text-primary-foreground shadow-glow hover:opacity-90">
                  <Link to="/auth">
                    Post a project <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <Link to="/auth">I'm a developer</Link>
                </Button>
              </div>
              <div className="mt-6 flex justify-center">
                <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 backdrop-blur-sm">
                  <PoweredByBant className="text-white/90 [&_span:first-child]:text-white/70" />
                </span>
              </div>
              <div className="mt-12 grid grid-cols-3 gap-6 text-center">
                <Stat value={`${(stats?.developers ?? 0).toLocaleString()}+`} label="Developers" />
                <Stat value={`${(stats?.projects ?? 0).toLocaleString()}+`} label="Projects posted" />
                <Stat value={`${(stats?.contracts ?? 0).toLocaleString()}+`} label="Engagements" />
              </div>
            </div>
          </div>
        </section>

        <TrustedBy />

        {/* TRENDING SKILLS / POPULAR TECHNOLOGIES */}
        {trendingSkills.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Popular technologies</span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Hire developers for top skills</h2>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {trendingSkills.map(([skill, count]) => (
                <Link
                  key={skill}
                  to="/developers"
                  className="group inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-card transition-all hover:border-accent/40 hover:shadow-elegant"
                >
                  <span>{skill}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground group-hover:bg-accent/15 group-hover:text-accent">
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FEATURES */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for how India actually hires.</h2>
            <p className="mt-4 text-muted-foreground">
              No bidding wars. No bloat. Just a clean flow from project post to first commit.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Feature icon={Zap} title="Match in minutes" desc="Smart matching ranks developers by skills, rate, and availability. No waiting on bids." />
            <Feature icon={IndianRupee} title="Fair, transparent pricing" desc="Suggested rate ranges per task type. Developers set their hourly rate upfront." />
            <Feature icon={ShieldCheck} title="Verified developers" desc="Every developer is reviewed. Verified badges signal quality and reliability." />
            <Feature icon={Clock} title="Part-time first" desc="Hire 10–30 hrs/week. Built for moonlighters, consultants, and contract devs." />
            <Feature icon={Code2} title="Built for builders" desc="GitHub-linked profiles, tech-stack filters, real portfolios — no resume PDFs." />
            <Feature icon={Users} title="Direct chat" desc="Talk to developers in real-time before you hire. No middlemen, no friction." />
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

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-10 text-center text-primary-foreground shadow-elegant md:p-16">
            <div
              className="absolute inset-0 opacity-30"
              style={{ backgroundImage: "radial-gradient(circle at 30% 50%, oklch(0.72 0.16 195 / 0.5), transparent 50%)" }}
            />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to ship faster?</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/80">
                Post your first project free. Get matched with developers within 24 hours.
              </p>
              <Button asChild size="lg" className="mt-8 bg-gradient-accent text-primary-foreground shadow-glow hover:opacity-90">
                <Link to="/auth">Get started — it's free</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-white/60">{label}</div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:border-accent/40 hover:shadow-elegant">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-accent text-primary-foreground shadow-sm">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
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
