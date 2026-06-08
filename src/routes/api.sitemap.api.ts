import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "../integrations/supabase/client";

export const Route = createFileRoute("/api/sitemap/api")({
  server: {
    handlers: {
      GET: async () => {
        // This is a test handler to see if we can trigger a supabase call on the server
        try {
           const { data } = await supabase.from("developer_profiles").select("id").limit(1);
           return new Response(JSON.stringify({ status: "ok", data }), {
             headers: { "Content-Type": "application/json" }
           });
        } catch (e) {
           return new Response(JSON.stringify({ status: "error", error: e.message }), {
             headers: { "Content-Type": "application/json" }
           });
        }
      },
    },
  },
});
