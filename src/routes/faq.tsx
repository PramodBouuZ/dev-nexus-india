import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Developer Connect" },
      { name: "description", content: "Frequently asked questions for developers and recruiters using Developer Connect." },
    ],
  }),
  component: FaqPage,
});

const developerFaq = [
  { q: "How do I get hired on Developer Connect?", a: "Create a profile, link your GitHub and portfolio, then apply to projects matching your stack. Verified developers get priority placement." },
  { q: "How does verification work?", a: "Submit your GitHub, portfolio and work evidence on the verification page. Our admin team reviews within 48 hours and grants a verified badge." },
  { q: "Do I set my own rate?", a: "Yes. You set your hourly rate in INR. We show suggested ranges per skill so you stay competitive." },
  { q: "How do payments work?", a: "Payment terms are agreed directly with the recruiter in your contract. Always confirm milestones and invoicing before starting." },
  { q: "Can I work part-time only?", a: "Absolutely — the platform is built for 10–30 hour-per-week engagements. You can set your weekly availability on your profile." },
];

const recruiterFaq = [
  { q: "How fast can I hire a developer?", a: "Most recruiters get matched candidates within 24–48 hours of posting a project." },
  { q: "Is there a fee to post a project?", a: "Posting your first project is free. See our pricing page for plans suited to ongoing hiring." },
  { q: "Are developers vetted?", a: "Verified developers are reviewed by our team using GitHub, portfolio and reference evidence. Look for the verified badge." },
  { q: "What if a developer doesn't deliver?", a: "Contracts protect both parties. You can rate developers and report issues; serious violations result in removal." },
  { q: "Can I hire for long-term roles?", a: "Yes. Many engagements that start as part-time evolve into long-term contracts or full-time hires." },
];

function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Frequently Asked Questions</h1>
            <p className="mt-3 text-white/80">Answers for both developers and recruiters.</p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Tabs defaultValue="developer">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="developer">For Developers</TabsTrigger>
              <TabsTrigger value="recruiter">For Recruiters</TabsTrigger>
            </TabsList>

            <TabsContent value="developer" className="mt-6">
              <Accordion type="single" collapsible className="w-full">
                {developerFaq.map((item, i) => (
                  <AccordionItem key={i} value={`d-${i}`}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            <TabsContent value="recruiter" className="mt-6">
              <Accordion type="single" collapsible className="w-full">
                {recruiterFaq.map((item, i) => (
                  <AccordionItem key={i} value={`r-${i}`}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent>{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
    </div>
  );
}
