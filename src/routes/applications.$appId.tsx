import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { ChatThread } from "@/components/ChatThread";

export const Route = createFileRoute("/applications/$appId")({
  head: () => ({ meta: [{ title: "Application | DeveloperConnect" }] }),
  component: AppPage,
});

function AppPage() {
  const { appId } = Route.useParams();
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>
        <Inner appId={appId} userId={user.id} />
      </main>
      <Footer />
    </div>
  );
}

function Inner({ appId, userId }: { appId: string; userId: string }) {
  const { role } = useAuth();
  const { data: app } = useQuery({
    queryKey: ["app", appId],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("*, projects(title, recruiter_id), developer_profiles(full_name)").eq("id", appId).maybeSingle();
      return data;
    },
  });

  if (!app) return <p className="mt-8 text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="mt-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/projects/$projectId" params={{ projectId: app.project_id }} className="text-sm text-muted-foreground hover:text-foreground">
            {app.projects?.title}
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="font-display text-2xl font-bold tracking-tight">Conversation</h1>
            <span className="text-muted-foreground">with</span>
            {role === 'developer' ? (
              <Link to="/recruiters/$recId" params={{ recId: (app.projects as any)?.recruiter_id }} className="font-semibold text-accent hover:underline">
                Recruiter
              </Link>
            ) : (
              <Link to="/developers/$devId" params={{ devId: app.developer_id }} className="font-semibold text-accent hover:underline">
                {(app.developer_profiles as any)?.full_name || 'Developer'}
              </Link>
            )}
          </div>
        </div>
        <Badge variant={app.status === "accepted" ? "default" : app.status === "rejected" ? "destructive" : "secondary"}>{app.status}</Badge>
      </div>

      {app.cover_message && (
        <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4 text-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Initial cover message</p>
          <p className="mt-1 whitespace-pre-wrap">{app.cover_message}</p>
        </div>
      )}

      <ChatThread appId={appId} userId={userId} />
    </div>
  );
}
