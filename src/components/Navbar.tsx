import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BrandLink, PoweredByBant } from "@/components/Brand";

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <BrandLink />
          <span className="hidden h-5 w-px bg-border md:block" />
          <PoweredByBant className="hidden md:inline-flex" />
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
            Browse Projects
          </Link>
          <Link to="/developers" className="text-muted-foreground hover:text-foreground transition-colors">
            Find Developers
          </Link>
          <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link to="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              {role === "developer" && (
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/verification">Get verified</Link>
                </Button>
              )}
              {role === "admin" && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">Admin</Link>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-accent text-primary-foreground hover:opacity-90">
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
