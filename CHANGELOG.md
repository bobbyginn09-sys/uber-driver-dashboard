# Changelog

## 3.6.0 — Gross Investment Plan

- Replaced the former 5% vehicle / 10% stock / 10% crypto default with 5% vehicle and 20% investments.
- Removed the savings allocation from future shifts.
- Changed the allocation base from positive net earnings to gross earnings for newly saved shifts.
- Split the 20% investment contribution into Bitcoin 40%, Solana 30%, SCHG 20%, and AAVE 10%.
- Added an in-app money-plan editor under Settings & data.
- Kept the headline take-out amount as recorded gas plus the full vehicle and investment allocation.
- Preserved old shifts under their original allocation model, including the prior Ethereum split.
- Added accurate mixed-plan summaries when a period includes both current and historical shifts.
- Updated CSV exports and imports with money-plan version, basis, percentages, and all four current investment amounts.
- Added cent-safe investment allocation so the four asset amounts always equal the investment contribution.
- Updated offline cache, version labels, documentation, and automated tests.

## 3.5.0 — Money Plan and Shift Pausing

- Added the post-shift money-instructions screen.
- Added gas plus 25% as the headline take-out amount.
- Set the new-shift allocation to 5% vehicle, 10% stocks, and 10% crypto.
- Added crypto-bucket instructions for Bitcoin 55%, Solana 25%, Ethereum 15%, and AAVE 5%.
- Added pause/resume controls for live shifts.
- Excluded paused time from active hours and hourly-rate calculations.
- Persisted pause state and pause history in local browser storage.
- Added daily, weekly, monthly, yearly, and all-time money-plan views.
- Added money-plan access from completed shift records.
- Preserved historical allocation data and version-3 browser-storage compatibility.
- Updated CSV and JSON backup fields for the new allocation and pause data.
- Refined mobile receipt density so the completed-shift plan fits a standard phone viewport without internal scrolling.
