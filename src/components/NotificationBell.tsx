import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, qc]);

  if (!user) return null;

  const unread = notifications?.filter((n) => !n.read_at) ?? [];

  async function markAllRead() {
    if (!user || unread.length === 0) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is_null("read_at");
    qc.invalidateQueries({ queryKey: ["notifications", user.id] });
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications", user!.id] });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unread.length > 0 && (
            <Button size="sm" variant="ghost" onClick={markAllRead} className="h-7 text-xs">
              <Check className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {!notifications || notifications.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`border-b border-border/60 p-3 text-sm last:border-0 ${
                    !n.read_at ? "bg-accent/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {n.link ? (
                        <Link
                          to={n.link}
                          onClick={() => markRead(n.id)}
                          className="font-medium hover:text-accent-foreground block"
                        >
                          {n.title}
                        </Link>
                      ) : (
                        <p className="font-medium">{n.title}</p>
                      )}
                      {(n.message || (n as any).body) && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {n.message || (n as any).body}
                        </p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.read_at && <Badge variant="default" className="h-1.5 w-1.5 rounded-full p-0" />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
