---
name: testing-email-flows
description: How to run the 4W'S Inua Jamii Next.js app locally with a local Supabase and an intercepted Resend API so member/contact/signup email flows can be tested end-to-end in a browser.
---

# Testing email + membership flows locally (4ws-inua-jamii)

## Devin Secrets Needed
- None required for local testing. Real `RESEND_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are only needed if you must test
  against the real project. If `list_secrets` is empty, use the local stack below.

## 1. Local Supabase
```bash
supabase init && supabase start           # API :54321, DB :54322, Studio :54323
docker exec -i supabase_db_sbtest psql -U postgres -d postgres < supabase/schema.sql
docker exec -i supabase_db_sbtest psql -U postgres -d postgres < supabase/migrations.sql
# plus any phase*.sql files; then NOTIFY pgrst,'reload schema';
```
`psql` may not exist on the host — always go through `docker exec ... psql`.
Create users via the auth admin API (or Studio) and insert matching `profiles` rows
(`role='admin'` for the admin account) — profiles are not always auto-created.

## 2. Intercept Resend instead of sending real mail
Map `api.resend.com` to 127.0.0.1 in `/etc/hosts`, run a local HTTPS server on :443 that
appends every request body to a JSONL file and returns a Resend-shaped `{id}`; start the app with
`RESEND_API_KEY=<anything>` and `NODE_EXTRA_CA_CERTS=<your cert>`. This is the only reliable way
to assert on recipients, `from`, `reply_to`, HTML escaping, `text` bodies, and `/emails/batch`
payloads. To test the "no key" path, restart with `env -u RESEND_API_KEY` and grep the server log
for `[email] RESEND_API_KEY not set — email skipped`.

## 3. Running the app (dev vs production) and the CSP
`next.config.mjs` builds the CSP conditionally on `NODE_ENV`. Since commit cbe11f2 the dev CSP adds
`'unsafe-eval'` to `script-src` and `ws: http://localhost:*` to `connect-src`, so `npm run dev`
hydrates and forms work. Verify with `curl -sI http://localhost:3000/contact | tr ';' '\n' | grep -i script-src`.
If a future change drops those dev allowances, `next dev` will silently fail to hydrate (buttons/forms
dead) — fall back to `npm run build && npm start` and report it.
Important: the dev connect-src allows `http://localhost:*` but NOT `127.0.0.1`. Set
`NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321` in `.env.local` when testing in dev mode, otherwise
browser calls to a local Supabase are CSP-blocked.
Always also check the production header has no `'unsafe-eval'` / `ws:` after `npm run build && npm start`.
Beware stale servers: check `pgrep -f next-server` and kill leftovers, otherwise you test an old build.
Chrome quirk: typing a URL ending in `/` in the omnibox can autocomplete to a previously visited path;
type the URL, press `Delete` to clear the inline autocompletion, then `Return`.

## 4. Known behaviour / gotchas
- `/contact` used to crash to the global error boundary ("Something went wrong", minified React
  error #482) after a successful submit because `app/contact/page.tsx` was `'use client'` while
  importing the async server component `Footer`. Fixed in cbe11f2 by splitting the page into a
  server component + `app/contact/ContactContent.tsx`. If a similar crash reappears on any page,
  look for a `'use client'` page importing an async server component.
- Contact form is rate limited to 3 messages per email address per hour; use a fresh email each run.
- `/auth/signup` and `/` redirect logged-in users to `/dashboard`; use an incognito window to smoke-test
  public pages.
- Bulk actions only email members whose status actually changes, so seed a mix of statuses to prove it.
- Cron/route-handler jobs (`/api/cron/birthdays`, `Authorization: Bearer $CRON_SECRET`) MUST be
  re-tested on a **production build** (`npm run build && npx next start -p 3001`) with a **warm**
  `.next/cache/fetch-cache`. Next's Data Cache can serve stale Supabase reads and either fake or mask
  ledger idempotency; dev mode hides this. A correct implementation needs both
  `export const fetchCache = 'force-no-store'` on the route and a service-role client whose
  `global.fetch` passes `cache: 'no-store'`. Adversarial check: run the job 3x back to back and assert
  the JSON counts drop to 0 AND the `notifications` row count stays flat, then flip a row in the DB and
  re-run without restarting — the change must be picked up in the same process.
- Don't run `next build` in the same directory as a live `next dev` — it clobbers `.next` and the dev
  server 500s with `Cannot find module './XXXX.js'` (fix: `rm -rf .next`, restart dev).
- After a box restart the filesystem survives but every process dies. Restart, in order: Supabase
  (`supabase start` in the local project dir), the Resend mock (`sudo -n node server.js` — it binds
  :443, non-root fails silently and the app then reports `fetch failed` per email), then the app.
  A cheap probe: `curl --cacert <cert> -X POST https://api.resend.com/emails -d '{}'` should return 200.
- To decide whether a UI bug is a regression, `git worktree add` the base commit, symlink
  `node_modules`, build it and run it on another port; compare behaviour.
