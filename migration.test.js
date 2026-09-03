"use strict";

const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const Core = require("./core.js");

class HTMLElementStub {}

function nodeStub() {
  return Object.assign(new HTMLElementStub(), {
    innerHTML: "",
    textContent: "",
    hidden: true,
    files: [],
    value: "",
    style: {},
    dataset: {},
    classList: { toggle() {}, add() {}, remove() {} },
    setAttribute() {},
    addEventListener() {},
    appendChild() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    focus() {},
    remove() {},
    click() {}
  });
}

function loadApp(seedEntries) {
  const seed = new Map(seedEntries || []);
  const localStorage = {
    getItem(key) { return seed.has(key) ? seed.get(key) : null; },
    setItem(key, value) { seed.set(key, String(value)); },
    removeItem(key) { seed.delete(key); }
  };
  const nodes = new Map();
  const document = {
    body: nodeStub(),
    documentElement: { dataset: {} },
    activeElement: null,
    title: "",
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, nodeStub());
      return nodes.get(id);
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return nodeStub(); },
    addEventListener() {},
    contains() { return false; }
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
    HTMLFormElement: class HTMLFormElement extends HTMLElementStub {},
    HTMLInputElement: class HTMLInputElement extends HTMLElementStub {},
    HTMLTextAreaElement: class HTMLTextAreaElement extends HTMLElementStub {},
    HTMLSelectElement: class HTMLSelectElement extends HTMLElementStub {},
    FileReader: class FileReader {},
    setTimeout() { return 0; },
    clearTimeout() {},
    setInterval() { return 0; },
    clearInterval() {},
    console
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
  source = source.replace(marker, `\n  globalThis.__migrationTest = {\n    getState: () => state,\n    saveState,\n    serializeState\n  };\n})();`);
  vm.runInNewContext(source, context, { filename: "app.js" });
  return { api: context.__migrationTest, seed };
}

const formerPlan = {
  version: 2,
  basis: "positiveNet",
  vehiclePct: 5,
  stockPct: 10,
  cryptoPct: 10,
  cryptoMix: { bitcoin: 55, solana: 25, ethereum: 15, aave: 5 }
};
const formerState = {
  schemaVersion: "3.5.0",
  appVersion: "3.5.0",
  settings: {
    theme: "light",
    defaultPlatform: "Lyft",
    monthlyNetGoal: 3200,
    moneyPlan: formerPlan
  },
  shifts: [
    {
      id: "old-v2",
      date: "2026-09-01",
      platform: "Uber",
      gross: 300,
      fuel: 40,
      tolls: 10,
      otherExpenses: 10,
      moneyPlanRates: formerPlan,
      moneyPlanVersion: 2
    },
    {
      id: "legacy",
      date: "2026-08-20",
      platform: "Uber",
      gross: 100,
      fuel: 10,
      vehicleFund: 4.5,
      investment: 18,
      savings: 9,
      allocationRates: { vehicle: 5, investment: 20, savings: 10 }
    }
  ],
  maintenance: [],
  goals: [],
  activeShift: null
};

const migrated = loadApp([[Core.STORAGE_KEY, JSON.stringify(formerState)]]);
assert.ok(migrated.api, "migration API should be exposed");
const state = migrated.api.getState();
assert.equal(state.schemaVersion, Core.APP_VERSION);
assert.equal(state.settings.theme, "light");
assert.equal(state.settings.defaultPlatform, "Lyft");
assert.equal(state.settings.monthlyNetGoal, 3200);
assert.deepEqual(
  JSON.parse(JSON.stringify(state.settings.moneyPlan)),
  JSON.parse(JSON.stringify(Core.normalizeMoneyPlan(Core.DEFAULT_MONEY_PLAN)))
);
assert.equal(state.shifts.length, 2);
assert.equal(state.shifts[0].moneyPlanRates.version, 2, "saved version-2 shift should remain historical");
assert.equal(state.shifts[1].moneyPlanRates, null, "pre-versioned shift should remain legacy");
assert.equal(Core.calculateShift(state.shifts[0], state.settings).isPreviousMoneyPlan, true);
assert.equal(Core.calculateShift(state.shifts[1], state.settings).isNewMoneyPlan, false);

assert.equal(migrated.api.saveState(), true);
const saved = JSON.parse(migrated.seed.get(Core.STORAGE_KEY));
assert.equal(saved.schemaVersion, Core.APP_VERSION);
assert.equal(saved.settings.moneyPlan.version, 3);
assert.equal(saved.shifts[0].moneyPlanRates.version, 2);
const mirrored = JSON.parse(migrated.seed.get("uberEntries"));
assert.equal(mirrored.length, 2);
assert.equal(mirrored[0].id, "old-v2");

const customPlan = Core.normalizeMoneyPlan({
  version: 3,
  vehiclePct: 7,
  investmentPct: 18,
  investmentMix: { bitcoin: 50, solana: 20, schg: 20, aave: 10 }
});
const customLoaded = loadApp([[
  Core.STORAGE_KEY,
  JSON.stringify({ settings: { moneyPlan: customPlan }, shifts: [], maintenance: [], goals: [], activeShift: null })
]]).api.getState();
assert.equal(Core.moneyPlanSignature(customLoaded.settings.moneyPlan), Core.moneyPlanSignature(customPlan), "a user-edited version-3 plan should survive reload");

const legacyOnly = loadApp([[
  "uberEntries",
  JSON.stringify([{ id: "legacy-only", date: "2026-08-01", gross: 75, gas: 8, investment: 13, savings: 6, vehicleFund: 3 }])
]]).api.getState();
assert.equal(legacyOnly.settings.moneyPlan.version, 3, "legacy-only storage should receive the new default plan");
assert.equal(legacyOnly.shifts.length, 1);
assert.equal(legacyOnly.shifts[0].fuel, 8);
assert.equal(legacyOnly.shifts[0].moneyPlanRates, null);

console.log("migration.test.js: all assertions passed");
