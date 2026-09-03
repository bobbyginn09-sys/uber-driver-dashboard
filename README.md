# Driver Command 3.7.0

Driver Command is a private, local-first rideshare dashboard for shifts, mileage, expenses, money allocation, vehicle costs, goals, and day-by-day performance.

## New in 3.7.0

### Separate Uber and Lyft earnings

Completed shifts now store **Uber gross** and **Lyft gross** separately. Driver Command automatically combines both amounts into **overall gross**, which is then used for net earnings, hourly performance, the vehicle fund, investments, and the final take-out amount.

The Money dashboard shows Uber, Lyft, and overall gross for the selected day, week, month, year, or all-time period, including each platform’s share of Uber + Lyft earnings. Shift cards, the shift ledger, calendar details, JSON backups, and CSV exports also preserve the split.

Older single-platform records are assigned to their saved platform automatically. An older record labeled Uber + Lyft that only had one combined amount remains under **Older unassigned gross** until it is optionally edited, so the app does not invent a platform split.

### Gross-earnings money plan

Newly saved shifts use this default allocation:

- **Vehicle fund:** 5% of gross earnings
- **Investments:** 20% of gross earnings
- **Savings:** 0%

The 20% investment contribution is split as follows:

| Investment | Share of investment contribution | Share of gross earnings |
|---|---:|---:|
| Bitcoin | 40% | 8% |
| Solana | 30% | 6% |
| SCHG | 20% | 4% |
| AAVE | 10% | 2% |

The post-shift calculation is:

1. **Net after expenses** = gross earnings − gas − tolls/parking − other expenses.
2. **Vehicle fund** = gross earnings × 5%.
3. **Investment contribution** = gross earnings × 20%.
4. **Total allocation** = vehicle fund + investment contribution, normally 25% of gross earnings.
5. **Take out / move** = recorded gas + total allocation.
6. **Keep available** = net after expenses − total allocation.

The percentage base is gross earnings, so expenses do not reduce the vehicle or investment contribution. Investment amounts are divided in whole cents and always add back to the full investment contribution.

### Change the plan inside the app

Open **Settings & data → Your money plan → Edit plan**. You can change:

- the vehicle-fund percentage;
- the total investment percentage; and
- the Bitcoin, Solana, SCHG, and AAVE split.

The four investment percentages must total 100%. Changes apply only to shifts saved afterward. Existing shifts retain the plan they originally used so past totals do not change.

### Existing features retained

- End-of-shift money directions after entering ending mileage and earnings
- Pause and resume for lunch, errands, or other personal stops
- Daily, weekly, monthly, yearly, and all-time money views
- JSON backup and restore
- Spreadsheet-friendly CSV export and import
- Historical support for the former 5% vehicle / 10% stocks / 10% crypto plan

## Updating an existing copy

1. Open the current dashboard and use **Settings & data → Full backup**.
2. Replace the existing GitHub Pages or hosted app files with the contents of this folder.
3. Commit and publish the replacement files.
4. Open the deployed app and refresh it. For an installed home-screen copy, fully close and reopen it after the new deployment loads.
5. Confirm that your old shifts appear before deleting the backup.

Driver Command 3.7.0 continues using the established `uberDriverDashboard.v3` browser-storage key. The current settings plan is upgraded to the new 5% vehicle and 20% investment default once. Historical shifts retain their own saved allocation model.

## Running locally

Opening `index.html` directly works for basic use. PWA installation and offline caching work best over HTTP or HTTPS.

From this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Tests

The included zero-dependency Node tests cover Uber/Lyft gross combining, platform trend totals, current and historical money math, cent-level investment splitting, migration, rendering, CSV round trips, required files, and source syntax.

```bash
node core.test.js
node static.test.js
node migration.test.js
node app-render.test.js
```

## Privacy and backups

All working data is stored in the browser. There is no account or cloud database. Clearing browser/site data, changing deployment origins, or moving to another browser can remove access to local records, so keep periodic JSON backups.

The money plan is an organizational tool, not tax, legal, or investment advice.
