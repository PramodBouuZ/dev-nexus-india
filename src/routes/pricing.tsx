import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Affordable Pricing for Hiring Developers in India | DeveloperConnect" },
      { name: "description", content: "Simple and transparent pricing. Free for developers. Affordable hiring plans for startups to find top tech talent in India." },
      { property: "og:title", content: "Affordable Pricing for Hiring Developers in India | DeveloperConnect" },
      { property: "og:description", content: "Simple and transparent pricing. Free for developers. Affordable hiring plans for startups to find top tech talent in India." },
      { tag: "link", rel: "canonical", href: "https://developerconnect.in/pricing" },
    ],
  }),
  component: Pricing,
});

const tiers = [
  { name: "Developers", price: "Free", desc: "Forever. Apply to projects, chat, get hired.", features: ["Unlimited applications", "Real-time chat", "Verified badge", "Portfolio + GitHub linking"], highlight: false },
  { name: "Recruiter", price: "₹0", per: "/ first project", desc: "Post and hire your first developer free.", features: ["Post 1 project", "View all applicants", "In-app chat", "Smart pricing suggestions"], highlight: true },
  { name: "Recruiter Pro", price: "₹2,499", per: "/ month", desc: "Unlimited projects, priority matching.", features: ["Unlimited projects", "Priority placement", "Featured listings", "Dedicated support"], highlight: false },
];

function Pricing() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Simple, fair pricing</h1>
          <p className="mt-4 text-muted-foreground">Free for developers. Pay only when you hire.</p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 sm:px-6 md:grid-cols-3">
          {tiers.map(t => (
            <div key={t.name} className={`rounded-2xl border p-8 shadow-card ${t.highlight ? "border-accent bg-gradient-subtle shadow-elegant" : "border-border bg-card"}`}>
              <h3 className="font-display text-xl font-semibold">{t.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold">{t.price}</span>
                {t.per && <span className="text-sm text-muted-foreground">{t.per}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {t.features.map(f => (
                  <li key={f} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-accent" /> {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
