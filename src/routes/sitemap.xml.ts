import { createAPIFile } from "@tanstack/react-start/api";
import { supabase } from "../integrations/supabase/client";

export default createAPIFile({
  async get({ request }) {
    const baseUrl = "https://developerconnect.in";

    // Fetch developers and projects for dynamic URLs
    const [{ data: developers }, { data: projects }] = await Promise.all([
      supabase.from("developer_profiles").select("id, updated_at"),
      supabase.from("projects").select("id, updated_at").eq("status", "open")
    ]);

    const staticPages = [
      "",
      "/developers",
      "/projects",
      "/pricing",
      "/faq",
      "/contact",
      "/terms"
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>`).join("")}
  ${(developers || []).map(dev => `
  <url>
    <loc>${baseUrl}/developers/${dev.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join("")}
  ${(projects || []).map(project => `
  <url>
    <loc>${baseUrl}/projects/${project.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join("")}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600"
      }
    });
  }
});
