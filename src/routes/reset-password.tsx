import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password | DeveloperConnect" },
      { name: "description", content: "Set a new password for your DeveloperConnect account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a session (Supabase automatically handles the recovery token from the URL)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        console.warn("No session found in reset password page. Token might be expired or invalid.");
      }
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setBusy(true);
    console.log("Updating password...");

    const { error } = await supabase.auth.updateUser({ password });

    setBusy(false);
    if (error) {
      console.error("Password update error:", error.message);
      toast.error(error.message);
      return;
    }

    toast.success("Password updated successfully!");
    navigate({ to: "/auth" });
  }

  if (!session && !busy) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <h1 className="text-xl font-bold mb-4">Invalid or Expired Link</h1>
          <p className="text-muted-foreground text-sm mb-6">
            The password reset link is invalid or has expired. Please request a new one.
          </p>
          <Button onClick={() => navigate({ to: "/forgot-password" })} className="w-full">
            Request new link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold font-display mb-2 text-center">Set new password</h1>
          <p className="text-muted-foreground text-sm mb-6 text-center">
            Please enter your new password below.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-accent text-primary-foreground hover:opacity-90" disabled={busy}>
              {busy ? "Updating password..." : "Reset password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
