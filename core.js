(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.DriverCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const APP_VERSION = "3.2.0";

  const DEFAULT_TAX_RATES = Object.freeze([
    { id: "rate-2024", effective: "2024-01-01", rate: 0.67, label: "2024" },
    { id: "rate-2025", effective: "2025-01-01", rate: 0.70, label: "2025" },
    { id: "rate-2026-h1", effective: "2026-01-01", rate: 0.725, label: "2026 Jan–Jun" },
    { id: "rate-2026-h2", effective: "2026-07-01", rate: 0.76, label: "2026 Jul–Dec" }
  ]);

  const DEFAULT_SETTINGS = Object.freeze({
    theme: "dark",
    defaultPlatform: "Uber",
    weekStartsOn: 1,
    weeklyNetGoal: 0,
    monthlyNetGoal: 0,
    allocations: {
      investment: 10,
      savings: 10,
      vehicle: 5
    },
    taxRates: DEFAULT_TAX_RATES,
    vehicle: {
      name: "Primary vehicle",
      currentOdometer: 0,
      oilInterval: 5000,
      tireInterval: 7500
    },
    lastRoute: "overview"
  });

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function deepMerge(base, override) {
    const output = clone(base);
    if (!override || typeof override !== "object" || Array.isArray(override)) return output;
    Object.keys(override).forEach((key) => {
      const incoming = override[key];
      if (
        incoming &&
        typeof incoming === "object" &&
        !Array.isArray(incoming) &&
        output[key] &&
        typeof output[key] === "object" &&
        !Array.isArray(output[key])
      ) {
        output[key] = deepMerge(output[key], incoming);
      } else if (incoming !== undefined) {
        output[key] = clone(incoming);
      }
    });
    return output;
  }

  function safeNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : (fallback == null ? 0 : fallback);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, safeNumber(value)));
  }

  function round(value, digits) {
    const places = digits == null ? 2 : digits;
    const factor = 10 ** places;
    return Math.round((safeNumber(value) + Number.EPSILON) * factor) / factor;
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function localISODate(date) {
    const d = date instanceof Date ? date : new Date(date || Date.now());
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function parseISODate(value) {
    if (!value || typeof value !== "string") return null;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    // JavaScript treats years 0–99 as 1900–1999 in this constructor.
    if (year < 100) date.setFullYear(year);
    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) return null;
    return date;
  }

  function shiftDate(date, days) {
    const d = date instanceof Date ? new Date(date) : parseISODate(date) || new Date();
    d.setDate(d.getDate() + safeNumber(days));
    return d;
  }

  function startOfDay(date) {
    const d = date instanceof Date ? new Date(date) : parseISODate(date) || new Date(date || Date.now());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function endOfDay(date) {
    const d = startOfDay(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  function startOfWeek(date, weekStartsOn) {
    const startsOn = clamp(weekStartsOn == null ? 1 : weekStartsOn, 0, 6);
    const d = startOfDay(date || new Date());
    const delta = (d.getDay() - startsOn + 7) % 7;
    d.setDate(d.getDate() - delta);
    return d;
  }

  function endOfWeek(date, weekStartsOn) {
    const d = startOfWeek(date, weekStartsOn);
    d.setDate(d.getDate() + 6);
    return endOfDay(d);
  }

  function startOfMonth(date) {
    const d = date instanceof Date ? new Date(date) : parseISODate(date) || new Date(date || Date.now());
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  }

  function endOfMonth(date) {
    const d = date instanceof Date ? new Date(date) : parseISODate(date) || new Date(date || Date.now());
    return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  function startOfYear(date) {
    const d = date instanceof Date ? new Date(date) : parseISODate(date) || new Date(date || Date.now());
    return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
  }

  function endOfYear(date) {
    const d = date instanceof Date ? new Date(date) : parseISODate(date) || new Date(date || Date.now());
    return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  function timeToMinutes(value) {
    if (!value || typeof value !== "string") return null;
    const match = /^(\d{1,2}):(\d{2})/.exec(value);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  function durationHours(startTime, endTime, fallback) {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    if (start == null || end == null) return Math.max(0, safeNumber(fallback));
    let minutes = end - start;
    if (minutes < 0) minutes += 24 * 60;
    return round(minutes / 60, 4);
  }

  function uid(prefix) {
    const base = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    return `${prefix || "id"}_${base}`;
  }

  function normalizeAllocations(value) {
    const incoming = value || {};
    const allocations = {
      investment: clamp(incoming.investment, 0, 100),
      savings: clamp(incoming.savings, 0, 100),
      vehicle: clamp(incoming.vehicle, 0, 100)
    };
    const total = allocations.investment + allocations.savings + allocations.vehicle;
    if (total <= 100) return allocations;
    const scale = 100 / total;
    return {
      investment: round(allocations.investment * scale, 4),
      savings: round(allocations.savings * scale, 4),
      vehicle: round(allocations.vehicle * scale, 4)
    };
  }

  function normalizeTaxRates(value) {
    const list = Array.isArray(value) ? value : DEFAULT_TAX_RATES;
    const normalized = list
      .map((item, index) => ({
        id: String(item && item.id ? item.id : `rate_${index}_${Date.now()}`),
        effective: item && parseISODate(item.effective || "") ? item.effective : "2000-01-01",
        rate: Math.max(0, safeNumber(item && item.rate)),
        label: String(item && item.label ? item.label : "Custom rate")
      }))
      .filter((item) => item.rate > 0)
      .sort((a, b) => a.effective.localeCompare(b.effective));
    return normalized.length ? normalized : clone(DEFAULT_TAX_RATES);
  }

  function normalizeSettings(value) {
    const merged = deepMerge(DEFAULT_SETTINGS, value || {});
    merged.theme = merged.theme === "light" ? "light" : "dark";
    merged.defaultPlatform = String(merged.defaultPlatform || "Uber");
    merged.weekStartsOn = clamp(merged.weekStartsOn, 0, 6);
    merged.weeklyNetGoal = Math.max(0, safeNumber(merged.weeklyNetGoal));
    merged.monthlyNetGoal = Math.max(0, safeNumber(merged.monthlyNetGoal));
    merged.allocations = normalizeAllocations(merged.allocations);
    merged.taxRates = normalizeTaxRates(merged.taxRates);
    merged.vehicle = deepMerge(DEFAULT_SETTINGS.vehicle, merged.vehicle || {});
    merged.vehicle.name = String(merged.vehicle.name || "Primary vehicle");
    merged.vehicle.currentOdometer = Math.max(0, safeNumber(merged.vehicle.currentOdometer));
    merged.vehicle.oilInterval = Math.max(0, safeNumber(merged.vehicle.oilInterval, 5000));
    merged.vehicle.tireInterval = Math.max(0, safeNumber(merged.vehicle.tireInterval, 7500));
    merged.lastRoute = String(merged.lastRoute || "overview");
    return merged;
  }

  function getMileageRate(date, rates) {
    const parsed = typeof date === "string" ? parseISODate(date) : (date instanceof Date && !Number.isNaN(date.getTime()) ? date : null);
    const iso = localISODate(parsed || new Date());
    const schedule = normalizeTaxRates(rates);
    let selected = schedule[0];
    schedule.forEach((item) => {
      if (item.effective <= iso) selected = item;
    });
    return selected || { rate: 0, effective: "", label: "" };
  }

  function deriveAllocationRates(raw, settings, net) {
    if (raw && raw.allocationRates) return normalizeAllocations(raw.allocationRates);
    const positiveNet = Math.max(0, safeNumber(net != null ? net : raw && raw.net));
    if (positiveNet > 0 && raw) {
      const legacyInvestment = safeNumber(raw.investment != null ? raw.investment : raw.investmentAmount);
      const legacySavings = safeNumber(raw.savings != null ? raw.savings : raw.savingsAmount);
      const legacyVehicle = safeNumber(raw.vehicleFund != null ? raw.vehicleFund : raw.vehicleAmount);
      if (legacyInvestment || legacySavings || legacyVehicle) {
        return normalizeAllocations({
          investment: (legacyInvestment / positiveNet) * 100,
          savings: (legacySavings / positiveNet) * 100,
          vehicle: (legacyVehicle / positiveNet) * 100
        });
      }
    }
    return normalizeAllocations((settings || DEFAULT_SETTINGS).allocations);
  }

  function normalizeShift(raw, settings) {
    const source = raw || {};
    const normalizedSettings = normalizeSettings(settings);
    const startOdometer = Math.max(0, safeNumber(
      source.startOdometer != null ? source.startOdometer : source.startMiles
    ));
    const endOdometer = Math.max(0, safeNumber(
      source.endOdometer != null ? source.endOdometer : source.endMiles
    ));
    const odometerMiles = endOdometer >= startOdometer && (endOdometer || startOdometer)
      ? endOdometer - startOdometer
      : 0;
    const manualMiles = Math.max(0, safeNumber(
      source.manualMiles != null
        ? source.manualMiles
        : source.businessMiles != null
          ? source.businessMiles
          : (odometerMiles ? 0 : source.miles)
    ));
    const fuel = Math.max(0, safeNumber(source.fuel != null ? source.fuel : source.gas));
    const tolls = Math.max(0, safeNumber(source.tolls));
    const otherExpenses = Math.max(0, safeNumber(source.otherExpenses));
    const gross = Math.max(0, safeNumber(source.gross != null ? source.gross : source.earnings));
    const net = gross - fuel - tolls - otherExpenses;
    const allocationRates = deriveAllocationRates(source, normalizedSettings, net);
    const date = parseISODate(source.date || "") ? source.date : localISODate();

    return {
      id: String(source.id || uid("shift")),
      date,
      platform: String(source.platform || normalizedSettings.defaultPlatform || "Uber"),
      startTime: String(source.startTime || source.clockInTime || ""),
      endTime: String(source.endTime || source.clockOutTime || ""),
      gross,
      fuel,
      tolls,
      otherExpenses,
      startOdometer,
      endOdometer,
      manualMiles,
      manualHours: Math.max(0, safeNumber(source.manualHours != null ? source.manualHours : source.hours)),
      trips: Math.max(0, Math.round(safeNumber(source.trips))),
      notes: String(source.notes || source.note || ""),
      allocationRates,
      createdAt: String(source.createdAt || `${date}T12:00:00`),
      updatedAt: String(source.updatedAt || source.createdAt || `${date}T12:00:00`)
    };
  }

  function calculateShift(raw, settings) {
    const normalizedSettings = normalizeSettings(settings);
    const shift = normalizeShift(raw, normalizedSettings);
    const odometerMiles = shift.endOdometer >= shift.startOdometer && (shift.endOdometer || shift.startOdometer)
      ? shift.endOdometer - shift.startOdometer
      : 0;
    const miles = Math.max(0, odometerMiles || shift.manualMiles);
    const hours = durationHours(shift.startTime, shift.endTime, shift.manualHours);
    const expenses = shift.fuel + shift.tolls + shift.otherExpenses;
    const net = shift.gross - expenses;
    const allocatable = Math.max(0, net);
    const rates = normalizeAllocations(shift.allocationRates);
    const investment = allocatable * (rates.investment / 100);
    const savings = allocatable * (rates.savings / 100);
    const vehicleFund = allocatable * (rates.vehicle / 100);
    const spendable = net - investment - savings - vehicleFund;
    const rate = getMileageRate(shift.date, normalizedSettings.taxRates);
    const taxDeduction = miles * rate.rate;

    return {
      ...shift,
      miles: round(miles, 2),
      hours: round(hours, 4),
      expenses: round(expenses, 2),
      net: round(net, 2),
      investment: round(investment, 2),
      savings: round(savings, 2),
      vehicleFund: round(vehicleFund, 2),
      spendable: round(spendable, 2),
      hourly: hours > 0 ? round(net / hours, 2) : 0,
      grossHourly: hours > 0 ? round(shift.gross / hours, 2) : 0,
      netPerMile: miles > 0 ? round(net / miles, 2) : 0,
      grossPerMile: miles > 0 ? round(shift.gross / miles, 2) : 0,
      perTrip: shift.trips > 0 ? round(net / shift.trips, 2) : 0,
      taxDeduction: round(taxDeduction, 2),
      taxRate: rate.rate,
      taxRateLabel: rate.label,
      allocationRates: rates
    };
  }

  function summarizeShifts(shifts, settings) {
    const summary = {
      count: 0,
      gross: 0,
      fuel: 0,
      tolls: 0,
      otherExpenses: 0,
      expenses: 0,
      net: 0,
      hours: 0,
      miles: 0,
      trips: 0,
      investment: 0,
      savings: 0,
      vehicleFund: 0,
      spendable: 0,
      taxDeduction: 0,
      hourly: 0,
      grossHourly: 0,
      netPerMile: 0,
      averageShift: 0,
      averageMiles: 0
    };

    (Array.isArray(shifts) ? shifts : []).forEach((item) => {
      const shift = calculateShift(item, settings);
      summary.count += 1;
      [
        "gross", "fuel", "tolls", "otherExpenses", "expenses", "net", "hours", "miles",
        "trips", "investment", "savings", "vehicleFund", "spendable", "taxDeduction"
      ].forEach((key) => { summary[key] += safeNumber(shift[key]); });
    });

    summary.hourly = summary.hours > 0 ? summary.net / summary.hours : 0;
    summary.grossHourly = summary.hours > 0 ? summary.gross / summary.hours : 0;
    summary.netPerMile = summary.miles > 0 ? summary.net / summary.miles : 0;
    summary.averageShift = summary.count > 0 ? summary.net / summary.count : 0;
    summary.averageMiles = summary.count > 0 ? summary.miles / summary.count : 0;
    Object.keys(summary).forEach((key) => {
      if (typeof summary[key] === "number") summary[key] = round(summary[key], key === "hours" ? 4 : 2);
    });
    return summary;
  }

  function normalizeMaintenance(raw) {
    const source = raw || {};
    const date = parseISODate(source.date || "") ? source.date : localISODate();
    return {
      id: String(source.id || uid("maintenance")),
      date,
      type: String(source.type || "Other"),
      amount: Math.max(0, safeNumber(source.amount)),
      odometer: Math.max(0, safeNumber(source.odometer)),
      nextDueOdometer: Math.max(0, safeNumber(source.nextDueOdometer)),
      note: String(source.note || source.notes || ""),
      createdAt: String(source.createdAt || `${date}T12:00:00`),
      updatedAt: String(source.updatedAt || source.createdAt || `${date}T12:00:00`)
    };
  }

  function normalizeGoal(raw) {
    const source = raw || {};
    const target = Math.max(0, safeNumber(source.target != null ? source.target : source.amount));
    let contributions = Array.isArray(source.contributions)
      ? source.contributions.map((item) => ({
          id: String(item.id || uid("contribution")),
          date: parseISODate(item.date || "") ? item.date : localISODate(),
          amount: Math.max(0, safeNumber(item.amount)),
          note: String(item.note || "")
        })).filter((item) => item.amount > 0)
      : [];
    const legacySaved = Math.max(0, safeNumber(source.saved));
    if (!contributions.length && legacySaved > 0) {
      contributions = [{
        id: uid("contribution"),
        date: parseISODate(source.createdDate || "") ? source.createdDate : localISODate(),
        amount: legacySaved,
        note: "Opening balance"
      }];
    }
    return {
      id: String(source.id || uid("goal")),
      name: String(source.name || "Untitled goal"),
      target,
      targetDate: parseISODate(source.targetDate || "") ? source.targetDate : "",
      note: String(source.note || ""),
      archived: Boolean(source.archived),
      contributions,
      createdAt: String(source.createdAt || new Date().toISOString()),
      updatedAt: String(source.updatedAt || source.createdAt || new Date().toISOString())
    };
  }

  function goalSaved(goal) {
    return round((goal && Array.isArray(goal.contributions) ? goal.contributions : []).reduce(
      (total, contribution) => total + Math.max(0, safeNumber(contribution.amount)),
      0
    ), 2);
  }

  function dateWithin(date, start, end) {
    const parsed = parseISODate(date);
    if (!parsed) return false;
    const time = parsed.getTime();
    return (!start || time >= start.getTime()) && (!end || time <= end.getTime());
  }

  function filterShiftsByDate(shifts, start, end) {
    return (Array.isArray(shifts) ? shifts : []).filter((shift) => dateWithin(shift.date, start, end));
  }

  function rangeForPeriod(period, anchor, weekStartsOn) {
    const base = anchor instanceof Date ? new Date(anchor) : parseISODate(anchor) || new Date(anchor || Date.now());
    switch (period) {
      case "week":
        return { start: startOfWeek(base, weekStartsOn), end: endOfWeek(base, weekStartsOn) };
      case "month":
        return { start: startOfMonth(base), end: endOfMonth(base) };
      case "year":
        return { start: startOfYear(base), end: endOfYear(base) };
      case "7": {
        const end = endOfDay(base);
        const start = startOfDay(base);
        start.setDate(start.getDate() - 6);
        return { start, end };
      }
      case "30": {
        const end = endOfDay(base);
        const start = startOfDay(base);
        start.setDate(start.getDate() - 29);
        return { start, end };
      }
      default:
        return { start: null, end: null };
    }
  }

  function previousRange(period, anchor, weekStartsOn) {
    const current = rangeForPeriod(period, anchor, weekStartsOn);
    if (!current.start || !current.end) return { start: null, end: null };
    const duration = current.end.getTime() - current.start.getTime() + 1;
    const end = new Date(current.start.getTime() - 1);
    const start = new Date(end.getTime() - duration + 1);
    return { start, end };
  }

  function groupShiftsByDate(shifts, settings) {
    const map = {};
    (Array.isArray(shifts) ? shifts : []).forEach((raw) => {
      const shift = calculateShift(raw, settings);
      if (!map[shift.date]) map[shift.date] = [];
      map[shift.date].push(shift);
    });
    return map;
  }

  function groupNetByWeekday(shifts, settings) {
    const output = Array.from({ length: 7 }, (_, index) => ({
      day: index,
      count: 0,
      net: 0,
      hours: 0,
      miles: 0,
      averageNet: 0,
      averageHourly: 0
    }));
    (Array.isArray(shifts) ? shifts : []).forEach((raw) => {
      const shift = calculateShift(raw, settings);
      const date = parseISODate(shift.date);
      if (!date) return;
      const bucket = output[date.getDay()];
      bucket.count += 1;
      bucket.net += shift.net;
      bucket.hours += shift.hours;
      bucket.miles += shift.miles;
    });
    output.forEach((bucket) => {
      bucket.averageNet = bucket.count ? round(bucket.net / bucket.count, 2) : 0;
      bucket.averageHourly = bucket.hours ? round(bucket.net / bucket.hours, 2) : 0;
      bucket.net = round(bucket.net, 2);
      bucket.hours = round(bucket.hours, 2);
      bucket.miles = round(bucket.miles, 2);
    });
    return output;
  }

  function comparePercent(current, previous) {
    const now = safeNumber(current);
    const before = safeNumber(previous);
    if (before === 0) return now === 0 ? 0 : null;
    return round(((now - before) / Math.abs(before)) * 100, 1);
  }

  function monthlyProjection(shifts, settings, anchor) {
    const now = anchor instanceof Date ? new Date(anchor) : parseISODate(anchor) || new Date(anchor || Date.now());
    const monthRange = rangeForPeriod("month", now, settings && settings.weekStartsOn);
    const list = filterShiftsByDate(shifts, monthRange.start, monthRange.end);
    const summary = summarizeShifts(list, settings);
    const isCurrentMonth = now.getFullYear() === new Date().getFullYear() && now.getMonth() === new Date().getMonth();
    const elapsedDays = isCurrentMonth ? Math.max(1, new Date().getDate()) : Math.max(1, now.getDate());
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projected = summary.net / elapsedDays * daysInMonth;
    return {
      current: summary.net,
      projected: round(projected, 2),
      goal: Math.max(0, safeNumber(settings && settings.monthlyNetGoal)),
      daysInMonth,
      elapsedDays
    };
  }

  function currentOdometer(shifts, maintenance, settings) {
    let value = Math.max(0, safeNumber(settings && settings.vehicle && settings.vehicle.currentOdometer));
    (Array.isArray(shifts) ? shifts : []).forEach((shift) => {
      value = Math.max(value, safeNumber(shift.endOdometer), safeNumber(shift.endMiles));
    });
    (Array.isArray(maintenance) ? maintenance : []).forEach((item) => {
      value = Math.max(value, safeNumber(item.odometer));
    });
    return round(value, 1);
  }

  function toLegacyShift(raw, settings) {
    const shift = calculateShift(raw, settings);
    return {
      id: shift.id,
      date: shift.date,
      platform: shift.platform,
      startTime: shift.startTime,
      endTime: shift.endTime,
      startMiles: shift.startOdometer,
      endMiles: shift.endOdometer,
      miles: shift.miles,
      gross: shift.gross,
      gas: shift.fuel,
      net: shift.net,
      hours: shift.hours,
      hourly: shift.hourly,
      grossMile: shift.grossPerMile,
      netMile: shift.netPerMile,
      investment: shift.investment,
      savings: shift.savings,
      vehicleFund: shift.vehicleFund,
      available: shift.spendable,
      deduction: shift.taxDeduction,
      notes: shift.notes,
      trips: shift.trips,
      tolls: shift.tolls,
      otherExpenses: shift.otherExpenses,
      allocationRates: shift.allocationRates,
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt
    };
  }

  return {
    APP_VERSION,
    DEFAULT_SETTINGS,
    DEFAULT_TAX_RATES,
    clone,
    deepMerge,
    safeNumber,
    clamp,
    round,
    pad,
    localISODate,
    parseISODate,
    shiftDate,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    timeToMinutes,
    durationHours,
    uid,
    normalizeAllocations,
    normalizeTaxRates,
    normalizeSettings,
    getMileageRate,
    normalizeShift,
    calculateShift,
    summarizeShifts,
    normalizeMaintenance,
    normalizeGoal,
    goalSaved,
    dateWithin,
    filterShiftsByDate,
    rangeForPeriod,
    previousRange,
    groupShiftsByDate,
    groupNetByWeekday,
    comparePercent,
    monthlyProjection,
    currentOdometer,
    toLegacyShift
  };
});
