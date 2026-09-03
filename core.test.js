"use strict";
const assert = require("node:assert/strict");
const Core = require("../core.js");

function close(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 0.011, `${message || "value"}: expected ${expected}, got ${actual}`);
}

const settings = Core.normalizeSettings({});
const shift = Core.calculateShift({
  id: "test",
  date: "2026-09-03",
  platform: "Uber",
  startTime: "10:00",
  endTime: "15:30",
  pausedMs: 30 * 60000,
  startOdometer: 1000,
  endOdometer: 1120,
  gross: 300,
  fuel: 40,
  tolls: 10,
  otherExpenses: 10,
  moneyPlanRates: Core.DEFAULT_MONEY_PLAN,
  moneyPlanVersion: 2
}, settings);

assert.equal(shift.hours, 5);
assert.equal(shift.miles, 120);
close(shift.expenses, 60, "expenses");
close(shift.net, 240, "net");
close(shift.vehicleFund, 12, "vehicle 5%");
close(shift.stock, 24, "stock 10%");
close(shift.crypto, 24, "crypto 10%");
close(shift.cryptoBreakdown.bitcoin, 13.20, "BTC 55%");
close(shift.cryptoBreakdown.solana, 6.00, "SOL 25%");
close(shift.cryptoBreakdown.ethereum, 3.60, "ETH 15%");
close(shift.cryptoBreakdown.aave, 1.20, "AAVE 5%");
close(shift.allocated, 60, "25% allocation");
close(shift.takeOut, 100, "gas + allocation");
close(shift.spendable, 180, "keep available");

const loss = Core.calculateShift({
  date: "2026-09-03",
  gross: 25,
  fuel: 30,
  tolls: 5,
  moneyPlanRates: Core.DEFAULT_MONEY_PLAN
}, settings);
close(loss.net, -10, "loss net");
close(loss.allocated, 0, "no allocation on loss");
close(loss.takeOut, 30, "gas still shown in take out");
close(loss.spendable, -10, "loss spendable");

const active = Core.normalizeActiveShift({
  date: "2026-09-03",
  startTime: "10:00",
  startedAt: "2026-09-03T15:00:00.000Z",
  pausedMs: 10 * 60000,
  pauseStartedAt: "2026-09-03T16:00:00.000Z"
}, settings);
close(Core.activeDurationMs(active, "2026-09-03T16:30:00.000Z") / 60000, 50, "active minutes stop during live pause");
close(Core.activePausedMs(active, "2026-09-03T16:30:00.000Z") / 60000, 40, "total pause minutes");
const resumed = Core.finalizeActivePause(active, "2026-09-03T16:30:00.000Z");
assert.equal(resumed.pauseStartedAt, "");
close(resumed.pausedMs / 60000, 40, "finalized pause");
assert.equal(resumed.pauseHistory.length, 1);

const legacy = Core.calculateShift({
  date: "2026-09-03",
  gross: 100,
  fuel: 10,
  allocationRates: { investment: 20, savings: 0, vehicle: 5 },
  investment: 18,
  vehicleFund: 4.5
}, settings);
assert.equal(legacy.isNewMoneyPlan, false);
close(legacy.allocated, 22.5, "legacy allocation preserved");
close(legacy.takeOut, 32.5, "legacy take out");

const summary = Core.summarizeShifts([shift], settings);
close(summary.takeOut, 100, "summary take out");
close(summary.bitcoin, 13.2, "summary BTC");

console.log("core.test.js: all assertions passed");
