import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, FileText, Image as ImageIcon, FileArchive, X, Download } from "lucide-react";
import { toast } from "sonner";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip", "application/x-zip-compressed", "application/x-zip",
  "image/png", "image/jpeg", "image/webp", "image/gif",
];

type Attachment = { name: string; url: string; size: number; mime: string };

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.includes("zip")) return FileArchive;
  return FileText;
}

function fmtSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function ChatThread({ appId, userId }: { appId: string; userId: string }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [pending, setPending] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["msgs", appId],
    staleTime: 1000 * 30, // 30 seconds cache
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("application_id", appId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Mark messages I received as read
  useEffect(() => {
    if (!messages?.length) return;
    const unread = messages.filter((m) => m.sender_id !== userId && !m.read_at).map((m) => m.id);
    if (!unread.length) return;
    supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread).then(({ error }) => {
      if (!error) qc.invalidateQueries({ queryKey: ["msgs", appId] });
    });
  }, [messages, userId, appId, qc]);

  useEffect(() => {
    const ch = supabase.channel(`msgs-${appId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `application_id=eq.${appId}` },
        () => qc.invalidateQueries({ queryKey: ["msgs", appId] }))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `application_id=eq.${appId}` },
        () => qc.invalidateQueries({ queryKey: ["msgs", appId] }))
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.userId !== userId) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [appId, userId, qc]);

  const sendTyping = () => {
    supabase.channel(`msgs-${appId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { userId },
    });
  };

  function pickFiles(files: FileList | null) {
    if (!files) return;
    const ok: File[] = [];
    for (const f of Array.from(files)) {
      if (!ALLOWED.includes(f.type)) { toast.error(`${f.name}: unsupported file type`); continue; }
      if (f.size > MAX_BYTES) { toast.error(`${f.name}: exceeds 10 MB`); continue; }
      ok.push(f);
    }
    setPending(p => [...p, ...ok].slice(0, 5));
  }

  async function uploadAll(): Promise<Attachment[]> {
    const out: Attachment[] = [];
    for (const f of pending) {
      const key = `${appId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${f.name}`;
      const { error } = await supabase.storage.from("chat-files").upload(key, f, {
        contentType: f.type, upsert: false,
      });
      if (error) { toast.error(`${f.name}: ${error.message}`); continue; }
      const { data: signed } = await supabase.storage.from("chat-files").createSignedUrl(key, 60 * 60 * 24 * 7);
      out.push({ name: f.name, url: signed?.signedUrl ?? key, size: f.size, mime: f.type });
    }
    return out;
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && pending.length === 0) return;
    setBusy(true);
    try {
      const attachments = pending.length ? await uploadAll() : [];
      const body = text.trim().slice(0, 2000) || null;
      const { error } = await supabase.from("messages").insert({
        application_id: appId, sender_id: userId, body, attachments,
      });
      if (error) { toast.error(error.message); return; }

      // Notify recipient
      const { data: app } = await supabase.from("applications").select("developer_id, projects(recruiter_id, title)").eq("id", appId).maybeSingle();
      if (app) {
        const targetId = userId === app.developer_id ? (app.projects as any)?.recruiter_id : app.developer_id;
        if (targetId) {
          await supabase.from("notifications").insert({
            user_id: targetId,
            title: "New message",
            body: `New message for project: ${(app.projects as any)?.title}`,
            type: "project_update",
            link: `/applications/${appId}`
          });
        }
      }

      setText(""); setPending([]);
      if (fileRef.current) fileRef.current.value = "";
    } finally { setBusy(false); }
  }

  if (error) return <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-10 text-center text-destructive">Failed to load chat. <Button variant="link" onClick={() => qc.invalidateQueries({ queryKey: ["msgs", appId] })}>Retry</Button></div>;

  return (
    <div className="mt-6 flex h-[60vh] flex-col rounded-xl border border-border bg-card shadow-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {isLoading && <ChatSkeleton />}
        {!isLoading && messages?.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No messages yet — say hi 👋</p>}
        {messages?.map(m => {
          const mine = m.sender_id === userId;
          const atts = (m.attachments as unknown as Attachment[]) ?? [];
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-gradient-accent text-primary-foreground" : "bg-muted"}`}>
                {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                {atts.length > 0 && (
                  <div className={`mt-2 space-y-1.5 ${m.body ? "border-t border-white/15 pt-2" : ""}`}>
                    {atts.map((a, i) => {
                      const Icon = fileIcon(a.mime);
                      const isImage = a.mime.startsWith("image/");
                      return (
                        <a key={i} href={a.url} target="_blank" rel="noreferrer"
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:opacity-90 ${mine ? "bg-white/15" : "bg-background/60 border border-border"}`}>
                          {isImage ? (
                            <img src={a.url} alt={a.name} className="h-10 w-10 rounded object-cover" loading="lazy" />
                          ) : (
                            <Icon className="h-4 w-4 shrink-0" />
                          )}
                          <span className="flex-1 truncate">{a.name}</span>
                          <span className="opacity-70">{fmtSize(a.size)}</span>
                          <Download className="h-3.5 w-3.5 opacity-70" />
                        </a>
                      );
                    })}
                  </div>
                )}
                <div className={`mt-1 flex items-center gap-1.5 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {mine && <span>· {m.read_at ? "Seen" : "Sent"}</span>}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-2 text-xs text-muted-foreground animate-pulse">typing...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {pending.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border p-2">
          {pending.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
              <Paperclip className="h-3 w-3" />{f.name} <span className="text-muted-foreground">({fmtSize(f.size)})</span>
              <button type="button" onClick={() => setPending(p => p.filter((_, idx) => idx !== i))} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <input ref={fileRef} type="file" multiple className="hidden"
          accept=".pdf,.doc,.docx,.zip,image/*"
          onChange={e => pickFiles(e.target.files)} />
        <Button type="button" size="icon" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          value={text}
          onChange={e => { setText(e.target.value); sendTyping(); }}
          placeholder="Type a message..."
          maxLength={2000}
          disabled={busy}
        />
        <Button type="submit" size="icon" disabled={busy} className="bg-gradient-accent text-primary-foreground hover:opacity-90">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
          <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-muted" />
        </div>
      ))}
    </div>
  );
}
