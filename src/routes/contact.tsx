import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us | DeveloperConnect India" },
      { name: "description", content: "Get in touch with the DeveloperConnect team. We're here to help startups hire developers and assist developers in finding the best remote work in India." },
      { property: "og:title", content: "Contact Us | DeveloperConnect India" },
      { property: "og:description", content: "Get in touch with the DeveloperConnect team. We're here to help startups hire developers and assist developers in finding the best remote work in India." },
      { tag: "link", rel: "canonical", href: "https://developerconnect.in/contact" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://developerconnect.in" },
            { "@type": "ListItem", "position": 2, "name": "Contact", "item": "https://developerconnect.in/contact" }
          ]
        })
      }
    ]
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Contact us</h1>
            <p className="mt-3 max-w-2xl text-white/80">
              Questions, partnerships, or feedback — we'd love to hear from you.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="space-y-4">
            <InfoCard icon={Mail} title="Email" body="hello@developerconnect.in" />
            <InfoCard icon={MessageCircle} title="Support" body="support@developerconnect.in" />
            <InfoCard icon={MapPin} title="Headquarters" body="Bengaluru, India" />
          </div>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>We typically respond within one business day.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitting(true);
                  setTimeout(() => {
                    toast.success("Message sent — we'll be in touch soon.");
                    (e.target as HTMLFormElement).reset();
                    setSubmitting(false);
                  }, 600);
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" required rows={6} className="mt-1.5" />
                </div>
                <Button type="submit" disabled={submitting} className="bg-gradient-accent text-primary-foreground hover:opacity-90">
                  {submitting ? "Sending..." : "Send message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function InfoCard({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-accent text-primary-foreground">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="font-display font-semibold">{title}</div>
          <div className="text-sm text-muted-foreground">{body}</div>
        </div>
      </CardContent>
    </Card>
  );
}
