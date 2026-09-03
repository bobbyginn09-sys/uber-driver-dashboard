# Driver Command 3.5.0

Driver Command is a local-first rideshare dashboard for shifts, mileage, expenses, money allocation, vehicle costs, goals, and day-by-day performance.

## New in 3.5.0

### End-of-shift money directions
After you enter ending mileage, gross earnings, gas, and any other expenses, select **Finish & show money plan**. The saved shift is followed by a compact receipt that tells you exactly what to move.

The calculation is:

1. **Net earnings** = gross earnings − gas − tolls/parking − other expenses.
2. The percentage base is positive net earnings. A loss never creates a negative investment amount.
3. **Vehicle fund** = 5% of positive net.
4. **Stocks** = 10% of positive net.
5. **Crypto** = 10% of positive net.
6. **Total allocated** = 25% of positive net.
7. **Take out / move** = gas + total allocated.
8. **Keep available** = net earnings − total allocated.

The 10% crypto bucket is divided into:

- Bitcoin: 55%
- Solana: 25%
- Ethereum: 15%
- AAVE: 5%

The app rounds displayed money to cents and assigns any one-cent rounding remainder to AAVE so the four coin amounts always equal the crypto bucket.

### Pause and resume a live shift
A live shift now has a **Pause shift** button for lunch, errands, or other personal stops. While paused:

- the active-work timer is frozen;
- the paused state survives a refresh or reopening the app;
- selecting **Resume shift** continues the same shift;
- finishing while paused closes the current pause automatically;
- completed-shift hours exclude all paused time.

## Updating an existing copy

1. Open the current dashboard and use **Settings & data → Full backup**.
2. Replace the existing GitHub Pages/app files with the contents of this folder.
3. Commit and publish the replacement files.
4. Open the deployed app and refresh it. For an installed home-screen version, fully close and reopen it after the new deployment loads.
5. Confirm your old shifts appear before deleting the backup.

Driver Command 3.5.0 continues using the established `uberDriverDashboard.v3` browser-storage key and mirrors the principal legacy keys. Historical shifts retain their previously saved allocation model; newly completed shifts use the 5% vehicle, 10% stocks, and 10% crypto plan.

## Running locally

Opening `index.html` directly works for basic use. PWA installation and offline caching work best over HTTP or HTTPS.

From this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Tests

The included zero-dependency Node tests cover the money math, crypto split, loss handling, pause duration, required files, service-worker cache, manifest, and source syntax.

```bash
node tests/core.test.js
node tests/static.test.js
```

## Privacy and backups

All working data is stored in the browser. There is no account or cloud database. Clearing browser/site data, changing deployment origins, or moving to another browser can remove access to local records, so keep periodic JSON backups.

The money plan is an organizational tool, not tax, legal, or investment advice.
