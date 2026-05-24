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

    for (let i = 0; i < staticPages.length; i++) {
      const page = staticPages[i];
      xml += '<url>';
      xml += '<loc>' + baseUrl + page + '</loc>';
      xml += '<changefreq>daily</changefreq>';
      xml += '<priority>' + (page === "" ? "1.0" : "0.8") + '</priority>';
      xml += '</url>';
    }

    if (developers) {
      for (let i = 0; i < developers.length; i++) {
        xml += '<url>';
        xml += '<loc>' + baseUrl + '/developers/' + developers[i].id + '</loc>';
        xml += '<changefreq>weekly</changefreq>';
        xml += '<priority>0.7</priority>';
        xml += '</url>';
      }
    }

    if (projects) {
      for (let i = 0; i < projects.length; i++) {
        xml += '<url>';
        xml += '<loc>' + baseUrl + '/projects/' + projects[i].id + '</loc>';
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
