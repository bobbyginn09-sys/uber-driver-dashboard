(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.DriverCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const APP_VERSION = "3.6.0";
  const STORAGE_KEY = "uberDriverDashboard.v3";

  const LEGACY_MONEY_PLAN_V2 = Object.freeze({
    version: 2,
    basis: "positiveNet",
    vehiclePct: 5,
    stockPct: 10,
    cryptoPct: 10,
    cryptoMix: Object.freeze({
      bitcoin: 55,
      solana: 25,
      ethereum: 15,
      aave: 5
    })
  });

  const DEFAULT_MONEY_PLAN = Object.freeze({
    version: 3,
    basis: "gross",
    vehiclePct: 5,
    investmentPct: 20,
    investmentMix: Object.freeze({
      bitcoin: 40,
      solana: 30,
      schg: 20,
      aave: 10
    })
  });

  const DEFAULT_SETTINGS = Object.freeze({
    theme: "dark",
    weekStartsOn: 0,
    defaultPlatform: "Uber",
    weeklyNetGoal: 500,
    monthlyNetGoal: 2000,
    lastRoute: "overview",
    moneyPlan: DEFAULT_MONEY_PLAN,
    vehicle: Object.freeze({
      name: "My vehicle",
      currentOdometer: 0,
      oilInterval: 5000,
      tireInterval: 5000
    }),
    taxRates: Object.freeze([
      Object.freeze({ start: "2024-01-01", end: "2024-12-31", rate: 0.67 }),
      Object.freeze({ start: "2025-01-01", end: "2025-12-31", rate: 0.70 }),
      Object.freeze({ start: "2026-01-01", end: "2026-06-30", rate: 0.725 }),
      Object.freeze({ start: "2026-07-01", end: "2026-12-31", rate: 0.76 })
    ])
  });

  function safeNumber(value, fallback) {
    const number = typeof value === "number" ? value : Number.parseFloat(String(value == null ? "" : value).replace(/[$,%\s]/g, ""));
    return Number.isFinite(number) ? number : (fallback == null ? 0 : fallback);
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, safeNumber(value)));
  }

  function round(value, digits) {
    const places = digits == null ? 2 : digits;
    const multiplier = 10 ** places;
    return Math.round((safeNumber(value) + Number.EPSILON) * multiplier) / multiplier;
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function uid(prefix) {
    const head = String(prefix || "item");
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${head}_${crypto.randomUUID()}`;
    }
    return `${head}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function localISODate(value) {
    const date = value instanceof Date ? value : value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseISODate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function startOfDay(value) {
    const date = value instanceof Date ? new Date(value) : new Date(value || Date.now());
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function endOfDay(value) {
    const date = startOfDay(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  function startOfWeek(value, weekStartsOn) {
    const date = startOfDay(value || new Date());
    const first = clamp(weekStartsOn, 0, 6);
    const delta = (date.getDay() - first + 7) % 7;
    date.setDate(date.getDate() - delta);
    return date;
  }

  function endOfWeek(value, weekStartsOn) {
    const date = startOfWeek(value, weekStartsOn);
    date.setDate(date.getDate() + 6);
    return endOfDay(date);
  }

  function startOfMonth(value) {
    const date = value instanceof Date ? new Date(value) : new Date(value || Date.now());
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function endOfMonth(value) {
    const date = value instanceof Date ? new Date(value) : new Date(value || Date.now());
    return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  }

  function startOfYear(value) {
    const date = value instanceof Date ? new Date(value) : new Date(value || Date.now());
    return new Date(date.getFullYear(), 0, 1);
  }

  function endOfYear(value) {
    const date = value instanceof Date ? new Date(value) : new Date(value || Date.now());
    return endOfDay(new Date(date.getFullYear(), 11, 31));
  }

  function normalizePercentage(value, fallback) {
    const number = safeNumber(value, fallback);
    return round(clamp(number, 0, 100), 4);
  }

  function normalizeMix(value, defaults, keys) {
    const source = value && typeof value === "object" ? value : {};
    const mix = {};
    keys.forEach((key) => {
      mix[key] = normalizePercentage(source[key], defaults[key]);
    });
    const total = keys.reduce((sum, key) => sum + mix[key], 0);
    if (total <= 0) return { ...defaults };
    if (Math.abs(total - 100) < 0.0001) return mix;
    const normalized = {};
    keys.forEach((key) => {
      normalized[key] = round(mix[key] / total * 100, 4);
    });
    return normalized;
  }

  function normalizeLegacyCryptoMix(value) {
    return normalizeMix(value, LEGACY_MONEY_PLAN_V2.cryptoMix, ["bitcoin", "solana", "ethereum", "aave"]);
  }

  function normalizeInvestmentMix(value) {
    return normalizeMix(value, DEFAULT_MONEY_PLAN.investmentMix, ["bitcoin", "solana", "schg", "aave"]);
  }

  function moneyPlanSignature(value) {
    const plan = normalizeMoneyPlan(value);
    if (plan.version >= 3) {
      return [
        `v${plan.version}`,
        plan.basis,
        plan.vehiclePct,
        plan.investmentPct,
        plan.investmentMix.bitcoin,
        plan.investmentMix.solana,
        plan.investmentMix.schg,
        plan.investmentMix.aave
      ].join("|");
    }
    return [
      `v${plan.version}`,
      plan.basis,
      plan.vehiclePct,
      plan.stockPct,
      plan.cryptoPct,
      plan.cryptoMix.bitcoin,
      plan.cryptoMix.solana,
      plan.cryptoMix.ethereum,
      plan.cryptoMix.aave
    ].join("|");
  }

  function allocateMoneyByMix(amountValue, mixValue, keysValue) {
    const keys = Array.isArray(keysValue) && keysValue.length ? keysValue : Object.keys(mixValue || {});
    const totalCents = Math.max(0, Math.round(round(amountValue, 2) * 100));
    const weights = keys.map((key) => Math.max(0, safeNumber(mixValue && mixValue[key])));
    const weightTotal = weights.reduce((sum, value) => sum + value, 0);
    const result = Object.fromEntries(keys.map((key) => [key, 0]));
    if (!totalCents || weightTotal <= 0 || !keys.length) return result;

    const allocations = weights.map((weight, index) => {
      const exact = totalCents * weight / weightTotal;
      const cents = Math.floor(exact + 1e-9);
      return { index, cents, remainder: exact - cents };
    });
    let centsLeft = totalCents - allocations.reduce((sum, item) => sum + item.cents, 0);
    const ranked = allocations.slice().sort((a, b) => b.remainder - a.remainder || a.index - b.index);
    for (let index = 0; centsLeft > 0; index += 1, centsLeft -= 1) {
      ranked[index % ranked.length].cents += 1;
    }
    allocations.forEach((item) => {
      result[keys[item.index]] = round(item.cents / 100, 2);
    });
    return result;
  }

  function normalizeMoneyPlan(value) {
    const source = value && typeof value === "object" ? value : {};
    const explicitVersion = Math.floor(safeNumber(source.version, 0));
    const resemblesVersion2 = explicitVersion === 2
      || (explicitVersion < 3 && (source.stockPct != null || source.cryptoPct != null || source.cryptoMix != null));

    if (resemblesVersion2) {
      return {
        version: 2,
        basis: "positiveNet",
        vehiclePct: normalizePercentage(source.vehiclePct, LEGACY_MONEY_PLAN_V2.vehiclePct),
        stockPct: normalizePercentage(source.stockPct, LEGACY_MONEY_PLAN_V2.stockPct),
        cryptoPct: normalizePercentage(source.cryptoPct, LEGACY_MONEY_PLAN_V2.cryptoPct),
        cryptoMix: normalizeLegacyCryptoMix(source.cryptoMix)
      };
    }

    return {
      version: Math.max(3, explicitVersion || DEFAULT_MONEY_PLAN.version),
      basis: "gross",
      vehiclePct: normalizePercentage(source.vehiclePct, DEFAULT_MONEY_PLAN.vehiclePct),
      investmentPct: normalizePercentage(source.investmentPct, DEFAULT_MONEY_PLAN.investmentPct),
      investmentMix: normalizeInvestmentMix(source.investmentMix || source.mix)
    };
  }

  function normalizeSettings(value) {
    const source = value && typeof value === "object" ? value : {};
    const vehicleSource = source.vehicle && typeof source.vehicle === "object" ? source.vehicle : {};
    const taxRates = Array.isArray(source.taxRates) && source.taxRates.length
      ? source.taxRates.map((item) => ({
          start: String(item && item.start || ""),
          end: String(item && item.end || ""),
          rate: Math.max(0, safeNumber(item && item.rate))
        })).filter((item) => parseISODate(item.start) && parseISODate(item.end))
      : DEFAULT_SETTINGS.taxRates.map((item) => ({ ...item }));

    return {
      ...source,
      theme: source.theme === "light" ? "light" : "dark",
      weekStartsOn: clamp(Math.floor(safeNumber(source.weekStartsOn, DEFAULT_SETTINGS.weekStartsOn)), 0, 6),
      defaultPlatform: String(source.defaultPlatform || DEFAULT_SETTINGS.defaultPlatform),
      weeklyNetGoal: Math.max(0, safeNumber(source.weeklyNetGoal, source.weeklyGoal || DEFAULT_SETTINGS.weeklyNetGoal)),
      monthlyNetGoal: Math.max(0, safeNumber(source.monthlyNetGoal, source.monthlyGoal || DEFAULT_SETTINGS.monthlyNetGoal)),
      lastRoute: String(source.lastRoute || DEFAULT_SETTINGS.lastRoute),
      moneyPlan: normalizeMoneyPlan(source.moneyPlan),
      vehicle: {
        ...vehicleSource,
        name: String(vehicleSource.name || DEFAULT_SETTINGS.vehicle.name),
        currentOdometer: Math.max(0, safeNumber(vehicleSource.currentOdometer, source.currentOdometer || 0)),
        oilInterval: Math.max(0, safeNumber(vehicleSource.oilInterval, DEFAULT_SETTINGS.vehicle.oilInterval)),
        tireInterval: Math.max(0, safeNumber(vehicleSource.tireInterval, DEFAULT_SETTINGS.vehicle.tireInterval))
      },
      taxRates
    };
  }

  function normalizePauseHistory(value) {
    if (!Array.isArray(value)) return [];
    return value.map((item) => ({
      start: String(item && item.start || ""),
      end: String(item && item.end || ""),
      milliseconds: Math.max(0, safeNumber(item && (item.milliseconds != null ? item.milliseconds : item.ms)))
    })).filter((item) => item.start || item.end || item.milliseconds);
  }

  function timeMinutes(value) {
    const match = /^(\d{1,2}):(\d{2})/.exec(String(value || ""));
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  function elapsedHoursFromTimes(startTime, endTime, pausedMinutes) {
    const start = timeMinutes(startTime);
    const end = timeMinutes(endTime);
    if (start == null || end == null) return 0;
    let minutes = end - start;
    if (minutes < 0) minutes += 24 * 60;
    minutes = Math.max(0, minutes - Math.max(0, safeNumber(pausedMinutes)));
    return minutes / 60;
  }

  function inferStartedAt(dateValue, startTime) {
    const date = parseISODate(dateValue) || new Date();
    const minutes = timeMinutes(startTime);
    if (minutes == null) return new Date().toISOString();
    date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return date.toISOString();
  }

  function normalizeActiveShift(value, settings) {
    if (!value || typeof value !== "object") return null;
    const date = parseISODate(value.date) ? String(value.date) : localISODate();
    const startTime = String(value.startTime || value.start || `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`);
    const startedAt = String(value.startedAt || value.clockInAt || inferStartedAt(date, startTime));
    const pausedMs = Math.max(0, safeNumber(value.pausedMs, safeNumber(value.totalPausedMs, safeNumber(value.pausedMinutes) * 60000)));
    const pauseStartedAt = value.pauseStartedAt ? String(value.pauseStartedAt) : "";
    return {
      ...value,
      id: String(value.id || uid("active")),
      date,
      platform: String(value.platform || value.app || settings.defaultPlatform),
      startTime,
      startedAt,
      startOdometer: Math.max(0, safeNumber(value.startOdometer, value.startMiles)),
      pausedMs,
      pauseStartedAt,
      pauseHistory: normalizePauseHistory(value.pauseHistory),
      notes: String(value.notes || "")
    };
  }

  function normalizeAllocationRates(value, settings) {
    const source = value && typeof value === "object" ? value : {};
    const fallback = settings && settings.allocations && typeof settings.allocations === "object" ? settings.allocations : {};
    return {
      investment: normalizePercentage(source.investment, fallback.investment || 0),
      savings: normalizePercentage(source.savings, fallback.savings || 0),
      vehicle: normalizePercentage(source.vehicle, fallback.vehicle || 0)
    };
  }

  function normalizeShift(value, settingsValue) {
    const settings = normalizeSettings(settingsValue || DEFAULT_SETTINGS);
    const source = value && typeof value === "object" ? value : {};
    const date = parseISODate(source.date) ? String(source.date) : localISODate();
    const startOdometer = Math.max(0, safeNumber(source.startOdometer, source.startMiles));
    const endOdometer = Math.max(0, safeNumber(source.endOdometer, source.endMiles));
    const pausedMs = Math.max(0, safeNumber(source.pausedMs, safeNumber(source.totalPausedMs, safeNumber(source.pausedMinutes) * 60000)));
    const hasNewPlan = Boolean(source.moneyPlanRates || source.allocationPlan || safeNumber(source.moneyPlanVersion) >= 2);
    const moneyPlanRates = hasNewPlan
      ? normalizeMoneyPlan(source.moneyPlanRates || source.allocationPlan || {
          version: source.moneyPlanVersion,
          cryptoMix: source.cryptoMix,
          investmentMix: source.investmentMix
        })
      : null;

    return {
      ...source,
      id: String(source.id || uid("shift")),
      date,
      platform: String(source.platform || source.app || settings.defaultPlatform),
      startTime: String(source.startTime || source.start || ""),
      endTime: String(source.endTime || source.end || ""),
      startedAt: String(source.startedAt || ""),
      endedAt: String(source.endedAt || ""),
      gross: Math.max(0, safeNumber(source.gross, source.earnings)),
      fuel: Math.max(0, safeNumber(source.fuel, source.gas)),
      tolls: Math.max(0, safeNumber(source.tolls, source.parking)),
      otherExpenses: Math.max(0, safeNumber(source.otherExpenses, source.other)),
      startOdometer,
      endOdometer,
      manualMiles: Math.max(0, safeNumber(source.manualMiles, source.miles)),
      manualHours: Math.max(0, safeNumber(source.manualHours, source.hours)),
      trips: Math.max(0, Math.floor(safeNumber(source.trips, source.rides || source.deliveries))),
      pausedMs,
      pausedMinutes: round(pausedMs / 60000, 2),
      pauseHistory: normalizePauseHistory(source.pauseHistory),
      notes: String(source.notes || source.note || ""),
      moneyPlanRates,
      moneyPlanVersion: moneyPlanRates ? moneyPlanRates.version : Math.max(0, Math.floor(safeNumber(source.moneyPlanVersion))),
      allocationRates: normalizeAllocationRates(source.allocationRates, settings),
      createdAt: String(source.createdAt || new Date().toISOString()),
      updatedAt: String(source.updatedAt || source.createdAt || new Date().toISOString())
    };
  }

  function normalizeMaintenance(value) {
    const source = value && typeof value === "object" ? value : {};
    return {
      ...source,
      id: String(source.id || uid("maintenance")),
      date: parseISODate(source.date) ? String(source.date) : localISODate(),
      type: String(source.type || source.service || "Other"),
      amount: Math.max(0, safeNumber(source.amount, source.cost)),
      odometer: Math.max(0, safeNumber(source.odometer, source.mileage)),
      nextDueOdometer: Math.max(0, safeNumber(source.nextDueOdometer, source.nextDue)),
      note: String(source.note || source.notes || ""),
      createdAt: String(source.createdAt || new Date().toISOString()),
      updatedAt: String(source.updatedAt || source.createdAt || new Date().toISOString())
    };
  }

  function normalizeGoal(value) {
    const source = value && typeof value === "object" ? value : {};
    const contributions = Array.isArray(source.contributions) ? source.contributions.map((item) => ({
      id: String(item && item.id || uid("contribution")),
      date: parseISODate(item && item.date) ? String(item.date) : localISODate(),
      amount: Math.max(0, safeNumber(item && item.amount)),
      note: String(item && (item.note || item.notes) || "")
    })) : [];
    return {
      ...source,
      id: String(source.id || uid("goal")),
      name: String(source.name || source.title || "Savings goal"),
      target: Math.max(0, safeNumber(source.target, source.amount)),
      targetDate: parseISODate(source.targetDate) ? String(source.targetDate) : "",
      note: String(source.note || source.notes || ""),
      archived: Boolean(source.archived),
      contributions,
      createdAt: String(source.createdAt || new Date().toISOString()),
      updatedAt: String(source.updatedAt || source.createdAt || new Date().toISOString())
    };
  }

  function normalizeState(value) {
    const source = value && typeof value === "object" ? value : {};
    const settings = normalizeSettings(source.settings);
    return {
      ...source,
      schemaVersion: APP_VERSION,
      appVersion: APP_VERSION,
      shifts: Array.isArray(source.shifts) ? source.shifts.map((item) => normalizeShift(item, settings)) : [],
      maintenance: Array.isArray(source.maintenance) ? source.maintenance.map(normalizeMaintenance) : [],
      goals: Array.isArray(source.goals) ? source.goals.map(normalizeGoal) : [],
      settings,
      activeShift: normalizeActiveShift(source.activeShift, settings)
    };
  }

  function durationHours(shift) {
    if (safeNumber(shift.manualHours) > 0) return safeNumber(shift.manualHours);
    if (shift.startedAt && shift.endedAt) {
      const start = new Date(shift.startedAt).getTime();
      const end = new Date(shift.endedAt).getTime();
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        return Math.max(0, (end - start - Math.max(0, safeNumber(shift.pausedMs))) / 3600000);
      }
    }
    return elapsedHoursFromTimes(shift.startTime, shift.endTime, safeNumber(shift.pausedMs) / 60000);
  }

  function mileage(shift) {
    const start = safeNumber(shift.startOdometer);
    const end = safeNumber(shift.endOdometer);
    if (end >= start && end > 0 && start > 0) return end - start;
    return Math.max(0, safeNumber(shift.manualMiles));
  }

  function getMileageRate(dateValue, schedule) {
    const iso = parseISODate(dateValue) ? String(dateValue) : localISODate();
    const list = Array.isArray(schedule) ? schedule : DEFAULT_SETTINGS.taxRates;
    const match = list.find((row) => row && iso >= String(row.start) && iso <= String(row.end));
    return match ? { rate: Math.max(0, safeNumber(match.rate)), source: match } : { rate: 0, source: null };
  }

  function calculateVersion2Plan(base, planValue) {
    const plan = normalizeMoneyPlan(planValue || LEGACY_MONEY_PLAN_V2);
    const positiveBase = Math.max(0, safeNumber(base));
    const vehicleFund = round(positiveBase * plan.vehiclePct / 100, 2);
    const stock = round(positiveBase * plan.stockPct / 100, 2);
    const crypto = round(positiveBase * plan.cryptoPct / 100, 2);
    const cryptoMix = plan.cryptoMix;
    const cryptoBreakdown = {
      bitcoin: round(crypto * cryptoMix.bitcoin / 100, 2),
      solana: round(crypto * cryptoMix.solana / 100, 2),
      ethereum: round(crypto * cryptoMix.ethereum / 100, 2),
      aave: 0
    };
    // Keep the historical crypto bucket exact after cent-level rounding.
    cryptoBreakdown.aave = round(crypto - cryptoBreakdown.bitcoin - cryptoBreakdown.solana - cryptoBreakdown.ethereum, 2);
    const investment = round(stock + crypto, 2);
    const allocated = round(vehicleFund + investment, 2);
    return {
      plan,
      allocationBase: positiveBase,
      allocationBasis: "positiveNet",
      vehicleFund,
      investment,
      stock,
      crypto,
      investmentBreakdown: {
        bitcoin: cryptoBreakdown.bitcoin,
        solana: cryptoBreakdown.solana,
        schg: 0,
        aave: cryptoBreakdown.aave
      },
      cryptoBreakdown,
      allocated
    };
  }

  function calculateVersion3Plan(base, planValue) {
    const plan = normalizeMoneyPlan(planValue || DEFAULT_MONEY_PLAN);
    const grossBase = Math.max(0, safeNumber(base));
    const vehicleFund = round(grossBase * plan.vehiclePct / 100, 2);
    const investment = round(grossBase * plan.investmentPct / 100, 2);
    const mix = plan.investmentMix;
    const investmentBreakdown = allocateMoneyByMix(investment, mix, ["bitcoin", "solana", "schg", "aave"]);
    const stock = investmentBreakdown.schg;
    const crypto = round(investmentBreakdown.bitcoin + investmentBreakdown.solana + investmentBreakdown.aave, 2);
    const cryptoBreakdown = {
      bitcoin: investmentBreakdown.bitcoin,
      solana: investmentBreakdown.solana,
      ethereum: 0,
      aave: investmentBreakdown.aave
    };
    const allocated = round(vehicleFund + investment, 2);
    return {
      plan,
      allocationBase: grossBase,
      allocationBasis: "gross",
      vehicleFund,
      investment,
      stock,
      crypto,
      investmentBreakdown,
      cryptoBreakdown,
      allocated
    };
  }

  function calculateNewPlan(base, planValue) {
    const plan = normalizeMoneyPlan(planValue);
    return plan.version >= 3 ? calculateVersion3Plan(base, plan) : calculateVersion2Plan(base, plan);
  }

  function calculateLegacyPlan(shift, positiveNet) {
    const rates = normalizeAllocationRates(shift.allocationRates, DEFAULT_SETTINGS);
    const storedInvestment = sourceNumberOrNull(shift.investment);
    const storedSavings = sourceNumberOrNull(shift.savings);
    const storedVehicle = sourceNumberOrNull(shift.vehicleFund);
    const investment = storedInvestment == null ? round(positiveNet * rates.investment / 100, 2) : Math.max(0, storedInvestment);
    const savings = storedSavings == null ? round(positiveNet * rates.savings / 100, 2) : Math.max(0, storedSavings);
    const vehicleFund = storedVehicle == null ? round(positiveNet * rates.vehicle / 100, 2) : Math.max(0, storedVehicle);
    const legacyInvestment = round(investment + savings, 2);
    const allocated = round(legacyInvestment + vehicleFund, 2);
    return { rates, investment, savings, vehicleFund, legacyInvestment, allocated };
  }

  function sourceNumberOrNull(value) {
    if (value == null || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function calculateShift(value, settingsValue) {
    const settings = normalizeSettings(settingsValue || DEFAULT_SETTINGS);
    const shift = normalizeShift(value, settings);
    const expenses = round(shift.fuel + shift.tolls + shift.otherExpenses, 2);
    const net = round(shift.gross - expenses, 2);
    const positiveNet = Math.max(0, net);
    const hours = round(durationHours(shift), 4);
    const miles = round(mileage(shift), 2);
    const isNewPlan = Boolean(shift.moneyPlanRates);
    const moneyPlanVersion = isNewPlan ? Math.max(2, Math.floor(safeNumber(shift.moneyPlanRates.version, shift.moneyPlanVersion))) : 0;
    const isGrossMoneyPlan = moneyPlanVersion >= 3;
    const activeMoneyPlan = normalizeMoneyPlan(settings.moneyPlan || DEFAULT_MONEY_PLAN);
    const isCurrentMoneyPlan = isGrossMoneyPlan && activeMoneyPlan.version >= 3
      && moneyPlanSignature(shift.moneyPlanRates) === moneyPlanSignature(activeMoneyPlan);
    const isPreviousMoneyPlan = moneyPlanVersion === 2;
    let vehicleFund = 0;
    let stock = 0;
    let crypto = 0;
    let cryptoBreakdown = { bitcoin: 0, solana: 0, ethereum: 0, aave: 0 };
    let investmentBreakdown = { bitcoin: 0, solana: 0, schg: 0, aave: 0 };
    let legacyInvestment = 0;
    let investment = 0;
    let savings = 0;
    let allocated = 0;
    let allocationBase = positiveNet;
    let allocationBasis = "historical";
    let plan = null;

    if (isNewPlan) {
      const result = calculateNewPlan(isGrossMoneyPlan ? shift.gross : positiveNet, shift.moneyPlanRates);
      plan = result.plan;
      allocationBase = result.allocationBase;
      allocationBasis = result.allocationBasis;
      vehicleFund = result.vehicleFund;
      stock = result.stock;
      crypto = result.crypto;
      cryptoBreakdown = result.cryptoBreakdown;
      investmentBreakdown = result.investmentBreakdown;
      allocated = result.allocated;
      investment = result.investment;
    } else {
      const legacy = calculateLegacyPlan(shift, positiveNet);
      vehicleFund = legacy.vehicleFund;
      legacyInvestment = legacy.legacyInvestment;
      investment = legacy.investment;
      savings = legacy.savings;
      allocated = legacy.allocated;
    }

    const takeOut = round(shift.fuel + allocated, 2);
    const spendable = round(net - allocated, 2);
    const rate = getMileageRate(shift.date, settings.taxRates).rate;

    return {
      ...shift,
      expenses,
      net,
      positiveNet,
      hours,
      miles,
      hourly: hours > 0 ? round(net / hours, 2) : 0,
      grossHourly: hours > 0 ? round(shift.gross / hours, 2) : 0,
      netPerMile: miles > 0 ? round(net / miles, 2) : 0,
      grossPerMile: miles > 0 ? round(shift.gross / miles, 2) : 0,
      vehicleFund,
      stock,
      crypto,
      cryptoBreakdown,
      investmentBreakdown,
      bitcoin: investmentBreakdown.bitcoin,
      solana: investmentBreakdown.solana,
      schg: investmentBreakdown.schg,
      ethereum: cryptoBreakdown.ethereum,
      aave: investmentBreakdown.aave,
      legacyInvestment,
      investment,
      savings,
      allocated,
      takeOut,
      spendable,
      moneyPlan: plan,
      moneyPlanVersion,
      isNewMoneyPlan: isNewPlan,
      isGrossMoneyPlan,
      isCurrentMoneyPlan,
      isPreviousMoneyPlan,
      allocationBase,
      allocationBasis,
      taxRate: rate,
      taxDeduction: round(miles * rate, 2)
    };
  }

  function summarizeShifts(values, settingsValue) {
    const list = Array.isArray(values) ? values.map((item) => calculateShift(item, settingsValue)) : [];
    const sum = (field) => round(list.reduce((total, item) => total + safeNumber(item[field]), 0), 2);
    const sumWhere = (predicate, field) => round(list.reduce((total, item) => predicate(item) ? total + safeNumber(item[field]) : total, 0), 2);
    const summary = {
      count: list.length,
      gross: sum("gross"),
      fuel: sum("fuel"),
      tolls: sum("tolls"),
      otherExpenses: sum("otherExpenses"),
      expenses: sum("expenses"),
      net: sum("net"),
      positiveNet: sum("positiveNet"),
      hours: round(list.reduce((total, item) => total + safeNumber(item.hours), 0), 2),
      miles: sum("miles"),
      trips: Math.round(list.reduce((total, item) => total + safeNumber(item.trips), 0)),
      vehicleFund: sum("vehicleFund"),
      investment: sum("investment"),
      savings: sum("savings"),
      stock: sum("stock"),
      crypto: sum("crypto"),
      bitcoin: sum("bitcoin"),
      solana: sum("solana"),
      schg: sum("schg"),
      ethereum: sum("ethereum"),
      aave: sum("aave"),
      legacyInvestment: sum("legacyInvestment"),
      allocated: sum("allocated"),
      takeOut: sum("takeOut"),
      spendable: sum("spendable"),
      taxDeduction: sum("taxDeduction"),
      currentPlanCount: list.filter((item) => item.isCurrentMoneyPlan).length,
      historicalPlanCount: list.filter((item) => !item.isCurrentMoneyPlan).length,
      currentGross: sumWhere((item) => item.isCurrentMoneyPlan, "gross"),
      currentVehicleFund: sumWhere((item) => item.isCurrentMoneyPlan, "vehicleFund"),
      currentInvestment: sumWhere((item) => item.isCurrentMoneyPlan, "investment"),
      currentBitcoin: sumWhere((item) => item.isCurrentMoneyPlan, "bitcoin"),
      currentSolana: sumWhere((item) => item.isCurrentMoneyPlan, "solana"),
      currentSchg: sumWhere((item) => item.isCurrentMoneyPlan, "schg"),
      currentAave: sumWhere((item) => item.isCurrentMoneyPlan, "aave"),
      currentAllocated: sumWhere((item) => item.isCurrentMoneyPlan, "allocated"),
      historicalVehicleFund: sumWhere((item) => !item.isCurrentMoneyPlan, "vehicleFund"),
      historicalInvestment: sumWhere((item) => !item.isCurrentMoneyPlan, "investment"),
      historicalSavings: sumWhere((item) => !item.isCurrentMoneyPlan, "savings"),
      historicalStock: sumWhere((item) => !item.isCurrentMoneyPlan, "stock"),
      historicalCrypto: sumWhere((item) => !item.isCurrentMoneyPlan, "crypto"),
      historicalEthereum: sumWhere((item) => !item.isCurrentMoneyPlan, "ethereum"),
      historicalAllocated: sumWhere((item) => !item.isCurrentMoneyPlan, "allocated")
    };
    summary.hourly = summary.hours > 0 ? round(summary.net / summary.hours, 2) : 0;
    summary.netPerMile = summary.miles > 0 ? round(summary.net / summary.miles, 2) : 0;
    summary.averageShift = summary.count ? round(summary.net / summary.count, 2) : 0;
    return summary;
  }

  function filterShiftsByDate(values, start, end) {
    const startTime = start instanceof Date ? startOfDay(start).getTime() : startOfDay(start || new Date(0)).getTime();
    const endTime = end instanceof Date ? endOfDay(end).getTime() : endOfDay(end || new Date(8640000000000000)).getTime();
    return (Array.isArray(values) ? values : []).filter((item) => {
      const date = parseISODate(item && item.date);
      const time = date ? date.getTime() : Number.NaN;
      return Number.isFinite(time) && time >= startTime && time <= endTime;
    });
  }

  function rangeForPeriod(period, anchorValue, weekStartsOn) {
    const anchor = anchorValue instanceof Date ? new Date(anchorValue) : new Date(anchorValue || Date.now());
    switch (period) {
      case "day":
        return { start: startOfDay(anchor), end: endOfDay(anchor) };
      case "week":
        return { start: startOfWeek(anchor, weekStartsOn), end: endOfWeek(anchor, weekStartsOn) };
      case "month":
        return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
      case "year":
        return { start: startOfYear(anchor), end: endOfYear(anchor) };
      case "all":
      default:
        return { start: new Date(1970, 0, 1), end: new Date(2999, 11, 31, 23, 59, 59, 999) };
    }
  }

  function groupShiftsByDate(values) {
    return (Array.isArray(values) ? values : []).reduce((groups, item) => {
      const date = parseISODate(item && item.date) ? String(item.date) : "";
      if (!date) return groups;
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
      return groups;
    }, {});
  }

  function activePausedMs(active, nowValue) {
    if (!active) return 0;
    let total = Math.max(0, safeNumber(active.pausedMs));
    if (active.pauseStartedAt) {
      const start = new Date(active.pauseStartedAt).getTime();
      const now = nowValue instanceof Date ? nowValue.getTime() : nowValue ? new Date(nowValue).getTime() : Date.now();
      if (Number.isFinite(start) && Number.isFinite(now) && now >= start) total += now - start;
    }
    return total;
  }

  function activeDurationMs(active, nowValue) {
    if (!active) return 0;
    const start = new Date(active.startedAt || inferStartedAt(active.date, active.startTime)).getTime();
    const now = nowValue instanceof Date ? nowValue.getTime() : nowValue ? new Date(nowValue).getTime() : Date.now();
    if (!Number.isFinite(start) || !Number.isFinite(now) || now < start) return 0;
    return Math.max(0, now - start - activePausedMs(active, now));
  }

  function finalizeActivePause(activeValue, nowValue) {
    const active = { ...(activeValue || {}) };
    if (!active.pauseStartedAt) return active;
    const now = nowValue instanceof Date ? nowValue : nowValue ? new Date(nowValue) : new Date();
    const start = new Date(active.pauseStartedAt);
    const milliseconds = Number.isFinite(start.getTime()) && now.getTime() >= start.getTime() ? now.getTime() - start.getTime() : 0;
    active.pausedMs = Math.max(0, safeNumber(active.pausedMs)) + milliseconds;
    active.pauseHistory = normalizePauseHistory(active.pauseHistory);
    active.pauseHistory.push({ start: active.pauseStartedAt, end: now.toISOString(), milliseconds });
    active.pauseStartedAt = "";
    return active;
  }

  function currentOdometer(shifts, maintenance, settingsValue) {
    const settings = normalizeSettings(settingsValue || DEFAULT_SETTINGS);
    const candidates = [settings.vehicle.currentOdometer];
    (Array.isArray(shifts) ? shifts : []).forEach((item) => {
      candidates.push(safeNumber(item && item.startOdometer), safeNumber(item && item.endOdometer), safeNumber(item && item.startMiles), safeNumber(item && item.endMiles));
    });
    (Array.isArray(maintenance) ? maintenance : []).forEach((item) => candidates.push(safeNumber(item && item.odometer)));
    return Math.max(0, ...candidates);
  }

  function goalSaved(goal) {
    return round((goal && Array.isArray(goal.contributions) ? goal.contributions : []).reduce((total, item) => total + Math.max(0, safeNumber(item && item.amount)), 0), 2);
  }

  return {
    APP_VERSION,
    STORAGE_KEY,
    LEGACY_MONEY_PLAN_V2,
    DEFAULT_MONEY_PLAN,
    DEFAULT_SETTINGS,
    safeNumber,
    clamp,
    round,
    pad,
    uid,
    localISODate,
    parseISODate,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    normalizeMoneyPlan,
    moneyPlanSignature,
    allocateMoneyByMix,
    normalizeSettings,
    normalizeActiveShift,
    normalizeShift,
    normalizeMaintenance,
    normalizeGoal,
    normalizeState,
    elapsedHoursFromTimes,
    inferStartedAt,
    durationHours,
    mileage,
    getMileageRate,
    calculateVersion2Plan,
    calculateVersion3Plan,
    calculateNewPlan,
    calculateShift,
    summarizeShifts,
    filterShiftsByDate,
    rangeForPeriod,
    groupShiftsByDate,
    activePausedMs,
    activeDurationMs,
    finalizeActivePause,
    currentOdometer,
    goalSaved
  };
});
