import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, ShieldCheck, Clock, IndianRupee, Code2, Users, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HireSpark — Hire part-time developers in India" },
      { name: "description", content: "Post a project, match in minutes, hire vetted part-time developers across India. Fair pricing, structured contracts, fast delivery." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: "radial-gradient(circle at 20% 30%, oklch(0.72 0.16 195 / 0.4), transparent 40%), radial-gradient(circle at 80% 70%, oklch(0.6 0.18 250 / 0.3), transparent 40%)"
          }} />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" /> Built for India's developer economy
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Hire part-time developers <br />
                <span className="text-gradient-accent">in hours, not weeks.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base text-white/80 sm:text-lg">
                A structured marketplace built for fair pricing and fast hiring. Post your project, get matched with vetted Indian developers, and ship faster.
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
              <div className="mt-12 grid grid-cols-3 gap-6 text-center">
                <Stat value="2,400+" label="Developers" />
                <Stat value="850+" label="Projects shipped" />
                <Stat value="48hr" label="Avg. time to hire" />
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for how India actually hires.
            </h2>
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

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-10 text-center text-primary-foreground shadow-elegant md:p-16">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: "radial-gradient(circle at 30% 50%, oklch(0.72 0.16 195 / 0.5), transparent 50%)"
            }} />
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
