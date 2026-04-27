import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Briefcase, Code2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create account — HireSpark" },
      { name: "description", content: "Join HireSpark to post projects or apply as a part-time developer." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
          <Link to="/">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to home
          </Link>
        </Button>

        <Link to="/" className="mb-8 flex items-center justify-center gap-2 font-display text-xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-accent text-primary-foreground shadow-glow">
            <Briefcase className="h-4 w-4" />
          </span>
          Developer Connect
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="si-pw">Password</Label>
        <Input id="si-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full bg-gradient-accent text-primary-foreground hover:opacity-90" disabled={busy}>
        {busy ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"developer" | "recruiter">("developer");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, role },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! Welcome aboard.");
    navigate({ to: "/dashboard" });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>I am a...</Label>
        <RadioGroup value={role} onValueChange={(v) => setRole(v as "developer" | "recruiter")} className="grid grid-cols-2 gap-3">
          <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${role === "developer" ? "border-accent bg-accent/5" : "border-border"}`}>
            <RadioGroupItem value="developer" className="mt-1" />
            <div>
              <div className="flex items-center gap-1.5 text-sm font-medium"><Code2 className="h-4 w-4" />Developer</div>
              <div className="mt-0.5 text-xs text-muted-foreground">Find part-time work</div>
            </div>
          </label>
          <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${role === "recruiter" ? "border-accent bg-accent/5" : "border-border"}`}>
            <RadioGroupItem value="recruiter" className="mt-1" />
            <div>
              <div className="flex items-center gap-1.5 text-sm font-medium"><Briefcase className="h-4 w-4" />Recruiter</div>
              <div className="mt-0.5 text-xs text-muted-foreground">Hire developers</div>
            </div>
          </label>
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-name">Full name</Label>
        <Input id="su-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-pw">Password</Label>
        <Input id="su-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full bg-gradient-accent text-primary-foreground hover:opacity-90" disabled={busy}>
        {busy ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
