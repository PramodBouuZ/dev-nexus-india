import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | DeveloperConnect India" },
      { name: "description", content: "Privacy policy for DeveloperConnect, explaining how we collect, use, and protect your data." },
      { property: "og:title", content: "Privacy Policy | DeveloperConnect India" },
      { property: "og:description", content: "Privacy policy for DeveloperConnect, explaining how we collect, use, and protect your data." },
      { property: "og:url", content: "https://developerconnect.in/privacy" },
      { tag: "link", rel: "canonical", href: "https://developerconnect.in/privacy" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://developerconnect.in" },
            { "@type": "ListItem", "position": 2, "name": "Privacy", "item": "https://developerconnect.in/privacy" }
          ]
        })
      }
    ]
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
            <p className="mt-3 text-white/80">Last updated: April 2026</p>
          </div>
        </section>

        <article className="prose prose-slate mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Section title="1. Information We Collect">
            We collect information you provide directly to us, such as when you create or modify your account, request
            services, contact customer support, or otherwise communicate with us. This information may include: name,
            email, phone number, postal address, profile picture, payment method, and other information you choose to
            provide.
          </Section>

          <Section title="2. Use of Information">
            We use the information we collect to provide, maintain, and improve our services, such as to facilitate
            connections between developers and recruiters, process payments, send support messages, and respond to your
            comments and questions.
          </Section>

          <Section title="3. Sharing of Information">
            We may share your information with third-party vendors, consultants, and other service providers who need
            access to such information to carry out work on our behalf. We do not sell your personal information to
            third parties.
          </Section>

          <Section title="4. Data Security">
            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized
            access, disclosure, alteration, and destruction.
          </Section>

          <Section title="5. Your Choices">
            You may update, correct, or delete information about you at any time by logging into your online account. If
            you wish to delete your account, please contact us, but note that we may retain certain information as
            required by law or for legitimate business purposes.
          </Section>

          <Section title="6. Cookies">
            Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your
            browser to remove or reject browser cookies.
          </Section>

          <Section title="7. Changes to the Policy">
            We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the
            date at the top of the policy and, in some cases, we may provide you with additional notice.
          </Section>

          <Section title="8. Contact Us">
            If you have any questions about this Privacy Policy, please contact us via our{" "}
            <Link className="text-accent hover:underline" to="/contact">
              contact page
            </Link>.
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
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}
