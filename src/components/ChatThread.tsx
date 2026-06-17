import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
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

// Stored shape (new): { name, path, size, mime }. Old rows may have { name, url, size, mime }.
type Attachment = { name: string; path?: string; url?: string; size: number; mime: string };

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
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastTypingSentRef = useRef(0);

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["msgs", appId],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      // Fetch latest 50 in desc order (uses index), then reverse for display
      const { data, error } = await supabase
        .from("messages")
        .select("id,application_id,sender_id,body,attachments,created_at,read_at")
        .eq("application_id", appId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []).reverse();
    },
  });

  // Collect attachment paths needing signed URLs
  const paths = useMemo(() => {
    const set = new Set<string>();
    (messages ?? []).forEach((m: any) => {
      const atts = (m.attachments ?? []) as Attachment[];
      atts.forEach((a) => { if (a.path) set.add(a.path); });
    });
    return Array.from(set);
  }, [messages]);

  const { data: appInfo } = useQuery({
    queryKey: ["chat-app-info", appId],
    queryFn: async () => {
      const { data: app } = await supabase
        .from("applications")
        .select("status, developer_id, projects(recruiter_id)")
        .eq("id", appId)
        .maybeSingle();
      return app;
    }
  });

  const { data: chatEnabledStatus } = useQuery({
    queryKey: ["chat-enabled", userId, appId, appInfo?.status],
    enabled: !!appInfo,
    queryFn: async () => {
      if (appInfo?.status === "accepted") return true;

      const partnerId = userId === appInfo?.developer_id ? (appInfo?.projects as any)?.recruiter_id : appInfo?.developer_id;
      if (!partnerId) return false;

      // Check Contact Access Approved
      const { data: hasContact } = await supabase.rpc("has_contact_access", { _a: userId, _b: partnerId });
      if (hasContact) return true;

      // Check Invite Accepted
      const { data: invite } = await supabase.from("invites")
        .select("id")
        .eq("status", "accepted")
        .or(`and(recruiter_id.eq.${userId},developer_id.eq.${partnerId}),and(recruiter_id.eq.${partnerId},developer_id.eq.${userId})`)
        .limit(1)
        .maybeSingle();

      return !!invite;
    }
  });

  const chatEnabled = !!chatEnabledStatus;

  // Resolve signed URLs for stored paths (refresh every hour)
  const { data: urlMap } = useQuery({
    queryKey: ["chat-signed-urls", appId, paths.join("|")],
    enabled: paths.length > 0,
    staleTime: 1000 * 60 * 50,
    queryFn: async () => {
      const map: Record<string, string> = {};
      // batch in chunks of 50
      for (let i = 0; i < paths.length; i += 50) {
        const slice = paths.slice(i, i + 50);
        const { data } = await supabase.storage.from("chat-files").createSignedUrls(slice, 60 * 60);
        (data ?? []).forEach((r) => { if (r.signedUrl && r.path) map[r.path] = r.signedUrl; });
      }
      return map;
    },
  });

  function resolveUrl(a: Attachment): string {
    if (a.path && urlMap?.[a.path]) return urlMap[a.path];
    return a.url || "";
  }

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Mark received messages as read
  useEffect(() => {
    if (!messages?.length) return;
    const unread = messages.filter((m: any) => m.sender_id !== userId && !m.read_at).map((m: any) => m.id);
    if (!unread.length) return;
    supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread).then(({ error }) => {
      if (!error) qc.invalidateQueries({ queryKey: ["msgs", appId] });
    });
  }, [messages, userId, appId, qc]);

  // Single channel for both postgres_changes and typing broadcast
  useEffect(() => {
    const ch = supabase.channel(`msgs-${appId}`, { config: { broadcast: { self: false } } })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `application_id=eq.${appId}` },
        () => qc.invalidateQueries({ queryKey: ["msgs", appId] }))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `application_id=eq.${appId}` },
        () => qc.invalidateQueries({ queryKey: ["msgs", appId] }))
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload?.userId !== userId) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 2500);
        }
      })
      .subscribe();
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); channelRef.current = null; };
  }, [appId, userId, qc]);

  function sendTyping() {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return; // throttle
    lastTypingSentRef.current = now;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId } });
  }

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
      const safeName = f.name.replace(/[^\w.\-]+/g, "_");
      const key = `${appId}/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safeName}`;
      const { error } = await supabase.storage.from("chat-files").upload(key, f, {
        contentType: f.type, upsert: false,
      });
      if (error) { toast.error(`${f.name}: ${error.message}`); continue; }
      out.push({ name: f.name, path: key, size: f.size, mime: f.type });
    }
    return out;
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && pending.length === 0) return;
    if (busy) return;
    setBusy(true);
    try {
      const attachments = pending.length ? await uploadAll() : [];
      if (pending.length > 0 && attachments.length === 0) return; // all uploads failed
      const body = text.trim().slice(0, 2000) || null;
      const { error } = await supabase.from("messages").insert({
        application_id: appId, sender_id: userId, body, attachments,
      });
      if (error) { toast.error(error.message); return; }

      // Notify recipient (best-effort)
      try {
        const { data: app } = await supabase.from("applications")
          .select("developer_id, projects(recruiter_id, title)").eq("id", appId).maybeSingle();
        if (app) {
          const targetId = userId === app.developer_id ? (app.projects as any)?.recruiter_id : app.developer_id;
          if (targetId && targetId !== userId) {
            await supabase.from("notifications").insert({
              user_id: targetId,
              title: "New message",
              body: `New message for project: ${(app.projects as any)?.title ?? ""}`.trim(),
              type: "project_update",
              link: `/applications/${appId}`,
            });
          }
        }
      } catch { /* notification failure shouldn't block chat */ }

      setText(""); setPending([]);
      if (fileRef.current) fileRef.current.value = "";
      // Immediate refresh — don't wait for realtime
      qc.invalidateQueries({ queryKey: ["msgs", appId] });
    } finally { setBusy(false); }
  }

  if (error) return <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-10 text-center text-destructive">Failed to load chat. <Button variant="link" onClick={() => qc.invalidateQueries({ queryKey: ["msgs", appId] })}>Retry</Button></div>;

  if (!chatEnabled && !isLoading) {
    return (
      <div className="mt-6 flex h-[40vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center shadow-card">
        <div className="rounded-full bg-muted p-4">
          <Send className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-semibold">Chat is locked</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          To enable chat, you must first have an approved contact request or an accepted invite between both parties.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex h-[60vh] flex-col rounded-xl border border-border bg-card shadow-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {isLoading && <ChatSkeleton />}
        {!isLoading && messages?.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No messages yet — say hi 👋</p>}
        {messages?.map((m: any) => {
          const mine = m.sender_id === userId;
          const atts = (m.attachments as unknown as Attachment[]) ?? [];
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-gradient-accent text-primary-foreground" : "bg-muted"}`}>
                {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                {atts.length > 0 && (
                  <div className={`mt-2 space-y-1.5 ${m.body ? "border-t border-white/15 pt-2" : ""}`}>
                    {atts.map((a, i) => {
                      const Icon = fileIcon(a.mime);
                      const isImage = a.mime.startsWith("image/");
                      const url = resolveUrl(a);
                      return (
                        <a key={i} href={url || undefined} target="_blank" rel="noreferrer"
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:opacity-90 ${mine ? "bg-white/15" : "bg-background/60 border border-border"} ${url ? "" : "pointer-events-none opacity-60"}`}>
                          {isImage && url ? (
                            <img src={url} alt={a.name} className="h-10 w-10 rounded object-cover" loading="lazy" />
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
