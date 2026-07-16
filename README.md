# Driver Command 3.1

A premium, local-first dashboard for managing rideshare shifts, earnings, mileage, allocations, goals, and vehicle costs.

This rebuild keeps compatibility with the original dashboard's browser storage while replacing the cramped single-page experience with a responsive command center designed for desktop, tablet, and phone.

## 3.1 compact-mobile update

This package includes the low-scroll mobile redesign requested after the original premium rebuild:

- Start-live-shift now shows only the fields required to begin, with odometer and notes tucked into an optional disclosure.
- Completed shifts use compact expandable rows instead of tall cards.
- Search stays visible while filters and sorting collapse behind one control.
- Analytics, settings, maintenance, and goal forms use progressive disclosure so secondary controls do not dominate the screen.
- Mobile grids, action bars, date/time controls, and fixed modal footers were tightened to prevent clipping and horizontal overflow.
- The service-worker cache version was advanced so installed copies can receive the new interface.

## What changed

### Command-center overview
- Live shift status and an automatic duration timer
- Weekly target pacing, recent shifts, a seven-day trend, and actionable performance signals
- Net, hourly, mileage, spendable cash, monthly projection, and vehicle-fund visibility

### Shift ledger built for management
- Search by date, platform, notes, or values
- Filter by period and platform; sort by date, net, hourly rate, or mileage
- Desktop table and mobile record cards
- Multi-select, bulk CSV export, bulk delete, edit, duplicate, and safe confirmation flows
- Per-shift allocation rates preserved historically

### Richer analytics
- Week, month, year, and all-time views
- Net trend, loss-aware weekday contribution, platform mix, money-flow allocation, mileage deduction estimate, and period comparisons
- Best-day, best-shift, expense-ratio, and per-trip signals

### Planning and vehicle operations
- Earnings heatmap calendar with day-level drilldown
- Monthly-goal progress and one-click entry for a selected date
- Vehicle reserve balance, service ledger, current odometer, and mileage-based reminders
- Goals with dated contributions, completion tracking, editing, archive/restore, and deletion

### Safer data controls
- Full JSON backups
- CSV shift exports, including selected rows
- JSON or CSV import with a preview and explicit merge/replace choice
- Strict date validation, generic-ledger expense reconciliation, and safe cancellation back to the import review
- Spreadsheet-formula protection for user-entered CSV text, with clean dashboard round trips
- Reset confirmation that affects only this dashboard's local keys
- Migration from the original localStorage keys

### Premium product details
- Responsive dark and light themes
- Installable PWA with offline app shell
- No build tools, package manager, framework, account, analytics, or server required
- Keyboard focus states, modal focus containment/return, reduced-motion support, semantic controls, and mobile bottom navigation

## Run it

### Fastest option
Open `index.html` in a modern browser. The dashboard itself works locally, but browser install and service-worker caching generally require HTTP or HTTPS.

### Recommended local server
From this folder, run:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

You can also deploy the folder to any static host. No server-side code is needed.

## Existing-data migration

On first load, Driver Command looks for the version 3 state key. When it is absent, it imports the original dashboard keys, including:

- `uberEntries`
- `uberMaintenance`
- `uberSpendingGoals`
- `activeShiftDraft`
- `clockInTime`
- `clockOutTime`
- allocation and goal settings

Version 3 continues mirroring the principal legacy keys so the transition is conservative. Export a JSON backup before replacing a production copy.

## Data model

A completed shift stores the raw inputs needed to recalculate derived figures:

- Date, platform, start/end time or manual hours
- Gross earnings, fuel, tolls/parking, and other direct expenses
- Start/end odometer or manual business miles
- Trips, notes, and the allocation percentages used for that shift

Net, hourly, per-mile, allocation amounts, spendable cash, and mileage-deduction estimates are derived consistently by `core.js`.

## Mileage-rate schedule

The built-in schedule is editable in **Settings & data**. It includes the published 2024 and 2025 business-mile rates, plus the two federal 2026 periods:

- January 1–June 30, 2026: $0.725 per business mile
- July 1–December 31, 2026: $0.76 per business mile

Mileage figures in the dashboard are organizational estimates, not tax advice. Confirm eligibility, contemporaneous recordkeeping, and applicable rates with authoritative guidance or a qualified tax professional.

## Backups and privacy

All working data is stored in the browser. There is no cloud sync. Clearing site data, changing browsers, or moving to another device can remove access to the local records.

Use **Settings & data → Full backup** regularly. The JSON backup includes shifts, maintenance, goals, settings, and an active shift. Import offers both merge and replace modes with a preview before changes are applied.

## Tests

The project includes zero-dependency Node tests:

```bash
node tests/core.test.js
node tests/app-render.test.js
node tests/migration.test.js
node tests/static.test.js
```

The calculation suite validates strict dates, periods, normalization, allocations, mileage rates, maintenance, goals, and derived metrics. The render suite covers every major page and modal with empty, populated, loss, and hostile-text states, plus CSV/JSON import-export and nested confirmation flows. The migration suite loads the original storage keys into version 3 and verifies the conservative legacy mirror. The static suite checks install assets, local references, icon dimensions, offline-cache coverage, script compilation, and markup/CSS integrity.

## File map

- `index.html` — application shell
- `styles.css` — responsive visual system
- `core.js` — pure calculations and normalization
- `app.js` — views, interactions, persistence, import/export, and live shift logic
- `manifest.json` — install metadata
- `service-worker.js` — offline app-shell caching
- `favicon.png`, `icon.svg`, `icon-192.png`, `icon-512.png` — application icon assets
- `tests/` — calculation, render/import, security, and static-integrity tests

## Version

Driver Command 3.1.0 — compact mobile management update.
