# TransitOps — Demo Video Script (~5 minutes)

**Setup before you hit Record**
- App running at `http://localhost:3000` (or your deployed URL)
- Logged out (start on Login)
- Prefer **Fleet Manager** for most of the tour (`fleet@transitops.com`)
- Have at least 1–2 **Dispatched** trips so Live Map is populated
- Browser window ~1280×720 or full screen; hide bookmarks bar
- Speak casually; pause ~1s between sections while you click

**Timing guide (total ≈ 5:00)**

| # | Section | Time | Cumulative |
|---|---|---|---|
| 0 | Hook + Login + RBAC | 0:35 | 0:35 |
| 1 | Dashboard | 0:40 | 1:15 |
| 2 | Vehicles + Documents | 0:35 | 1:50 |
| 3 | Drivers + reminders | 0:25 | 2:15 |
| 4 | Trips + business rules | 0:40 | 2:55 |
| 5 | **Live Map** (highlight) | 0:45 | 3:40 |
| 6 | Maintenance + Fuel & Expenses | 0:30 | 4:10 |
| 7 | **Reports + PDF/CSV** | 0:35 | 4:45 |
| 8 | Audit + close | 0:15 | 5:00 |

---

## 0. Hook + Login + RBAC (0:00–0:35)

**On screen:** Login page

**Say:**
> Hi — this is **TransitOps**, a smart transport operations platform. It replaces spreadsheets for fleet, drivers, dispatch, maintenance, expenses, and analytics — with real business rules enforced in the system.

**Do:** Point at the four demo accounts (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst). Click **Fleet Manager** to autofill, then Sign in.

**Say:**
> We ship with role-based access. Each role only gets the write actions they need — Fleet Manager owns vehicles and maintenance, Dispatcher owns trips, Safety owns drivers, Finance owns spend.

---

## 1. Dashboard (0:35–1:15)

**On screen:** `/dashboard`

**Do:** Scroll KPIs briefly. Toggle a filter (type / status / region). Hover the fleet-status chart. Point at attention cards (licenses, documents, drafts, in shop).

**Say:**
> The dashboard is the morning brief — vehicles on trip, available, in shop, active trips, drivers on duty, utilization. Filters are URL-driven by type, status, and region. These attention cards surface licenses and documents expiring soon, drafts waiting to dispatch, and vehicles in the shop — so nothing slips.

**Optional:** Click theme toggle once (light ↔ dark) — one sentence: “Dark mode is built in.”

---

## 2. Vehicles + document management (1:15–1:50)

**On screen:** Sidebar → **Vehicles** → open one vehicle

**Do:** Show the registry (search/sort). Open a vehicle detail. Click **Documents** tab. Briefly show upload kinds (RC, Insurance, Permit, PUC) and expiry badges if present.

**Say:**
> Vehicle registry tracks reg number, type, capacity, odometer, acquisition cost, and status — Available, On Trip, In Shop, or Retired. On the detail page we also manage compliance documents with expiry tracking — a bonus the brief asked for.

---

## 3. Drivers + license reminders (1:50–2:15)

**On screen:** **Drivers**

**Do:** Scroll the table; point at license expiry / safety score. If visible, hover **Send reminders now**.

**Say:**
> Drivers carry license category, expiry, and safety score. Expired or suspended drivers cannot be assigned to trips. We also have email reminders for licenses about to expire — manually from here, or on a schedule in production.

---

## 4. Trips + business rules (2:15–2:55)

**On screen:** **Trips** → open a trip or open **New trip** dialog (don’t need to save if time-tight)

**Do:** Show list statuses (Draft / Dispatched / Completed). Open New trip; point at vehicle/driver dropdowns and cargo weight. Mention capacity and availability checks. Close dialog. Optionally open a dispatched trip detail.

**Say:**
> Trip lifecycle is Draft → Dispatched → Completed or Cancelled. On create, the system validates cargo against max load, blocks retired or in-shop vehicles, and blocks drivers with expired licenses or who are already on trip. Dispatch flips both vehicle and driver to On Trip; complete or cancel restores them.

---

## 5. Live Map — highlight (2:55–3:40)

**On screen:** **Live Map**

**Do:** Let the India map animate for 5–8 seconds. Click a moving vehicle / route. Point at the side panel (reg, driver, cargo, distance, revenue). Click a second trip so selection updates.

**Say:**
> Here’s our **Live Map** — a real-time view of every dispatched trip across India. Routes animate from source to destination with vehicle icons by type. Click any trip for details: vehicle, driver, cargo, distance, and revenue. It’s the ops view you can’t get from a spreadsheet.

---

## 6. Maintenance + Fuel & Expenses (3:40–4:10)

**On screen:** **Maintenance** (5–8s) → **Fuel & Expenses** (rest)

**Do:** On Maintenance, point at Open status and “In Shop” behavior. On Expenses, show Fuel vs Other tabs and totals.

**Say:**
> Opening maintenance puts the vehicle **In Shop** and removes it from dispatch. Closing restores Available. Fuel & Expenses logs liters and cost, plus tolls, parking, and fines — feeding operational cost and ROI on reports.

---

## 7. Reports + PDF / CSV (4:10–4:45)

**On screen:** **Reports**

**Do:** Change date preset (7 / 30 / 90 days). Scroll charts (fuel efficiency, utilization, cost). Point at ROI table. Click **Export PDF** (print dialog — cancel after showing). Point at CSV export on the table if visible.

**Say:**
> Reports cover fuel efficiency, fleet utilization, operational cost, and vehicle ROI — with date ranges. **Export PDF** uses a print stylesheet for a clean handout. Tables also support **CSV export** for analysts. Charts work in light and dark mode.

---

## 8. Audit + close (4:45–5:00)

**On screen:** **Audit Log** (quick scroll) → end on Dashboard or Live Map

**Do:** Scroll a few audit rows. Optional: open ⌘K / Ctrl+K command menu for 2 seconds.

**Say:**
> Every sensitive action — retire, suspend, dispatch, complete, open or close maintenance — lands in the audit log with who and when. Command palette, search, and keyboard jumps keep power users fast.

> That’s TransitOps — end-to-end transport ops with enforced rules, live fleet visibility, documents, reminders, and analytics. Thanks for watching.

---

## Quick action cheat-sheet (while recording)

1. Login as Fleet Manager  
2. Dashboard → filter once → attention cards  
3. Vehicles → open one → Documents tab  
4. Drivers → point at expiry / Send reminders  
5. Trips → New trip dialog → close  
6. **Live Map** → click 2 trips, watch animation  
7. Maintenance → Expenses tabs  
8. Reports → date filter → **Export PDF** → cancel print  
9. Audit Log → ⌘K → end  

## Demo accounts (password from your seed / README)

| Role | Email |
|---|---|
| Fleet Manager | `fleet@transitops.com` |
| Dispatcher | `dispatch@transitops.com` |
| Safety Officer | `safety@transitops.com` |
| Financial Analyst | `finance@transitops.com` |

## If something is empty

- **Live Map blank:** Dispatch 1–2 draft trips first (login as Dispatcher if needed).  
- **No documents:** Skip deep into upload; still mention the Documents tab.  
- **Print blocked:** Still click Export PDF and cancel — narration covers it.
