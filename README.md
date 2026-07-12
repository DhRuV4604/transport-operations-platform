<div align="center">

# 🚚 TransitOps

**A keyboard-first operations platform for running a vehicle fleet — dispatch, compliance, maintenance, and spend in one place.**

Next.js 16 · React 19 · TypeScript · Prisma + SQLite · Tailwind v4 · Base UI

</div>

---

TransitOps is a full-stack fleet operations console: register vehicles and drivers, dispatch and track trips, log maintenance and fuel/expenses, watch licenses and documents before they lapse, and read it all back as charts and exportable reports. It ships with role-based access, a ⌘K command palette with live search, an animated live map, and a standalone **MCP server** so an AI assistant can run daily fleet checkups.

## ✨ Features

- **Dashboard cockpit** — greeting header, live KPIs (utilization meter, on-trip count, drivers on duty), and a "Needs attention" panel that surfaces expiring licenses/documents, drafts awaiting dispatch, and open maintenance.
- **Fleet modules** — Vehicles, Drivers, Trips, Maintenance, and Fuel & Expenses, each with sortable/filterable tables, detail pages, and create/edit dialogs.
- **Live Map** — an animated SVG map of India showing every dispatched trip in motion, with a selectable trip detail panel.
- **Compliance** — driver-license and vehicle-document expiry tracking, plus an email reminder job (`/api/cron/license-reminders`).
- **Reports** — fuel efficiency, operating cost, utilization, and vehicle ROI (Recharts), with a date-range filter and CSV export for every dataset.
- **⌘K command palette** — fuzzy search across vehicles, drivers, trips, and maintenance; jump-to navigation; quick-create actions; theme switching.
- **Keyboard-first** — `g`-then-key navigation, `/` to search, `?` for the cheat sheet.
- **Role-based access** — four roles with per-module write permissions; everyone can read.
- **Audit log** — an immutable trail of who dispatched, retired, suspended, or closed what.
- **Light / dark themes** — the "Signal" design system (graphite base, one electric-teal accent), AA-contrast verified.
- **MCP server** — 9 read-only fleet tools any MCP client (Claude Code, Claude Desktop) can call.

## 🧱 Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Server Actions) |
| UI | React 19, Base UI, Tailwind CSS v4, lucide-react, Recharts, Sonner |
| Data | Prisma ORM + SQLite |
| Auth | JWT sessions (`jose`) in an httpOnly cookie, `bcryptjs` password hashing |
| Email | Nodemailer (license reminders) |
| AI | `@modelcontextprotocol/sdk` (stdio MCP server) |
| Tooling | TypeScript (strict), ESLint, Vitest |

## 🚀 Getting started

**Prerequisites:** Node.js 20+ and npm.

```bash
# 1. Install dependencies (also generates the Prisma client via postinstall/predev if configured)
npm install

# 2. Create your environment file
cp .env.example .env
#   then edit .env — at minimum set AUTH_SECRET to a long random string

# 3. Generate the Prisma client, create the SQLite database, and seed demo data
npx prisma generate
npm run db:reset      # prisma db push --force-reset && prisma db seed

# 4. Start the dev server
npm run dev
```

Open **http://localhost:3000** and sign in with a demo account below.

> **Note:** `@prisma/client` is generated code, not committed. If you ever see *"@prisma/client did not initialize yet"*, run `npx prisma generate` and restart the dev server.

### Demo accounts

All demo users share the password **`password123`**:

| Email | Role |
|---|---|
| `fleet@transitops.com` | Fleet Manager |
| `dispatch@transitops.com` | Dispatcher |
| `safety@transitops.com` | Safety Officer |
| `finance@transitops.com` | Financial Analyst |

On the login screen you can **click any demo account to autofill** the form.

## 🔐 Roles & permissions

Everyone can view every module. Write access is scoped per role:

| Capability | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
|---|:---:|:---:|:---:|:---:|
| Vehicles | ✅ | | | |
| Drivers | | | ✅ | |
| Trips | | ✅ | | |
| Maintenance | ✅ | | | |
| Fuel & Expenses | ✅ | ✅ | | ✅ |

## ⌨️ Keyboard shortcuts

| Keys | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open the command palette & global search |
| `/` | Focus search |
| `?` | Show the shortcut cheat sheet |
| `g` then `d / v / u / t / m / e / r / a / l` | Jump to Dashboard / Vehicles / Drivers / Trips / Maintenance / Expenses / Reports / Audit / Live map |

## 📜 Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Run the Vitest suite |
| `npm run db:reset` | Reset the SQLite DB and reseed demo data |
| `npm run mcp` | Run the standalone MCP fleet-checkup server (stdio) |

## 🤖 MCP server

A standalone Model Context Protocol server (`mcp/server.ts`) exposes read-only "daily checkup" tools over the same database:

`fleet_daily_digest` · `list_expiring_licenses` · `list_expiring_documents` · `list_open_maintenance` · `list_active_trips` · `get_vehicle_status` · `get_driver_status` · `search_fleet` · `list_recent_audit_events`

**Claude Code:** the project-scoped [`.mcp.json`](.mcp.json) registers it automatically — run `/mcp` in the project to approve it, then ask e.g. *"run the fleet daily digest."*

**Claude Desktop / other clients:** point them at `npx tsx mcp/server.ts` (use an absolute path to `mcp/server.ts`). The server loads the repo's `.env` itself, so `DATABASE_URL` resolves.

## 🗂️ Project structure

```
src/
  app/
    (app)/            # Authenticated app: dashboard, vehicles, drivers, trips,
                      # maintenance, expenses, reports, audit, live-map
    api/              # Route handlers: search, CSV export, cron reminders
    login/            # Public sign-in
    globals.css       # "Signal" design tokens (OKLCH), light + dark
  components/
    ui/               # Base UI primitives (button, dialog, select, table…)
    command-menu.tsx  # ⌘K palette
    keyboard-shortcuts.tsx
    app-sidebar.tsx, topbar.tsx, kpi-card.tsx, status-*.tsx, charts/…
  lib/                # db, auth, constants, status, geo, csv, utils
  server/
    actions/          # Server actions (mutations)
    services/         # Analytics, reminders, and domain services
prisma/               # schema.prisma, seed.ts, dev.db
mcp/                  # Standalone MCP server
```

## 🎨 Design system

The UI follows **"Signal"** — a near-monochrome graphite base with a single electric-teal accent, hairline borders, a tight 6px radius, the Geist typeface with tabular numerals, and sentence case throughout. Every color is an OKLCH token in [`src/app/globals.css`](src/app/globals.css); **change `--primary`'s hue to re-skin the whole app.**

## ⚙️ Environment variables

See [`.env.example`](.env.example). `DATABASE_URL` and `AUTH_SECRET` are required; the `SMTP_*` and `CRON_SECRET` values are only needed for the license-reminder email job.

## 🧪 Testing

```bash
npm test
```

Vitest covers the MCP server tools and core services against a throwaway SQLite database.

---

<div align="center">
<sub>Built with Next.js, Prisma, and Base UI.</sub>
</div>
