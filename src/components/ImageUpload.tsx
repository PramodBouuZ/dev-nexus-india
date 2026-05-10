import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, X, Building2, User } from "lucide-react";
import { toast } from "sonner";

type Props = {
  userId: string;
  value: string | null;
  onChange: (url: string | null) => void;
  shape?: "circle" | "square";
  label?: string;
  fallback?: "user" | "company";
  folder?: string;
};

export function ImageUpload({ userId, value, onChange, shape = "circle", label, fallback = "user", folder = "" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");

    setBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const name = `${folder ? folder + "-" : ""}${Date.now()}.${ext}`;
    const path = `${userId}/${name}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    onChange(pub.publicUrl);
    setBusy(false);
    toast.success("Image uploaded");
  }

  const Icon = fallback === "company" ? Building2 : User;
  const round = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className="flex items-center gap-4">
      <div className={`relative h-20 w-20 overflow-hidden ${round} border border-border bg-muted flex items-center justify-center`}>
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            <span>{value ? "Change" : "Upload"}</span>
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)} disabled={busy}>
              <X className="h-3.5 w-3.5" /> Remove
            </Button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handle} />
      </div>
    </div>
  );
}
