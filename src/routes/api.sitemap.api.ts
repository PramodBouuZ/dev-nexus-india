import { createAPIFile } from "@tanstack/react-start/api";
import { supabase } from "../integrations/supabase/client";

export default createAPIFile({
  get: async () => {
    const baseUrl = "https://developerconnect.in";
    const [{ data: developers }, { data: projects }] = await Promise.all([
      supabase.from("developer_profiles").select("id"),
      supabase.from("projects").select("id").eq("status", "open")
    ]);

    const staticPages = ["", "/developers", "/projects", "/pricing", "/faq", "/contact", "/terms"];
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

    for (const page of staticPages) {
      xml += '<url>';
      xml += '<loc>' + baseUrl + page + '</loc>';
      xml += '<changefreq>daily</changefreq>';
      xml += '<priority>' + (page === "" ? "1.0" : "0.8") + '</priority>';
      xml += '</url>';
    }

    if (developers) {
      for (const dev of developers) {
        xml += '<url>';
        xml += '<loc>' + baseUrl + '/developers/' + dev.id + '</loc>';
        xml += '<changefreq>weekly</changefreq>';
        xml += '<priority>0.7</priority>';
        xml += '</url>';
      }
    }

    if (projects) {
      for (const project of projects) {
        xml += '<url>';
        xml += '<loc>' + baseUrl + '/projects/' + project.id + '</loc>';
        xml += '<changefreq>weekly</changefreq>';
        xml += '<priority>0.7</priority>';
        xml += '</url>';
      }
    }

    xml += '</urlset>';

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600"
      }
    });
  }
});
