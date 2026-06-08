import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Briefcase, Code2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or Create Account | DeveloperConnect" },
      { name: "description", content: "Join DeveloperConnect today. Find the best part-time developer jobs or hire top Indian tech talent for your startup." },
      { property: "og:title", content: "Sign in or Create Account | DeveloperConnect" },
      { property: "og:description", content: "Join DeveloperConnect today. Find the best part-time developer jobs or hire top Indian tech talent for your startup." },
      { tag: "link", rel: "canonical", href: "https://developerconnect.in/auth" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://developerconnect.in" },
            { "@type": "ListItem", "position": 2, "name": "Auth", "item": "https://developerconnect.in/auth" }
          ]
        })
      }
    ]
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

function GoogleButton({ role, text = "Continue with Google" }: { role?: "developer" | "recruiter", text?: string }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    if (role) {
      localStorage.setItem("pending_role", role);
    }
    console.log("Initiating Google OAuth flow...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      console.error("Google sign in error:", error.message);
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full gap-2 border-border hover:bg-muted"
      onClick={handleGoogleSignIn}
      disabled={loading}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {loading ? "Connecting..." : text}
    </Button>
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
    console.log("Attempting sign in for:", email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      console.error("Sign in error:", error.message);
      toast.error(error.message);
      return;
    }

    console.log("Sign in successful for user:", data.user?.id);
    const role = data.user?.user_metadata?.role;
    console.log("User Role from metadata:", role);

    toast.success("Welcome back!");

    if (role === 'admin') navigate({ to: '/admin' });
    else navigate({ to: "/dashboard" });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="si-email">Email</Label>
          <Input id="si-email" type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="si-pw">Password</Label>
            <Link to="/forgot-password" title="Recover your password" className="text-xs text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="si-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full bg-gradient-accent text-primary-foreground hover:opacity-90" disabled={busy}>
          {busy ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
      </div>

      <GoogleButton text="Sign in with Google" />
    </div>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"developer" | "recruiter">("developer");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setBusy(true);

    const selectedRole = role;
    console.log("Attempting sign up for:", email, "with role:", selectedRole);

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, role: selectedRole },
      },
    });

    if (error) {
      console.error("Sign up error:", error.message);
      setBusy(false);
      toast.error(error.message);
      return;
    }

    console.log("Sign up successful. User ID:", data.user?.id);
    if (data.session) {
      console.log("Session established immediately");
    } else {
      console.log("No immediate session - email verification might be required");
    }

    // Role is captured via user_metadata and synced to public.user_roles by the handle_new_user trigger.

    setBusy(false);

    if (!data.session) {
      setCheckEmail(true);
      toast.success("Check your email to verify your account!");
    } else {
      toast.success("Account created! Welcome aboard.");
      navigate({ to: "/dashboard" });
    }
  }

  if (checkEmail) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <Mail className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold mb-2">Check your email</h2>
        <p className="text-muted-foreground text-sm mb-6">
          We've sent a verification link to <span className="font-medium text-foreground">{email}</span>.
          Please click the link to activate your account.
        </p>
        <Button variant="outline" className="w-full" onClick={() => setCheckEmail(false)}>
          Back to sign up
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="su-name">Full name</Label>
          <Input id="su-name" required placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-email">Email</Label>
          <Input id="su-email" type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-pw">Password</Label>
          <Input id="su-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full bg-gradient-accent text-primary-foreground hover:opacity-90" disabled={busy}>
          {busy ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
      </div>

      <GoogleButton role={role} text="Sign up with Google" />
    </div>
  );
}
