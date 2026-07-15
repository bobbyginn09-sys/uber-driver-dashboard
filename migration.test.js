"use strict";

const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const Core = require("../core.js");

function nodeStub() {
  return {
    innerHTML: "", textContent: "", style: {}, dataset: {}, classList: { toggle() {} },
    setAttribute() {}, addEventListener() {}, appendChild() {}, querySelector() { return null; },
    querySelectorAll() { return []; }, focus() {}, remove() {}
  };
}

const legacyShift = {
  id: 42,
  date: "2026-07-04",
  platform: "Uber",
  startTime: "09:00",
  endTime: "13:00",
  startMiles: 12000,
  endMiles: 12120,
  gross: 220,
  gas: 20,
  net: 200,
  investment: 20,
  savings: 30,
  vehicleFund: 10,
  notes: "Migrated holiday shift"
};

const seed = new Map([
  ["uberEntries", JSON.stringify([legacyShift])],
  ["uberMaintenance", JSON.stringify([{ id: "m1", date: "2026-07-01", type: "Oil Change", amount: 80, odometer: 11950 }])],
  ["uberSpendingGoals", JSON.stringify([{ id: "g1", name: "Tires", amount: 800, saved: 125, targetDate: "2026-10-01" }])],
  ["activeShiftDraft", JSON.stringify({ date: "2026-07-15", platform: "Lyft", gross: 45, gas: 6, startMiles: 12120, notes: "Live legacy draft" })],
  ["clockInTime", "08:30"],
  ["investmentPct", "12"],
  ["savingsPct", "8"],
  ["vehiclePct", "5"],
  ["monthlyNetGoal", "3200"],
  ["dashboardTheme", "light"]
]);

const localStorage = {
  getItem(key) { return seed.has(key) ? seed.get(key) : null; },
  setItem(key, value) { seed.set(key, String(value)); },
  removeItem(key) { seed.delete(key); }
};

const document = {
  body: nodeStub(), documentElement: { dataset: {} }, activeElement: null,
  getElementById() { return nodeStub(); }, querySelector() { return null; },
  querySelectorAll() { return []; }, createElement() { return nodeStub(); }, addEventListener() {}
};
const context = {
  DriverCore: Core,
  window: null,
  globalThis: null,
  document,
  localStorage,
  navigator: { onLine: true },
  location: { hash: "", protocol: "file:" },
  history: { replaceState() {} },
  Intl, Date, Math, JSON, Map, Set, Blob, URL, FormData,
  HTMLFormElement: function HTMLFormElement() {},
  setTimeout() { return 0; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
  console
};
context.window = context;
context.globalThis = context;
context.window.location = context.location;
context.window.history = context.history;
context.window.scrollTo = () => {};
context.window.addEventListener = () => {};

let source = fs.readFileSync(require.resolve("../app.js"), "utf8");
source = source.replace(
  /\n  init\(\);\n\}\)\(\);\s*$/,
  `\n  globalThis.__migrationTest = { getState: () => state, saveState, serializeState };\n})();`
);
vm.runInNewContext(source, context, { filename: "app.js" });

const api = context.__migrationTest;
assert(api, "migration test API should be exposed");
const state = api.getState();
assert.equal(state.version, Core.APP_VERSION);
assert.equal(state.settings.theme, "light");
assert.equal(state.settings.monthlyNetGoal, 3200);
assert.deepEqual(
  { ...state.settings.allocations },
  { investment: 12, savings: 8, vehicle: 5 }
);
assert.equal(state.shifts.length, 1);
assert.equal(state.shifts[0].id, "42");
assert.equal(state.shifts[0].fuel, 20);
assert.equal(state.shifts[0].startOdometer, 12000);
assert.equal(state.shifts[0].endOdometer, 12120);
assert.equal(state.shifts[0].allocationRates.investment, 10);
assert.equal(state.shifts[0].allocationRates.savings, 15);
assert.equal(state.shifts[0].allocationRates.vehicle, 5);
assert.equal(state.maintenance.length, 1);
assert.equal(state.goals.length, 1);
assert.equal(Core.goalSaved(state.goals[0]), 125);
assert(state.activeShift, "open legacy clock-in should become an active shift");
assert.equal(state.activeShift.platform, "Lyft");
assert.equal(state.activeShift.startTime, "08:30");
assert.equal(state.activeShift.notes, "Live legacy draft");

assert.equal(api.saveState(), true);
const saved = JSON.parse(seed.get("uberDriverDashboard.v3"));
assert.equal(saved.version, Core.APP_VERSION);
assert.equal(saved.shifts.length, 1);
assert(saved.activeShift);
const mirroredLegacy = JSON.parse(seed.get("uberEntries"));
assert.equal(mirroredLegacy[0].date, "2026-07-04");
assert.equal(mirroredLegacy[0].gas, 20);
assert.equal(seed.get("clockInTime"), "08:30");

console.log("migration.test.js: all tests passed");
