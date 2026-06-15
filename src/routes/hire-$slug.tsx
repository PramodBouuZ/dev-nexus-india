import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, MapPin, Code2, Star, MessageSquare, Zap, ShieldCheck } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const SEO_DATA: Record<string, any> = {
  "react-developers": {
    title: "Hire React Developers in India | Top 1% ReactJS Talent | DeveloperConnect",
    description: "Hire skilled React developers in India for your startup or enterprise. Vetted ReactJS experts available for part-time and full-time roles. Fast hiring, secure collaboration.",
    h1: "Hire Expert React Developers in India",
    tech: "React",
    type: "tech"
  },
  "nodejs-developers": {
    title: "Hire Node.js Developers in India | Expert Backend Engineers | DeveloperConnect",
    description: "Connect with top Node.js developers in India. Build scalable backend systems with vetted experts available for immediate hire. Part-time & full-time options.",
    h1: "Hire Top Node.js Developers in India",
    tech: "Node.js",
    type: "tech"
  },
  "python-developers": {
    title: "Hire Python Developers in India | Django & Flask Experts | DeveloperConnect",
    description: "Find and hire experienced Python developers in India for web development, AI, and data science. Vetted engineers available for remote work.",
    h1: "Hire Skilled Python Developers in India",
    tech: "Python",
    type: "tech"
  },
  "flutter-developers": {
    title: "Hire Flutter Developers in India | Cross-Platform Mobile Experts",
    description: "Hire top Flutter developers in India for high-performance iOS and Android apps. Vetted experts available for part-time and full-time hiring.",
    h1: "Hire Expert Flutter Developers in India",
    tech: "Flutter",
    type: "tech"
  },
  "php-developers": {
    title: "Hire PHP Developers in India | Backend & Web Experts | DeveloperConnect",
    description: "Hire skilled PHP developers in India for robust web applications. Vetted experts available for custom PHP development projects.",
    h1: "Hire Skilled PHP Developers in India",
    tech: "PHP",
    type: "tech"
  },
  "laravel-developers": {
    title: "Hire Laravel Developers in India | Top PHP Framework Experts",
    description: "Connect with expert Laravel developers in India. Build secure and scalable web apps with vetted Laravel engineers on DeveloperConnect.",
    h1: "Hire Top Laravel Developers in India",
    tech: "Laravel",
    type: "tech"
  },
  "wordpress-developers": {
    title: "Hire WordPress Developers in India | Custom WP & Elementor Experts",
    description: "Hire expert WordPress developers in India for custom themes, plugins, and enterprise WP sites. Vetted developers available for hire.",
    h1: "Hire Expert WordPress Developers in India",
    tech: "WordPress",
    type: "tech"
  },
  "java-developers": {
    title: "Hire Java Developers in India | Enterprise Backend Engineers",
    description: "Find and hire skilled Java developers in India for enterprise-grade applications. Vetted Spring Boot and microservices experts.",
    h1: "Hire Top Java Developers in India",
    tech: "Java",
    type: "tech"
  },
  "android-developers": {
    title: "Hire Android Developers in India | Native App Experts | DeveloperConnect",
    description: "Hire top-rated Android developers in India for native mobile apps. Vetted Kotlin and Java experts available for immediate hire.",
    h1: "Hire Expert Android Developers in India",
    tech: "Android",
    type: "tech"
  },
  "ios-developers": {
    title: "Hire iOS Developers in India | Swift & Native App Experts",
    description: "Connect with expert iOS developers in India for iPhone and iPad apps. Vetted Swift and SwiftUI developers available for hire.",
    h1: "Hire Top iOS Developers in India",
    tech: "iOS",
    type: "tech"
  },
  "ai-developers": {
    title: "Hire AI Developers in India | LLM, RAG & Machine Learning Experts",
    description: "Hire specialized AI developers in India for Generative AI, LLMs, and custom AI solutions. Vetted experts available for your startup.",
    h1: "Hire Expert AI Developers in India",
    tech: "AI/ML",
    type: "tech"
  },
  "machine-learning-engineers": {
    title: "Hire Machine Learning Engineers in India | ML & Data Science Experts",
    description: "Find and hire skilled Machine Learning engineers in India. Experts in PyTorch, TensorFlow, and predictive modeling for your business.",
    h1: "Hire Top Machine Learning Engineers in India",
    tech: "Machine Learning",
    type: "tech"
  },
  "devops-engineers": {
    title: "Hire DevOps Engineers in India | AWS, Docker & K8s Experts",
    description: "Hire expert DevOps engineers in India for cloud infrastructure, CI/CD, and scalability. Vetted AWS and Kubernetes specialists.",
    h1: "Hire Expert DevOps Engineers in India",
    tech: "DevOps",
    type: "tech"
  },
  "ui-ux-designers": {
    title: "Hire UI/UX Designers in India | Expert Product & Web Designers",
    description: "Hire top UI/UX designers in India for web and mobile products. Vetted designers skilled in Figma, user research, and prototyping.",
    h1: "Hire Creative UI/UX Designers in India",
    tech: "UI/UX",
    type: "tech"
  },
  "developers-in-delhi": {
    title: "Hire Developers in Delhi | Top Tech Talent in Delhi NCR | DeveloperConnect",
    description: "Hire skilled software developers in Delhi NCR for your startup or business. Vetted local experts available for part-time and full-time roles.",
    h1: "Hire Top Developers in Delhi NCR",
    location: "Delhi",
    type: "location"
  },
  "developers-in-noida": {
    title: "Hire Developers in Noida | Skilled Software Engineers in Noida",
    description: "Connect with top developers in Noida. Hire vetted software engineers for remote or on-site roles in Noida and Greater Noida.",
    h1: "Hire Expert Developers in Noida",
    location: "Noida",
    type: "location"
  },
  "developers-in-gurgaon": {
    title: "Hire Developers in Gurgaon | Top Tech Talent in Gurugram",
    description: "Hire expert software developers in Gurgaon (Gurugram). Vetted engineers for startups and enterprises available on DeveloperConnect.",
    h1: "Hire Skilled Developers in Gurgaon",
    location: "Gurgaon",
    type: "location"
  },
  "developers-in-bangalore": {
    title: "Hire Developers in Bangalore | Top Software Engineers in Bengaluru",
    description: "Hire the best developers in Bangalore, India's Silicon Valley. Vetted software engineers available for part-time and full-time hiring.",
    h1: "Hire Top Developers in Bangalore",
    location: "Bangalore",
    type: "location"
  },
  "developers-in-hyderabad": {
    title: "Hire Developers in Hyderabad | Expert Software Talent in Hyderabad",
    description: "Connect with top software developers in Hyderabad. Vetted engineers for web, mobile, and enterprise apps available for hire.",
    h1: "Hire Expert Developers in Hyderabad",
    location: "Hyderabad",
    type: "location"
  },
  "developers-in-pune": {
    title: "Hire Developers in Pune | Skilled Tech Talent in Pune",
    description: "Hire expert developers in Pune for your tech team. Vetted software engineers available for remote and part-time projects.",
    h1: "Hire Top Developers in Pune",
    location: "Pune",
    type: "location"
  },
  "developers-in-mumbai": {
    title: "Hire Developers in Mumbai | Top Tech Talent in Mumbai",
    description: "Hire skilled software developers in Mumbai. Vetted engineers for startups and financial tech available for immediate hire.",
    h1: "Hire Expert Developers in Mumbai",
    location: "Mumbai",
    type: "location"
  },
  "developers-in-chennai": {
    title: "Hire Developers in Chennai | Skilled Software Engineers in Chennai",
    description: "Connect with top software developers in Chennai. Vetted engineers available for part-time, full-time, and remote hiring.",
    h1: "Hire Top Developers in Chennai",
    location: "Chennai",
    type: "location"
  }
};

export const Route = createFileRoute("/hire-$slug")({
  loader: ({ params }) => {
    const data = SEO_DATA[params.slug];
    if (!data) throw new Error("Page not found");
    return { ...data, slug: params.slug };
  },
  head: ({ loaderData }) => {
    return {
      meta: [
        { title: loaderData.title },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.description },
        { property: "og:url", content: `https://developerconnect.in/hire-${loaderData.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: loaderData.title },
        { name: "twitter:description", content: loaderData.description },
        { tag: "link", rel: "canonical", href: `https://developerconnect.in/hire-${loaderData.slug}` },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": loaderData.title,
            "description": loaderData.description,
            "url": `https://developerconnect.in/hire-${loaderData.slug}`,
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://developerconnect.in" },
                { "@type": "ListItem", "position": 2, "name": loaderData.h1, "item": `https://developerconnect.in/hire-${loaderData.slug}` }
              ]
            }
          })
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": `How do I hire ${loaderData.tech || "developers"} through DeveloperConnect?`,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": `You can hire ${loaderData.tech || "developers"} by posting your project on DeveloperConnect, browsing vetted profiles, and sending direct invites to developers who match your requirements.`
                }
              },
              {
                "@type": "Question",
                "name": "Is there a trial period for hired developers?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Many developers on our platform are open to a paid trial period or starting with a smaller milestone to ensure a good fit for both parties."
                }
              }
            ]
          })
        }
      ]
    };
  },
  component: SEOLandingPage,
});

function SEOLandingPage() {
  const data = Route.useLoaderData();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-hero text-primary-foreground py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <Badge variant="outline" className="mb-4 border-white/20 text-white bg-white/5">
              Vetted Talent Marketplace
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
              {data.h1}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/80 mb-10">
              {data.description} Stop wasting time on generic job boards. Connect with the top 1% of Indian tech talent today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="bg-gradient-accent text-primary-foreground shadow-glow h-14 px-8 text-lg font-bold">
                <Link to="/auth">Post Your Project</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 bg-white/5 text-white hover:bg-white/10 h-14 px-8 text-lg">
                <Link to="/developers">Browse Developers</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight">Why Hire via DeveloperConnect?</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Vetted Experts", icon: ShieldCheck, desc: "Every developer undergoes a screening process to ensure technical competence." },
                { title: "Fair Pricing", icon: Star, desc: "No middleman markups. Negotiate rates directly with developers based on market standards." },
                { title: "Fast Hiring", icon: Zap, desc: "Go from posting a project to first interview in less than 24 hours." }
              ].map((b, i) => (
                <div key={i} className="p-6 rounded-2xl border border-border bg-card shadow-sm">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                    <b.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{b.title}</h3>
                  <p className="text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-20 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">The best platform for {data.tech ? `${data.tech} hiring` : "hiring developers"}</h2>
                <div className="space-y-4">
                  {[
                    "Direct communication with developers",
                    "Structured project milestones",
                    "Vetted Indian tech talent pool",
                    "Part-time and full-time engagement options",
                    "Secure messaging and file sharing"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <Button asChild className="mt-8" variant="outline">
                  <Link to="/auth">Get Started Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="bg-card rounded-2xl border border-border p-8 shadow-card">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Code2 className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-bold">Technical Proficiency</h4>
                      <p className="text-sm text-muted-foreground">Expertise in {data.tech || "modern stacks"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold">Regional Talent</h4>
                      <p className="text-sm text-muted-foreground">{data.location ? `Focused on ${data.location}` : "Pan-India coverage"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <h4 className="font-bold">Verified History</h4>
                      <p className="text-sm text-muted-foreground">Proven track record on the platform</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I hire {data.tech || "developers"}?</AccordionTrigger>
                <AccordionContent>
                  Simply create a recruiter account, post your project requirements, and browse our pool of vetted talent. You can send direct invites or review applications as they come in.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>What are the costs involved?</AccordionTrigger>
                <AccordionContent>
                  DeveloperConnect offers free and premium plans for recruiters. Developers set their own rates, and you pay them directly based on agreed-upon milestones. We don't charge commission on developer earnings.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Are the developers vetted?</AccordionTrigger>
                <AccordionContent>
                  Yes, we verify developers through their technical portfolios, GitHub profiles, and previous work history to ensure they meet the quality standards of our marketplace.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4">
          <div className="mx-auto max-w-5xl bg-primary rounded-3xl p-12 text-center text-primary-foreground relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6">Ready to hire your next {data.tech || "developer"}?</h2>
              <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                Join thousands of founders and tech leaders who trust DeveloperConnect for their hiring needs.
              </p>
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-10 text-lg font-bold">
                <Link to="/auth">Create Recruiter Account</Link>
              </Button>
            </div>
            <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
