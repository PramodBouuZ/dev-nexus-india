import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | DeveloperConnect India" },
      { name: "description", content: "Terms and conditions for using DeveloperConnect, the marketplace for hiring part-time and full-time developers in India." },
      { property: "og:title", content: "Terms & Conditions | DeveloperConnect India" },
      { property: "og:description", content: "Terms and conditions for using DeveloperConnect, the marketplace for hiring part-time and full-time developers in India." },
      { tag: "link", rel: "canonical", href: "https://developerconnect.in/terms" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://developerconnect.in" },
            { "@type": "ListItem", "position": 2, "name": "Terms", "item": "https://developerconnect.in/terms" }
          ]
        })
      }
    ]
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Terms & Conditions</h1>
            <p className="mt-3 text-white/80">Last updated: April 2026</p>
          </div>
        </section>

        <article className="prose prose-slate mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Section title="1. Acceptance of Terms">
            By accessing or using Developer Connect ("the Platform"), you agree to be bound by these Terms & Conditions.
            If you do not agree, do not use the Platform.
          </Section>

          <Section title="2. Eligibility">
            You must be at least 18 years old and legally able to enter contracts in your jurisdiction. Developers must
            have legitimate skills and identification; recruiters must represent a real organization or project.
          </Section>

          <Section title="3. Accounts & Verification">
            Accounts must contain accurate information. Verified badges are issued at our discretion based on submitted
            evidence. Misrepresentation may result in account suspension.
          </Section>

          <Section title="4. Engagements & Payments">
            Developer Connect facilitates introductions and contracts between developers and recruiters. Both parties
            are responsible for honoring agreed scopes, deliverables, rates, and timelines. Payment terms are agreed
            directly between parties unless an escrow product is explicitly used.
          </Section>

          <Section title="5. Conduct">
            Harassment, fraud, plagiarism, intellectual-property violations, and circumvention of the Platform's
            payment flows are strictly prohibited and may result in permanent removal.
          </Section>

          <Section title="6. Intellectual Property">
            Work product ownership defaults to the recruiter upon full payment unless the contract states otherwise.
            The Platform retains rights to its own brand, code, and content.
          </Section>

          <Section title="7. Limitation of Liability">
            Developer Connect provides the Platform "as is" without warranties. We are not liable for losses arising
            from engagements between users.
          </Section>

          <Section title="8. Termination">
            We may suspend or terminate accounts that violate these Terms. You may close your account at any time.
          </Section>

          <Section title="9. Changes">
            We may update these Terms periodically. Continued use after changes constitutes acceptance.
          </Section>

          <Section title="10. Contact">
            Questions about these Terms can be sent to <a className="text-accent" href="/contact">our contact page</a>.
          </Section>
        </article>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
