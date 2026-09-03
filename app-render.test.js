"use strict";

const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const Core = require("./core.js");

class HTMLElementStub {}
class HTMLFormElementStub extends HTMLElementStub {}
class HTMLInputElementStub extends HTMLElementStub {}
class HTMLTextAreaElementStub extends HTMLElementStub {}
class HTMLSelectElementStub extends HTMLElementStub {}

function createNode() {
  return Object.assign(new HTMLElementStub(), {
    innerHTML: "",
    textContent: "",
    title: "",
    hidden: true,
    files: [],
    value: "",
    style: {},
    dataset: {},
    className: "",
    classList: { toggle() {}, add() {}, remove() {} },
    setAttribute() {},
    getAttribute() { return null; },
    addEventListener() {},
    focus() {},
    appendChild() {},
    remove() {},
    click() {},
    querySelector() { return null; },
    querySelectorAll() { return []; }
  });
}

const nodes = new Map();
const document = {
  body: createNode(),
  documentElement: { dataset: {} },
  activeElement: null,
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
  addEventListener() {},
  contains() { return false; }
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
  HTMLElement: HTMLElementStub,
  HTMLFormElement: HTMLFormElementStub,
  HTMLInputElement: HTMLInputElementStub,
  HTMLTextAreaElement: HTMLTextAreaElementStub,
  HTMLSelectElement: HTMLSelectElementStub,
  FileReader: class FileReader {},
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

let source = fs.readFileSync(require.resolve("./app.js"), "utf8");
const marker = "\n  initialize();\n})();";
assert.ok(source.includes(marker), "app initialization marker should exist");
source = source.replace(marker, `\n  globalThis.__appTest = {\n    ui,\n    getState: () => state,\n    setState: (value) => { state = Core.normalizeState(value); },\n    renderOverviewPage,\n    renderShiftsPage,\n    renderMoneyPage,\n    renderCalendarPage,\n    renderVehiclePage,\n    renderGoalsPage,\n    renderSettingsPage,\n    moneyPlanMarkup,\n    openMoneyPlanEditor,\n    openEndShiftModal,\n    openManualShiftModal,\n    shiftsToCSV,\n    parseCSV,\n    csvRowsToShifts,\n    prepareImport\n  };\n})();`);
vm.runInNewContext(source, context, { filename: "app.js" });
const app = context.__appTest;
assert.ok(app, "test API should be exposed");

const renderers = [
  "renderOverviewPage",
  "renderShiftsPage",
  "renderMoneyPage",
  "renderCalendarPage",
  "renderVehiclePage",
  "renderGoalsPage",
  "renderSettingsPage"
];

const emptyState = Core.normalizeState({ settings: {}, shifts: [], maintenance: [], goals: [], activeShift: null });
app.setState(emptyState);
for (const name of renderers) {
  const html = app[name]();
  assert.equal(typeof html, "string", `${name} should return HTML`);
  assert.ok(html.length > 200, `${name} should return a substantive view`);
  assert.ok(!html.includes("undefined"), `${name} should not render undefined`);
  assert.ok(!html.includes("NaN"), `${name} should not render NaN`);
}
assert.ok(app.renderMoneyPage().includes("No directions yet"), "empty money page should show a useful empty state");
const emptySettingsHtml = app.renderSettingsPage();
for (const phrase of ["Your money plan", "Edit plan", "Vehicle fund", "Investments", "Bitcoin", "Solana", "SCHG", "AAVE", "no savings allocation"]) {
  assert.ok(emptySettingsHtml.toLowerCase().includes(phrase.toLowerCase()), `settings should include ${phrase}`);
}

const settings = Core.normalizeSettings({ weeklyNetGoal: 900, monthlyNetGoal: 3500 });
const today = Core.localISODate();
const currentShift = Core.normalizeShift({
  id: "current",
  date: today,
  platform: "Uber",
  startTime: "08:00",
  endTime: "12:00",
  uberGross: 120,
  lyftGross: 80,
  fuel: 30,
  startOdometer: 25000,
  endOdometer: 25120,
  trips: 9,
  notes: "Morning airport run",
  moneyPlanRates: settings.moneyPlan
}, settings);
const previousShift = Core.normalizeShift({
  id: "previous",
  date: today,
  platform: "Lyft",
  manualHours: 2,
  gross: 100,
  fuel: 10,
  moneyPlanRates: Core.LEGACY_MONEY_PLAN_V2
}, settings);
const legacyShift = Core.normalizeShift({
  id: "legacy",
  date: today,
  platform: "Uber",
  manualHours: 1,
  gross: 80,
  fuel: 8,
  vehicleFund: 3.6,
  investment: 12,
  savings: 7.2,
  allocationRates: { vehicle: 5, investment: 16.67, savings: 10 }
}, settings);

const sampleState = Core.normalizeState({
  settings,
  shifts: [currentShift],
  maintenance: [{ id: "m1", date: today, type: "Oil Change", amount: 84.5, odometer: 25000, nextDueOdometer: 30000, note: "Full synthetic" }],
  goals: [{ id: "g1", name: "New tires", target: 900, targetDate: "2026-12-01", contributions: [{ id: "c1", date: today, amount: 250 }] }],
  activeShift: null
});
app.setState(sampleState);
for (const name of renderers) {
  const html = app[name]();
  assert.ok(html.length > 500, `${name} should render sample data`);
  assert.ok(!html.includes("undefined"), `${name} should not render undefined`);
  assert.ok(!html.includes("NaN"), `${name} should not render NaN`);
}

const currentPlanHtml = app.moneyPlanMarkup(currentShift);
for (const phrase of ["$80.00", "$10.00", "$40.00", "$16.00", "$12.00", "$8.00", "$4.00", "40% of investments · 8% gross", "Uber $120.00 · Lyft $80.00"]) {
  assert.ok(currentPlanHtml.includes(phrase), `current money receipt should include ${phrase}`);
}
assert.ok(!currentPlanHtml.includes("Ethereum"), "current plan should not include Ethereum");
const moneyPageHtml = app.renderMoneyPage();
assert.ok(moneyPageHtml.includes("$80.00"), "day money page should show gas plus 25% take-out");
assert.ok(moneyPageHtml.includes("Investment directions"));
assert.ok(moneyPageHtml.includes("SCHG"));
assert.ok(moneyPageHtml.includes("Uber gross"));
assert.ok(moneyPageHtml.includes("Lyft gross"));
assert.ok(moneyPageHtml.includes("Overall gross"));
assert.ok(moneyPageHtml.includes("$120.00"));
assert.ok(moneyPageHtml.includes("60% of Uber + Lyft"));
assert.ok(moneyPageHtml.includes("40% of Uber + Lyft"));

const previousPlanHtml = app.moneyPlanMarkup(previousShift);
assert.ok(previousPlanHtml.includes("historical 5/10/10 plan"));
assert.ok(previousPlanHtml.includes("Ethereum"));

app.openMoneyPlanEditor();
const modalHtml = nodes.get("modalRoot").innerHTML;
for (const phrase of ["Edit money plan", "planVehiclePct", "planInvestmentPct", "planBitcoinPct", "planSolanaPct", "planSchgPct", "planAavePct", "Savings allocation", "0%"] ) {
  assert.ok(modalHtml.includes(phrase), `money-plan editor should include ${phrase}`);
}

const activeState = Core.normalizeState({
  ...sampleState,
  activeShift: {
    id: "active-test",
    date: today,
    platform: "Uber",
    startTime: "10:00",
    startedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    startOdometer: 25120,
    pausedMs: 0,
    notes: "Mixed app test"
  }
});
app.setState(activeState);
app.openEndShiftModal();
const endModalHtml = nodes.get("modalRoot").innerHTML;
for (const phrase of ["Finish shift", "Earnings by app", "endUberGross", "endLyftGross", "Overall gross", "data-preview-gross", "adds them together for overall gross"]) {
  assert.ok(endModalHtml.includes(phrase), `end-shift modal should include ${phrase}`);
}

app.setState(sampleState);
app.openManualShiftModal();
const manualModalHtml = nodes.get("modalRoot").innerHTML;
for (const phrase of ["Add completed shift", "manualUberGross", "manualLyftGross", "manualUnassignedGross", "overall gross is calculated for you"]) {
  assert.ok(manualModalHtml.includes(phrase), `manual-shift modal should include ${phrase}`);
}

const priorGrossPlan = Core.normalizeMoneyPlan({
  version: 3,
  vehiclePct: 6,
  investmentPct: 19,
  investmentMix: { bitcoin: 50, solana: 20, schg: 20, aave: 10 }
});
const priorGrossShift = Core.normalizeShift({ id: "prior-v3", date: today, gross: 100, moneyPlanRates: priorGrossPlan }, settings);
app.setState({ ...sampleState, shifts: [currentShift, priorGrossShift] });
const mixedHtml = app.renderMoneyPage();
assert.ok(mixedHtml.includes("Saved plans combined"), "mixed periods should not label every total with current percentages");
assert.ok(mixedHtml.includes("1 older shift"), "mixed periods should identify historical plan amounts");

// Versioned CSV round trips must preserve current, former, and legacy plan types.
app.setState({ ...sampleState, shifts: [currentShift, previousShift, legacyShift] });
const csv = app.shiftsToCSV([currentShift, previousShift, legacyShift]);
assert.ok(csv.includes("moneyPlanVersion"));
assert.ok(csv.includes("schgInvestment"));
assert.ok(csv.includes("uberGross,lyftGross,otherGross,unassignedGross,overallGross"));
assert.ok(csv.includes("Morning airport run"));
const imported = app.csvRowsToShifts(app.parseCSV(csv));
assert.equal(imported.length, 3);
const importedCurrent = imported.find((item) => item.id === "current");
const importedPrevious = imported.find((item) => item.id === "previous");
const importedLegacy = imported.find((item) => item.id === "legacy");
assert.equal(importedCurrent.moneyPlanRates.version, 3);
assert.equal(importedCurrent.uberGross, 120);
assert.equal(importedCurrent.lyftGross, 80);
assert.equal(importedCurrent.gross, 200);
assert.equal(importedCurrent.platform, "Uber + Lyft");
assert.equal(importedPrevious.moneyPlanRates.version, 2);
assert.equal(importedLegacy.moneyPlanRates, null);
assert.equal(Core.calculateShift(importedCurrent, settings).takeOut, 80);
assert.equal(Core.calculateShift(importedPrevious, settings).isPreviousMoneyPlan, true);
assert.equal(Core.calculateShift(importedLegacy, settings).isNewMoneyPlan, false);

// A CSV exported by version 3.5 did not include plan-version columns. Detect it
// from its old 5/10/10 amount columns and preserve it as version 2.
const oldCsv = [
  "date,platform,gross,gas,tollsParking,otherExpenses,totalExpenses,netAfterExpenses,vehicleFund5Pct,stocks10Pct,crypto10Pct,bitcoin55PctOfCrypto,solana25PctOfCrypto,ethereum15PctOfCrypto,aave5PctOfCrypto,totalAllocation,gasPlusAllocationTakeOut,keepAvailable",
  "2026-09-01,Uber,300,40,10,10,60,240,12,24,24,13.2,6,3.6,1.2,60,100,180"
].join("\n");
const oldImported = app.csvRowsToShifts(app.parseCSV(oldCsv));
assert.equal(oldImported.length, 1);
assert.equal(oldImported[0].moneyPlanRates.version, 2);
assert.equal(oldImported[0].uberGross, 300);
assert.equal(oldImported[0].lyftGross, 0);
assert.equal(Core.calculateShift(oldImported[0], settings).takeOut, 100);
assert.equal(Core.calculateShift(oldImported[0], settings).ethereum, 3.6);

const splitOnlyCsv = "date,uberGross,lyftGross,gas,manualHours\n2026-07-11,75,25,10,2";
const splitOnlyRows = app.csvRowsToShifts(app.parseCSV(splitOnlyCsv));
assert.equal(splitOnlyRows.length, 1);
assert.equal(splitOnlyRows[0].uberGross, 75);
assert.equal(splitOnlyRows[0].lyftGross, 25);
assert.equal(splitOnlyRows[0].gross, 100);
assert.equal(splitOnlyRows[0].platform, "Uber + Lyft");
assert.equal(Core.calculateShift(splitOnlyRows[0], settings).net, 90);

const genericLedgerCsv = "date,platform,gross,expenses,net,manualHours\n2026-07-12,Uber,100,25,75,2\n2026-07-13,Uber,,25,0,1";
const genericRows = app.csvRowsToShifts(app.parseCSV(genericLedgerCsv));
assert.equal(genericRows.length, 2);
assert.equal(genericRows[0].moneyPlanRates, null);
assert.equal(Core.calculateShift(genericRows[0], settings).net, 75);
assert.equal(Core.calculateShift(genericRows[1], settings).net, 0);
assert.equal(genericRows[1].otherExpenses, 25);

const formulaShift = Core.normalizeShift({
  id: "formula",
  date: "2026-07-12",
  platform: "=2+2",
  gross: 50,
  notes: "@SUM(1,1)",
  moneyPlanRates: settings.moneyPlan
}, settings);
const protectedCsv = app.shiftsToCSV([formulaShift]);
assert.ok(protectedCsv.includes("'=2+2"), "formula-like labels should be neutralized in CSV exports");
const formulaRoundTrip = app.csvRowsToShifts(app.parseCSV(protectedCsv));
assert.equal(formulaRoundTrip[0].platform, "=2+2");
assert.equal(formulaRoundTrip[0].otherGross, 50);
assert.equal(formulaRoundTrip[0].gross, 50);
assert.equal(formulaRoundTrip[0].notes, "@SUM(1,1)");

const invalidDateCsv = "date,platform,gross\n2026-02-31,Uber,100\n2026-02-28,Uber,100";
const validDateRows = app.csvRowsToShifts(app.parseCSV(invalidDateCsv));
assert.equal(validDateRows.length, 1, "invalid imported dates should be skipped");
assert.equal(validDateRows[0].date, "2026-02-28");

const jsonPayload = app.prepareImport(JSON.stringify(sampleState), "backup.json");
assert.equal(jsonPayload.shifts.length, 1);
assert.equal(jsonPayload.maintenance.length, 1);
assert.equal(jsonPayload.goals.length, 1);

// User-entered labels and notes must remain escaped in rendered HTML.
const unsafe = "<img src=x onerror=alert(1)>";
const unsafeSettings = Core.normalizeSettings({ defaultPlatform: unsafe, vehicle: { name: unsafe } });
const unsafeState = Core.normalizeState({
  settings: unsafeSettings,
  shifts: [{ id: "unsafe-shift", date: today, platform: unsafe, notes: unsafe, gross: 100, moneyPlanRates: unsafeSettings.moneyPlan }],
  maintenance: [{ id: "unsafe-maintenance", date: today, type: unsafe, note: unsafe }],
  goals: [{ id: "unsafe-goal", name: unsafe, note: unsafe, target: 100 }],
  activeShift: null
});
app.setState(unsafeState);
for (const name of renderers) {
  const html = app[name]();
  assert.ok(!html.includes("<img src=x"), `${name} should escape user-provided HTML`);
}

console.log("app-render.test.js: all assertions passed");
