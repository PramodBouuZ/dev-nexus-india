import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password | DeveloperConnect" },
      { name: "description", content: "Reset your DeveloperConnect account password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    console.log("Requesting password reset for:", email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setBusy(false);
    if (error) {
      console.error("Password reset error:", error.message);
      toast.error(error.message);
      return;
    }

    setSent(true);
    toast.success("Reset link sent to your email!");
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
          <Link to="/auth">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to login
          </Link>
        </Button>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant text-center">
          {!sent ? (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Mail className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold font-display mb-2">Forgot password?</h1>
              <p className="text-muted-foreground text-sm mb-6">
                No worries! Enter your email and we'll send you a link to reset your password.
              </p>

              <form onSubmit={onSubmit} className="space-y-4 text-left">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-accent text-primary-foreground hover:opacity-90" disabled={busy}>
                  {busy ? "Sending link..." : "Send reset link"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold font-display mb-2">Check your email</h1>
              <p className="text-muted-foreground text-sm mb-6">
                We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/auth">Return to login</Link>
              </Button>
              <p className="mt-6 text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-accent hover:underline font-medium"
                >
                  try again
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
