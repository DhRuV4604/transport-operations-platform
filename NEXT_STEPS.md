# TransitOps — Next Steps

Gap analysis against the hackathon brief (`TransitOps Smart Transport Operations Platform.pdf`),
plus a prioritized roadmap for what to build next. Status as of 2026-07-12.

## 1. Where the build stands vs the brief

### Mandatory deliverables — all complete ✅

| Brief requirement | Status | Where |
|---|---|---|
| Responsive web interface | ✅ | Sidebar + mobile bottom nav (`src/components/app-sidebar.tsx`) |
| Authentication with RBAC | ✅ | JWT cookie sessions + permission matrix (`src/lib/auth.ts`, `src/lib/constants.ts`) |
| CRUD for Vehicles and Drivers | ✅ | `/vehicles` (+ `/vehicles/[id]` detail), `/drivers` |
| Trip management with validations | ✅ | `/trips` + `tripService.ts` (capacity, license, availability checks) |
| Automatic status transitions | ✅ | Dispatch/complete/cancel + maintenance open/close, all in `$transaction` |
| Maintenance workflow | ✅ | `/maintenance` + `maintenanceService.ts` |
| Fuel & expense tracking | ✅ | `/expenses` (tabs) + per-vehicle cost totals |
| Dashboard with KPIs + type/status/region filters | ✅ | `/dashboard` (7 KPIs, URL-driven filters, fleet-status donut) |
| Reports: fuel efficiency, utilization, operational cost, ROI | ✅ | `/reports` + `analyticsService.ts` |
| CSV export | ✅ | `/api/export/[report]` — vehicles, drivers, trips, fuel, expenses, roi |
| All 10 mandatory business rules | ✅ | Verified end-to-end (20-check service-level run, all passing) |

### Bonus features

| Bonus feature | Status |
|---|---|
| Charts and visual analytics | ✅ Done (Recharts, light/dark validated palette) |
| Search, filters, and sorting | ✅ Done (shared `DataTable` on every registry) |
| Dark mode | ✅ Done (`next-themes` + theme-aware charts) |
| **PDF export** | ❌ Not built |
| **Email reminders for expiring licenses** | ❌ Not built |
| **Vehicle document management** | ❌ Not built |

## 2. Remaining bonus features (highest demo value first)

### 2.1 PDF export — ~1–2 h

The brief marks PDF export as optional alongside CSV. Cheapest credible path:

- Add a print stylesheet to `/reports` (`@media print`: hide sidebar/topbar/filter chrome,
  force light theme, page-break between report cards) and an "Export PDF" button that calls
  `window.print()`. Browsers produce the PDF; zero new dependencies.
- If a true server-generated file is wanted later, swap to `@react-pdf/renderer` behind the
  same `/api/export/…` pattern (e.g. `/api/export/roi?format=pdf`), reusing
  `analyticsService.ts` so numbers can never diverge from the CSV.

### 2.2 Email reminders for expiring licenses — ~2–3 h

- Query already exists in spirit: drivers with `licenseExpiry < now + 30 days` (the drivers
  page shows the red badge for exactly this).
- Add `licenseReminderService.ts` that finds expiring/expired licenses and sends one email
  per safety officer via `nodemailer` (SMTP creds in `.env`; use Ethereal/Mailtrap for demo).
- Trigger: a guarded route handler `/api/cron/license-reminders` (secret header check) hit by
  an external scheduler — Vercel Cron in deployment, or a manual "Send reminders now" button
  on `/drivers` for the demo (visible to Safety Officer only).
- Record `lastRemindedAt` on `Driver` to avoid duplicate sends.

### 2.3 Vehicle document management — ~3–4 h

The biggest remaining item; touches schema, upload handling, and UI.

- Schema: `VehicleDocument { id, vehicleId, title, kind (RC | INSURANCE | PERMIT | PUC | OTHER), fileName, filePath, expiryDate?, uploadedAt }`.
- Upload: server action taking `FormData` with a `File`, saved under `public/uploads/`
  (local dev) — swap to S3/UploadThing when deployed. Validate type (pdf/jpg/png) and size.
- UI: new "Documents" tab on `/vehicles/[id]` — list with download links, expiry badges
  (reuse the red-badge pattern from drivers), upload dialog for `vehicles.write` (Fleet Manager).
- Dashboard tie-in: "Documents expiring soon" count once expiry dates exist.

## 3. Worth doing beyond the brief

Ordered by value-to-effort for a judged demo:

1. **Expiring-license KPI on the dashboard** (~30 min) — count of licenses expired or
   expiring within 30 days; makes the Safety Officer story visible without opening `/drivers`.
2. **Trip detail page `/trips/[id]`** (~1 h) — the original plan sketched it; row dialogs
   cover the lifecycle today, but a detail page gives judges a place to see odometer history,
   linked fuel logs, and expenses per trip. Mirror `vehicles/[id]`.
3. **Turn the E2E script into a real test suite** (~1–2 h) — the 20-check verification run
   (business rules + analytics) was written as a throwaway script; port it to Vitest
   (`npm t`), pointing at a temp SQLite file so it never touches `dev.db`. Guards every
   future change to the services.
4. **Date-range filter on reports** (~1–2 h) — all analytics are currently all-time.
   A `?from=&to=` searchParam pair (preset rows: 7/30/90 days) threaded into
   `analyticsService.ts` makes the charts answer "this month vs last".
5. **Deployment** (~1–2 h) — Vercel + a hosted SQLite (Turso) or Postgres (Neon), since a
   SQLite file doesn't persist on serverless. Prisma schema is enum-free strings already, so
   the Postgres switch is only a datasource change + `db push` + seed.
6. **Driver detail page** with trip history and safety-score timeline (~1 h).
7. **Audit log** — who dispatched/retired/suspended what, when (~2 h; one `AuditEvent`
   model + writes from the actions layer).

## 4. Explicitly out of scope earlier — now unblocked

The original 8-hour plan cut PDF export, email reminders, and document management for time.
Phases 0–6 are complete and verified, so those cuts (sections 2.1–2.3 above) are the natural
next block of work. Suggested order for one more working session:

1. PDF export via print stylesheet (fast win, closes the last "export" checkbox)
2. Expiring-license dashboard KPI, then email reminders (same query powers both)
3. Vehicle document management (largest, schema-touching — do last)
