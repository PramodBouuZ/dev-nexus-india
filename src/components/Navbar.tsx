import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BrandLink } from "@/components/Brand";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { to: "/projects", label: "Browse Projects" },
    { to: "/developers", label: "Find Developers" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLink />

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user && <NotificationBell />}
          {/* Desktop auth area */}
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/saved">Saved</Link>
                </Button>
                {role === "developer" && (
                  <Button asChild variant="ghost" size="sm">
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

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] max-w-sm">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <BrandLink />
                </SheetTitle>
              </SheetHeader>

              <nav className="mt-6 flex flex-col gap-1 text-sm font-medium">
                {navLinks.map((l) => (
                  <SheetClose asChild key={l.to}>
                    <Link
                      to={l.to}
                      className="rounded-md px-3 py-2.5 text-foreground hover:bg-muted transition-colors"
                    >
                      {l.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-6 flex flex-col gap-2 border-t border-border/60 pt-6">
                {user ? (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="ghost" className="justify-start">
                        <Link to="/dashboard">Dashboard</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild variant="ghost" className="justify-start">
                        <Link to="/saved">Saved</Link>
                      </Button>
                    </SheetClose>
                    {role === "developer" && (
                      <SheetClose asChild>
                        <Button asChild variant="ghost" className="justify-start">
                          <Link to="/verification">Get verified</Link>
                        </Button>
                      </SheetClose>
                    )}
                    {role === "admin" && (
                      <SheetClose asChild>
                        <Button asChild variant="ghost" className="justify-start">
                          <Link to="/admin">Admin</Link>
                        </Button>
                      </SheetClose>
                    )}
                    <Button
                      variant="outline"
                      onClick={async () => {
                        setOpen(false);
                        await signOut();
                        navigate({ to: "/" });
                      }}
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button asChild variant="outline">
                        <Link to="/auth">Sign in</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild className="bg-gradient-accent text-primary-foreground hover:opacity-90">
                        <Link to="/auth">Get started</Link>
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
