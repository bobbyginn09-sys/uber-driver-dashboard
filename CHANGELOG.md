# Changelog

## 3.4.0 — Daily money plan

### Added
- Day period in Analytics for a focused view of today's completed shifts
- Prominent **Take out today** total in Money view
- Compact gas, 25% investment, and remaining-available breakdown
- Shared transfer-plan calculation with automated tests

### Changed
- Fresh installations now default to a 25% investment allocation
- Existing copies using the exact former 10% investment, 10% savings, and 5% vehicle defaults migrate to 25% / 10% / 5%
- Custom allocation settings and historical per-shift rates remain preserved
- Mobile analytics period controls now fit Day, Week, Month, Year, and All in one row
- Advanced the offline cache version for installed copies

## 3.3.0 — Glance mode and readability

### Added
- One-screen mobile command center with weekly goal pacing, compact money snapshots, and two recent shifts
- Trend, Money, and Patterns analytics tabs so only one report is visible at a time
- Calendar day sheets, Vehicle Status/History tabs, Active/Archived goal tabs, and context-aware quick-add behavior
- Explicit load-more controls for shifts, maintenance, and goals

### Changed
- Reduced the initial mobile shift ledger to five recent records and the goal list to three active targets
- Reworked mobile type scale, contrast, spacing, touch targets, and fixed navigation for easier scanning
- Replaced stacked vehicle cards with one reserve/odometer status card and deduplicated matching service reminders
- Preserved the mileage-first start and end flow while keeping secondary fields behind progressive disclosure
- Corrected the built-in 2026 business-mile schedule to one 72.5-cent rate for the full year
- Added a narrow migration that replaces only the exact unedited 3.0–3.2 split-rate defaults; custom mileage schedules remain untouched
- Fixed the modal backdrop event path so mileage and other native form submit buttons work reliably
- Advanced the offline cache version for installed copies

## 3.2.0 — Mileage-first shift workflow

### Added
- Dedicated starting-mileage prompt that appears immediately after **Start shift**
- Dedicated ending-mileage prompt that appears immediately after **End shift**
- Live business-mile calculation while entering the ending odometer
- Compact captured-mileage summary in the final shift sheet
- Editable ending-mileage step that preserves final earnings and cost inputs

### Changed
- Shift date and start time are now captured automatically when the starting mileage is confirmed
- Final earnings and costs appear only after ending mileage is captured
- Live-shift update no longer asks for a current odometer; ending mileage is reserved for the finish flow
- Active-shift summaries show the recorded starting mileage
- Modal focus now lands on the primary input instead of the close button
- Opening a modal clears stale toasts so they do not cover the focused workflow
- Fresh installs now retain the intended 10% investment, 10% savings, and 5% vehicle-fund defaults
- Advanced the offline cache version for installed copies

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
