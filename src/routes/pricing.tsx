import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing Plans | DeveloperConnect" },
      { name: "description", content: "Choose the right plan for your needs. Free for developers, flexible options for recruiters to find top tech talent in India." },
      { property: "og:title", content: "Pricing Plans | DeveloperConnect" },
      { property: "og:description", content: "Choose the right plan for your needs. Free for developers, flexible options for recruiters to find top tech talent in India." },
      { property: "og:url", content: "https://developerconnect.in/pricing" },
      { tag: "link", rel: "canonical", href: "https://developerconnect.in/pricing" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://developerconnect.in" },
            { "@type": "ListItem", "position": 2, "name": "Pricing", "item": "https://developerconnect.in/pricing" }
          ]
        })
      }
    ]
  }),
  component: Pricing,
});

const plans = [
  {
    name: "Developer Free",
    price: "₹0",
    per: "/month",
    desc: "Perfect for developers looking for their next opportunity.",
    features: [
      "Create professional profile",
      "Apply to unlimited projects",
      "Receive recruiter invitations",
      "Accept or reject invitations",
      "Direct messaging",
      "Portfolio showcase",
      "Project notifications",
    ],
    buttonText: "Join as Developer",
    highlight: false,
  },
  {
    name: "Recruiter Free",
    price: "₹0",
    per: "/month",
    desc: "Start hiring top tech talent with basic platform access.",
    features: [
      "Create recruiter profile",
      "Browse developers",
      "Send invitations",
      "Post up to 10 projects/month",
      "Receive developer applications",
      "Basic messaging",
    ],
    buttonText: "Start Hiring",
    highlight: false,
  },
  {
    name: "Recruiter Pro",
    price: "₹2,999",
    per: "/month",
    desc: "Unlock the full potential of DeveloperConnect for your hiring needs.",
    features: [
      "Unlimited project postings",
      "Unlimited developer invitations",
      "Unlimited messaging",
      "Priority listing of projects",
      "Featured recruiter badge",
      "Advanced search filters",
      "AI candidate matching",
      "Contact access requests",
      "Recruiter analytics dashboard",
      "Premium support",
      "All future features included",
    ],
    buttonText: "Upgrade to Pro",
    highlight: true,
    badge: "Most Popular",
  },
];

const comparison = [
  { feature: "Project Postings", developer: "N/A", recruiterFree: "10 / month", recruiterPro: "Unlimited" },
  { feature: "Developer Invitations", developer: "Receive", recruiterFree: "Basic", recruiterPro: "Unlimited" },
  { feature: "Direct Messaging", developer: "Included", recruiterFree: "Basic", recruiterPro: "Unlimited" },
  { feature: "AI Candidate Matching", developer: "N/A", recruiterFree: "No", recruiterPro: "Yes" },
  { feature: "Featured Badge", developer: "No", recruiterFree: "No", recruiterPro: "Yes" },
  { feature: "Analytics Dashboard", developer: "Basic", recruiterFree: "No", recruiterPro: "Advanced" },
  { feature: "Priority Listing", developer: "N/A", recruiterFree: "No", recruiterPro: "Yes" },
];

function Pricing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Choose the right plan for <span className="text-accent">your growth</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Whether you are a developer looking for work or a recruiter building a team, we have the perfect plan for you.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl border p-8 shadow-card transition-all hover:shadow-elegant ${
                  plan.highlight
                    ? "border-accent bg-gradient-subtle ring-2 ring-accent ring-opacity-20"
                    : "border-border bg-card"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-bold text-primary-foreground shadow-sm">
                    {plan.badge}
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                </div>
                <div className="mb-8 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-lg font-medium text-muted-foreground">{plan.per}</span>
                </div>
                <Button
                  asChild
                  className={`mb-8 w-full ${
                    plan.highlight ? "bg-gradient-accent text-primary-foreground hover:opacity-90" : ""
                  }`}
                  variant={plan.highlight ? "default" : "outline"}
                >
                  <Link to="/auth">{plan.buttonText}</Link>
                </Button>
                <div className="flex-1">
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider">What's included</h4>
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-12 text-center font-display text-3xl font-bold">Compare plans at a glance</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-4 text-sm font-semibold">Feature</th>
                    <th className="px-6 py-4 text-sm font-semibold">Developer</th>
                    <th className="px-6 py-4 text-sm font-semibold">Recruiter Free</th>
                    <th className="px-6 py-4 text-sm font-semibold">Recruiter Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {comparison.map((row) => (
                    <tr key={row.feature} className="transition-colors hover:bg-muted/20">
                      <td className="px-6 py-4 text-sm font-medium">{row.feature}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{row.developer}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{row.recruiterFree}</td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{row.recruiterPro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section (Optional but good for pricing) */}
        <div className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold mb-6">Frequently Asked Questions</h2>
          <p className="text-muted-foreground mb-10">
            Have more questions about our plans? Check out our <Link to="/faq" className="text-accent hover:underline">FAQ page</Link> or reach out to us.
          </p>
          <Button asChild variant="outline">
             <Link to="/contact">Contact Support</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
