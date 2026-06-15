import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Clock, Share2 } from "lucide-react";
import { BLOG_POSTS } from "./blog.index";

export const Route = createFileRoute("/blog/$postSlug")({
  loader: ({ params }) => {
    const post = BLOG_POSTS.find((p) => p.slug === params.postSlug);
    if (!post) throw new Error("Post not found");
    return post;
  },
  head: ({ loaderData }) => {
    return {
      meta: [
        { title: `${loaderData.title} | DeveloperConnect Blog` },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: loaderData.description },
        { property: "og:image", content: loaderData.image },
        { property: "og:type", content: "article" },
        { tag: "link", rel: "canonical", href: `https://developerconnect.in/blog/${loaderData.slug}` },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": loaderData.title,
            "description": loaderData.description,
            "image": loaderData.image,
            "author": {
              "@type": "Organization",
              "name": "DeveloperConnect"
            },
            "publisher": {
              "@type": "Organization",
              "name": "DeveloperConnect",
              "logo": {
                "@type": "ImageObject",
                "url": "https://developerconnect.in/logo.png"
              }
            },
            "datePublished": loaderData.date
          })
        }
      ]
    };
  },
  component: BlogPost,
});

function BlogPost() {
  const post = Route.useLoaderData();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <article>
            <header className="mb-10">
              <Badge className="mb-4">{post.category}</Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6 leading-tight">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-y border-border py-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                    {post.author[0]}
                  </div>
                  <span className="font-medium text-foreground">{post.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {post.date}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </div>
                <Button variant="ghost" size="sm" className="ml-auto gap-2">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
            </header>

            <div className="aspect-video rounded-3xl overflow-hidden mb-10 shadow-elegant">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-muted-foreground leading-relaxed mb-8 font-medium italic">
                {post.description}
              </p>
              <div className="space-y-6 text-foreground/90 leading-relaxed">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <h2 className="text-2xl font-bold mt-10 mb-4">The Current Landscape of Tech Hiring</h2>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Expertise in modern tech stacks like React, Node.js, and Python.</li>
                  <li>Cost-effective solutions for startups and enterprises.</li>
                  <li>Flexible engagement models: part-time and full-time.</li>
                  <li>Time-zone compatibility for global teams.</li>
                </ul>
                <h2 className="text-2xl font-bold mt-10 mb-4">Key Strategies for Success</h2>
                <p>
                  At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.
                </p>
              </div>
            </div>

            <footer className="mt-16 pt-10 border-t border-border">
              <div className="bg-muted/30 rounded-2xl p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Looking for top developers?</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Hire vetted Indian developers for your project today on DeveloperConnect.
                </p>
                <Button asChild size="lg" className="bg-gradient-accent text-primary-foreground font-bold px-10">
                  <Link to="/auth">Get Started Now</Link>
                </Button>
              </div>
            </footer>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
