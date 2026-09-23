# RealtyPulse AI

A real, functional multi-tenant real estate CRM/SaaS built from the Stitch
"RealtyPulse Enterprise Suite" UI designs — Next.js 14 (App Router) +
TypeScript + Tailwind CSS on the frontend, Supabase (Postgres + Auth + RLS)
on the backend.

This is a foundation, not a finished, audited product. Read
[Known limitations](#known-limitations--whats-left) before deploying it
for real users.

## Stack

- **Framework:** Next.js 14, App Router, Server Components + Server Actions
- **Database / Auth:** Supabase (Postgres, Row Level Security, Supabase Auth)
- **Styling:** Tailwind CSS, tokens matched to the Stitch design system
- **Charts:** Recharts
- **i18n:** custom EN/AR dictionary system with full RTL support

## Getting started

1. **Create a Supabase project** at [supabase.com](https://supabase.com).

2. **Run the schema.** In the Supabase SQL editor, run, in order:
   - `supabase/schema.sql` — all tables, enums, RLS policies, triggers
   - `supabase/seed-demo-data.sql` — optional; defines a `load_demo_data(org_id)`
     RPC you can call manually. Nothing seeds automatically.

3. **Copy environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   from Project Settings → API. Add `SUPABASE_SERVICE_ROLE_KEY` (same
   page) if you want team invites to work — keep it server-only, never
   commit it.

4. **Install and run:**
   ```bash
   npm install
   npm run dev
   ```

5. **Sign up.** The first user in a new organization becomes its `owner`.
   Signing up creates the organization, the owner membership, and an
   idle registry of the 11 default AI agents (see below) — all with zero
   run history, because nothing has executed yet.

## Architecture

```
User → Supabase Auth → profiles (trigger-created) → memberships → organizations
                                                            ↓
                                    leads / clients / properties / deals /
                                    tasks / appointments / campaigns /
                                    conversations+messages / ai_agents
```

Every business table carries `organization_id`, and Row Level Security
policies (in `schema.sql`) enforce that a user can only read/write rows
in an organization they're a member of — this is checked at the database
level via `is_org_member()` / `has_org_role()`, not just in the UI.

### Multi-tenancy & roles

`organizations` ← `memberships` (role: `owner` / `admin` / `agent` / `staff`) → `profiles`.
An organization can have many users; a user can belong to more than one
organization's data model (though the current signup flow gives each new
user exactly one). Every teammate signs in with their own email and
password — nobody shares a login, even when the whole office works out of
one organization.

Role permissions are enforced in two places, not just the UI:
- **Database (source of truth):** RLS policies in `schema.sql` — `staff`
  is read-only, `agent`/`admin`/`owner` can create and edit, and only
  `admin`/`owner` can delete or manage the team/org settings. If you
  already ran the original schema before this was added, run
  `supabase/migration-role-permissions.sql` once to bring an existing
  database up to date.
- **UI (convenience, mirrors the DB rules):** `src/lib/permissions.ts`
  hides buttons a role can't use — e.g. a `staff` user never sees an "Add
  Lead" button. This is only a UX nicety; someone bypassing the UI still
  hits the same RLS wall at the database.

Role checks for organization-level actions (renaming the org, inviting
teammates) live in `src/lib/actions/settings.ts`.

### Zero-data by design

No table is ever seeded automatically. A new organization's dashboard,
leads, properties, etc. all genuinely read `0` / empty from the database
until you add real records or explicitly call `load_demo_data()`.

### AI Agents

`src/lib/services/ai/agent-service.ts` is the orchestration layer:
- `ai_agents` — one row per agent per organization (created idle at signup
  from `default-agents.ts`)
- `ai_agent_runs` — real run history; a run is only ever written after an
  actual attempt
- `ModelProvider` (`ai/types.ts`) — the abstraction. The included
  `AnthropicProvider` calls the real Anthropic API when
  `ANTHROPIC_API_KEY` is set, and returns an honest "not configured"
  error when it isn't. **No agent result is ever fabricated** — if you
  see output in the UI, it came from a real provider call.

Swap in a different provider (OpenAI, a custom pipeline, etc.) by
implementing `ModelProvider` and pointing `agent-service.ts` at it.

### i18n / RTL

`src/lib/i18n/` — dictionaries in `locales/en.json` / `locales/ar.json`,
a server-side loader that reads the `rp_locale` cookie, and a client
`I18nProvider` + `useI18n()` hook. `<html dir>` flips between `ltr`/`rtl`
in the root layout. The language switcher persists the choice to both a
cookie (survives refresh) and the user's `profiles.language` column
(survives logout/login, follows the user).

**The language switcher is available before authentication** — it's
built into `AuthShell` (`src/components/auth/auth-shell.tsx`), so it
shows on every screen in the login/signup/forgot-password/reset-password/
onboarding flow, not just after signing in. A new visitor can switch to
Arabic on the very first screen they see, and the whole flow — including
RTL layout — follows from there.

### Auth flow redirects

Login, signup, password reset, and onboarding submit through a small
React-18-compatible `useActionState` hook (`src/lib/hooks/use-action-state.ts`)
that calls the underlying Server Action as a plain function rather than
through a native `<form action={...}>` submission (React 18/Next 14
don't support passing arbitrary functions to `action`, only real Server
Action references via `useFormState`, and that hook's `pending` value
isn't usable outside a nested `useFormStatus` component — see the
comments in that file for the full reasoning).

One consequence: calling `redirect()` **inside** a Server Action invoked
that way is not reliable — Next only guarantees a server-thrown redirect
reaches the browser when the action was triggered via an actual form
submission. Those actions return `{ redirectTo: '/dashboard' }` instead,
and `useActionRedirect` (`src/lib/hooks/use-action-redirect.ts`) calls
`router.push()` client-side once it sees that field. `logout` is the one
exception — it's wired to a real native `<form action={logout}>` in the
topbar, so a server-side `redirect()` there is fine as-is.

## Known limitations / what's left

This is a solid, real foundation — auth, RLS, multi-tenancy, CRUD, i18n/RTL,
and an honest AI-agent architecture all work end-to-end. Before treating it
as production-ready:

- **Not yet built:** file/image upload for property photos (the `images`
  column exists but nothing writes to Supabase Storage yet); WhatsApp/email
  provider integration for Communications (the data model and UI are real,
  but messages you send are stored, not actually dispatched to WhatsApp/SMTP);
  a proper in-app "Load Demo Data" button (the SQL RPC exists, wire a button
  to it in Settings if you want one); pagination on long lists; optimistic
  UI (several forms currently `location.reload()` after a mutation instead
  of updating state in place — functional, but not the smoothest UX).
- **Security review needed before real users:** rate limiting and abuse
  protection on Server Actions aren't included. Review whether `agent`
  should be allowed to edit records they didn't create, or only their own
  (current policies are org-wide by role, not per-record ownership).
- **Type safety:** `src/lib/supabase/types.ts` is hand-written to match
  `schema.sql`. Regenerate it from your live database for full accuracy:
  ```bash
  npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
  ```
- **Not run in this environment:** `npm install` / `npm run build` were
  not executed against a live Supabase project as part of producing this
  code (no network access to supabase.co from the build sandbox). The
  project does typecheck, lint, and build cleanly in this sandbox
  (`npm run typecheck`, `npx next lint`, `npm run build` all pass), but
  connect it to a real Supabase project and click through the auth flow
  yourself before treating it as verified end-to-end.
- **Netlify:** `netlify.toml` explicitly sets `publish = ".next"`. Leave
  the "Publish directory" field blank in the Netlify UI (Site
  configuration → Build & deploy → Build settings) — a manually-set
  value there overrides `netlify.toml` and will conflict with the
  Next.js Runtime plugin, which expects to own that setting.
