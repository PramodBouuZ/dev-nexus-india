import { CheckCircle2, Clock, XCircle, FileCheck2 } from "lucide-react";

type Entry = { status: string; at: string; by?: string | null; note?: string | null };

const iconFor = (s: string) => {
  if (s === "approved") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (s === "rejected") return <XCircle className="h-4 w-4 text-destructive" />;
  if (s === "pending") return <FileCheck2 className="h-4 w-4 text-muted-foreground" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

export function StatusTimeline({ history }: { history: Entry[] | null | undefined }) {
  const items = Array.isArray(history) ? history : [];
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No status updates yet.</p>;
  }
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {items.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[27px] flex h-5 w-5 items-center justify-center rounded-full bg-background ring-2 ring-border">
            {iconFor(e.status)}
          </span>
          <div className="text-sm">
            <span className="font-medium capitalize">{e.status}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {new Date(e.at).toLocaleString()}
            </span>
          </div>
          {e.note && <p className="mt-0.5 text-sm text-muted-foreground whitespace-pre-wrap">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}
