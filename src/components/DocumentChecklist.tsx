import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, ExternalLink, FileCheck2 } from "lucide-react";

export type VerificationDoc = {
  type: string;
  label: string;
  url: string;
  notes?: string;
};

const DOC_TYPES = [
  { value: "government_id", label: "Government ID" },
  { value: "education", label: "Education / Degree" },
  { value: "work_proof", label: "Work / Employment proof" },
  { value: "certification", label: "Certification" },
  { value: "code_sample", label: "Code sample / Repo" },
  { value: "reference", label: "Reference letter" },
  { value: "other", label: "Other" },
];

const REQUIRED_TYPES = ["government_id", "work_proof"];

export function DocumentChecklist({
  value,
  onChange,
  readOnly = false,
}: {
  value: VerificationDoc[];
  onChange?: (v: VerificationDoc[]) => void;
  readOnly?: boolean;
}) {
  const [draft, setDraft] = useState<VerificationDoc>({ type: "government_id", label: "", url: "", notes: "" });

  function add() {
    if (!draft.url.trim()) return;
    onChange?.([...(value ?? []), { ...draft, label: draft.label.trim() || DOC_TYPES.find(t => t.value === draft.type)?.label || draft.type }]);
    setDraft({ type: "other", label: "", url: "", notes: "" });
  }
  function remove(i: number) {
    onChange?.(value.filter((_, idx) => idx !== i));
  }

  const presentTypes = new Set((value ?? []).map(d => d.type));

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground">Required checklist</p>
          <ul className="mt-2 space-y-1 text-sm">
            {REQUIRED_TYPES.map(t => (
              <li key={t} className="flex items-center gap-2">
                <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${presentTypes.has(t) ? "border-success bg-success text-success-foreground" : "border-border"}`}>
                  {presentTypes.has(t) && <FileCheck2 className="h-3 w-3" />}
                </span>
                {DOC_TYPES.find(d => d.value === t)?.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(value ?? []).length > 0 && (
        <ul className="space-y-2">
          {value.map((d, i) => (
            <li key={i} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>{d.label}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                    {DOC_TYPES.find(t => t.value === d.type)?.label ?? d.type}
                  </span>
                </div>
                <a href={d.url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 truncate text-xs text-primary hover:underline">
                  {d.url} <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                {d.notes && <p className="mt-1 text-xs text-muted-foreground">{d.notes}</p>}
              </div>
              {!readOnly && (
                <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)} aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className="grid gap-2 rounded-lg border border-dashed border-border p-3 sm:grid-cols-[1fr_1fr_2fr_auto]">
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={draft.type} onValueChange={v => setDraft({ ...draft, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Label</Label>
            <Input value={draft.label} onChange={e => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. Aadhaar" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL (link to file/page)</Label>
            <Input type="url" value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={add} disabled={!draft.url.trim()} className="w-full">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
