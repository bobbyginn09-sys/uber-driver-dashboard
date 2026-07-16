"use strict";

const assert = require("node:assert/strict");
const Core = require("../core.js");

function approx(actual, expected, epsilon = 0.001) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} ≈ ${expected}`);
}

assert.equal(Core.durationHours("22:30", "01:00"), 2.5);
assert.equal(Core.durationHours("09:00", "17:30"), 8.5);
assert.equal(Core.localISODate(Core.parseISODate("2024-02-29")), "2024-02-29");
assert.equal(Core.parseISODate("2025-02-29"), null);
assert.equal(Core.parseISODate("2026-02-31"), null);
assert.equal(Core.parseISODate("2026-13-01"), null);
assert.equal(Core.getMileageRate("2026-06-30", Core.DEFAULT_TAX_RATES).rate, 0.725);
assert.equal(Core.getMileageRate("2026-07-01", Core.DEFAULT_TAX_RATES).rate, 0.725);
assert.deepEqual(Core.normalizeSettings({ taxRates: [
  { id: "rate-2026-h1", effective: "2026-01-01", rate: 0.725, label: "2026 Jan–Jun" },
  { id: "rate-2026-h2", effective: "2026-07-01", rate: 0.76, label: "2026 Jul–Dec" }
] }).taxRates, [{ id: "rate-2026", effective: "2026-01-01", rate: 0.725, label: "2026" }]);

const settings = Core.normalizeSettings({
  allocations: { investment: 10, savings: 10, vehicle: 5 }
});

const legacy = Core.normalizeShift({
  id: 100,
  date: "2026-07-10",
  platform: "Uber",
  startTime: "18:00",
  endTime: "22:00",
  startMiles: 1000,
  endMiles: 1100,
  gross: 200,
  gas: 20,
  investment: 18,
  savings: 18,
  vehicleFund: 9,
  notes: "Legacy day"
}, settings);

assert.equal(legacy.id, "100");
assert.equal(legacy.startOdometer, 1000);
assert.equal(legacy.endOdometer, 1100);
assert.equal(legacy.fuel, 20);
approx(legacy.allocationRates.investment, 10);

const calculated = Core.calculateShift(legacy, settings);
assert.equal(calculated.miles, 100);
assert.equal(calculated.hours, 4);
assert.equal(calculated.net, 180);
assert.equal(calculated.investment, 18);
assert.equal(calculated.savings, 18);
assert.equal(calculated.vehicleFund, 9);
assert.equal(calculated.spendable, 135);
assert.equal(calculated.hourly, 45);
assert.equal(calculated.taxDeduction, 72.5);

const summary = Core.summarizeShifts([
  legacy,
  {
    date: "2026-07-11",
    startTime: "10:00",
    endTime: "12:00",
    gross: 100,
    fuel: 10,
    manualMiles: 40,
    allocationRates: { investment: 10, savings: 10, vehicle: 5 }
  }
], settings);

assert.equal(summary.count, 2);
assert.equal(summary.gross, 300);
assert.equal(summary.net, 270);
assert.equal(summary.hours, 6);
assert.equal(summary.miles, 140);
assert.equal(summary.spendable, 202.5);
assert.equal(summary.hourly, 45);

const mondayStart = Core.startOfWeek(new Date(2026, 6, 15), 1);
assert.equal(Core.localISODate(mondayStart), "2026-07-13");

const dayRange = Core.rangeForPeriod("day", new Date(2026, 6, 15, 18, 30), 1);
assert.equal(Core.localISODate(dayRange.start), "2026-07-15");
assert.equal(Core.localISODate(dayRange.end), "2026-07-15");
assert.equal(dayRange.start.getHours(), 0);
assert.equal(dayRange.end.getHours(), 23);

const transferPlan = Core.calculateTransferPlan([
  { date: "2026-07-15", gross: 200, fuel: 20, tolls: 5, manualHours: 4 },
  { date: "2026-07-15", gross: 100, fuel: 10, manualHours: 2 }
], settings, 25);
assert.equal(transferPlan.rate, 25);
assert.equal(transferPlan.fuel, 30);
assert.equal(transferPlan.investment, 66.25);
assert.equal(transferPlan.takeOut, 96.25);
assert.equal(transferPlan.remaining, 198.75);

const normalizedGoal = Core.normalizeGoal({ name: "Trip", amount: 1000, saved: 250 });
assert.equal(normalizedGoal.target, 1000);
assert.equal(Core.goalSaved(normalizedGoal), 250);

const odometer = Core.currentOdometer([
  { endOdometer: 22000 },
  { endOdometer: 22500 }
], [{ odometer: 23000 }], { vehicle: { currentOdometer: 21000 } });
assert.equal(odometer, 23000);

// Deterministic fuzz pass for numeric safety and allocation invariants.
let seed = 8675309;
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
for (let index = 0; index < 750; index += 1) {
  const gross = random() * 450 - 40;
  const startOdometer = Math.floor(random() * 250000);
  const endOdometer = startOdometer + Math.floor(random() * 400 - 25);
  const shift = Core.calculateShift({
    date: index % 17 === 0 ? "2026-02-31" : `2026-${String(index % 12 + 1).padStart(2, "0")}-${String(index % 28 + 1).padStart(2, "0")}`,
    startTime: `${String(index % 24).padStart(2, "0")}:15`,
    endTime: `${String((index + Math.floor(random() * 10)) % 24).padStart(2, "0")}:45`,
    gross,
    fuel: random() * 70 - 10,
    tolls: random() * 30 - 5,
    otherExpenses: random() * 50 - 5,
    startOdometer,
    endOdometer,
    manualMiles: random() * 300,
    allocationRates: {
      investment: random() * 120,
      savings: random() * 120,
      vehicle: random() * 120
    }
  }, settings);
  for (const key of [
    "gross", "fuel", "tolls", "otherExpenses", "expenses", "net", "miles", "hours",
    "investment", "savings", "vehicleFund", "spendable", "hourly", "netPerMile", "taxDeduction"
  ]) assert(Number.isFinite(shift[key]), `${key} should remain finite`);
  assert(shift.gross >= 0 && shift.expenses >= 0 && shift.miles >= 0 && shift.hours >= 0);
  assert(shift.investment >= 0 && shift.savings >= 0 && shift.vehicleFund >= 0);
  const allocated = shift.investment + shift.savings + shift.vehicleFund;
  assert(allocated <= Math.max(0, shift.net) + 0.03, "rounded allocations should not exceed positive net");
  approx(shift.spendable, shift.net - allocated, 0.03);
}

console.log("core.test.js: all tests passed");
