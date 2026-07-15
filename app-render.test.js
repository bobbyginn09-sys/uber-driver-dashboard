"use strict";

const fs = require("fs");
const vm = require("vm");
const assert = require("assert");
const Core = require("../core.js");

function createNode() {
  return {
    innerHTML: "",
    textContent: "",
    title: "",
    style: {},
    dataset: {},
    className: "",
    classList: { toggle() {}, add() {}, remove() {} },
    setAttribute() {},
    getAttribute() { return null; },
    focus() {},
    appendChild() {},
    remove() {},
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
}

const nodes = new Map();
const document = {
  body: createNode(),
  documentElement: { dataset: {} },
  title: "",
  getElementById(id) {
    if (!nodes.has(id)) nodes.set(id, createNode());
    return nodes.get(id);
  },
  querySelector(selector) {
    if (selector === 'meta[name="theme-color"]') return createNode();
    return null;
  },
  querySelectorAll() { return []; },
  createElement() { return createNode(); },
  addEventListener() {}
};

const storage = new Map();
const localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); }
};

const context = {
  console,
  DriverCore: Core,
  window: null,
  globalThis: null,
  document,
  localStorage,
  navigator: { onLine: true },
  history: { replaceState() {} },
  location: { hash: "", protocol: "file:" },
  Intl,
  Date,
  Math,
  JSON,
  Map,
  Set,
  Blob,
  URL,
  FormData,
  HTMLFormElement: function HTMLFormElement() {},
  setTimeout() { return 0; },
  clearTimeout() {},
  setInterval() { return 0; },
  clearInterval() {}
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
  `\n  globalThis.__appTest = {\n    ui,\n    getState: () => state,\n    setState: (value) => { state = value; },\n    renderOverviewPage, renderShiftsPage, renderAnalyticsPage, renderCalendarPage,\n    renderVehiclePage, renderGoalsPage, renderSettingsPage, shiftsToCSV,\n    parseCSV, csvRowsToShifts, prepareImportPayload, filteredShifts, filteredMaintenance,\n    updateShiftResults, updateVehicleResults, openShiftModal, openMaintenanceModal,\n    openGoalModal, openContributionModal, openMoreModal, openConfirm, openImportReview, dismissModal\n  };\n})();`
);
vm.runInNewContext(source, context, { filename: "app.js" });
const app = context.__appTest;
assert(app, "test API should be exposed");

const emptyState = {
  version: Core.APP_VERSION,
  shifts: [],
  maintenance: [],
  goals: [],
  settings: Core.normalizeSettings({}),
  activeShift: null
};
app.setState(emptyState);
for (const fn of [
  "renderOverviewPage", "renderShiftsPage", "renderAnalyticsPage", "renderCalendarPage",
  "renderVehiclePage", "renderGoalsPage", "renderSettingsPage"
]) {
  const html = app[fn]();
  assert.strictEqual(typeof html, "string", `${fn} should return HTML`);
  assert(html.length > 200, `${fn} should return a substantive view`);
  assert(!html.includes("undefined"), `${fn} should not render undefined`);
}

const sampleState = {
  version: Core.APP_VERSION,
  settings: Core.normalizeSettings({ weeklyNetGoal: 900, monthlyNetGoal: 3500 }),
  shifts: [
    Core.normalizeShift({ id: "s1", date: Core.localISODate(), platform: "Uber", startTime: "08:00", endTime: "12:30", gross: 180, fuel: 22, tolls: 4, startOdometer: 25000, endOdometer: 25128, trips: 9, notes: "Morning airport run" }),
    Core.normalizeShift({ id: "s2", date: Core.localISODate(Core.shiftDate(new Date(), -2)), platform: "Lyft", startTime: "17:15", endTime: "22:00", gross: 205, fuel: 28, manualMiles: 142, trips: 11 })
  ],
  maintenance: [Core.normalizeMaintenance({ id: "m1", date: Core.localISODate(), type: "Oil Change", amount: 84.5, odometer: 25000, nextDueOdometer: 30000, note: "Full synthetic" })],
  goals: [Core.normalizeGoal({ id: "g1", name: "New tires", target: 900, targetDate: Core.localISODate(Core.shiftDate(new Date(), 60)), contributions: [{ id: "c1", date: Core.localISODate(), amount: 250, note: "Opening contribution" }] })],
  activeShift: null
};
app.setState(sampleState);
for (const fn of [
  "renderOverviewPage", "renderShiftsPage", "renderAnalyticsPage", "renderCalendarPage",
  "renderVehiclePage", "renderGoalsPage", "renderSettingsPage"
]) {
  const html = app[fn]();
  assert(html.length > 500, `${fn} should render sample data`);
  assert(!html.includes("NaN"), `${fn} should not render NaN`);
  assert(!html.includes("undefined"), `${fn} should not render undefined`);
}

const lossState = {
  ...sampleState,
  shifts: [Core.normalizeShift({ id: "loss", date: Core.localISODate(), platform: "Uber", manualHours: 1, gross: 0, fuel: 25 }, sampleState.settings)]
};
app.setState(lossState);
assert(app.renderAnalyticsPage().includes("is-negative"), "analytics should visibly represent negative performance");
app.setState(sampleState);

// Exercise dynamic result rendering against lightweight DOM nodes.
nodes.set("shiftResultsMeta", createNode());
nodes.set("shiftSummary", createNode());
nodes.set("shiftBulkBar", createNode());
nodes.set("shiftTableWrap", createNode());
nodes.set("shiftMobileList", createNode());
app.updateShiftResults();
assert(nodes.get("shiftTableWrap").innerHTML.includes("data-table"));
nodes.set("maintenanceResults", createNode());
nodes.set("maintenanceResultsMeta", createNode());
app.updateVehicleResults();
assert(nodes.get("maintenanceResults").innerHTML.includes("Oil Change"));

// Exercise every modal renderer.
app.openShiftModal("add");
assert(nodes.get("modalRoot").innerHTML.includes("Add completed shift"));
app.openShiftModal("edit", sampleState.shifts[0]);
assert(nodes.get("modalRoot").innerHTML.includes("Edit shift"));
app.openMaintenanceModal(sampleState.maintenance[0]);
assert(nodes.get("modalRoot").innerHTML.includes("Edit maintenance"));
app.openGoalModal(sampleState.goals[0]);
assert(nodes.get("modalRoot").innerHTML.includes("Edit goal"));
app.openContributionModal(sampleState.goals[0]);
assert(nodes.get("modalRoot").innerHTML.includes("Fund New tires"));
app.openMoreModal();
assert(nodes.get("modalRoot").innerHTML.includes("More tools"));
app.openConfirm({ title: "Confirm test", body: "Confirmation body", onConfirm() {} });
assert(nodes.get("modalRoot").innerHTML.includes("Confirmation body"));
let importReviewRestored = false;
const reviewPayload = { source: "CSV", shifts: sampleState.shifts, maintenance: [], goals: [], settings: null, activeShift: null };
app.openImportReview(reviewPayload, "ledger.csv");
app.openConfirm({
  title: "Replace test",
  body: "Replace confirmation",
  onConfirm() {},
  onCancel() {
    importReviewRestored = true;
    app.openImportReview(reviewPayload, "ledger.csv");
  }
});
app.dismissModal();
assert(importReviewRestored, "canceling a nested confirmation should restore the import review");
assert(nodes.get("modalRoot").innerHTML.includes("ledger.csv"));

const csv = app.shiftsToCSV(sampleState.shifts);
assert(csv.includes("Morning airport run"));
assert.strictEqual(app.parseCSV(csv).length, 3);
assert.strictEqual(app.csvRowsToShifts(app.parseCSV(csv)).length, 2);

const formulaShift = Core.normalizeShift({
  id: "formula-shift",
  date: "2026-07-12",
  platform: "=2+2",
  manualHours: 1,
  gross: 50,
  notes: "@SUM(1,1)"
}, sampleState.settings);
const protectedCSV = app.shiftsToCSV([formulaShift]);
assert(protectedCSV.includes("'=2+2"), "formula-like text should be neutralized in CSV exports");
const formulaRoundTrip = app.csvRowsToShifts(app.parseCSV(protectedCSV));
assert.strictEqual(formulaRoundTrip[0].platform, "=2+2");
assert.strictEqual(formulaRoundTrip[0].notes, "@SUM(1,1)");

const dateAuditCSV = "date,platform,gross,manualHours\n2026-02-31,Uber,100,2\n2026-02-28,Uber,100,2";
const dateAuditRows = app.csvRowsToShifts(app.parseCSV(dateAuditCSV));
assert.strictEqual(dateAuditRows.length, 1, "invalid imported dates should be skipped instead of becoming today");
assert.strictEqual(dateAuditRows[0].date, "2026-02-28");

const genericLedgerCSV = "date,platform,gross,expenses,net,manualHours\n2026-07-12,Uber,100,25,75,2\n2026-07-13,Uber,,25,0,1";
const genericRows = app.csvRowsToShifts(app.parseCSV(genericLedgerCSV));
assert.strictEqual(Core.calculateShift(genericRows[0], sampleState.settings).net, 75);
assert.strictEqual(Core.calculateShift(genericRows[1], sampleState.settings).net, 0);
assert.strictEqual(genericRows[1].otherExpenses, 25);

const jsonImport = app.prepareImportPayload(JSON.stringify(sampleState), "json");
assert.strictEqual(jsonImport.shifts.length, 2);
assert.strictEqual(jsonImport.maintenance.length, 1);

// User-entered labels and notes must never become executable markup.
const unsafe = `<img src=x onerror=alert(1)>`;
const unsafeSettings = Core.normalizeSettings({ defaultPlatform: unsafe, vehicle: { name: unsafe } });
const unsafeState = {
  version: Core.APP_VERSION,
  settings: unsafeSettings,
  shifts: [Core.normalizeShift({ id: "unsafe-shift", date: Core.localISODate(), platform: unsafe, notes: unsafe, gross: 100 }, unsafeSettings)],
  maintenance: [Core.normalizeMaintenance({ id: "unsafe-maintenance", date: Core.localISODate(), type: unsafe, note: unsafe })],
  goals: [Core.normalizeGoal({ id: "unsafe-goal", name: unsafe, note: unsafe, target: 100 })],
  activeShift: null
};
app.setState(unsafeState);
for (const fn of [
  "renderOverviewPage", "renderShiftsPage", "renderAnalyticsPage", "renderCalendarPage",
  "renderVehiclePage", "renderGoalsPage", "renderSettingsPage"
]) {
  const html = app[fn]();
  assert(!html.includes("<img src=x"), `${fn} should escape user-provided HTML`);
}
nodes.set("shiftResultsMeta", createNode());
nodes.set("shiftSummary", createNode());
nodes.set("shiftBulkBar", createNode());
nodes.set("shiftTableWrap", createNode());
nodes.set("shiftMobileList", createNode());
app.updateShiftResults();
assert(!nodes.get("shiftTableWrap").innerHTML.includes("<img src=x"));
assert(!nodes.get("shiftMobileList").innerHTML.includes("<img src=x"));
nodes.set("maintenanceResults", createNode());
nodes.set("maintenanceResultsMeta", createNode());
app.updateVehicleResults();
assert(!nodes.get("maintenanceResults").innerHTML.includes("<img src=x"));

app.openShiftModal("edit", unsafeState.shifts[0]);
assert(!nodes.get("modalRoot").innerHTML.includes("<img src=x"));
app.openMaintenanceModal(unsafeState.maintenance[0]);
assert(!nodes.get("modalRoot").innerHTML.includes("<img src=x"));
app.openGoalModal(unsafeState.goals[0]);
assert(!nodes.get("modalRoot").innerHTML.includes("<img src=x"));

console.log("app-render.test.js: all tests passed");
