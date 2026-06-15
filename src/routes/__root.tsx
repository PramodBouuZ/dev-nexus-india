import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Hire Developers in India | Part-time & Full-time Developers | DeveloperConnect" },
      { name: "description", content: "Hire skilled developers in India for part-time, full-time, freelance, startup and project-based work. Connect with verified developers and recruiters on DeveloperConnect." },
      { name: "keywords", content: "hire developers, hire software developers, hire web developers, hire app developers, hire developers in India, part time developers, full time developers, remote developers, freelance developers, react developers, node js developers, python developers, flutter developers, full stack developers, startup hiring, software engineers India, developer marketplace India" },
      { property: "og:title", content: "Hire Developers in India | Part-time & Full-time Developers | DeveloperConnect" },
      { property: "og:description", content: "Hire skilled developers in India for part-time, full-time, freelance, startup and project-based work. Connect with verified developers and recruiters on DeveloperConnect." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://developerconnect.in" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/048d9539-d15a-48ae-87ae-dcc781661fc9/id-preview-ccc11d2b--4f2b6e14-bc26-4ba1-9413-febc7f0ab51e.lovable.app-1777173063062.png" },
      { name: "twitter:title", content: "Hire Part-Time & Full-Time Developers in India | DeveloperConnect" },
      { name: "twitter:description", content: "DeveloperConnect helps startups and businesses hire skilled part-time and full-time developers in India. Find React, Node.js, Full Stack, Backend, Frontend, and freelance developers quickly." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/048d9539-d15a-48ae-87ae-dcc781661fc9/id-preview-ccc11d2b--4f2b6e14-bc26-4ba1-9413-febc7f0ab51e.lovable.app-1777173063062.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "DeveloperConnect" },
      { name: "theme-color", content: "#0f172a" },
    ],
    links: [
      { rel: "canonical", href: "https://developerconnect.in" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" }
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "DeveloperConnect",
          "url": "https://developerconnect.in",
          "logo": "https://developerconnect.in/logo.png",
          "description": "DeveloperConnect helps startups and businesses hire skilled part-time and full-time developers in India.",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN"
          }
        })
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "DeveloperConnect",
          "url": "https://developerconnect.in",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://developerconnect.in/projects?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
