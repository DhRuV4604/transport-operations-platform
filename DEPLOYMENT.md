# Deploying TransitOps

Local dev uses a SQLite file (`prisma/dev.db`), which doesn't persist on serverless
platforms like Vercel — every deploy (and often every request) gets a fresh, read-only
filesystem. You need a real hosted database before deploying.

## 1. Pick a hosted database

**Option A — Neon (Postgres), recommended.** The schema already avoids Prisma enums
(status/role values are plain strings validated by Zod, see `prisma/schema.prisma`), so
the swap is mechanical:

1. Create a free project at [neon.tech](https://neon.tech) and copy its connection string.
2. In `prisma/schema.prisma`, change the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run `npx prisma db push` against the Neon URL to create tables, then
   `npx prisma db seed` to load demo data (or write real data via the app).

**Option B — Turso (hosted SQLite/libSQL).** Keeps `provider = "sqlite"` in the schema,
but requires swapping `@prisma/client` for the `@prisma/adapter-libsql` driver adapter,
since Prisma's default SQLite connector expects a local file, not a network endpoint.
More moving parts than Neon for the same result — only worth it if you specifically want
to stay on SQLite semantics.

This guide assumes **Option A (Neon)**.

## 2. Environment variables

Set these in the Vercel project's Settings → Environment Variables (production and
preview):

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | Neon connection string | Use the *pooled* connection string Neon provides for serverless. |
| `AUTH_SECRET` | a long random string | Generate with `openssl rand -base64 32`. Rotating it invalidates all sessions. |
| `CRON_SECRET` | a long random string | Must match the `x-cron-secret` header Vercel Cron sends (see step 4). |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | your SMTP provider's creds | Optional — without these, license reminder emails fall back to a disposable Ethereal test inbox and won't reach real recipients. Use a real provider (Resend, Postmark, SES) for production. |

Never commit real values for these — `.env` is gitignored specifically so secrets stay
local; supply them through Vercel's dashboard instead.

## 3. Vehicle document uploads

`uploadVehicleDocumentAction` (`src/server/actions/vehicleDocuments.ts`) currently writes
uploaded files to `public/uploads/` on the local filesystem — this **will not work** on
Vercel, where the filesystem is ephemeral and read-only outside `/tmp`. Before deploying,
swap the file-write in that action for an object-storage upload (Vercel Blob, S3, or
UploadThing), storing the returned public URL in `VehicleDocument.filePath` instead of a
local `/uploads/...` path. Everything downstream (the Documents tab, download links,
expiry badges) already just renders whatever `filePath` contains, so this is a localized
change to one action.

## 4. License reminder cron

`/api/cron/license-reminders` is already guarded by a `CRON_SECRET` header check
(`src/app/api/cron/license-reminders/route.ts`). To run it on a schedule, add a
`vercel.json` at the project root:

```json
{
  "crons": [
    { "path": "/api/cron/license-reminders", "schedule": "0 6 * * *" }
  ]
}
```

Vercel Cron calls the path with `GET` but does **not** send custom headers by default —
either switch the route to check a query param instead (`?secret=...`), or trigger it
from an external scheduler (e.g. GitHub Actions, cron-job.org) that can set the
`x-cron-secret` header. The manual "Send reminders now" button on `/drivers` (Safety
Officer only) works regardless and doesn't depend on this cron.

## 5. Deploy

1. Push the repo to GitHub/GitLab and import it in Vercel ("Add New Project").
2. Set the environment variables from step 2.
3. Vercel auto-detects Next.js; the build runs `next build`. Prisma Client generation
   happens automatically via the `postinstall` step `prisma generate` — add that script
   to `package.json` if it isn't already present, since Vercel's build cache can skip
   `node_modules` regeneration otherwise:
   ```json
   "scripts": {
     "postinstall": "prisma generate"
   }
   ```
4. After the first deploy, run `npx prisma db push` (or `prisma migrate deploy` if you
   switch to migrations) against the production `DATABASE_URL` from your local machine
   or a CI step — schema changes don't apply themselves.
5. Seed production data only if you want the demo dataset; otherwise create real
   Fleet Manager / Dispatcher / Safety Officer / Financial Analyst users directly against
   the production database.

## 6. Post-deploy checklist

- [ ] Log in with each of the four roles and confirm write permissions match `PERMISSIONS`
      in `src/lib/constants.ts`.
- [ ] Trigger a trip dispatch → complete cycle to confirm the Postgres `$transaction`
      behavior matches SQLite (Prisma's transaction API is provider-agnostic, but worth
      a smoke test).
- [ ] Upload a vehicle document and confirm it's retrievable after a fresh deploy (proves
      object storage, not local disk, is actually being used).
- [ ] Hit `/api/export/roi` and confirm the CSV downloads correctly behind auth.
- [ ] Confirm `/api/cron/license-reminders` returns 401 without the secret and 200 with it.
