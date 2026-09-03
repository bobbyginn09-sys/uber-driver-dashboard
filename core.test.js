"use strict";

const assert = require("node:assert/strict");
const Core = require("./core.js");

function close(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 0.011, `${message || "value"}: expected ${expected}, got ${actual}`);
}

const settings = Core.normalizeSettings({});
assert.equal(Core.APP_VERSION, "3.6.0");
assert.equal(settings.moneyPlan.version, 3);
assert.equal(settings.moneyPlan.basis, "gross");
assert.equal(settings.moneyPlan.vehiclePct, 5);
assert.equal(settings.moneyPlan.investmentPct, 20);
assert.deepEqual(settings.moneyPlan.investmentMix, { bitcoin: 40, solana: 30, schg: 20, aave: 10 });

const shift = Core.calculateShift({
  id: "current",
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
  moneyPlanRates: Core.DEFAULT_MONEY_PLAN
}, settings);

assert.equal(shift.hours, 5);
assert.equal(shift.miles, 120);
close(shift.expenses, 60, "expenses");
close(shift.net, 240, "net");
close(shift.allocationBase, 300, "gross allocation base");
assert.equal(shift.allocationBasis, "gross");
close(shift.vehicleFund, 15, "vehicle 5% of gross");
close(shift.investment, 60, "investments 20% of gross");
close(shift.bitcoin, 24, "Bitcoin 40% of investment");
close(shift.solana, 18, "Solana 30% of investment");
close(shift.schg, 12, "SCHG 20% of investment");
close(shift.aave, 6, "AAVE 10% of investment");
close(shift.allocated, 75, "25% total allocation");
close(shift.takeOut, 115, "gas plus allocation");
close(shift.spendable, 165, "keep available");
assert.equal(shift.isGrossMoneyPlan, true);
assert.equal(shift.isCurrentMoneyPlan, true);
assert.equal(shift.isPreviousMoneyPlan, false);

// The new plan remains based on gross earnings even when expenses create a loss.
const loss = Core.calculateShift({
  date: "2026-09-03",
  gross: 25,
  fuel: 30,
  tolls: 5,
  moneyPlanRates: Core.DEFAULT_MONEY_PLAN
}, settings);
close(loss.net, -10, "loss net");
close(loss.vehicleFund, 1.25, "loss vehicle allocation");
close(loss.investment, 5, "loss investment allocation");
close(loss.allocated, 6.25, "loss total allocation");
close(loss.takeOut, 36.25, "loss gas plus allocation");
close(loss.spendable, -16.25, "loss spendable");

// Cent allocation must stay nonnegative and add exactly to the investment bucket,
// even with a custom mix that would make independent rounding over-allocate.
const tinyPlan = Core.normalizeMoneyPlan({
  version: 3,
  vehiclePct: 0,
  investmentPct: 100,
  investmentMix: { bitcoin: 34, solana: 33, schg: 33, aave: 0 }
});
const tinySettings = Core.normalizeSettings({ moneyPlan: tinyPlan });
const tiny = Core.calculateShift({ date: "2026-09-03", gross: 0.02, moneyPlanRates: tinyPlan }, tinySettings);
close(tiny.investment, 0.02, "tiny investment");
assert.ok([tiny.bitcoin, tiny.solana, tiny.schg, tiny.aave].every((amount) => amount >= 0), "all split amounts should be nonnegative");
close(tiny.bitcoin + tiny.solana + tiny.schg + tiny.aave, tiny.investment, "tiny split sum");

// The former 5/10/10 positive-net plan remains calculable for saved historical shifts.
const previous = Core.calculateShift({
  id: "previous",
  date: "2026-09-03",
  gross: 300,
  fuel: 40,
  tolls: 10,
  otherExpenses: 10,
  moneyPlanRates: Core.LEGACY_MONEY_PLAN_V2
}, settings);
close(previous.allocationBase, 240, "previous positive-net base");
close(previous.vehicleFund, 12, "previous vehicle");
close(previous.stock, 24, "previous stock");
close(previous.crypto, 24, "previous crypto");
close(previous.bitcoin, 13.20, "previous BTC");
close(previous.solana, 6, "previous SOL");
close(previous.ethereum, 3.60, "previous ETH");
close(previous.aave, 1.20, "previous AAVE");
close(previous.investment, 48, "previous combined investments");
close(previous.allocated, 60, "previous total allocation");
close(previous.takeOut, 100, "previous take out");
assert.equal(previous.isGrossMoneyPlan, false);
assert.equal(previous.isCurrentMoneyPlan, false);
assert.equal(previous.isPreviousMoneyPlan, true);

// A prior version-3 custom plan is still a gross plan, but is no longer labeled as
// the active plan after settings change.
const priorGrossPlan = Core.normalizeMoneyPlan({
  version: 3,
  vehiclePct: 6,
  investmentPct: 19,
  investmentMix: { bitcoin: 50, solana: 20, schg: 20, aave: 10 }
});
const priorGross = Core.calculateShift({ date: "2026-09-02", gross: 100, moneyPlanRates: priorGrossPlan }, settings);
assert.equal(priorGross.isGrossMoneyPlan, true);
assert.equal(priorGross.isCurrentMoneyPlan, false);
close(priorGross.allocated, 25, "prior gross plan allocation");

const legacy = Core.calculateShift({
  date: "2026-09-01",
  gross: 100,
  fuel: 10,
  allocationRates: { investment: 20, savings: 10, vehicle: 5 },
  investment: 18,
  savings: 9,
  vehicleFund: 4.5
}, settings);
assert.equal(legacy.isNewMoneyPlan, false);
close(legacy.allocated, 31.5, "legacy allocation preserved");
close(legacy.takeOut, 41.5, "legacy take out");

const summary = Core.summarizeShifts([shift, priorGross, previous, legacy], settings);
assert.equal(summary.count, 4);
assert.equal(summary.currentPlanCount, 1);
assert.equal(summary.historicalPlanCount, 3);
close(summary.currentInvestment, 60, "summary current investments");
close(summary.currentBitcoin, 24, "summary current BTC");
close(summary.historicalSavings, 9, "summary historical savings");

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

console.log("core.test.js: all assertions passed");
