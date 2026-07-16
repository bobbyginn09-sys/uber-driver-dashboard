# Changelog

## 3.1.0 — Compact mobile management

### Changed
- Rebuilt the live-shift start sheet around essential fields so it fits common phone viewports without an internal scroll
- Replaced tall mobile shift cards with compact expandable ledger rows
- Collapsed secondary filters, analytics panels, settings groups, maintenance fields, and goal details using progressive disclosure
- Reduced vertical spacing across the overview, analytics, ledger, vehicle, goals, and settings workspaces
- Tightened responsive grids and iOS date/time controls to prevent clipping and horizontal overflow
- Advanced the offline cache version so installed dashboards receive the refreshed assets

## 3.0.0 — Premium rebuild

### Added
- Responsive command-center layout with desktop sidebar and mobile bottom navigation
- Live-shift timer, update flow, and finish-to-ledger workflow
- Searchable, filterable, sortable shift ledger
- Multi-select shift export and deletion
- Shift duplication and per-shift historical allocation rates
- Week/month/year/all-time analytics and comparative signals
- Earnings calendar with heat levels and daily drilldown
- Vehicle-fund balance, service history, odometer, and service reminders
- Goals with dated contribution history and archive/restore
- Editable date-effective mileage-rate schedule
- Full JSON backup and previewed JSON/CSV import with merge/replace modes
- Dark/light themes, offline PWA shell, reduced-motion support, and new app icon
- Pure calculation module and automated calculation, render, security, and static-integrity tests
- Loss-aware analytics bars and platform contribution indicators
- Modal focus containment, focus return, and import-review restoration after canceling replacement
- CSV formula-injection protection, strict imported-date checks, and generic expense-total reconciliation

### Changed
- Reorganized the original single-page interface into seven focused workspaces
- Replaced hardcoded derived values with centralized recalculation in `core.js`
- Preserved allocation settings on each saved shift so future changes do not rewrite history
- Expanded costs from fuel-only tracking to fuel, tolls/parking, and other direct expenses
- Improved data safety with confirmations, filtered exports, explicit import behavior, and local-key-only reset
- Updated the editable default business-mile schedule through the two 2026 federal periods

### Compatibility
- Migrates the original `uberEntries`, maintenance, goals, live-draft, clock, allocation, and monthly-goal keys
- Continues mirroring principal legacy keys after version 3 saves
