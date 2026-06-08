# Deploying to Vercel with your own Supabase project

This repo is built on TanStack Start v1 (Vite 7). It runs fine on Vercel with the
official `tanstack-start` framework preset. Server functions and server routes
become Vercel Functions automatically.

---

## 1. Provision your Supabase project

You said you already created the project. Grab these from **Project Settings → API**:

- **Project URL** — `https://<ref>.supabase.co`
- **`anon` / publishable key** (safe in browser)
- **`service_role` key** (server-only, NEVER expose to client)
- **Project Ref** — the `<ref>` part of the URL

---

## 2. Recreate the schema

A single combined SQL file is exported for you:

**`supabase_full_schema.sql`** (downloadable artifact below)

In your new Supabase dashboard:
1. Open **SQL Editor → New query**
2. Paste the entire contents of `supabase_full_schema.sql`
3. Click **Run**

This recreates every table, enum, function, trigger, RLS policy, GRANT, realtime
publication entry, and the storage buckets used by the app.

> ⚠️ The bundle is the historical migration log. Run it ONCE on a brand-new
> project. Re-running it on an existing project will fail because objects
> already exist.

### Storage buckets

The migrations also create the `avatars` (public) and `chat-files` (private)
buckets along with their RLS policies. No manual step needed.

### Google OAuth (optional, if you use it)

In **Authentication → Providers → Google**: enable, paste your Google OAuth
client id/secret, and set the redirect URL Supabase shows there in your Google
Cloud Console.

---

## 3. Configure environment variables in Vercel

Go to **Vercel → Project → Settings → Environment Variables** and add:

### Client-visible (prefixed `VITE_`)
| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your anon/publishable key |
| `VITE_SUPABASE_PROJECT_ID` | `<ref>` |

### Server-only (no prefix)
| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | your anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | your service_role key |
| `SUPABASE_PROJECT_ID` | `<ref>` |
| `LOVABLE_API_KEY` | only if you keep using Lovable AI gateway features |

Apply to **Production**, **Preview**, and **Development** as needed.

---

## 4. Deploy

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, **Add New → Project → Import** your repo.
3. Framework preset: **TanStack Start** (detected automatically from `vercel.json`).
4. Leave Build/Output settings on defaults — `vercel.json` overrides what's needed:
   - Build command: `npm run build:vercel`
   - Output directory: `.vercel/output`
   - Install command: `npm install`
5. Click **Deploy**.

---

## 5. After first deploy

- **Supabase Auth → URL Configuration**: set **Site URL** to your Vercel
  domain (e.g. `https://your-app.vercel.app`) and add it under
  **Redirect URLs**. Without this, email-link sign-ins land on `localhost`.
- **Custom domain** (optional): add it in Vercel, then update Site URL and
  Redirect URLs in Supabase to match.
- **Realtime**: Already enabled by the bundle for messages, profiles, projects,
  applications, etc. — no action needed.

---

## 6. Things to know

- `src/integrations/supabase/client.ts`, `client.server.ts`, `auth-middleware.ts`,
  `auth-attacher.ts`, and `types.ts` are Lovable-generated. They read from
  `import.meta.env.VITE_*` (browser) and `process.env.*` (server), so they work
  unchanged on Vercel once env vars are set.
- The Lovable AI gateway (`LOVABLE_API_KEY`) only works while connected to
  Lovable. If you're moving fully off Lovable, swap any AI features over to a
  direct provider (OpenAI / Anthropic / etc.) and store that key as a Vercel env var.
- `supabase/config.toml` is for the Lovable-managed project and is not used by
  Vercel. Safe to leave in the repo.
- Edge functions live in `supabase/functions/` (if any). Deploy them with
  `supabase functions deploy <name>` against your new project ref using the
  Supabase CLI.

---

## Troubleshooting

- **Blank page / 500 on Vercel** → check the function logs. Almost always a
  missing `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` env var.
- **`Failed to fetch` from the browser** → `VITE_SUPABASE_URL` or
  `VITE_SUPABASE_PUBLISHABLE_KEY` missing or pointing at the wrong project.
- **`Unsupported provider: provider is not enabled`** on Google sign-in →
  Google provider isn't toggled on in Supabase Auth.
- **Realtime not updating** → confirm the table is in the
  `supabase_realtime` publication (the bundle adds the ones the app uses).
- **Permission denied on a public table** → re-run the GRANT block from the
  bundle for that table; PostgREST needs explicit GRANTs.
