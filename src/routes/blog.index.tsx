import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User, Clock } from "lucide-react";

export const BLOG_POSTS = [
  {
    slug: "how-to-hire-developers-in-india",
    title: "How to Hire Developers in India: A Comprehensive Guide",
    description: "Learn the best practices, legal considerations, and platforms for hiring top tech talent in India.",
    date: "March 15, 2024",
    author: "DeveloperConnect Team",
    readTime: "8 min read",
    category: "Hiring",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=800&auto=format&fit=crop"
  },
  {
    slug: "best-platforms-to-hire-developers",
    title: "Best Platforms to Hire Developers in 2024",
    description: "A comparison of top marketplaces and job boards for finding skilled software engineers.",
    date: "March 10, 2024",
    author: "Saurabh Rai",
    readTime: "6 min read",
    category: "Software Development",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=800&auto=format&fit=crop"
  },
  {
    slug: "hire-react-developers-in-india",
    title: "Why You Should Hire React Developers in India",
    description: "Explore the benefits of hiring Indian ReactJS experts for your next web project.",
    date: "March 05, 2024",
    author: "Tech Lead",
    readTime: "5 min read",
    category: "Hiring",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop"
  },
  {
    slug: "how-startups-can-hire-developers-faster",
    title: "How Startups Can Hire Developers Faster",
    description: "Strategies for early-stage companies to streamline their technical recruitment process.",
    date: "February 28, 2024",
    author: "Startup Founder",
    readTime: "7 min read",
    category: "Startups",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop"
  }
];

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "DeveloperConnect Blog | Hiring, Tech & Startups in India" },
      { name: "description", content: "Expert insights on hiring developers, software development trends, and startup growth in India. Read the DeveloperConnect blog." },
      { property: "og:title", content: "DeveloperConnect Blog | Hiring, Tech & Startups in India" },
      { property: "og:url", content: "https://developerconnect.in/blog" },
      { tag: "link", rel: "canonical", href: "https://developerconnect.in/blog" },
    ],
  }),
  component: BlogList,
});

function BlogList() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">DeveloperConnect Blog</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Insights, guides, and stories from the world of tech hiring and software development in India.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post) => (
              <Card key={post.slug} className="overflow-hidden flex flex-col hover:shadow-elegant transition-all">
                <div className="aspect-video overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{post.category}</Badge>
                  </div>
                  <CardTitle className="line-clamp-2 hover:text-accent transition-colors">
                    <Link to="/blog/$postSlug" params={{ postSlug: post.slug }}>{post.title}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {post.description}
                  </p>
                </CardContent>
                <CardFooter className="border-t border-border/50 pt-4 text-xs text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readTime}</span>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="p-0 h-auto hover:bg-transparent hover:text-accent">
                    <Link to="/blog/$postSlug" params={{ postSlug: post.slug }}>Read More <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
