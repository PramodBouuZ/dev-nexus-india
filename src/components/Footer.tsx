import { Link } from "@tanstack/react-router";
import { BrandMark, BrandWordmark, PoweredByBant } from "@/components/Brand";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <BrandMark />
              <BrandWordmark />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Hire vetted part-time developers across India. Built for fair pricing and fast delivery.
            </p>
            <div className="mt-4">
              <PoweredByBant />
            </div>
          </div>

          <FooterCol title="Platform" links={[
            { to: "/projects", label: "Browse Projects" },
            { to: "/developers", label: "Find Developers" },
            { to: "/pricing", label: "Pricing" },
            { to: "/auth", label: "Sign in" },
          ]} />

          <FooterCol title="For Developers" links={[
            { to: "/faq", label: "Developer FAQ" },
            { to: "/verification", label: "Get verified" },
            { to: "/terms", label: "Code of Conduct" },
          ]} />

          <FooterCol title="Company" links={[
            { to: "/contact", label: "Contact" },
            { to: "/terms", label: "Terms & Conditions" },
            { to: "/privacy", label: "Privacy Policy" },
            { to: "/faq", label: "FAQ" },
          ]} />
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Developer Connect. Built for India's developer community.</p>
          <PoweredByBant />
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
