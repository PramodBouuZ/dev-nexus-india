import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/applications/$appId")({
  head: () => ({ meta: [{ title: "Application — HireSpark" }] }),
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
  const { data: app } = useQuery({
    queryKey: ["app", appId],
    queryFn: async () => {
      const { data } = await supabase.from("applications").select("*, projects(title, recruiter_id)").eq("id", appId).maybeSingle();
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
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">Conversation</h1>
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

function ChatThread({ appId, userId }: { appId: string; userId: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ["msgs", appId],
    queryFn: async () => {
      const { data } = await supabase.from("messages").select("*").eq("application_id", appId).order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ch = supabase.channel(`msgs-${appId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `application_id=eq.${appId}` },
        () => qc.invalidateQueries({ queryKey: ["msgs", appId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [appId, qc]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text.trim().slice(0, 2000);
    setText("");
    const { error } = await supabase.from("messages").insert({ application_id: appId, sender_id: userId, body });
    if (error) toast.error(error.message);
  }

  return (
    <div className="mt-6 flex h-[60vh] flex-col rounded-xl border border-border bg-card shadow-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages?.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet — say hi 👋</p>}
        {messages?.map(m => (
          <div key={m.id} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.sender_id === userId ? "bg-gradient-accent text-primary-foreground" : "bg-muted"}`}>
              {m.body}
              <div className={`mt-1 text-[10px] ${m.sender_id === userId ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." maxLength={2000} />
        <Button type="submit" size="icon" className="bg-gradient-accent text-primary-foreground hover:opacity-90"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
