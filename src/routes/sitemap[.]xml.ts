import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://developerconnect.in";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/developers", changefreq: "daily", priority: "0.9" },
          { path: "/projects", changefreq: "daily", priority: "0.9" },
          { path: "/pricing", changefreq: "monthly", priority: "0.7" },
          { path: "/faq", changefreq: "monthly", priority: "0.6" },
          { path: "/contact", changefreq: "monthly", priority: "0.5" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
          { path: "/auth", changefreq: "yearly", priority: "0.3" },
          { path: "/blog", changefreq: "daily", priority: "0.8" },
        ];

        const seoSlugs = [
          "react-developers", "nodejs-developers", "python-developers", "flutter-developers",
          "php-developers", "laravel-developers", "wordpress-developers", "java-developers",
          "android-developers", "ios-developers", "ai-developers", "machine-learning-engineers",
          "devops-engineers", "ui-ux-designers", "developers-in-delhi", "developers-in-noida",
          "developers-in-gurgaon", "developers-in-bangalore", "developers-in-hyderabad",
          "developers-in-pune", "developers-in-mumbai", "developers-in-chennai"
        ];

        seoSlugs.forEach(slug => {
          staticEntries.push({ path: `/hire-${slug}`, changefreq: "weekly", priority: "0.8" });
        });

        const blogSlugs = [
          "how-to-hire-developers-in-india", "best-platforms-to-hire-developers",
          "hire-react-developers-in-india", "how-startups-can-hire-developers-faster"
        ];

        blogSlugs.forEach(slug => {
          staticEntries.push({ path: `/blog/${slug}`, changefreq: "monthly", priority: "0.7" });
        });

        const dynamic: SitemapEntry[] = [];
        try {
          const [{ data: devs }, { data: projs }, { data: recs }] = await Promise.all([
            supabase.from("developer_profiles").select("id").limit(1000),
            supabase.from("projects").select("id").eq("status", "open").limit(1000),
            supabase.from("recruiter_profiles").select("id").limit(1000),
          ]);
          devs?.forEach((d) => dynamic.push({ path: `/developers/${d.id}`, changefreq: "weekly", priority: "0.6" }));
          projs?.forEach((p) => dynamic.push({ path: `/projects/${p.id}`, changefreq: "weekly", priority: "0.7" }));
          recs?.forEach((r) => dynamic.push({ path: `/recruiters/${r.id}`, changefreq: "weekly", priority: "0.6" }));
        } catch {
          // ignore — emit static-only sitemap on failure
        }

        const entries = [...staticEntries, ...dynamic];
        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ].filter(Boolean).join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
