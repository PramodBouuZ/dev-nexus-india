import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "../integrations/supabase/client";

export const Route = createFileRoute("/api/sitemap")({
  server: {
    handlers: {
      GET: async () => {
        const baseUrl = "https://developerconnect.in";
        const [{ data: developers }, { data: projects }] = await Promise.all([
          supabase.from("developer_profiles").select("id"),
          supabase.from("projects").select("id").eq("status", "open"),
        ]);

        const staticPages = ["", "/developers", "/projects", "/pricing", "/faq", "/contact", "/terms"];
        let xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        for (const page of staticPages) {
          xml += `<url><loc>${baseUrl}${page}</loc><changefreq>daily</changefreq><priority>${page === "" ? "1.0" : "0.8"}</priority></url>`;
        }
        for (const dev of developers ?? []) {
          xml += `<url><loc>${baseUrl}/developers/${dev.id}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
        }
        for (const p of projects ?? []) {
          xml += `<url><loc>${baseUrl}/projects/${p.id}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
        }
        xml += "</urlset>";

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
