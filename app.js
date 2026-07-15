(function () {
  "use strict";

  const Core = window.DriverCore;
  if (!Core) {
    document.body.innerHTML = "<p style='padding:24px;font-family:sans-serif'>The dashboard could not load its core module.</p>";
    return;
  }

  const STORAGE_KEY = "uberDriverDashboard.v3";
  const LEGACY_KEYS = {
    shifts: "uberEntries",
    maintenance: "uberMaintenance",
    goals: "uberSpendingGoals",
    activeDraft: "activeShiftDraft",
    clockIn: "clockInTime",
    clockOut: "clockOutTime"
  };

  const ROUTES = ["overview", "shifts", "analytics", "calendar", "vehicle", "goals", "settings"];

  const PAGE_META = {
    overview: {
      eyebrow: "Command center",
      title: "Overview",
      subtitle: "Your earnings, efficiency, goals, and current shift in one place."
    },
    shifts: {
      eyebrow: "Operations",
      title: "Shift ledger",
      subtitle: "Search, filter, edit, duplicate, export, and safely manage every shift."
    },
    analytics: {
      eyebrow: "Performance",
      title: "Analytics",
      subtitle: "See the patterns behind your net earnings, time, mileage, and allocations."
    },
    calendar: {
      eyebrow: "Planning",
      title: "Calendar",
      subtitle: "Review your driving rhythm and open any day for a complete breakdown."
    },
    vehicle: {
      eyebrow: "Vehicle",
      title: "Vehicle center",
      subtitle: "Track your maintenance fund, service history, odometer, and upcoming work."
    },
    goals: {
      eyebrow: "Planning",
      title: "Goals",
      subtitle: "Turn spendable driving income into clear, funded targets."
    },
    settings: {
      eyebrow: "System",
      title: "Settings & data",
      subtitle: "Control allocations, mileage rates, vehicle defaults, backups, and appearance."
    }
  };

  const NAV_ITEMS = [
    { route: "overview", label: "Overview", icon: "overview", section: "Command" },
    { route: "shifts", label: "Shifts", icon: "shifts" },
    { route: "analytics", label: "Analytics", icon: "analytics" },
    { route: "calendar", label: "Calendar", icon: "calendar" },
    { route: "vehicle", label: "Vehicle", icon: "vehicle", section: "Planning" },
    { route: "goals", label: "Goals", icon: "goal" },
    { route: "settings", label: "Settings & data", icon: "settings" }
  ];

  const MOBILE_NAV_ITEMS = [
    { route: "overview", label: "Home", icon: "overview" },
    { route: "shifts", label: "Shifts", icon: "shifts" },
    { route: "analytics", label: "Analytics", icon: "analytics" },
    { route: "calendar", label: "Calendar", icon: "calendar" },
    { route: "more", label: "More", icon: "more" }
  ];

  const MAINTENANCE_TYPES = [
    "Oil Change",
    "Tire Rotation",
    "Tires",
    "Brakes",
    "Car Wash",
    "Inspection",
    "Registration",
    "Repair",
    "Other"
  ];

  const PLATFORM_OPTIONS = ["Uber", "Lyft", "Uber + Lyft", "DoorDash", "Other"];

  const ICONS = {
    overview: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    shifts: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    analytics: '<path d="M4 19V9M10 19V5M16 19v-7M22 19V2"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/>',
    vehicle: '<path d="M5 17h14l2-6-3-5H6l-3 5 2 6Z"/><path d="M7 17v2M17 17v2M6 11h12"/><circle cx="7.5" cy="14" r="1"/><circle cx="16.5" cy="14" r="1"/>',
    goal: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><path d="m16 8 5-5M17 3h4v4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a7.8 7.8 0 0 0 .1-6l2-1.5-2-3.4-2.4 1a8 8 0 0 0-5.2-3L11.5 0h-4l-.4 2.1a8 8 0 0 0-5.2 3l-2.4-1-2 3.4L.5 9a7.8 7.8 0 0 0 .1 6l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 5.2 3l.4 2.1h4l.4-2.1a8 8 0 0 0 5.2-3l2.4 1 2-3.4-2-1.5Z" transform="translate(2.5 0) scale(.78)"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    dollar: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/>',
    route: '<path d="M5 19c0-4 5-4 5-8s-5-4-5-8M19 5c0 4-5 4-5 8s5 4 5 8"/><circle cx="5" cy="3" r="1.5"/><circle cx="19" cy="21" r="1.5"/>',
    trend: '<path d="m3 17 6-6 4 4 8-10"/><path d="M15 5h6v6"/>',
    fuel: '<path d="M5 21V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17M7 8h8"/><path d="M17 7h2l2 3v8a2 2 0 0 1-2 2h-2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    more: '<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    warning: '<path d="M10.3 3.2 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0Z"/><path d="M12 8v4M12 16h.01"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5 5L4 17v3h3l5.7-5.7a4 4 0 0 0 5-5l-3 3-3-3 3-3Z"/>',
    wallet: '<path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12"/><path d="M16 11h6v4h-6a2 2 0 0 1 0-4Z"/>',
    tax: '<path d="M5 3h14v18H5zM8 7h8M8 11h3M13 11h3M8 15h3M13 15h3"/>',
    arrowUp: '<path d="m6 15 6-6 6 6"/>',
    arrowDown: '<path d="m6 9 6 6 6-6"/>',
    spark: '<path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
    receipt: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
    refresh: '<path d="M20 11a8 8 0 1 0 2 5"/><path d="M20 4v7h-7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    file: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    archive: '<rect x="3" y="5" width="18" height="4" rx="1"/><path d="M5 9v11h14V9M10 13h4"/>',
    contribution: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/>',
    car: '<path d="M5 16h14l2-5-3-5H6l-3 5 2 5Z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    calendarAdd: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18M12 12v6M9 15h6"/>'
  };

  function icon(name, className) {
    return `<svg class="${className || "icon"}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
  }

  const dom = {
    main: document.getElementById("mainContent"),
    sidebarNav: document.getElementById("sidebarNav"),
    mobileNav: document.getElementById("mobileNav"),
    pageEyebrow: document.getElementById("pageEyebrow"),
    pageTitle: document.getElementById("pageTitle"),
    pageSubtitle: document.getElementById("pageSubtitle"),
    modalRoot: document.getElementById("modalRoot"),
    toastRoot: document.getElementById("toastRoot"),
    themeToggle: document.getElementById("themeToggle"),
    versionLabel: document.getElementById("versionLabel"),
    topbarAddIcon: document.getElementById("topbarAddIcon"),
    connectionPill: document.getElementById("connectionPill"),
    importFileInput: document.getElementById("importFileInput")
  };

  let state = loadState();
  const ui = {
    route: initialRoute(),
    analyticsPeriod: "month",
    shiftFilters: {
      search: "",
      range: "30",
      platform: "all",
      sort: "dateDesc"
    },
    selectedShiftIds: new Set(),
    vehicleFilters: {
      search: "",
      type: "all"
    },
    calendarCursor: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    calendarSelected: Core.localISODate(),
    modal: null,
    pendingImport: null,
    pendingImportFilename: "",
    toastCounter: 0
  };

  let liveTimer = null;
  let filterInputTimer = null;
  let modalReturnFocus = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#039;",
      '"': "&quot;"
    })[char]);
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function formatMoney(value, options) {
    const opts = options || {};
    const number = Core.safeNumber(value);
    if (opts.compact && Math.abs(number) >= 1000) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1
      }).format(number);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: opts.noCents ? 0 : 2,
      maximumFractionDigits: opts.noCents ? 0 : 2
    }).format(number);
  }

  function formatNumber(value, digits) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: digits == null ? 0 : digits,
      maximumFractionDigits: digits == null ? 0 : digits
    }).format(Core.safeNumber(value));
  }

  function formatDate(value, options) {
    const date = Core.parseISODate(value);
    if (!date) return "—";
    return new Intl.DateTimeFormat("en-US", options || {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function formatShortDate(value) {
    return formatDate(value, { month: "short", day: "numeric" });
  }

  function formatWeekday(value, short) {
    return formatDate(value, { weekday: short ? "short" : "long" });
  }

  function formatTime(value) {
    if (!value) return "—";
    const match = /^(\d{1,2}):(\d{2})/.exec(value);
    if (!match) return value;
    const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  }

  function currentTimeValue() {
    const now = new Date();
    return `${Core.pad(now.getHours())}:${Core.pad(now.getMinutes())}`;
  }

  function formatDuration(hours, includeSeconds) {
    const totalSeconds = Math.max(0, Math.floor(Core.safeNumber(hours) * 3600));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (includeSeconds) return `${Core.pad(h)}:${Core.pad(m)}:${Core.pad(s)}`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  function activeDurationHours() {
    if (!state.activeShift || !state.activeShift.date || !state.activeShift.startTime) return 0;
    const start = new Date(`${state.activeShift.date}T${state.activeShift.startTime}:00`);
    if (Number.isNaN(start.getTime())) return 0;
    return Math.max(0, (Date.now() - start.getTime()) / 3600000);
  }

  function sortedShifts(list) {
    return (list || state.shifts).slice().sort((a, b) => {
      const dateCompare = String(b.date).localeCompare(String(a.date));
      if (dateCompare) return dateCompare;
      return String(b.startTime || "").localeCompare(String(a.startTime || ""));
    });
  }

  function getShift(id) {
    return state.shifts.find((shift) => String(shift.id) === String(id));
  }

  function getMaintenance(id) {
    return state.maintenance.find((item) => String(item.id) === String(id));
  }

  function getGoal(id) {
    return state.goals.find((goal) => String(goal.id) === String(id));
  }

  function parseStored(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function loadState() {
    const stored = parseStored(STORAGE_KEY, null);
    if (stored && typeof stored === "object") {
      const settings = Core.normalizeSettings(stored.settings);
      return {
        version: Core.APP_VERSION,
        shifts: Array.isArray(stored.shifts) ? stored.shifts.map((item) => Core.normalizeShift(item, settings)) : [],
        maintenance: Array.isArray(stored.maintenance) ? stored.maintenance.map(Core.normalizeMaintenance) : [],
        goals: Array.isArray(stored.goals) ? stored.goals.map(Core.normalizeGoal) : [],
        settings,
        activeShift: stored.activeShift ? Core.normalizeShift(stored.activeShift, settings) : null
      };
    }

    const legacyShifts = parseStored(LEGACY_KEYS.shifts, []);
    const legacyMaintenance = parseStored(LEGACY_KEYS.maintenance, []);
    const legacyGoals = parseStored(LEGACY_KEYS.goals, []);
    const legacyDraft = parseStored(LEGACY_KEYS.activeDraft, null);

    const settings = Core.normalizeSettings({
      theme: localStorage.getItem("dashboardTheme") || "dark",
      allocations: {
        investment: Core.safeNumber(localStorage.getItem("investmentPct"), 10),
        savings: Core.safeNumber(localStorage.getItem("savingsPct"), 10),
        vehicle: Core.safeNumber(localStorage.getItem("vehiclePct"), 5)
      },
      monthlyNetGoal: Core.safeNumber(localStorage.getItem("monthlyNetGoal"), 0)
    });

    let activeShift = null;
    const legacyClockIn = localStorage.getItem(LEGACY_KEYS.clockIn) || (legacyDraft && (legacyDraft.clockInTime || legacyDraft.manualClockIn));
    const legacyClockOut = localStorage.getItem(LEGACY_KEYS.clockOut) || (legacyDraft && (legacyDraft.clockOutTime || legacyDraft.manualClockOut));
    if (legacyClockIn && !legacyClockOut) {
      activeShift = Core.normalizeShift({
        id: Core.uid("active"),
        date: (legacyDraft && legacyDraft.date) || Core.localISODate(),
        platform: (legacyDraft && legacyDraft.platform) || settings.defaultPlatform,
        startTime: legacyClockIn,
        gross: legacyDraft && legacyDraft.gross,
        fuel: legacyDraft && legacyDraft.gas,
        startOdometer: legacyDraft && legacyDraft.startMiles,
        endOdometer: legacyDraft && legacyDraft.endMiles,
        notes: legacyDraft && legacyDraft.notes,
        allocationRates: settings.allocations,
        createdAt: new Date().toISOString()
      }, settings);
    }

    return {
      version: Core.APP_VERSION,
      shifts: Array.isArray(legacyShifts) ? legacyShifts.map((item) => Core.normalizeShift(item, settings)) : [],
      maintenance: Array.isArray(legacyMaintenance) ? legacyMaintenance.map(Core.normalizeMaintenance) : [],
      goals: Array.isArray(legacyGoals) ? legacyGoals.map(Core.normalizeGoal) : [],
      settings,
      activeShift
    };
  }

  function serializeState() {
    return {
      version: Core.APP_VERSION,
      exportedAt: new Date().toISOString(),
      shifts: state.shifts,
      maintenance: state.maintenance,
      goals: state.goals,
      settings: state.settings,
      activeShift: state.activeShift
    };
  }

  function saveState(options) {
    const opts = options || {};
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState()));
      localStorage.setItem(LEGACY_KEYS.shifts, JSON.stringify(state.shifts.map((shift) => Core.toLegacyShift(shift, state.settings))));
      localStorage.setItem(LEGACY_KEYS.maintenance, JSON.stringify(state.maintenance));
      localStorage.setItem(LEGACY_KEYS.goals, JSON.stringify(state.goals.map((goal) => ({
        id: goal.id,
        name: goal.name,
        amount: goal.target,
        saved: Core.goalSaved(goal),
        targetDate: goal.targetDate,
        note: goal.note,
        archived: goal.archived,
        contributions: goal.contributions
      }))));
      localStorage.setItem("investmentPct", String(state.settings.allocations.investment));
      localStorage.setItem("savingsPct", String(state.settings.allocations.savings));
      localStorage.setItem("vehiclePct", String(state.settings.allocations.vehicle));
      localStorage.setItem("monthlyNetGoal", String(state.settings.monthlyNetGoal || ""));
      localStorage.setItem("dashboardTheme", state.settings.theme);

      if (state.activeShift) {
        localStorage.setItem(LEGACY_KEYS.clockIn, state.activeShift.startTime || "");
        localStorage.removeItem(LEGACY_KEYS.clockOut);
        localStorage.setItem(LEGACY_KEYS.activeDraft, JSON.stringify({
          date: state.activeShift.date,
          platform: state.activeShift.platform,
          manualClockIn: state.activeShift.startTime,
          manualClockOut: "",
          gross: state.activeShift.gross,
          gas: state.activeShift.fuel,
          startMiles: state.activeShift.startOdometer,
          endMiles: state.activeShift.endOdometer,
          notes: state.activeShift.notes,
          clockInTime: state.activeShift.startTime,
          savedAt: new Date().toISOString()
        }));
      } else {
        localStorage.removeItem(LEGACY_KEYS.clockIn);
        localStorage.removeItem(LEGACY_KEYS.clockOut);
        localStorage.removeItem(LEGACY_KEYS.activeDraft);
      }
      return true;
    } catch (error) {
      if (!opts.silent) showToast("Your browser could not save the latest change.", "error");
      return false;
    }
  }

  function initialRoute() {
    const hash = window.location.hash.replace("#", "");
    if (ROUTES.includes(hash)) return hash;
    const stored = state && state.settings && state.settings.lastRoute;
    return ROUTES.includes(stored) ? stored : "overview";
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.settings.theme;
    const themeIcon = state.settings.theme === "dark" ? "sun" : "moon";
    dom.themeToggle.innerHTML = icon(themeIcon);
    dom.themeToggle.setAttribute("aria-label", state.settings.theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", state.settings.theme === "dark" ? "#080a0b" : "#f3f6f4");
  }

  function renderNavigation() {
    let section = "";
    dom.sidebarNav.innerHTML = NAV_ITEMS.map((item) => {
      const sectionMarkup = item.section && item.section !== section
        ? `<div class="nav-section-label">${escapeHtml(item.section)}</div>`
        : "";
      if (item.section) section = item.section;
      const active = ui.route === item.route;
      const liveBadge = item.route === "shifts" && state.activeShift ? '<span class="nav-badge">LIVE</span>' : "";
      return `${sectionMarkup}<button class="nav-item${active ? " is-active" : ""}" type="button" data-route="${item.route}">
        ${icon(item.icon)}<span>${escapeHtml(item.label)}</span>${liveBadge}
      </button>`;
    }).join("");

    const routeIsMore = ["vehicle", "goals", "settings"].includes(ui.route);
    dom.mobileNav.innerHTML = MOBILE_NAV_ITEMS.map((item) => {
      const active = item.route === "more" ? routeIsMore : ui.route === item.route;
      const attrs = item.route === "more" ? 'data-action="open-more"' : `data-route="${item.route}"`;
      return `<button class="mobile-nav-item${active ? " is-active" : ""}" type="button" ${attrs}>
        ${icon(item.icon)}<span>${escapeHtml(item.label)}</span>
      </button>`;
    }).join("");
  }

  function renderHeader() {
    const meta = PAGE_META[ui.route] || PAGE_META.overview;
    dom.pageEyebrow.textContent = meta.eyebrow;
    dom.pageTitle.textContent = meta.title;
    dom.pageSubtitle.textContent = meta.subtitle;
    document.title = `${meta.title} · Driver Command`;
  }

  function setRoute(route, options) {
    if (!ROUTES.includes(route)) route = "overview";
    const opts = options || {};
    ui.route = route;
    state.settings.lastRoute = route;
    if (window.location.hash !== `#${route}`) history.replaceState(null, "", `#${route}`);
    saveState({ silent: true });
    closeModal(false);
    renderApp();
    if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: "smooth" });
    if (opts.focus !== false) dom.main.focus({ preventScroll: true });
  }

  function renderApp() {
    applyTheme();
    renderNavigation();
    renderHeader();
    renderCurrentRoute();
    updateConnectionStatus();
    updateLiveElements();
  }

  function renderCurrentRoute() {
    switch (ui.route) {
      case "shifts":
        dom.main.innerHTML = renderShiftsPage();
        updateShiftResults();
        break;
      case "analytics":
        dom.main.innerHTML = renderAnalyticsPage();
        break;
      case "calendar":
        dom.main.innerHTML = renderCalendarPage();
        break;
      case "vehicle":
        dom.main.innerHTML = renderVehiclePage();
        updateVehicleResults();
        break;
      case "goals":
        dom.main.innerHTML = renderGoalsPage();
        break;
      case "settings":
        dom.main.innerHTML = renderSettingsPage();
        updateAllocationTotal();
        break;
      case "overview":
      default:
        dom.main.innerHTML = renderOverviewPage();
        break;
    }
  }

  function updateConnectionStatus() {
    if (!dom.connectionPill) return;
    const online = navigator.onLine;
    dom.connectionPill.classList.toggle("is-offline", !online);
    dom.connectionPill.innerHTML = `<span></span><b>${online ? "Local" : "Offline"}</b>`;
    dom.connectionPill.title = online
      ? "Data is stored locally; internet connection available"
      : "Offline mode; your local dashboard remains available";
  }

  function showToast(message, type, duration) {
    if (!dom.toastRoot) return;
    const id = `toast_${++ui.toastCounter}`;
    const kind = type || "info";
    const toastIcon = kind === "success" ? "check" : kind === "error" || kind === "warning" ? "warning" : "info";
    const element = document.createElement("div");
    element.className = `toast is-${kind}`;
    element.id = id;
    element.innerHTML = `<div class="toast-icon">${icon(toastIcon, "icon icon-sm")}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
      <button class="toast-close" type="button" data-action="close-toast" data-toast-id="${id}" aria-label="Dismiss notification">${icon("close", "icon icon-sm")}</button>`;
    dom.toastRoot.appendChild(element);
    window.setTimeout(() => closeToast(id), duration || 3600);
  }

  function closeToast(id) {
    const element = document.getElementById(id);
    if (!element) return;
    element.style.opacity = "0";
    element.style.transform = "translateY(8px)";
    window.setTimeout(() => element.remove(), 170);
  }

  function periodList(period, anchor) {
    if (period === "all") return state.shifts.slice();
    const range = Core.rangeForPeriod(period, anchor || new Date(), state.settings.weekStartsOn);
    return Core.filterShiftsByDate(state.shifts, range.start, range.end);
  }

  function previousPeriodList(period, anchor) {
    if (period === "all") return [];
    const range = Core.previousRange(period, anchor || new Date(), state.settings.weekStartsOn);
    return Core.filterShiftsByDate(state.shifts, range.start, range.end);
  }

  function trendBadge(current, previous, suffix) {
    const percent = Core.comparePercent(current, previous);
    if (percent == null) {
      return `<span class="trend-badge">${icon("arrowUp", "icon icon-sm")} New</span>`;
    }
    if (Math.abs(percent) < 0.05) {
      return '<span class="trend-badge is-neutral">No change</span>';
    }
    const down = percent < 0;
    return `<span class="trend-badge${down ? " is-down" : ""}>${icon(down ? "arrowDown" : "arrowUp", "icon icon-sm")}${Math.abs(percent).toFixed(1)}%${suffix || ""}</span>`;
  }

  function metricCard(config) {
    return `<article class="metric-card">
      <div class="metric-head">
        <div class="metric-icon ${config.iconClass || ""}">${icon(config.icon || "trend", "icon icon-sm")}</div>
        ${config.badge || ""}
      </div>
      <div class="metric-label">${escapeHtml(config.label)}</div>
      <strong class="metric-value">${config.value}</strong>
      <div class="metric-meta">${config.meta || "&nbsp;"}</div>
    </article>`;
  }

  function summaryStrip(summary) {
    return `<div class="summary-strip">
      <div class="summary-stat"><span>Net</span><strong>${formatMoney(summary.net)}</strong></div>
      <div class="summary-stat"><span>Hours</span><strong>${formatNumber(summary.hours, 1)}</strong></div>
      <div class="summary-stat"><span>Miles</span><strong>${formatNumber(summary.miles, 1)}</strong></div>
      <div class="summary-stat"><span>Hourly</span><strong>${formatMoney(summary.hourly)}/hr</strong></div>
      <div class="summary-stat"><span>Shifts</span><strong>${formatNumber(summary.count)}</strong></div>
    </div>`;
  }

  function emptyState(config) {
    return `<div class="empty-state">
      <div>
        <div class="empty-state-icon">${icon(config.icon || "spark", "icon icon-lg")}</div>
        <h3>${escapeHtml(config.title)}</h3>
        <p>${escapeHtml(config.body)}</p>
        ${config.action ? `<button class="button button-primary" type="button" data-action="${config.action}">${icon(config.actionIcon || "plus", "icon icon-sm")}${escapeHtml(config.actionLabel || "Get started")}</button>` : ""}
      </div>
    </div>`;
  }

  function renderAreaChart(series, options) {
    const opts = options || {};
    if (!series || !series.length) return emptyState({ icon: "analytics", title: "No chart data yet", body: "Save a shift to start building your performance history." });
    const width = 760;
    const height = opts.height || 240;
    const padding = { top: 24, right: 18, bottom: 38, left: 46 };
    const values = series.map((item) => Core.safeNumber(item.value));
    const maxValue = Math.max(1, ...values);
    const minValue = Math.min(0, ...values);
    const range = Math.max(1, maxValue - minValue);
    const xStep = series.length > 1 ? (width - padding.left - padding.right) / (series.length - 1) : 0;
    const yFor = (value) => padding.top + ((maxValue - value) / range) * (height - padding.top - padding.bottom);
    const points = series.map((item, index) => ({
      x: padding.left + index * xStep,
      y: yFor(Core.safeNumber(item.value)),
      item
    }));
    const line = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
    const zeroY = yFor(0);
    const areaPath = `M ${points[0].x} ${zeroY} L ${points.map((point) => `${point.x} ${point.y}`).join(" L ")} L ${points[points.length - 1].x} ${zeroY} Z`;
    const gradientId = `areaGradient_${Math.random().toString(36).slice(2, 9)}`;
    const gridValues = [maxValue, minValue + range / 2, minValue];
    const labelEvery = Math.max(1, Math.ceil(series.length / 8));

    return `<div class="chart-shell">
      <svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttribute(opts.label || "Net earnings trend")}">
        <defs>
          <linearGradient id="${gradientId}" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="currentColor" stop-opacity=".28"/>
            <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${gridValues.map((value) => {
          const y = yFor(value);
          return `<line class="chart-grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/>
            <text class="chart-axis-label" x="${padding.left - 8}" y="${y + 4}" text-anchor="end">${escapeHtml(formatMoney(value, { compact: true, noCents: true }))}</text>`;
        }).join("")}
        <path d="${areaPath}" fill="url(#${gradientId})"/>
        <polyline class="chart-line" points="${line}"/>
        ${points.map((point, index) => `<g>
          <circle class="chart-dot" cx="${point.x}" cy="${point.y}" r="4"/>
          ${(index % labelEvery === 0 || index === points.length - 1) ? `<text class="chart-axis-label" x="${point.x}" y="${height - 12}" text-anchor="middle">${escapeHtml(point.item.label)}</text>` : ""}
        </g>`).join("")}
      </svg>
    </div>`;
  }

  function renderBarChart(series, options) {
    const opts = options || {};
    if (!series || !series.length) return emptyState({ icon: "analytics", title: "No comparison data", body: "More shifts will reveal your strongest days and platforms." });
    const width = 760;
    const height = opts.height || 245;
    const padding = { top: 28, right: 18, bottom: 42, left: 48 };
    const values = series.map((item) => Core.safeNumber(item.value));
    const maxValue = Math.max(0, ...values);
    const minValue = Math.min(0, ...values);
    const range = Math.max(1, maxValue - minValue);
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const slot = chartWidth / series.length;
    const barWidth = Math.min(46, slot * 0.58);
    const yFor = (value) => padding.top + ((maxValue - value) / range) * chartHeight;
    const zeroY = yFor(0);
    const gridValues = Array.from(new Set([maxValue, 0, minValue]));

    return `<div class="chart-shell">
      <svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeAttribute(opts.label || "Performance bar chart")}">
        ${gridValues.map((value) => {
          const y = yFor(value);
          return `<line class="chart-grid-line${value === 0 ? " is-zero" : ""}" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"/>
            <text class="chart-axis-label" x="${padding.left - 8}" y="${y + 4}" text-anchor="end">${escapeHtml(formatMoney(value, { compact: true, noCents: true }))}</text>`;
        }).join("")}
        ${series.map((item, index) => {
          const value = Core.safeNumber(item.value);
          const valueY = yFor(value);
          const barHeight = Math.abs(valueY - zeroY);
          const x = padding.left + index * slot + (slot - barWidth) / 2;
          const y = Math.min(valueY, zeroY);
          const negative = value < 0;
          const labelY = negative ? y + barHeight - 8 : y + 16;
          return `<rect class="chart-bar${item.secondary ? " is-secondary" : ""}${negative ? " is-negative" : ""}" x="${x}" y="${y}" width="${barWidth}" height="${Math.max(1, barHeight)}" rx="7"/>
            ${barHeight > 28 ? `<text class="chart-value-label" x="${x + barWidth / 2}" y="${labelY}" text-anchor="middle">${escapeHtml(formatMoney(value, { compact: true, noCents: true }))}</text>` : ""}
            <text class="chart-axis-label" x="${x + barWidth / 2}" y="${height - 14}" text-anchor="middle">${escapeHtml(item.label)}</text>`;
        }).join("")}
      </svg>
    </div>`;
  }

  function buildDailySeries(days, endDate) {
    const end = Core.startOfDay(endDate || new Date());
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    const grouped = Core.groupShiftsByDate(state.shifts, state.settings);
    const output = [];
    for (let index = 0; index < days; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const iso = Core.localISODate(date);
      const summary = Core.summarizeShifts(grouped[iso] || [], state.settings);
      output.push({
        key: iso,
        label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
        value: summary.net
      });
    }
    return output;
  }

  function bestWeekdayInsight(list) {
    const rows = Core.groupNetByWeekday(list || state.shifts, state.settings).filter((item) => item.count > 0);
    if (!rows.length) return null;
    rows.sort((a, b) => b.averageNet - a.averageNet);
    const best = rows[0];
    const day = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(2026, 0, 4 + best.day));
    return { ...best, label: day };
  }

  function vehicleFundSummary() {
    const all = Core.summarizeShifts(state.shifts, state.settings);
    const spent = state.maintenance.reduce((total, item) => total + Core.safeNumber(item.amount), 0);
    return {
      contributions: all.vehicleFund,
      spent: Core.round(spent, 2),
      balance: Core.round(all.vehicleFund - spent, 2)
    };
  }

  function renderOverviewPage() {
    const currentWeek = periodList("week");
    const previousWeek = previousPeriodList("week");
    const week = Core.summarizeShifts(currentWeek, state.settings);
    const prev = Core.summarizeShifts(previousWeek, state.settings);
    const month = Core.summarizeShifts(periodList("month"), state.settings);
    const all = Core.summarizeShifts(state.shifts, state.settings);
    const projection = Core.monthlyProjection(state.shifts, state.settings, new Date());
    const bestDay = bestWeekdayInsight(state.shifts);
    const vehicle = vehicleFundSummary();
    const recent = sortedShifts().slice(0, 5);
    const weeklyGoal = Core.safeNumber(state.settings.weeklyNetGoal);
    const weeklyProgress = weeklyGoal > 0 ? Math.min(100, Math.max(0, week.net / weeklyGoal * 100)) : 0;
    const weeklyRemaining = Math.max(0, weeklyGoal - week.net);
    const dailySeries = buildDailySeries(7);
    const active = state.activeShift;
    const activeMetrics = active ? Core.calculateShift({
      ...active,
      endTime: currentTimeValue(),
      manualHours: activeDurationHours()
    }, state.settings) : null;
    const lastShift = recent.length ? Core.calculateShift(recent[0], state.settings) : null;

    const hero = active ? `<section class="shift-hero is-active">
      <div class="hero-topline">
        <div class="hero-status"><span class="live-dot is-live"></span>On duty · ${escapeHtml(active.platform)}</div>
        <span class="pill pill-success">Started ${escapeHtml(formatTime(active.startTime))}</span>
      </div>
      <div class="hero-main">
        <h2>Shift in progress</h2>
        <span class="hero-live-time" data-live-duration>${formatDuration(activeDurationHours(), true)}</span>
        <p>Your draft is continuously preserved in this browser. Update earnings anytime or finish when you are ready.</p>
      </div>
      <div class="hero-actions">
        <button class="button button-primary" type="button" data-action="end-active-shift">${icon("stop", "icon icon-sm")}End shift</button>
        <button class="button button-secondary" type="button" data-action="update-active-shift">${icon("edit", "icon icon-sm")}Update shift</button>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><span>Gross</span><strong>${formatMoney(activeMetrics.gross)}</strong></div>
        <div class="hero-stat"><span>Live net</span><strong>${formatMoney(activeMetrics.net)}</strong></div>
        <div class="hero-stat"><span>Miles</span><strong>${formatNumber(activeMetrics.miles, 1)}</strong></div>
        <div class="hero-stat"><span>Live hourly</span><strong>${formatMoney(activeMetrics.hourly)}/hr</strong></div>
      </div>
    </section>` : `<section class="shift-hero">
      <div class="hero-topline">
        <div class="hero-status"><span class="live-dot"></span>Off duty</div>
        <span class="pill">${escapeHtml(formatDate(Core.localISODate(), { weekday: "long", month: "short", day: "numeric" }))}</span>
      </div>
      <div class="hero-main">
        <h2>Ready when you are.</h2>
        <p>Start a live shift for automatic timing, or add a completed shift from the past.</p>
      </div>
      <div class="hero-actions">
        <button class="button button-primary" type="button" data-action="start-shift">${icon("play", "icon icon-sm")}Start shift</button>
        <button class="button button-secondary" type="button" data-action="open-add-shift">${icon("plus", "icon icon-sm")}Add past shift</button>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><span>Last shift</span><strong>${lastShift ? formatMoney(lastShift.net) : "—"}</strong></div>
        <div class="hero-stat"><span>This month</span><strong>${formatMoney(month.net)}</strong></div>
        <div class="hero-stat"><span>All-time miles</span><strong>${formatNumber(all.miles, 0)}</strong></div>
        <div class="hero-stat"><span>Avg hourly</span><strong>${formatMoney(all.hourly)}/hr</strong></div>
      </div>
    </section>`;

    const goalPanel = `<aside class="goal-panel">
      <div class="panel-header">
        <div><div class="eyebrow">Weekly target</div><h2 class="panel-title">Net earnings goal</h2></div>
        ${weeklyGoal > 0 ? `<span class="pill ${weeklyProgress >= 100 ? "pill-success" : "pill-info"}">${weeklyProgress.toFixed(0)}%</span>` : ""}
      </div>
      <div class="goal-total">
        <strong>${formatMoney(week.net, { noCents: true })}</strong>
        <span>${weeklyGoal > 0 ? `of ${formatMoney(weeklyGoal, { noCents: true })} this week` : "No weekly goal has been set yet."}</span>
      </div>
      <div style="margin-top:20px">
        <div class="progress progress-lg"><div class="progress-fill" style="width:${weeklyProgress.toFixed(2)}%"></div></div>
        <div class="progress-meta">
          <span>${weeklyGoal > 0 ? `${formatMoney(weeklyRemaining, { noCents: true })} remaining` : "Set a goal to track pace"}</span>
          <span>${week.count} shift${week.count === 1 ? "" : "s"}</span>
        </div>
      </div>
      <div style="margin-top:22px">
        <button class="button button-ghost button-small" type="button" data-route="settings">${icon("settings", "icon icon-sm")}${weeklyGoal > 0 ? "Adjust goal" : "Set weekly goal"}</button>
      </div>
    </aside>`;

    const metricCards = [
      metricCard({
        icon: "dollar",
        label: "Net this week",
        value: formatMoney(week.net),
        badge: trendBadge(week.net, prev.net),
        meta: `${formatMoney(week.gross)} gross · ${formatMoney(week.expenses)} expenses`
      }),
      metricCard({
        icon: "clock",
        iconClass: "is-blue",
        label: "Average hourly",
        value: `${formatMoney(week.hourly)}/hr`,
        badge: trendBadge(week.hourly, prev.hourly),
        meta: `${formatNumber(week.hours, 1)} hours this week`
      }),
      metricCard({
        icon: "route",
        iconClass: "is-violet",
        label: "Business miles",
        value: formatNumber(week.miles, 1),
        badge: trendBadge(week.miles, prev.miles),
        meta: `${formatMoney(week.netPerMile)} net per mile`
      }),
      metricCard({
        icon: "wallet",
        iconClass: "is-amber",
        label: "Spendable cash",
        value: formatMoney(week.spendable),
        badge: trendBadge(week.spendable, prev.spendable),
        meta: `${formatMoney(week.investment + week.savings + week.vehicleFund)} set aside`
      })
    ].join("");

    const insightMarkup = [
      `<article class="insight-card"><div class="insight-card-head"><div class="insight-card-icon">${icon("trend", "icon icon-sm")}</div><div><strong>Month projection</strong><p>${projection.current > 0 ? `${formatMoney(projection.projected, { noCents: true })} projected from ${formatMoney(projection.current, { noCents: true })} earned so far.` : "Save shifts this month to build a projection."}</p></div></div></article>`,
      `<article class="insight-card"><div class="insight-card-head"><div class="insight-card-icon">${icon("spark", "icon icon-sm")}</div><div><strong>Best driving day</strong><p>${bestDay ? `${escapeHtml(bestDay.label)} averages ${formatMoney(bestDay.averageNet)} net across ${bestDay.count} shift${bestDay.count === 1 ? "" : "s"}.` : "More history will reveal your strongest weekday."}</p></div></div></article>`,
      `<article class="insight-card"><div class="insight-card-head"><div class="insight-card-icon">${icon("vehicle", "icon icon-sm")}</div><div><strong>Vehicle fund</strong><p>${formatMoney(vehicle.balance)} remains after ${formatMoney(vehicle.spent)} in logged maintenance.</p></div></div></article>`
    ].join("");

    const recentMarkup = recent.length ? `<div class="recent-list">${recent.map((raw) => {
      const shift = Core.calculateShift(raw, state.settings);
      return `<div class="recent-item">
        <div class="recent-main"><strong>${escapeHtml(formatDate(shift.date, { weekday: "short", month: "short", day: "numeric" }))} · ${escapeHtml(shift.platform)}</strong><span>${escapeHtml(formatTime(shift.startTime))}–${escapeHtml(formatTime(shift.endTime))} · ${formatNumber(shift.miles, 1)} mi</span></div>
        <div class="recent-metric"><strong>${formatMoney(shift.net)}</strong><span>${formatMoney(shift.hourly)}/hr</span></div>
        <button class="icon-button" type="button" data-action="edit-shift" data-id="${escapeAttribute(shift.id)}" aria-label="Edit shift on ${escapeAttribute(shift.date)}">${icon("edit", "icon icon-sm")}</button>
      </div>`;
    }).join("")}</div>` : emptyState({
      icon: "shifts",
      title: "Your ledger is ready",
      body: "Save your first shift and this overview will start surfacing trends automatically.",
      action: "open-add-shift",
      actionLabel: "Add first shift"
    });

    return `<div class="overview-stack">
      <div class="overview-grid">${hero}${goalPanel}</div>
      <section class="metric-grid" aria-label="Weekly performance metrics">${metricCards}</section>
      <div class="dashboard-lower-grid">
        <section class="chart-panel">
          <div class="panel-header"><div><h2 class="panel-title">Last 7 days</h2><p class="panel-subtitle">Net earnings by day</p></div><button class="button button-ghost button-small" type="button" data-route="analytics">Full analytics${icon("chevronRight", "icon icon-sm")}</button></div>
          ${renderAreaChart(dailySeries, { label: "Net earnings over the last seven days" })}
        </section>
        <aside class="insight-stack">${insightMarkup}</aside>
      </div>
      <section class="panel">
        <div class="panel-header"><div><h2 class="panel-title">Recent shifts</h2><p class="panel-subtitle">Your latest completed driving sessions</p></div><button class="button button-ghost button-small" type="button" data-route="shifts">Manage all${icon("chevronRight", "icon icon-sm")}</button></div>
        ${recentMarkup}
      </section>
    </div>`;
  }

  function filteredShifts() {
    const filters = ui.shiftFilters;
    let list = state.shifts.slice();
    if (filters.range !== "all") {
      const range = Core.rangeForPeriod(filters.range, new Date(), state.settings.weekStartsOn);
      list = Core.filterShiftsByDate(list, range.start, range.end);
    }
    if (filters.platform !== "all") {
      list = list.filter((shift) => shift.platform === filters.platform);
    }

    // Calculate each visible candidate once so metric sorts do not recalculate inside every comparison.
    let prepared = list.map((raw) => ({ raw, shift: Core.calculateShift(raw, state.settings) }));
    const query = filters.search.trim().toLowerCase();
    if (query) {
      prepared = prepared.filter(({ shift }) => {
        const haystack = [
          shift.date,
          formatDate(shift.date),
          formatWeekday(shift.date),
          shift.platform,
          shift.notes,
          shift.gross,
          shift.net,
          shift.miles,
          shift.trips
        ].join(" ").toLowerCase();
        return haystack.includes(query);
      });
    }
    prepared.sort((a, b) => {
      const left = a.shift;
      const right = b.shift;
      switch (filters.sort) {
        case "dateAsc":
          return `${left.date} ${left.startTime}`.localeCompare(`${right.date} ${right.startTime}`);
        case "netDesc":
          return right.net - left.net;
        case "netAsc":
          return left.net - right.net;
        case "hourlyDesc":
          return right.hourly - left.hourly;
        case "milesDesc":
          return right.miles - left.miles;
        case "dateDesc":
        default:
          return `${right.date} ${right.startTime}`.localeCompare(`${left.date} ${left.startTime}`);
      }
    });
    return prepared.map((item) => item.raw);
  }

  function renderShiftsPage() {
    const platforms = Array.from(new Set([...PLATFORM_OPTIONS, ...state.shifts.map((shift) => shift.platform)])).filter(Boolean);
    const activeBanner = state.activeShift ? `<section class="shift-hero is-active">
      <div class="hero-topline">
        <div class="hero-status"><span class="live-dot is-live"></span>Live shift · ${escapeHtml(state.activeShift.platform)}</div>
        <span class="pill pill-success" data-live-duration>${formatDuration(activeDurationHours(), true)}</span>
      </div>
      <div class="hero-main"><h2>${formatMoney(Core.calculateShift({ ...state.activeShift, endTime: currentTimeValue(), manualHours: activeDurationHours() }, state.settings).gross)} gross so far</h2><p>Keep the live draft current, then finish it into the ledger when your driving session ends.</p></div>
      <div class="hero-actions"><button class="button button-primary" type="button" data-action="end-active-shift">${icon("stop", "icon icon-sm")}End shift</button><button class="button button-secondary" type="button" data-action="update-active-shift">${icon("edit", "icon icon-sm")}Update</button></div>
    </section>` : "";

    return `<div class="page-stack">
      ${activeBanner}
      <section class="toolbar" aria-label="Shift ledger controls">
        <div class="toolbar-row">
          <div><h2 class="panel-title">Completed shifts</h2><p class="panel-subtitle" id="shiftResultsMeta">Loading your ledger…</p></div>
          <div class="bulk-actions">
            <button class="button button-ghost button-small" type="button" data-action="export-csv">${icon("download", "icon icon-sm")}Export</button>
            <button class="button button-primary button-small" type="button" data-action="open-add-shift">${icon("plus", "icon icon-sm")}Add shift</button>
          </div>
        </div>
        <div class="filter-grid">
          <div class="field"><label for="shiftSearch">Search</label><div class="input-wrap">${icon("search", "input-icon")}<input id="shiftSearch" type="search" autocomplete="off" placeholder="Date, platform, notes…" value="${escapeAttribute(ui.shiftFilters.search)}" data-filter="shift-search"></div></div>
          <div class="field"><label for="shiftRange">Date range</label><select id="shiftRange" data-filter="shift-range">
            <option value="all"${ui.shiftFilters.range === "all" ? " selected" : ""}>All time</option>
            <option value="7"${ui.shiftFilters.range === "7" ? " selected" : ""}>Last 7 days</option>
            <option value="30"${ui.shiftFilters.range === "30" ? " selected" : ""}>Last 30 days</option>
            <option value="month"${ui.shiftFilters.range === "month" ? " selected" : ""}>This month</option>
            <option value="year"${ui.shiftFilters.range === "year" ? " selected" : ""}>This year</option>
          </select></div>
          <div class="field"><label for="shiftPlatform">Platform</label><select id="shiftPlatform" data-filter="shift-platform"><option value="all">All platforms</option>${platforms.map((platform) => `<option value="${escapeAttribute(platform)}"${ui.shiftFilters.platform === platform ? " selected" : ""}>${escapeHtml(platform)}</option>`).join("")}</select></div>
          <div class="field"><label for="shiftSort">Sort by</label><select id="shiftSort" data-filter="shift-sort">
            <option value="dateDesc"${ui.shiftFilters.sort === "dateDesc" ? " selected" : ""}>Newest first</option>
            <option value="dateAsc"${ui.shiftFilters.sort === "dateAsc" ? " selected" : ""}>Oldest first</option>
            <option value="netDesc"${ui.shiftFilters.sort === "netDesc" ? " selected" : ""}>Highest net</option>
            <option value="netAsc"${ui.shiftFilters.sort === "netAsc" ? " selected" : ""}>Lowest net</option>
            <option value="hourlyDesc"${ui.shiftFilters.sort === "hourlyDesc" ? " selected" : ""}>Best hourly</option>
            <option value="milesDesc"${ui.shiftFilters.sort === "milesDesc" ? " selected" : ""}>Most miles</option>
          </select></div>
        </div>
      </section>
      <div id="shiftSummary"></div>
      <div id="shiftBulkBar"></div>
      <div id="shiftTableWrap"></div>
      <div id="shiftMobileList" class="mobile-record-list"></div>
    </div>`;
  }

  function updateShiftResults() {
    const list = filteredShifts();
    const visibleIds = new Set(list.map((shift) => String(shift.id)));
    Array.from(ui.selectedShiftIds).forEach((id) => {
      if (!state.shifts.some((shift) => String(shift.id) === String(id))) ui.selectedShiftIds.delete(id);
    });
    const summary = Core.summarizeShifts(list, state.settings);
    const selectedCount = Array.from(ui.selectedShiftIds).filter((id) => visibleIds.has(String(id))).length;
    const allVisibleSelected = list.length > 0 && list.every((shift) => ui.selectedShiftIds.has(String(shift.id)));

    const meta = document.getElementById("shiftResultsMeta");
    const summaryRoot = document.getElementById("shiftSummary");
    const bulkRoot = document.getElementById("shiftBulkBar");
    const tableRoot = document.getElementById("shiftTableWrap");
    const mobileRoot = document.getElementById("shiftMobileList");
    if (!meta || !summaryRoot || !bulkRoot || !tableRoot || !mobileRoot) return;

    meta.textContent = `${list.length} of ${state.shifts.length} shift${state.shifts.length === 1 ? "" : "s"} shown`;
    summaryRoot.innerHTML = summaryStrip(summary);
    bulkRoot.innerHTML = selectedCount ? `<div class="bulk-bar"><div><strong>${selectedCount}</strong> selected in this view</div><div class="bulk-actions"><button class="button button-ghost button-small" type="button" data-action="clear-shift-selection">Clear</button><button class="button button-secondary button-small" type="button" data-action="export-selected-shifts">${icon("download", "icon icon-sm")}Export</button><button class="button button-danger button-small" type="button" data-action="delete-selected-shifts">${icon("trash", "icon icon-sm")}Delete</button></div></div>` : "";

    if (!list.length) {
      tableRoot.innerHTML = emptyState({
        icon: "filter",
        title: state.shifts.length ? "No shifts match these filters" : "No completed shifts yet",
        body: state.shifts.length ? "Try a broader date range or clear the search." : "Add a completed shift or start a live one to build your ledger.",
        action: state.shifts.length ? "clear-shift-filters" : "open-add-shift",
        actionLabel: state.shifts.length ? "Clear filters" : "Add first shift",
        actionIcon: state.shifts.length ? "refresh" : "plus"
      });
      mobileRoot.innerHTML = "";
      return;
    }

    tableRoot.innerHTML = `<div class="data-table-wrap"><table class="data-table"><thead><tr>
      <th><input class="table-check" type="checkbox" data-action="select-all-shifts" aria-label="Select every visible shift"${allVisibleSelected ? " checked" : ""}></th>
      <th>Date / platform</th><th>Gross</th><th>Expenses</th><th>Net</th><th>Time</th><th>Miles</th><th>Efficiency</th><th>Spendable</th><th><span class="visually-hidden">Actions</span></th>
    </tr></thead><tbody>${list.map((raw) => {
      const shift = Core.calculateShift(raw, state.settings);
      const selected = ui.selectedShiftIds.has(String(shift.id));
      return `<tr class="${selected ? "is-selected" : ""}">
        <td><input class="table-check" type="checkbox" data-action="toggle-shift-select" data-id="${escapeAttribute(shift.id)}" aria-label="Select shift on ${escapeAttribute(formatDate(shift.date))}"${selected ? " checked" : ""}></td>
        <td><span class="table-primary">${escapeHtml(formatDate(shift.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" }))}</span><span class="table-secondary">${escapeHtml(shift.platform)} · ${escapeHtml(formatTime(shift.startTime))}–${escapeHtml(formatTime(shift.endTime))}</span></td>
        <td class="table-number">${formatMoney(shift.gross)}</td>
        <td class="table-number">${formatMoney(shift.expenses)}</td>
        <td class="table-number text-accent">${formatMoney(shift.net)}</td>
        <td><span class="table-primary">${formatDuration(shift.hours)}</span><span class="table-secondary">${formatNumber(shift.trips)} trip${shift.trips === 1 ? "" : "s"}</span></td>
        <td><span class="table-primary">${formatNumber(shift.miles, 1)}</span><span class="table-secondary">${formatMoney(shift.taxDeduction)} deduction</span></td>
        <td><span class="table-primary">${formatMoney(shift.hourly)}/hr</span><span class="table-secondary">${formatMoney(shift.netPerMile)}/mi</span></td>
        <td class="table-number">${formatMoney(shift.spendable)}</td>
        <td><div class="row-actions"><button class="icon-button" type="button" data-action="edit-shift" data-id="${escapeAttribute(shift.id)}" aria-label="Edit shift">${icon("edit", "icon icon-sm")}</button><button class="icon-button" type="button" data-action="duplicate-shift" data-id="${escapeAttribute(shift.id)}" aria-label="Duplicate shift">${icon("copy", "icon icon-sm")}</button><button class="icon-button" type="button" data-action="delete-shift" data-id="${escapeAttribute(shift.id)}" aria-label="Delete shift">${icon("trash", "icon icon-sm")}</button></div></td>
      </tr>`;
    }).join("")}</tbody></table></div>`;

    mobileRoot.innerHTML = list.map((raw) => {
      const shift = Core.calculateShift(raw, state.settings);
      const selected = ui.selectedShiftIds.has(String(shift.id));
      return `<article class="record-card${selected ? " is-selected" : ""}">
        <div class="record-card-head"><div class="record-card-title"><input class="table-check" type="checkbox" data-action="toggle-shift-select" data-id="${escapeAttribute(shift.id)}" aria-label="Select shift"${selected ? " checked" : ""}><div><strong>${escapeHtml(formatDate(shift.date, { weekday: "short", month: "short", day: "numeric" }))}</strong><span>${escapeHtml(shift.platform)} · ${escapeHtml(formatTime(shift.startTime))}–${escapeHtml(formatTime(shift.endTime))}</span></div></div><div class="record-card-value text-accent">${formatMoney(shift.net)}</div></div>
        <div class="record-card-grid"><div class="record-mini-stat"><span>Hourly</span><strong>${formatMoney(shift.hourly)}</strong></div><div class="record-mini-stat"><span>Miles</span><strong>${formatNumber(shift.miles, 1)}</strong></div><div class="record-mini-stat"><span>Spendable</span><strong>${formatMoney(shift.spendable)}</strong></div></div>
        <div class="record-card-actions"><button class="button button-ghost button-small" type="button" data-action="duplicate-shift" data-id="${escapeAttribute(shift.id)}">${icon("copy", "icon icon-sm")}Duplicate</button><button class="button button-secondary button-small" type="button" data-action="edit-shift" data-id="${escapeAttribute(shift.id)}">${icon("edit", "icon icon-sm")}Edit</button><button class="button button-ghost button-small" type="button" data-action="delete-shift" data-id="${escapeAttribute(shift.id)}" aria-label="Delete shift">${icon("trash", "icon icon-sm")}</button></div>
      </article>`;
    }).join("");
  }

  function analyticsPeriodLabel(period) {
    return ({ week: "This week", month: "This month", year: "This year", all: "All time" })[period] || "This month";
  }

  function seriesForAnalytics(list, period) {
    const grouped = {};
    const currentYear = new Date().getFullYear();
    if (period === "week" || period === "month") {
      const range = Core.rangeForPeriod(period, new Date(), state.settings.weekStartsOn);
      const cursor = new Date(range.start);
      while (cursor <= range.end) {
        const key = Core.localISODate(cursor);
        grouped[key] = 0;
        cursor.setDate(cursor.getDate() + 1);
      }
      list.forEach((raw) => {
        const shift = Core.calculateShift(raw, state.settings);
        grouped[shift.date] = (grouped[shift.date] || 0) + shift.net;
      });
      return Object.keys(grouped).sort().map((key) => ({
        key,
        label: formatDate(key, period === "week" ? { weekday: "short" } : { month: "short", day: "numeric" }),
        value: Core.round(grouped[key], 2)
      }));
    }
    if (period === "year") {
      for (let month = 0; month < 12; month += 1) {
        const date = new Date(currentYear, month, 1);
        const key = `${currentYear}-${Core.pad(month + 1)}`;
        grouped[key] = 0;
      }
      list.forEach((raw) => {
        const shift = Core.calculateShift(raw, state.settings);
        const key = shift.date.slice(0, 7);
        grouped[key] = (grouped[key] || 0) + shift.net;
      });
      return Object.keys(grouped).sort().map((key) => ({
        key,
        label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1)),
        value: Core.round(grouped[key], 2)
      }));
    }
    list.forEach((raw) => {
      const shift = Core.calculateShift(raw, state.settings);
      const key = shift.date.slice(0, 7);
      grouped[key] = (grouped[key] || 0) + shift.net;
    });
    return Object.keys(grouped).sort().map((key) => ({
      key,
      label: new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1)),
      value: Core.round(grouped[key], 2)
    }));
  }

  function platformBreakdown(list) {
    const map = {};
    list.forEach((raw) => {
      const shift = Core.calculateShift(raw, state.settings);
      if (!map[shift.platform]) map[shift.platform] = { label: shift.platform, net: 0, gross: 0, count: 0, hours: 0 };
      map[shift.platform].net += shift.net;
      map[shift.platform].gross += shift.gross;
      map[shift.platform].count += 1;
      map[shift.platform].hours += shift.hours;
    });
    return Object.values(map).sort((a, b) => b.net - a.net);
  }

  function renderAnalyticsPage() {
    const period = ui.analyticsPeriod;
    const list = periodList(period);
    const previous = previousPeriodList(period);
    const summary = Core.summarizeShifts(list, state.settings);
    const prev = Core.summarizeShifts(previous, state.settings);
    const series = seriesForAnalytics(list, period);
    const weekdays = Core.groupNetByWeekday(list, state.settings);
    const weekdaySeries = weekdays.map((row) => ({
      label: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(2026, 0, 4 + row.day)),
      value: row.net
    }));
    const platforms = platformBreakdown(list);
    const maxPlatform = Math.max(1, ...platforms.map((row) => Math.abs(row.net)));
    const spendableFlow = Math.max(0, summary.spendable);
    const allocationTotal = Math.max(0, summary.investment + summary.savings + summary.vehicleFund + spendableFlow);
    const parts = allocationTotal > 0 ? [summary.investment, summary.savings, summary.vehicleFund, spendableFlow] : [0, 0, 0, 1];
    const degrees = parts.reduce((acc, value, index) => {
      const previousDegree = index ? acc[index - 1] : 0;
      acc.push(previousDegree + value / (allocationTotal || 1) * 360);
      return acc;
    }, []);
    const bestDay = bestWeekdayInsight(list);
    const bestShift = sortedShifts(list).map((item) => Core.calculateShift(item, state.settings)).sort((a, b) => b.net - a.net)[0];
    const deductionRate = summary.miles ? summary.taxDeduction / summary.miles : Core.getMileageRate(Core.localISODate(), state.settings.taxRates).rate;

    return `<div class="page-stack">
      <section class="toolbar"><div class="toolbar-row"><div><h2 class="panel-title">${escapeHtml(analyticsPeriodLabel(period))}</h2><p class="panel-subtitle">Compared with the preceding equivalent period where available.</p></div><div class="period-switch" aria-label="Analytics period">${[
        ["week", "Week"], ["month", "Month"], ["year", "Year"], ["all", "All time"]
      ].map(([value, label]) => `<button class="segment-button${period === value ? " is-active" : ""}" type="button" data-action="analytics-period" data-period="${value}">${label}</button>`).join("")}</div></div></section>
      <section class="metric-grid">
        ${metricCard({ icon: "dollar", label: "Net earnings", value: formatMoney(summary.net), badge: period === "all" ? "" : trendBadge(summary.net, prev.net), meta: `${formatMoney(summary.gross)} gross · ${formatMoney(summary.expenses)} expenses` })}
        ${metricCard({ icon: "clock", iconClass: "is-blue", label: "Net hourly", value: `${formatMoney(summary.hourly)}/hr`, badge: period === "all" ? "" : trendBadge(summary.hourly, prev.hourly), meta: `${formatNumber(summary.hours, 1)} logged hours` })}
        ${metricCard({ icon: "route", iconClass: "is-violet", label: "Net per mile", value: `${formatMoney(summary.netPerMile)}/mi`, badge: period === "all" ? "" : trendBadge(summary.netPerMile, prev.netPerMile), meta: `${formatNumber(summary.miles, 1)} business miles` })}
        ${metricCard({ icon: "shifts", iconClass: "is-amber", label: "Average shift", value: formatMoney(summary.averageShift), badge: period === "all" ? "" : trendBadge(summary.averageShift, prev.averageShift), meta: `${summary.count} shift${summary.count === 1 ? "" : "s"} · ${formatNumber(summary.trips)} trips` })}
      </section>
      <div class="analytics-grid">
        <section class="chart-panel"><div class="panel-header"><div><h2 class="panel-title">Net earnings trend</h2><p class="panel-subtitle">Performance across ${escapeHtml(analyticsPeriodLabel(period).toLowerCase())}</p></div><span class="pill pill-info">${formatMoney(summary.net, { noCents: true })}</span></div>${renderAreaChart(series, { height: 285, label: `Net earnings for ${analyticsPeriodLabel(period)}` })}</section>
        <aside class="analytics-side">
          <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Money flow</h2><p class="panel-subtitle">Where positive net earnings went</p></div></div>
            <div class="donut-layout"><div class="donut" style="--donut-a:${degrees[0] || 0}deg;--donut-b:${degrees[1] || 0}deg;--donut-c:${degrees[2] || 0}deg"><div class="donut-center"><strong>${formatMoney(summary.spendable, { compact: true })}</strong><span>Spendable</span></div></div>
            <div class="legend-list">
              <div class="legend-item"><span class="legend-dot"></span><span>Investment</span><strong>${formatMoney(summary.investment)}</strong></div>
              <div class="legend-item"><span class="legend-dot is-blue"></span><span>Savings</span><strong>${formatMoney(summary.savings)}</strong></div>
              <div class="legend-item"><span class="legend-dot is-violet"></span><span>Vehicle fund</span><strong>${formatMoney(summary.vehicleFund)}</strong></div>
              <div class="legend-item"><span class="legend-dot is-amber"></span><span>Spendable</span><strong>${formatMoney(summary.spendable)}</strong></div>
            </div></div>
          </section>
          <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Mileage deduction</h2><p class="panel-subtitle">Planning estimate from your rate schedule</p></div>${icon("tax", "icon icon-lg text-blue")}</div><div class="goal-total"><strong>${formatMoney(summary.taxDeduction)}</strong><span>${formatNumber(summary.miles, 1)} miles at an average ${formatMoney(deductionRate)}/mile</span></div><p class="field-help">This is an organizational estimate, not tax advice. Confirm eligibility and records with a tax professional.</p></section>
        </aside>
      </div>
      <div class="analytics-grid">
        <section class="chart-panel"><div class="panel-header"><div><h2 class="panel-title">Weekday contribution</h2><p class="panel-subtitle">Total net by day of week</p></div></div>${renderBarChart(weekdaySeries, { label: "Net earnings by weekday" })}</section>
        <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Platform mix</h2><p class="panel-subtitle">Net contribution by platform</p></div></div>${platforms.length ? `<div class="bar-list">${platforms.map((row, index) => `<div class="bar-row"><div class="bar-row-head"><span>${escapeHtml(row.label)} · ${row.count} shift${row.count === 1 ? "" : "s"}</span><strong>${formatMoney(row.net)}</strong></div><div class="bar-track"><div class="bar-fill ${row.net < 0 ? "is-negative" : index % 3 === 1 ? "is-blue" : index % 3 === 2 ? "is-violet" : ""}" style="width:${Math.max(2, Math.abs(row.net) / maxPlatform * 100)}%"></div></div></div>`).join("")}</div>` : emptyState({ icon: "analytics", title: "No platform data", body: "Save shifts to compare your platforms." })}</section>
      </div>
      <section class="panel"><div class="panel-header"><div><h2 class="panel-title">Performance signals</h2><p class="panel-subtitle">Useful context from the selected period</p></div></div><div class="insight-grid">
        <div class="compact-insight"><span>Best weekday</span><strong>${bestDay ? escapeHtml(bestDay.label) : "—"}</strong></div>
        <div class="compact-insight"><span>Best shift</span><strong>${bestShift ? formatMoney(bestShift.net) : "—"}</strong></div>
        <div class="compact-insight"><span>Expense ratio</span><strong>${summary.gross ? `${(summary.expenses / summary.gross * 100).toFixed(1)}%` : "—"}</strong></div>
        <div class="compact-insight"><span>Net per trip</span><strong>${summary.trips ? formatMoney(summary.net / summary.trips) : "—"}</strong></div>
      </div></section>
    </div>`;
  }

  function calendarMonthData(cursor) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const weekStart = state.settings.weekStartsOn;
    const leading = (monthStart.getDay() - weekStart + 7) % 7;
    const gridStart = new Date(year, month, 1 - leading);
    const groups = Core.groupShiftsByDate(state.shifts, state.settings);
    const monthShifts = Core.filterShiftsByDate(state.shifts, Core.startOfMonth(cursor), Core.endOfMonth(cursor));
    const maxNet = Math.max(1, ...Object.keys(groups).filter((key) => key.slice(0, 7) === Core.localISODate(monthStart).slice(0, 7)).map((key) => Core.summarizeShifts(groups[key], state.settings).net));
    const days = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const iso = Core.localISODate(date);
      const shifts = groups[iso] || [];
      const summary = Core.summarizeShifts(shifts, state.settings);
      let heat = 0;
      if (summary.net > 0) heat = Math.min(4, Math.max(1, Math.ceil(summary.net / maxNet * 4)));
      days.push({ date, iso, shifts, summary, outside: date.getMonth() !== month, heat });
    }
    return { year, month, monthStart, monthEnd, monthShifts, summary: Core.summarizeShifts(monthShifts, state.settings), days };
  }

  function renderCalendarPage() {
    const data = calendarMonthData(ui.calendarCursor);
    const selectedList = state.shifts.filter((shift) => shift.date === ui.calendarSelected);
    const selectedSummary = Core.summarizeShifts(selectedList, state.settings);
    const weekDays = [];
    for (let index = 0; index < 7; index += 1) {
      const date = new Date(2026, 0, 4 + ((state.settings.weekStartsOn + index) % 7));
      weekDays.push(new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date));
    }
    const monthlyGoal = Core.safeNumber(state.settings.monthlyNetGoal);
    const progress = monthlyGoal > 0 ? Math.min(100, Math.max(0, data.summary.net / monthlyGoal * 100)) : 0;
    const selectedDate = Core.parseISODate(ui.calendarSelected);

    return `<div class="page-stack">
      <div class="calendar-layout">
        <section class="calendar-panel panel">
          <div class="calendar-toolbar"><div class="calendar-nav-actions"><button class="icon-button" type="button" data-action="calendar-prev" aria-label="Previous month">${icon("chevronLeft", "icon icon-sm")}</button><button class="button button-ghost button-small" type="button" data-action="calendar-today">Today</button></div><div class="calendar-title"><strong>${new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(data.monthStart)}</strong><span>${data.summary.count} shift${data.summary.count === 1 ? "" : "s"} recorded</span></div><div class="calendar-nav-actions"><button class="icon-button" type="button" data-action="calendar-next" aria-label="Next month">${icon("chevronRight", "icon icon-sm")}</button></div></div>
          <div class="calendar-summary"><div class="calendar-summary-item"><span>Net</span><strong>${formatMoney(data.summary.net)}</strong></div><div class="calendar-summary-item"><span>Hours</span><strong>${formatNumber(data.summary.hours, 1)}</strong></div><div class="calendar-summary-item"><span>Miles</span><strong>${formatNumber(data.summary.miles, 1)}</strong></div></div>
          <div class="calendar-grid">${weekDays.map((day) => `<div class="calendar-weekday">${escapeHtml(day)}</div>`).join("")}${data.days.map((day) => `<button class="calendar-day${day.outside ? " is-outside" : ""}${day.iso === Core.localISODate() ? " is-today" : ""}${day.iso === ui.calendarSelected ? " is-selected" : ""}${day.heat ? ` heat-${day.heat}` : ""}" type="button" data-action="calendar-select" data-date="${day.iso}" aria-label="${escapeAttribute(formatDate(day.iso, { weekday: "long", month: "long", day: "numeric", year: "numeric" }))}, ${day.summary.count} shifts, ${formatMoney(day.summary.net)} net"><span class="calendar-day-number">${day.date.getDate()}</span>${day.summary.count ? `<span class="calendar-day-net">${formatMoney(day.summary.net, { compact: true })}</span><span class="calendar-day-count">${day.summary.count} shift${day.summary.count === 1 ? "" : "s"}</span>` : ""}</button>`).join("")}</div>
        </section>
        <aside class="calendar-detail panel">
          <div class="eyebrow">Selected day</div><h2 class="detail-date">${selectedDate ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(selectedDate) : "Choose a date"}</h2>
          <div class="detail-summary-grid"><div class="detail-summary-item"><span>Net</span><strong>${formatMoney(selectedSummary.net)}</strong></div><div class="detail-summary-item"><span>Gross</span><strong>${formatMoney(selectedSummary.gross)}</strong></div><div class="detail-summary-item"><span>Hours</span><strong>${formatNumber(selectedSummary.hours, 1)}</strong></div><div class="detail-summary-item"><span>Miles</span><strong>${formatNumber(selectedSummary.miles, 1)}</strong></div></div>
          ${selectedList.length ? `<div class="detail-shift-list">${sortedShifts(selectedList).map((raw) => { const shift = Core.calculateShift(raw, state.settings); return `<button class="detail-shift" type="button" data-action="edit-shift" data-id="${escapeAttribute(shift.id)}"><div class="detail-shift-top"><strong>${escapeHtml(shift.platform)}</strong><strong class="text-accent">${formatMoney(shift.net)}</strong></div><div class="detail-shift-meta">${escapeHtml(formatTime(shift.startTime))}–${escapeHtml(formatTime(shift.endTime))} · ${formatDuration(shift.hours)} · ${formatNumber(shift.miles, 1)} mi</div></button>`; }).join("")}</div>` : `<p class="panel-subtitle" style="margin:18px 0">No shifts recorded on this date.</p><button class="button button-primary button-wide" type="button" data-action="add-shift-on-date" data-date="${escapeAttribute(ui.calendarSelected)}">${icon("calendarAdd", "icon icon-sm")}Add shift on this date</button>`}
          <div class="divider"></div>
          <div class="panel-header"><div><h3 class="panel-title">Monthly goal</h3><p class="panel-subtitle">${monthlyGoal ? `${formatMoney(data.summary.net, { noCents: true })} of ${formatMoney(monthlyGoal, { noCents: true })}` : "No monthly goal set"}</p></div><span class="pill ${progress >= 100 ? "pill-success" : "pill-info"}">${progress.toFixed(0)}%</span></div><div class="progress progress-lg"><div class="progress-fill" style="width:${progress.toFixed(2)}%"></div></div><div style="margin-top:12px"><button class="button button-ghost button-small" type="button" data-route="settings">${icon("settings", "icon icon-sm")}Adjust goal</button></div>
        </aside>
      </div>
    </div>`;
  }

  function sortedMaintenance(list) {
    return (list || state.maintenance).slice().sort((a, b) => {
      const dateCompare = String(b.date).localeCompare(String(a.date));
      if (dateCompare) return dateCompare;
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });
  }

  function filteredMaintenance() {
    const search = ui.vehicleFilters.search.trim().toLowerCase();
    return sortedMaintenance().filter((item) => {
      if (ui.vehicleFilters.type !== "all" && item.type !== ui.vehicleFilters.type) return false;
      if (!search) return true;
      return [item.date, formatDate(item.date), item.type, item.note, item.amount, item.odometer, item.nextDueOdometer].join(" ").toLowerCase().includes(search);
    });
  }

  function latestMaintenanceMatching(pattern) {
    return state.maintenance
      .filter((item) => pattern.test(item.type))
      .slice()
      .sort((a, b) => Core.safeNumber(b.odometer) - Core.safeNumber(a.odometer) || String(b.date).localeCompare(String(a.date)))[0] || null;
  }

  function serviceReminder(label, pattern, interval, currentOdometer) {
    const latest = latestMaintenanceMatching(pattern);
    if (!latest) {
      return {
        label,
        status: "Not tracked",
        detail: "Log the service once to start mileage-based reminders.",
        className: "",
        dueAt: 0
      };
    }
    const dueAt = Core.safeNumber(latest.nextDueOdometer) || (Core.safeNumber(latest.odometer) + Core.safeNumber(interval));
    if (!dueAt) {
      return { label, status: "Interval needed", detail: `Last logged ${formatShortDate(latest.date)}.`, className: "", dueAt: 0 };
    }
    const remaining = dueAt - currentOdometer;
    const soonThreshold = Math.max(500, Core.safeNumber(interval) * 0.15);
    return {
      label,
      status: remaining <= 0 ? `${formatNumber(Math.abs(remaining), 0)} mi overdue` : `${formatNumber(remaining, 0)} mi remaining`,
      detail: `Due at ${formatNumber(dueAt, 0)} mi · last logged ${formatShortDate(latest.date)}`,
      className: remaining <= 0 ? "is-due" : remaining <= soonThreshold ? "is-soon" : "",
      dueAt
    };
  }

  function renderReminderCard(reminder, iconName) {
    return `<article class="reminder-card panel ${reminder.className}"><div class="reminder-head"><div class="reminder-icon">${icon(iconName || "wrench", "icon icon-sm")}</div>${reminder.className === "is-due" ? '<span class="pill pill-danger">Due</span>' : reminder.className === "is-soon" ? '<span class="pill pill-warning">Soon</span>' : '<span class="pill">Tracked</span>'}</div><h3>${escapeHtml(reminder.label)}</h3><strong>${escapeHtml(reminder.status)}</strong><p>${escapeHtml(reminder.detail)}</p></article>`;
  }

  function renderVehiclePage() {
    const fund = vehicleFundSummary();
    const odometer = Core.currentOdometer(state.shifts, state.maintenance, state.settings);
    const oil = serviceReminder("Oil change", /oil/i, state.settings.vehicle.oilInterval, odometer);
    const tires = serviceReminder("Tire rotation", /tire rotation/i, state.settings.vehicle.tireInterval, odometer);
    const explicitUpcoming = state.maintenance
      .filter((item) => Core.safeNumber(item.nextDueOdometer) > 0)
      .map((item) => ({ item, remaining: Core.safeNumber(item.nextDueOdometer) - odometer }))
      .sort((a, b) => a.remaining - b.remaining)[0];
    const nextReminder = explicitUpcoming ? {
      label: explicitUpcoming.item.type,
      status: explicitUpcoming.remaining <= 0 ? `${formatNumber(Math.abs(explicitUpcoming.remaining), 0)} mi overdue` : `${formatNumber(explicitUpcoming.remaining, 0)} mi remaining`,
      detail: `Due at ${formatNumber(explicitUpcoming.item.nextDueOdometer, 0)} mi${explicitUpcoming.item.note ? ` · ${explicitUpcoming.item.note}` : ""}`,
      className: explicitUpcoming.remaining <= 0 ? "is-due" : explicitUpcoming.remaining <= 750 ? "is-soon" : ""
    } : {
      label: "Next custom service",
      status: "Nothing scheduled",
      detail: "Set a next-due odometer when logging maintenance.",
      className: ""
    };
    const types = Array.from(new Set([...MAINTENANCE_TYPES, ...state.maintenance.map((item) => item.type)])).filter(Boolean);

    return `<div class="page-stack">
      <div class="vehicle-hero-grid">
        <section class="vehicle-fund-card"><div class="panel-header"><div><div class="eyebrow">Available reserve</div><h2>Vehicle fund balance</h2></div>${icon("wallet", "icon icon-lg text-accent")}</div><strong class="vehicle-fund-balance ${fund.balance < 0 ? "text-red" : ""}">${formatMoney(fund.balance)}</strong><div class="vehicle-fund-meta"><span>${formatMoney(fund.contributions)} contributed</span><span>${formatMoney(fund.spent)} maintenance logged</span></div><div style="margin-top:20px"><button class="button button-primary button-small" type="button" data-action="open-maintenance">${icon("plus", "icon icon-sm")}Log maintenance</button></div></section>
        <section class="odometer-card"><div class="panel-header"><div><div class="eyebrow">${escapeHtml(state.settings.vehicle.name)}</div><h2 class="panel-title">Current odometer</h2></div>${icon("car", "icon icon-lg text-blue")}</div><strong class="odometer-value">${formatNumber(odometer, 0)} <span class="muted" style="font-size:.42em;letter-spacing:0">mi</span></strong><p class="panel-subtitle" style="margin-top:10px">Updated from your highest saved shift, maintenance record, or vehicle setting.</p><div style="margin-top:18px"><button class="button button-ghost button-small" type="button" data-route="settings">${icon("settings", "icon icon-sm")}Vehicle settings</button></div></section>
      </div>
      <section><div class="section-header"><div><h2 class="section-title">Service reminders</h2><p class="section-subtitle">Mileage-based planning from your maintenance history</p></div></div><div class="reminder-grid">${renderReminderCard(oil, "fuel")}${renderReminderCard(tires, "route")}${renderReminderCard(nextReminder, "wrench")}</div></section>
      <section class="toolbar"><div class="toolbar-row"><div><h2 class="panel-title">Maintenance ledger</h2><p class="panel-subtitle" id="maintenanceResultsMeta">Loading service history…</p></div><button class="button button-primary button-small" type="button" data-action="open-maintenance">${icon("plus", "icon icon-sm")}Add record</button></div><div class="filter-grid" style="grid-template-columns:minmax(220px,1.5fr) minmax(180px,.65fr)"><div class="field"><label for="maintenanceSearch">Search</label><div class="input-wrap">${icon("search", "input-icon")}<input id="maintenanceSearch" type="search" placeholder="Type, note, date…" value="${escapeAttribute(ui.vehicleFilters.search)}" data-filter="maintenance-search"></div></div><div class="field"><label for="maintenanceType">Service type</label><select id="maintenanceType" data-filter="maintenance-type"><option value="all">All service types</option>${types.map((type) => `<option value="${escapeAttribute(type)}"${ui.vehicleFilters.type === type ? " selected" : ""}>${escapeHtml(type)}</option>`).join("")}</select></div></div></section>
      <div id="maintenanceResults"></div>
    </div>`;
  }

  function updateVehicleResults() {
    const root = document.getElementById("maintenanceResults");
    const meta = document.getElementById("maintenanceResultsMeta");
    if (!root || !meta) return;
    const list = filteredMaintenance();
    const total = list.reduce((sum, item) => sum + Core.safeNumber(item.amount), 0);
    meta.textContent = `${list.length} of ${state.maintenance.length} record${state.maintenance.length === 1 ? "" : "s"} · ${formatMoney(total)} shown`;
    if (!list.length) {
      root.innerHTML = emptyState({
        icon: "wrench",
        title: state.maintenance.length ? "No maintenance matches" : "Build a vehicle service history",
        body: state.maintenance.length ? "Try another service type or clear your search." : "Record oil changes, tires, repairs, washes, and scheduled mileage in one ledger.",
        action: state.maintenance.length ? "clear-maintenance-filters" : "open-maintenance",
        actionLabel: state.maintenance.length ? "Clear filters" : "Log first service",
        actionIcon: state.maintenance.length ? "refresh" : "plus"
      });
      return;
    }
    root.innerHTML = `<div class="data-table-wrap"><table class="data-table" style="min-width:760px"><thead><tr><th>Date</th><th>Service</th><th>Cost</th><th>Odometer</th><th>Next due</th><th>Note</th><th><span class="visually-hidden">Actions</span></th></tr></thead><tbody>${list.map((item) => `<tr><td><span class="table-primary">${escapeHtml(formatDate(item.date, { month: "short", day: "numeric", year: "numeric" }))}</span></td><td><span class="platform-pill">${escapeHtml(item.type)}</span></td><td class="table-number">${formatMoney(item.amount)}</td><td class="table-number">${item.odometer ? `${formatNumber(item.odometer, 0)} mi` : "—"}</td><td class="table-number">${item.nextDueOdometer ? `${formatNumber(item.nextDueOdometer, 0)} mi` : "—"}</td><td><span class="table-secondary" style="margin:0;max-width:260px;white-space:normal">${escapeHtml(item.note || "—")}</span></td><td><div class="row-actions"><button class="icon-button" type="button" data-action="edit-maintenance" data-id="${escapeAttribute(item.id)}" aria-label="Edit maintenance record">${icon("edit", "icon icon-sm")}</button><button class="icon-button" type="button" data-action="delete-maintenance" data-id="${escapeAttribute(item.id)}" aria-label="Delete maintenance record">${icon("trash", "icon icon-sm")}</button></div></td></tr>`).join("")}</tbody></table></div>`;
  }

  function goalTiming(goal) {
    if (!goal.targetDate) return "No target date";
    const target = Core.parseISODate(goal.targetDate);
    if (!target) return "No target date";
    const today = Core.startOfDay(new Date());
    const days = Math.ceil((target.getTime() - today.getTime()) / 86400000);
    if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} past target`;
    if (days === 0) return "Target is today";
    return `${days} day${days === 1 ? "" : "s"} remaining`;
  }

  function renderGoalCard(goal) {
    const saved = Core.goalSaved(goal);
    const percent = goal.target > 0 ? Math.min(100, Math.max(0, saved / goal.target * 100)) : 0;
    const complete = goal.target > 0 && saved >= goal.target;
    const remaining = Math.max(0, goal.target - saved);
    const latest = goal.contributions.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
    return `<article class="goal-card-item panel${complete ? " is-complete" : ""}"><div class="goal-card-top"><div><h3>${escapeHtml(goal.name)}</h3><p>${escapeHtml(goal.archived ? "Archived" : goalTiming(goal))}</p></div><span class="goal-percent">${percent.toFixed(0)}%</span></div><div class="goal-money-row"><strong>${formatMoney(saved, { noCents: true })}</strong><span>of ${formatMoney(goal.target, { noCents: true })}</span></div><div style="margin-top:13px"><div class="progress"><div class="progress-fill" style="width:${percent.toFixed(2)}%"></div></div><div class="progress-meta"><span>${complete ? "Target funded" : `${formatMoney(remaining, { noCents: true })} to go`}</span><span>${goal.contributions.length} deposit${goal.contributions.length === 1 ? "" : "s"}</span></div></div>${goal.note ? `<p class="panel-subtitle" style="margin-top:14px">${escapeHtml(goal.note)}</p>` : ""}${latest ? `<p class="field-help">Latest: ${formatMoney(latest.amount)} on ${formatShortDate(latest.date)}${latest.note ? ` · ${escapeHtml(latest.note)}` : ""}</p>` : ""}<div class="goal-card-actions"><button class="button button-primary button-small" type="button" data-action="add-contribution" data-id="${escapeAttribute(goal.id)}">${icon("contribution", "icon icon-sm")}Add funds</button><button class="button button-secondary button-small" type="button" data-action="edit-goal" data-id="${escapeAttribute(goal.id)}">${icon("edit", "icon icon-sm")}Edit</button><button class="button button-ghost button-small" type="button" data-action="archive-goal" data-id="${escapeAttribute(goal.id)}" aria-label="${goal.archived ? "Restore" : "Archive"} goal">${icon(goal.archived ? "refresh" : "archive", "icon icon-sm")}</button></div></article>`;
  }

  function renderGoalsPage() {
    const goals = state.goals.slice().sort((a, b) => Number(a.archived) - Number(b.archived) || String(a.targetDate || "9999").localeCompare(String(b.targetDate || "9999")) || String(a.name).localeCompare(String(b.name)));
    const active = goals.filter((goal) => !goal.archived);
    const archived = goals.filter((goal) => goal.archived);
    const target = active.reduce((sum, goal) => sum + goal.target, 0);
    const saved = active.reduce((sum, goal) => sum + Core.goalSaved(goal), 0);
    const completed = active.filter((goal) => goal.target > 0 && Core.goalSaved(goal) >= goal.target).length;
    return `<div class="page-stack">
      <section class="toolbar"><div class="toolbar-row"><div><h2 class="panel-title">Goal portfolio</h2><p class="panel-subtitle">Fund personal targets with deliberate contributions from your spendable cash.</p></div><button class="button button-primary button-small" type="button" data-action="open-goal">${icon("plus", "icon icon-sm")}New goal</button></div></section>
      <section class="goals-summary-grid">
        ${metricCard({ icon: "goal", label: "Active targets", value: formatMoney(target, { noCents: true }), meta: `${active.length} active goal${active.length === 1 ? "" : "s"}` })}
        ${metricCard({ icon: "wallet", iconClass: "is-blue", label: "Total funded", value: formatMoney(saved, { noCents: true }), meta: target ? `${Math.min(100, saved / target * 100).toFixed(0)}% across active goals` : "Create a goal to begin" })}
        ${metricCard({ icon: "check", iconClass: "is-violet", label: "Completed", value: formatNumber(completed), meta: `${formatMoney(Math.max(0, target - saved), { noCents: true })} remaining across active goals` })}
      </section>
      ${active.length ? `<section><div class="section-header"><div><h2 class="section-title">Active goals</h2><p class="section-subtitle">Your current funding priorities</p></div></div><div class="goals-grid">${active.map(renderGoalCard).join("")}</div></section>` : emptyState({ icon: "goal", title: "Give your earnings a destination", body: "Create a goal, set a target, and add contributions without changing your shift history.", action: "open-goal", actionLabel: "Create first goal" })}
      ${archived.length ? `<section><div class="section-header"><div><h2 class="section-title">Archived goals</h2><p class="section-subtitle">Past targets kept for your records</p></div></div><div class="goals-grid">${archived.map(renderGoalCard).join("")}</div></section>` : ""}
    </div>`;
  }

  function renderTaxRateRows() {
    return state.settings.taxRates.map((rate) => `<div class="rate-row" data-rate-row data-rate-id="${escapeAttribute(rate.id)}"><div class="field"><label>Effective date</label><input type="date" name="rateEffective" value="${escapeAttribute(rate.effective)}" required></div><div class="field"><label>Rate per mile</label><div class="input-prefix-wrap"><span class="input-prefix">$</span><input type="number" name="rateAmount" value="${escapeAttribute(rate.rate)}" min="0" step="0.001" required></div></div><div class="field"><label>Label</label><input type="text" name="rateLabel" value="${escapeAttribute(rate.label)}" maxlength="60" required></div><button class="icon-button rate-delete" type="button" data-action="delete-tax-rate" aria-label="Remove mileage rate">${icon("trash", "icon icon-sm")}</button></div>`).join("");
  }

  function formatBytes(bytes) {
    const value = Math.max(0, Core.safeNumber(bytes));
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  function renderSettingsPage() {
    const settings = state.settings;
    const serializedBytes = new Blob([JSON.stringify(serializeState())]).size;
    return `<div class="settings-layout">
      <form data-form="settings" novalidate>
        <section class="settings-section panel"><div class="settings-section-header"><div><h2>Dashboard preferences</h2><p>Choose how the command center opens and how weeks are grouped.</p></div>${icon("settings", "icon icon-lg text-blue")}</div><div class="settings-grid is-three"><div class="field"><label for="settingTheme">Appearance</label><select id="settingTheme" name="theme"><option value="dark"${settings.theme === "dark" ? " selected" : ""}>Dark</option><option value="light"${settings.theme === "light" ? " selected" : ""}>Light</option></select></div><div class="field"><label for="settingPlatform">Default platform</label><select id="settingPlatform" name="defaultPlatform">${platformOptionMarkup(settings.defaultPlatform)}</select></div><div class="field"><label for="settingWeekStart">Week starts on</label><select id="settingWeekStart" name="weekStartsOn"><option value="1"${settings.weekStartsOn === 1 ? " selected" : ""}>Monday</option><option value="0"${settings.weekStartsOn === 0 ? " selected" : ""}>Sunday</option><option value="6"${settings.weekStartsOn === 6 ? " selected" : ""}>Saturday</option></select></div></div></section>

        <section class="settings-section panel" style="margin-top:18px"><div class="settings-section-header"><div><h2>Money allocation & targets</h2><p>Percentages apply to positive net earnings on new shifts. Saved historical shifts keep their original allocation rates.</p></div><span class="pill" id="allocationTotal">25% allocated</span></div><div class="settings-grid is-three"><div class="field"><label for="investmentPct">Investment</label><div class="input-suffix-wrap"><input id="investmentPct" type="number" name="investmentPct" value="${escapeAttribute(settings.allocations.investment)}" min="0" max="100" step="0.1" data-allocation><span class="input-suffix">%</span></div></div><div class="field"><label for="savingsPct">Savings</label><div class="input-suffix-wrap"><input id="savingsPct" type="number" name="savingsPct" value="${escapeAttribute(settings.allocations.savings)}" min="0" max="100" step="0.1" data-allocation><span class="input-suffix">%</span></div></div><div class="field"><label for="vehiclePct">Vehicle fund</label><div class="input-suffix-wrap"><input id="vehiclePct" type="number" name="vehiclePct" value="${escapeAttribute(settings.allocations.vehicle)}" min="0" max="100" step="0.1" data-allocation><span class="input-suffix">%</span></div></div><div class="field"><label for="weeklyGoal">Weekly net goal</label><div class="input-prefix-wrap"><span class="input-prefix">$</span><input id="weeklyGoal" type="number" name="weeklyNetGoal" value="${settings.weeklyNetGoal || ""}" min="0" step="1" placeholder="0"></div></div><div class="field"><label for="monthlyGoal">Monthly net goal</label><div class="input-prefix-wrap"><span class="input-prefix">$</span><input id="monthlyGoal" type="number" name="monthlyNetGoal" value="${settings.monthlyNetGoal || ""}" min="0" step="1" placeholder="0"></div></div><div class="field"><label>Unallocated / spendable</label><div class="control" id="spendableAllocation" style="display:flex;align-items:center">${formatNumber(100 - settings.allocations.investment - settings.allocations.savings - settings.allocations.vehicle, 1)}%</div></div></div><p class="field-help" id="allocationHelp">The combined allocation must not exceed 100%.</p></section>

        <section class="settings-section panel" style="margin-top:18px"><div class="settings-section-header"><div><h2>Business mileage rate schedule</h2><p>Rates are selected by shift date. Add historical or future periods without changing saved mileage.</p></div><button class="button button-ghost button-small" type="button" data-action="add-tax-rate">${icon("plus", "icon icon-sm")}Add rate</button></div><div class="rate-list" id="taxRateList">${renderTaxRateRows()}</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="button button-ghost button-small" type="button" data-action="restore-default-rates">${icon("refresh", "icon icon-sm")}Restore built-in schedule</button></div><p class="field-help">Mileage deduction figures are recordkeeping estimates only. Confirm current rules and eligibility with a qualified tax professional.</p></section>

        <section class="settings-section panel" style="margin-top:18px"><div class="settings-section-header"><div><h2>Vehicle profile</h2><p>These defaults power the vehicle center and reminder estimates.</p></div>${icon("car", "icon icon-lg text-violet")}</div><div class="settings-grid"><div class="field"><label for="vehicleName">Vehicle label</label><input id="vehicleName" type="text" name="vehicleName" value="${escapeAttribute(settings.vehicle.name)}" maxlength="80"></div><div class="field"><label for="vehicleOdometer">Current odometer</label><div class="input-suffix-wrap"><input id="vehicleOdometer" type="number" name="vehicleOdometer" value="${escapeAttribute(settings.vehicle.currentOdometer)}" min="0" step="1"><span class="input-suffix">mi</span></div></div><div class="field"><label for="oilInterval">Oil-change interval</label><div class="input-suffix-wrap"><input id="oilInterval" type="number" name="oilInterval" value="${escapeAttribute(settings.vehicle.oilInterval)}" min="0" step="100"><span class="input-suffix">mi</span></div></div><div class="field"><label for="tireInterval">Tire-rotation interval</label><div class="input-suffix-wrap"><input id="tireInterval" type="number" name="tireInterval" value="${escapeAttribute(settings.vehicle.tireInterval)}" min="0" step="100"><span class="input-suffix">mi</span></div></div></div></section>

        <div style="display:flex;justify-content:flex-end;margin-top:18px"><button class="button button-primary" type="submit">${icon("check", "icon icon-sm")}Save settings</button></div>
      </form>

      <section class="settings-section panel"><div class="settings-section-header"><div><h2>Data controls</h2><p>Back up, move, or reset the dashboard. Everything stays local until you export a file.</p></div>${icon("database", "icon icon-lg text-accent")}</div><div class="data-actions"><button class="data-action-card" type="button" data-action="export-backup"><span class="data-icon">${icon("download", "icon icon-sm")}</span><h3>Full backup</h3><p>Download shifts, settings, goals, maintenance, and any active shift as JSON.</p><span class="button button-ghost button-small">Download JSON</span></button><button class="data-action-card" type="button" data-action="import-data"><span class="data-icon">${icon("upload", "icon icon-sm")}</span><h3>Import data</h3><p>Merge or replace data from a dashboard JSON backup or a shift CSV file.</p><span class="button button-ghost button-small">Choose file</span></button><button class="data-action-card" type="button" data-action="reset-data"><span class="data-icon" style="color:var(--red);background:var(--red-soft)">${icon("trash", "icon icon-sm")}</span><h3>Reset dashboard</h3><p>Erase all locally stored dashboard data and return settings to defaults.</p><span class="button button-danger button-small">Reset local data</span></button></div><div class="storage-meter"><div class="storage-item"><span>Shifts</span><strong>${state.shifts.length}</strong></div><div class="storage-item"><span>Maintenance</span><strong>${state.maintenance.length}</strong></div><div class="storage-item"><span>Goals</span><strong>${state.goals.length}</strong></div><div class="storage-item"><span>Backup size</span><strong>${formatBytes(serializedBytes)}</strong></div></div></section>

      <section class="settings-section panel"><div class="settings-section-header"><div><h2>Privacy & version</h2><p>Driver Command has no account, server database, ad tracking, or cloud sync. Browser storage is the source of truth, so regular backups are recommended.</p></div>${icon("lock", "icon icon-lg text-blue")}</div><div class="summary-strip"><div class="summary-stat"><span>Version</span><strong>${escapeHtml(Core.APP_VERSION)}</strong></div><div class="summary-stat"><span>Storage</span><strong>Local</strong></div><div class="summary-stat"><span>Offline</span><strong>Ready</strong></div><div class="summary-stat"><span>Legacy data</span><strong>Compatible</strong></div><div class="summary-stat"><span>Build</span><strong>Premium</strong></div></div></section>
    </div>`;
  }

  function updateAllocationTotal() {
    const inputs = Array.from(document.querySelectorAll("[data-allocation]"));
    const badge = document.getElementById("allocationTotal");
    const spendable = document.getElementById("spendableAllocation");
    const help = document.getElementById("allocationHelp");
    if (!inputs.length || !badge || !spendable || !help) return;
    const total = inputs.reduce((sum, input) => sum + Math.max(0, Core.safeNumber(input.value)), 0);
    const remaining = 100 - total;
    badge.textContent = `${formatNumber(total, 1)}% allocated`;
    badge.className = `pill ${total > 100 ? "pill-danger" : total === 100 ? "pill-warning" : "pill-info"}`;
    spendable.textContent = `${formatNumber(Math.max(0, remaining), 1)}%`;
    help.textContent = total > 100 ? `Reduce allocations by ${formatNumber(total - 100, 1)} percentage points before saving.` : `${formatNumber(remaining, 1)}% of positive net earnings remains spendable.`;
    help.className = `field-help ${total > 100 ? "text-red" : ""}`;
    inputs.forEach((input) => input.setAttribute("aria-invalid", total > 100 ? "true" : "false"));
  }

  function modalShell(config) {
    return `<div class="modal-backdrop" data-action="modal-backdrop"><section class="modal ${config.className || ""}" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><header class="modal-header"><div><h2 id="modalTitle">${escapeHtml(config.title)}</h2>${config.subtitle ? `<p>${escapeHtml(config.subtitle)}</p>` : ""}</div><button class="icon-button modal-close" type="button" data-action="close-modal" aria-label="Close dialog">${icon("close", "icon icon-sm")}</button></header><div class="modal-body">${config.body}</div>${config.footer ? `<footer class="modal-footer">${config.footer}</footer>` : ""}</section></div>`;
  }

  function openModal(config) {
    if (!ui.modal) modalReturnFocus = document.activeElement || null;
    ui.modal = config.meta || { type: "custom" };
    dom.modalRoot.innerHTML = modalShell(config);
    document.body.style.overflow = "hidden";
    window.setTimeout(() => {
      const target = dom.modalRoot.querySelector("[autofocus], input:not([type=hidden]), select, textarea, button");
      if (target) target.focus();
      const form = dom.modalRoot.querySelector('[data-form="shift"]');
      if (form) updateShiftPreview(form);
    }, 0);
  }

  function dismissModal() {
    const onCancel = ui.modal && ui.modal.onCancel;
    if (typeof onCancel === "function") onCancel();
    else closeModal();
  }

  function trapModalFocus(event) {
    if (!ui.modal || !dom.modalRoot) return;
    const focusable = Array.from(dom.modalRoot.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    const activeInside = typeof dom.modalRoot.contains === "function" ? dom.modalRoot.contains(active) : true;
    if (event.shiftKey && (active === first || !activeInside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !activeInside)) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeModal(restoreFocus) {
    if (!dom.modalRoot) return;
    const returnTarget = modalReturnFocus;
    modalReturnFocus = null;
    dom.modalRoot.innerHTML = "";
    document.body.style.overflow = "";
    ui.modal = null;
    if (restoreFocus !== false) {
      if (returnTarget && typeof returnTarget.focus === "function") returnTarget.focus({ preventScroll: true });
      else {
        const fallback = document.querySelector('[data-action="open-add-shift"]');
        if (fallback) fallback.focus({ preventScroll: true });
      }
    }
  }

  function platformOptionMarkup(selected) {
    const options = Array.from(new Set([...PLATFORM_OPTIONS, selected].filter(Boolean)));
    return options.map((platform) => `<option value="${escapeAttribute(platform)}"${platform === selected ? " selected" : ""}>${escapeHtml(platform)}</option>`).join("");
  }

  function numberField(config) {
    const prefix = config.prefix ? `<span class="input-prefix">${escapeHtml(config.prefix)}</span>` : "";
    const suffix = config.suffix ? `<span class="input-suffix">${escapeHtml(config.suffix)}</span>` : "";
    const wrap = config.prefix ? "input-prefix-wrap" : config.suffix ? "input-suffix-wrap" : "";
    return `<div class="field ${config.className || ""}"><label for="${escapeAttribute(config.id)}">${escapeHtml(config.label)}</label><div class="${wrap}">${prefix}<input id="${escapeAttribute(config.id)}" type="number" name="${escapeAttribute(config.name)}" value="${config.value == null || config.value === 0 && config.blankZero ? "" : escapeAttribute(config.value)}" min="${config.min == null ? "0" : escapeAttribute(config.min)}" ${config.max == null ? "" : `max="${escapeAttribute(config.max)}"`} step="${escapeAttribute(config.step || "0.01")}" ${config.placeholder ? `placeholder="${escapeAttribute(config.placeholder)}"` : ""}>${suffix}</div>${config.help ? `<p class="field-help">${escapeHtml(config.help)}</p>` : ""}</div>`;
  }

  function shiftModalCopy(mode) {
    const map = {
      add: ["Add completed shift", "Record a past driving session with detailed costs, mileage, and allocation rules.", "Save shift"],
      edit: ["Edit shift", "Update this ledger entry without disturbing the rest of your history.", "Save changes"],
      start: ["Start live shift", "Begin an automatically timed shift. You can update earnings and mileage while it is active.", "Start shift"],
      update: ["Update live shift", "Save the latest earnings, expenses, mileage, and notes without ending the timer.", "Save live draft"],
      end: ["Finish live shift", "Add the ending details and commit this live session to your completed ledger.", "Finish & save"]
    };
    return map[mode] || map.add;
  }

  function openShiftModal(mode, supplied) {
    const source = supplied || (mode === "edit" ? getShift(ui.modal && ui.modal.id) : null) || ((mode === "update" || mode === "end") ? state.activeShift : null) || {};
    const defaults = Core.normalizeShift({
      date: source.date || Core.localISODate(),
      platform: source.platform || state.settings.defaultPlatform,
      startTime: source.startTime || (mode === "start" ? currentTimeValue() : ""),
      endTime: source.endTime || (mode === "end" ? currentTimeValue() : ""),
      gross: source.gross,
      fuel: source.fuel,
      tolls: source.tolls,
      otherExpenses: source.otherExpenses,
      startOdometer: source.startOdometer || Core.currentOdometer(state.shifts, state.maintenance, state.settings),
      endOdometer: source.endOdometer,
      manualMiles: source.manualMiles,
      manualHours: source.manualHours,
      trips: source.trips,
      notes: source.notes,
      allocationRates: source.allocationRates || state.settings.allocations,
      id: source.id,
      createdAt: source.createdAt
    }, state.settings);
    const liveMode = mode === "start" || mode === "update";
    const copy = shiftModalCopy(mode);
    const endTimeValue = mode === "end" && !defaults.endTime ? currentTimeValue() : defaults.endTime;
    const allocation = defaults.allocationRates || state.settings.allocations;
    const body = `<form data-form="shift" data-mode="${escapeAttribute(mode)}" data-id="${escapeAttribute(defaults.id || "")}" novalidate>
      <section class="form-section"><h3 class="form-section-title">${icon("calendar", "icon icon-sm")}Shift timing</h3><div class="form-grid is-three"><div class="field"><label for="shiftDate">Date</label><input id="shiftDate" type="date" name="date" value="${escapeAttribute(defaults.date)}" required autofocus></div><div class="field"><label for="shiftPlatformInput">Platform</label><select id="shiftPlatformInput" name="platform">${platformOptionMarkup(defaults.platform)}</select></div><div class="field"><label for="shiftTrips">Trips / deliveries</label><input id="shiftTrips" type="number" name="trips" value="${defaults.trips || ""}" min="0" step="1" placeholder="0"></div><div class="field"><label for="shiftStartTime">Start time</label><input id="shiftStartTime" type="time" name="startTime" value="${escapeAttribute(defaults.startTime)}" ${liveMode || mode === "end" ? "required" : ""}></div>${liveMode ? `<div class="field"><label>Live duration</label><div class="control" style="display:flex;align-items:center" data-live-duration>${formatDuration(activeDurationHours(), true)}</div></div>` : `<div class="field"><label for="shiftEndTime">End time</label><input id="shiftEndTime" type="time" name="endTime" value="${escapeAttribute(endTimeValue)}"></div><div class="field"><label for="shiftManualHours">Manual hours</label><div class="input-suffix-wrap"><input id="shiftManualHours" type="number" name="manualHours" value="${defaults.manualHours || ""}" min="0" step="0.05" placeholder="Use when times are unknown"><span class="input-suffix">hr</span></div></div>`}</div></section>
      <section class="form-section"><h3 class="form-section-title">${icon("dollar", "icon icon-sm")}Earnings & direct costs</h3><div class="form-grid is-three">${numberField({ id: "shiftGross", name: "gross", label: "Gross earnings", value: defaults.gross, prefix: "$", blankZero: true })}${numberField({ id: "shiftFuel", name: "fuel", label: "Fuel", value: defaults.fuel, prefix: "$", blankZero: true })}${numberField({ id: "shiftTolls", name: "tolls", label: "Tolls / parking", value: defaults.tolls, prefix: "$", blankZero: true })}${numberField({ id: "shiftOther", name: "otherExpenses", label: "Other expenses", value: defaults.otherExpenses, prefix: "$", blankZero: true })}</div></section>
      <section class="form-section"><h3 class="form-section-title">${icon("route", "icon icon-sm")}Mileage</h3><div class="form-grid is-three">${numberField({ id: "shiftStartOdometer", name: "startOdometer", label: "Start odometer", value: defaults.startOdometer, suffix: "mi", step: "0.1", blankZero: true })}${numberField({ id: "shiftEndOdometer", name: "endOdometer", label: "End odometer", value: defaults.endOdometer, suffix: "mi", step: "0.1", blankZero: true })}${numberField({ id: "shiftManualMiles", name: "manualMiles", label: "Manual business miles", value: defaults.manualMiles, suffix: "mi", step: "0.1", blankZero: true, help: "Used only when an odometer difference is unavailable." })}</div></section>
      <section class="form-section"><h3 class="form-section-title">${icon("wallet", "icon icon-sm")}Allocation for this shift</h3><div class="form-grid is-three">${numberField({ id: "shiftInvestment", name: "allocationInvestment", label: "Investment", value: allocation.investment, suffix: "%", step: "0.1", max: "100" })}${numberField({ id: "shiftSavings", name: "allocationSavings", label: "Savings", value: allocation.savings, suffix: "%", step: "0.1", max: "100" })}${numberField({ id: "shiftVehicle", name: "allocationVehicle", label: "Vehicle fund", value: allocation.vehicle, suffix: "%", step: "0.1", max: "100" })}</div><p class="field-help">These percentages are stored with this shift, so future settings changes will not rewrite history.</p></section>
      <section class="form-section"><h3 class="form-section-title">${icon("receipt", "icon icon-sm")}Notes</h3><div class="field"><label for="shiftNotes">Optional context</label><textarea id="shiftNotes" name="notes" maxlength="1000" placeholder="Airport queue, surge window, route notes, unusual costs…">${escapeHtml(defaults.notes)}</textarea></div></section>
      <div class="form-summary" data-shift-preview></div>
    </form>`;
    openModal({
      title: copy[0],
      subtitle: copy[1],
      body,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="submit-shift-form">${mode === "start" ? icon("play", "icon icon-sm") : mode === "end" ? icon("stop", "icon icon-sm") : icon("check", "icon icon-sm")}${escapeHtml(copy[2])}</button>`,
      className: "modal-wide",
      meta: { type: "shift", mode, id: defaults.id || "", supplied: supplied || null }
    });
  }

  function shiftFormValue(form, name) {
    const field = form.elements.namedItem(name);
    return field ? field.value : "";
  }

  function shiftFromForm(form, preview) {
    const mode = form.dataset.mode;
    const existing = mode === "edit" ? getShift(form.dataset.id) : (mode === "update" || mode === "end") ? state.activeShift : null;
    const livePreview = (mode === "start" || mode === "update") && preview;
    const allocations = {
      investment: Core.safeNumber(shiftFormValue(form, "allocationInvestment")),
      savings: Core.safeNumber(shiftFormValue(form, "allocationSavings")),
      vehicle: Core.safeNumber(shiftFormValue(form, "allocationVehicle"))
    };
    return Core.normalizeShift({
      id: existing && existing.id ? existing.id : form.dataset.id || undefined,
      date: shiftFormValue(form, "date"),
      platform: shiftFormValue(form, "platform"),
      startTime: shiftFormValue(form, "startTime"),
      endTime: livePreview ? currentTimeValue() : shiftFormValue(form, "endTime"),
      gross: shiftFormValue(form, "gross"),
      fuel: shiftFormValue(form, "fuel"),
      tolls: shiftFormValue(form, "tolls"),
      otherExpenses: shiftFormValue(form, "otherExpenses"),
      startOdometer: shiftFormValue(form, "startOdometer"),
      endOdometer: shiftFormValue(form, "endOdometer"),
      manualMiles: shiftFormValue(form, "manualMiles"),
      manualHours: livePreview ? activeDurationHours() : shiftFormValue(form, "manualHours"),
      trips: shiftFormValue(form, "trips"),
      notes: shiftFormValue(form, "notes"),
      allocationRates: allocations,
      createdAt: existing && existing.createdAt ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, state.settings);
  }

  function updateShiftPreview(form) {
    const root = form && form.querySelector("[data-shift-preview]");
    if (!root) return;
    const shift = Core.calculateShift(shiftFromForm(form, true), state.settings);
    root.innerHTML = `<div class="form-summary-item"><span>Net</span><strong>${formatMoney(shift.net)}</strong></div><div class="form-summary-item"><span>Hours</span><strong>${formatNumber(shift.hours, 1)}</strong></div><div class="form-summary-item"><span>Miles</span><strong>${formatNumber(shift.miles, 1)}</strong></div><div class="form-summary-item"><span>Spendable</span><strong>${formatMoney(shift.spendable)}</strong></div>`;
  }

  function validateShiftForm(form) {
    const mode = form.dataset.mode;
    const date = shiftFormValue(form, "date");
    const start = shiftFormValue(form, "startTime");
    const end = shiftFormValue(form, "endTime");
    const manualHours = Core.safeNumber(shiftFormValue(form, "manualHours"));
    const startOdometer = Core.safeNumber(shiftFormValue(form, "startOdometer"));
    const endOdometer = Core.safeNumber(shiftFormValue(form, "endOdometer"));
    const allocationTotal = ["allocationInvestment", "allocationSavings", "allocationVehicle"].reduce((sum, name) => sum + Core.safeNumber(shiftFormValue(form, name)), 0);
    if (!date) return "Choose a shift date.";
    if ((mode === "start" || mode === "update" || mode === "end") && !start) return "Enter the shift start time.";
    if (mode !== "start" && mode !== "update" && !(start && end) && manualHours <= 0) return "Enter start and end times, or provide manual hours.";
    if (startOdometer > 0 && endOdometer > 0 && endOdometer < startOdometer) return "End odometer cannot be lower than start odometer.";
    if (allocationTotal > 100.0001) return "This shift's allocations exceed 100%.";
    return "";
  }

  function submitShiftForm() {
    const form = dom.modalRoot.querySelector('[data-form="shift"]');
    if (!form) return;
    const error = validateShiftForm(form);
    if (error) {
      showToast(error, "error");
      return;
    }
    const mode = form.dataset.mode;
    const record = shiftFromForm(form, false);
    if (mode === "start") {
      if (state.activeShift) {
        showToast("Finish the current live shift before starting another.", "warning");
        return;
      }
      record.endTime = "";
      record.manualHours = 0;
      state.activeShift = record;
      saveState();
      closeModal(false);
      setRoute("overview", { focus: false });
      showToast("Live shift started. Your draft will stay saved locally.", "success");
      return;
    }
    if (mode === "update") {
      record.endTime = "";
      record.manualHours = 0;
      state.activeShift = record;
      saveState();
      closeModal(false);
      renderApp();
      showToast("Live shift updated.", "success");
      return;
    }
    if (mode === "end") {
      state.shifts.push(record);
      state.activeShift = null;
      saveState();
      closeModal(false);
      setRoute("shifts", { focus: false });
      showToast("Shift finished and added to your ledger.", "success");
      return;
    }
    if (mode === "edit") {
      const index = state.shifts.findIndex((shift) => String(shift.id) === String(record.id));
      if (index >= 0) state.shifts[index] = record;
      else state.shifts.push(record);
      saveState();
      closeModal(false);
      renderApp();
      showToast("Shift changes saved.", "success");
      return;
    }
    state.shifts.push(record);
    saveState();
    closeModal(false);
    setRoute("shifts", { focus: false });
    showToast("Shift added to your ledger.", "success");
  }

  function openMaintenanceModal(item) {
    const record = Core.normalizeMaintenance(item || { date: Core.localISODate(), odometer: Core.currentOdometer(state.shifts, state.maintenance, state.settings) });
    const types = Array.from(new Set([...MAINTENANCE_TYPES, record.type].filter(Boolean)));
    const body = `<form data-form="maintenance" data-id="${escapeAttribute(item ? record.id : "")}" novalidate><div class="form-grid"><div class="field"><label for="maintenanceDateInput">Date</label><input id="maintenanceDateInput" type="date" name="date" value="${escapeAttribute(record.date)}" required autofocus></div><div class="field"><label for="maintenanceTypeInput">Service type</label><select id="maintenanceTypeInput" name="type">${types.map((type) => `<option value="${escapeAttribute(type)}"${record.type === type ? " selected" : ""}>${escapeHtml(type)}</option>`).join("")}</select></div>${numberField({ id: "maintenanceAmount", name: "amount", label: "Cost", value: record.amount, prefix: "$", blankZero: true })}${numberField({ id: "maintenanceOdometer", name: "odometer", label: "Odometer", value: record.odometer, suffix: "mi", step: "1", blankZero: true })}${numberField({ id: "maintenanceNextDue", name: "nextDueOdometer", label: "Next due odometer", value: record.nextDueOdometer, suffix: "mi", step: "1", blankZero: true, className: "span-2", help: "Optional. Use this for exact service reminders." })}<div class="field span-2"><label for="maintenanceNote">Notes</label><textarea id="maintenanceNote" name="note" maxlength="1000" placeholder="Brand, shop, work performed, warranty details…">${escapeHtml(record.note)}</textarea></div></div></form>`;
    openModal({ title: item ? "Edit maintenance" : "Log maintenance", subtitle: "Keep service costs, mileage, and next-due details together.", body, footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="submit-maintenance-form">${icon("check", "icon icon-sm")}${item ? "Save changes" : "Add record"}</button>`, meta: { type: "maintenance", id: item ? record.id : "" } });
  }

  function submitMaintenanceForm() {
    const form = dom.modalRoot.querySelector('[data-form="maintenance"]');
    if (!form) return;
    const data = new FormData(form);
    if (!data.get("date")) {
      showToast("Choose a maintenance date.", "error");
      return;
    }
    const existing = form.dataset.id ? getMaintenance(form.dataset.id) : null;
    const record = Core.normalizeMaintenance({
      id: existing ? existing.id : undefined,
      date: data.get("date"),
      type: data.get("type"),
      amount: data.get("amount"),
      odometer: data.get("odometer"),
      nextDueOdometer: data.get("nextDueOdometer"),
      note: data.get("note"),
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    if (existing) state.maintenance[state.maintenance.findIndex((item) => String(item.id) === String(existing.id))] = record;
    else state.maintenance.push(record);
    state.settings.vehicle.currentOdometer = Math.max(state.settings.vehicle.currentOdometer, record.odometer);
    saveState();
    closeModal(false);
    setRoute("vehicle", { focus: false, keepScroll: true });
    showToast(existing ? "Maintenance record updated." : "Maintenance record added.", "success");
  }

  function openGoalModal(goal) {
    const record = Core.normalizeGoal(goal || { name: "", target: 0, targetDate: "", note: "" });
    const body = `<form data-form="goal" data-id="${escapeAttribute(goal ? record.id : "")}" novalidate><div class="form-grid"><div class="field span-2"><label for="goalName">Goal name</label><input id="goalName" type="text" name="name" value="${escapeAttribute(goal ? record.name : "")}" maxlength="100" placeholder="Emergency fund, vacation, new tires…" required autofocus></div>${numberField({ id: "goalTarget", name: "target", label: "Target amount", value: record.target, prefix: "$", blankZero: true })}<div class="field"><label for="goalTargetDate">Target date</label><input id="goalTargetDate" type="date" name="targetDate" value="${escapeAttribute(record.targetDate)}"></div><div class="field span-2"><label for="goalNote">Notes</label><textarea id="goalNote" name="note" maxlength="1000" placeholder="Why this matters, funding plan, or any context…">${escapeHtml(record.note)}</textarea></div></div></form>`;
    const deleteButton = goal ? `<button class="button button-danger" type="button" data-action="delete-goal" data-id="${escapeAttribute(record.id)}">${icon("trash", "icon icon-sm")}Delete</button>` : "";
    openModal({ title: goal ? "Edit goal" : "Create goal", subtitle: "Set a clear target and fund it with traceable contributions.", body, footer: `${deleteButton}<span style="flex:1"></span><button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="submit-goal-form">${icon("check", "icon icon-sm")}${goal ? "Save changes" : "Create goal"}</button>`, meta: { type: "goal", id: goal ? record.id : "" } });
  }

  function submitGoalForm() {
    const form = dom.modalRoot.querySelector('[data-form="goal"]');
    if (!form) return;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const target = Core.safeNumber(data.get("target"));
    if (!name) return showToast("Give the goal a name.", "error");
    if (target <= 0) return showToast("Enter a target amount greater than zero.", "error");
    const existing = form.dataset.id ? getGoal(form.dataset.id) : null;
    const record = Core.normalizeGoal({
      id: existing ? existing.id : undefined,
      name,
      target,
      targetDate: data.get("targetDate"),
      note: data.get("note"),
      archived: existing ? existing.archived : false,
      contributions: existing ? existing.contributions : [],
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    if (existing) state.goals[state.goals.findIndex((goal) => String(goal.id) === String(existing.id))] = record;
    else state.goals.push(record);
    saveState();
    closeModal(false);
    setRoute("goals", { focus: false, keepScroll: true });
    showToast(existing ? "Goal updated." : "Goal created.", "success");
  }

  function openContributionModal(goal) {
    if (!goal) return;
    const saved = Core.goalSaved(goal);
    const remaining = Math.max(0, goal.target - saved);
    const body = `<form data-form="contribution" data-id="${escapeAttribute(goal.id)}" novalidate><div class="goal-total"><strong>${formatMoney(saved)}</strong><span>funded toward ${formatMoney(goal.target)} · ${formatMoney(remaining)} remaining</span></div><div class="form-grid" style="margin-top:18px">${numberField({ id: "contributionAmount", name: "amount", label: "Contribution", value: remaining || "", prefix: "$", blankZero: true })}<div class="field"><label for="contributionDate">Date</label><input id="contributionDate" type="date" name="date" value="${Core.localISODate()}" required></div><div class="field span-2"><label for="contributionNote">Note</label><textarea id="contributionNote" name="note" maxlength="500" placeholder="Optional source or context"></textarea></div></div></form>`;
    openModal({ title: `Fund ${goal.name}`, subtitle: "Add a dated contribution without changing shift allocations.", body, footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="submit-contribution-form">${icon("contribution", "icon icon-sm")}Add contribution</button>`, className: "modal-small", meta: { type: "contribution", id: goal.id } });
  }

  function submitContributionForm() {
    const form = dom.modalRoot.querySelector('[data-form="contribution"]');
    if (!form) return;
    const goal = getGoal(form.dataset.id);
    if (!goal) return closeModal();
    const data = new FormData(form);
    const amount = Core.safeNumber(data.get("amount"));
    if (amount <= 0) return showToast("Enter a contribution greater than zero.", "error");
    goal.contributions.push({ id: Core.uid("contribution"), date: data.get("date") || Core.localISODate(), amount: Core.round(amount, 2), note: String(data.get("note") || "") });
    goal.updatedAt = new Date().toISOString();
    saveState();
    closeModal(false);
    setRoute("goals", { focus: false, keepScroll: true });
    showToast(`${formatMoney(amount)} added to ${goal.name}.`, "success");
  }

  function openConfirm(config) {
    openModal({
      title: config.title,
      subtitle: config.subtitle || "This action needs confirmation.",
      body: `<div class="confirm-copy"><div class="confirm-icon">${icon(config.icon || "warning", "icon icon-lg")}</div><h3>${escapeHtml(config.heading || config.title)}</h3><p>${escapeHtml(config.body)}</p></div>`,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button ${config.danger === false ? "button-primary" : "button-danger"}" type="button" data-action="confirm-modal">${icon(config.confirmIcon || (config.danger === false ? "check" : "trash"), "icon icon-sm")}${escapeHtml(config.confirmLabel || "Confirm")}</button>`,
      className: "modal-small",
      meta: { type: "confirm", onConfirm: config.onConfirm, onCancel: config.onCancel }
    });
  }

  function openMoreModal() {
    const body = `<div class="more-menu">${[
      ["vehicle", "vehicle", "Vehicle", "Fund, service, and odometer"],
      ["goals", "goal", "Goals", "Targets and contributions"],
      ["settings", "settings", "Settings & data", "Rates, backups, and appearance"],
      ["shifts", "download", "Export shifts", "Download the complete CSV ledger"]
    ].map(([route, iconName, title, subtitle], index) => `<button class="more-menu-item" type="button" ${index === 3 ? 'data-action="export-csv"' : `data-route="${route}"`}><span class="more-icon">${icon(iconName, "icon icon-sm")}</span><span><strong>${escapeHtml(title)}</strong><span>${escapeHtml(subtitle)}</span></span></button>`).join("")}</div>`;
    openModal({ title: "More tools", subtitle: "Vehicle, goals, settings, and data actions.", body, className: "modal-small", meta: { type: "more" } });
  }

  function downloadFile(filename, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: type || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function csvEscape(value) {
    let text = String(value == null ? "" : value);
    // Quoting alone does not stop spreadsheet apps from evaluating formula-like user text.
    if (typeof value === "string" && /^\s*[=+\-@]/.test(text)) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function csvUnprotectText(value) {
    const text = String(value == null ? "" : value);
    return /^'(?=\s*[=+\-@])/.test(text) ? text.slice(1) : text;
  }

  function shiftsToCSV(shifts) {
    const headers = [
      "id", "date", "platform", "startTime", "endTime", "gross", "fuel", "tolls", "otherExpenses",
      "expenses", "net", "startOdometer", "endOdometer", "manualMiles", "miles", "manualHours", "hours",
      "trips", "hourly", "netPerMile", "investmentPct", "savingsPct", "vehiclePct", "investment", "savings",
      "vehicleFund", "spendable", "taxRate", "taxDeduction", "notes", "createdAt", "updatedAt"
    ];
    const rows = sortedShifts(shifts).map((raw) => {
      const shift = Core.calculateShift(raw, state.settings);
      return [
        shift.id, shift.date, shift.platform, shift.startTime, shift.endTime, shift.gross, shift.fuel, shift.tolls,
        shift.otherExpenses, shift.expenses, shift.net, shift.startOdometer, shift.endOdometer, shift.manualMiles,
        shift.miles, shift.manualHours, shift.hours, shift.trips, shift.hourly, shift.netPerMile,
        shift.allocationRates.investment, shift.allocationRates.savings, shift.allocationRates.vehicle,
        shift.investment, shift.savings, shift.vehicleFund, shift.spendable, shift.taxRate, shift.taxDeduction,
        shift.notes, shift.createdAt, shift.updatedAt
      ];
    });
    return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  }

  function exportCSV(shifts, label) {
    const list = Array.isArray(shifts) ? shifts : state.shifts;
    if (!list.length) {
      showToast("There are no shifts to export.", "warning");
      return;
    }
    const filename = `driver-command-${label || "shifts"}-${Core.localISODate()}.csv`;
    downloadFile(filename, shiftsToCSV(list), "text/csv;charset=utf-8");
    showToast(`${list.length} shift${list.length === 1 ? "" : "s"} exported.`, "success");
  }

  function exportBackup() {
    const backup = {
      app: "Driver Command",
      schemaVersion: Core.APP_VERSION,
      exportedAt: new Date().toISOString(),
      ...serializeState()
    };
    downloadFile(`driver-command-backup-${Core.localISODate()}.json`, JSON.stringify(backup, null, 2), "application/json;charset=utf-8");
    showToast("Full dashboard backup downloaded.", "success");
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (quoted) {
        if (char === '"' && text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          field += char;
        }
      } else if (char === '"') {
        quoted = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field.replace(/\r$/, ""));
        if (row.some((value) => value !== "")) rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }
    row.push(field.replace(/\r$/, ""));
    if (row.some((value) => value !== "")) rows.push(row);
    return rows;
  }

  function normalizeHeader(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function csvRowsToShifts(rows) {
    if (rows.length < 2) return [];
    const headers = rows[0].map(normalizeHeader);
    const find = (record, aliases) => {
      for (const alias of aliases) {
        const index = headers.indexOf(alias);
        if (index >= 0 && record[index] != null) return record[index];
      }
      return "";
    };
    const findText = (record, aliases) => csvUnprotectText(find(record, aliases));

    return rows.slice(1).map((row) => {
      const importedDate = findText(row, ["date", "shiftdate"]).trim();
      if (!Core.parseISODate(importedDate)) return null;

      const grossRaw = find(row, ["gross", "grossearnings", "earnings"]);
      const fuelRaw = find(row, ["fuel", "gas", "fuelcost"]);
      const tollsRaw = find(row, ["tolls", "tollsparking", "parking"]);
      let otherRaw = find(row, ["otherexpenses", "othercosts"]);
      const importedNetRaw = find(row, ["net", "netearnings"]);
      const importedExpensesRaw = find(row, ["expenses", "totalexpenses"]);
      const hasImportedNet = String(importedNetRaw).trim() !== "";
      const hasImportedExpenses = String(importedExpensesRaw).trim() !== "";
      const importedNet = Core.safeNumber(importedNetRaw);
      const importedExpenses = Math.max(0, Core.safeNumber(importedExpensesRaw));
      const fuel = Math.max(0, Core.safeNumber(fuelRaw));
      const tolls = Math.max(0, Core.safeNumber(tollsRaw));

      // Preserve totals from generic ledgers even when expense categories are not broken out.
      if (hasImportedExpenses && String(otherRaw).trim() === "") {
        otherRaw = Math.max(0, importedExpenses - fuel - tolls);
      }
      const inferredGross = String(grossRaw).trim() === "" && hasImportedNet
        ? importedNet + (hasImportedExpenses ? importedExpenses : fuel + tolls + Core.safeNumber(otherRaw))
        : grossRaw;

      const allocationInvestment = find(row, ["investmentpct", "investmentpercent"]);
      const allocationSavings = find(row, ["savingspct", "savingspercent"]);
      const allocationVehicle = find(row, ["vehiclepct", "vehiclepercent", "vehiclefundpct"]);
      const hasAllocationRates = [allocationInvestment, allocationSavings, allocationVehicle].some((value) => String(value).trim() !== "");
      return Core.normalizeShift({
        id: findText(row, ["id", "shiftid"]) || undefined,
        date: importedDate,
        platform: findText(row, ["platform", "app"]),
        startTime: findText(row, ["starttime", "clockintime", "start"]),
        endTime: findText(row, ["endtime", "clockouttime", "end"]),
        gross: inferredGross,
        fuel: fuelRaw,
        tolls: tollsRaw,
        otherExpenses: otherRaw,
        startOdometer: find(row, ["startodometer", "startmiles"]),
        endOdometer: find(row, ["endodometer", "endmiles"]),
        manualMiles: find(row, ["manualmiles", "businessmiles", "miles"]),
        manualHours: find(row, ["manualhours", "hours"]),
        trips: find(row, ["trips", "deliveries", "rides"]),
        notes: findText(row, ["notes", "note"]),
        allocationRates: hasAllocationRates ? {
          investment: allocationInvestment,
          savings: allocationSavings,
          vehicle: allocationVehicle
        } : undefined,
        investment: find(row, ["investment", "investmentamount"]),
        savings: find(row, ["savings", "savingsamount"]),
        vehicleFund: find(row, ["vehiclefund", "vehicleamount"]),
        createdAt: findText(row, ["createdat"]),
        updatedAt: findText(row, ["updatedat"])
      }, state.settings);
    }).filter(Boolean);
  }

  function prepareImportPayload(value, extension) {
    if (extension === "csv") {
      const shifts = csvRowsToShifts(parseCSV(value));
      if (!shifts.length) throw new Error("No valid shift rows were found in the CSV file.");
      return { source: "CSV", shifts, maintenance: [], goals: [], settings: null, activeShift: null };
    }
    const parsed = JSON.parse(value);
    const source = Array.isArray(parsed) ? { shifts: parsed } : parsed;
    if (!source || typeof source !== "object") throw new Error("The JSON file does not contain dashboard data.");
    const settings = source.settings ? Core.normalizeSettings(source.settings) : null;
    const normalizationSettings = settings || state.settings;
    const shiftsRaw = Array.isArray(source.shifts) ? source.shifts : Array.isArray(source.entries) ? source.entries : Array.isArray(source.uberEntries) ? source.uberEntries : [];
    const maintenanceRaw = Array.isArray(source.maintenance) ? source.maintenance : Array.isArray(source.uberMaintenance) ? source.uberMaintenance : [];
    const goalsRaw = Array.isArray(source.goals) ? source.goals : Array.isArray(source.spendingGoals) ? source.spendingGoals : [];
    const payload = {
      source: "JSON",
      shifts: shiftsRaw.map((item) => Core.normalizeShift(item, normalizationSettings)),
      maintenance: maintenanceRaw.map(Core.normalizeMaintenance),
      goals: goalsRaw.map(Core.normalizeGoal),
      settings,
      activeShift: source.activeShift ? Core.normalizeShift(source.activeShift, normalizationSettings) : null
    };
    if (!payload.shifts.length && !payload.maintenance.length && !payload.goals.length && !payload.settings && !payload.activeShift) {
      throw new Error("No recognizable dashboard records were found in the JSON file.");
    }
    return payload;
  }

  function openImportReview(payload, filename) {
    ui.pendingImport = payload;
    ui.pendingImportFilename = filename || "import file";
    const body = `<div class="form-section"><h3 class="form-section-title">${icon("file", "icon icon-sm")}Import preview</h3><p class="panel-subtitle">${escapeHtml(filename)} · ${escapeHtml(payload.source)} data</p><div class="form-summary"><div class="form-summary-item"><span>Shifts</span><strong>${payload.shifts.length}</strong></div><div class="form-summary-item"><span>Maintenance</span><strong>${payload.maintenance.length}</strong></div><div class="form-summary-item"><span>Goals</span><strong>${payload.goals.length}</strong></div><div class="form-summary-item"><span>Settings</span><strong>${payload.settings ? "Included" : "No"}</strong></div></div></div><div class="form-section"><h3 class="form-section-title">Choose import behavior</h3><div class="data-actions" style="grid-template-columns:repeat(2,minmax(0,1fr))"><button class="data-action-card" type="button" data-action="apply-import-merge"><span class="data-icon">${icon("plus", "icon icon-sm")}</span><h3>Merge records</h3><p>Add imported records and update matching IDs. Keep your current dashboard settings.</p><span class="button button-primary button-small">Merge safely</span></button><button class="data-action-card" type="button" data-action="apply-import-replace"><span class="data-icon" style="color:var(--amber);background:var(--amber-soft)">${icon("refresh", "icon icon-sm")}</span><h3>Replace dashboard</h3><p>Replace local records with this file. Imported settings are used when present.</p><span class="button button-secondary button-small">Replace data</span></button></div></div>`;
    openModal({ title: "Review import", subtitle: "Nothing changes until you choose how to apply this file.", body, footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button>`, className: "modal-wide", meta: { type: "import" } });
  }

  function mergeById(existing, incoming, normalize) {
    const map = new Map(existing.map((item) => [String(item.id), item]));
    incoming.forEach((item) => {
      const normalized = normalize(item);
      map.set(String(normalized.id), normalized);
    });
    return Array.from(map.values());
  }

  function applyPendingImport(mode) {
    const payload = ui.pendingImport;
    if (!payload) return;
    if (mode === "replace") {
      const importedSettings = payload.settings || state.settings;
      state.settings = Core.normalizeSettings({ ...importedSettings, lastRoute: ui.route });
      state.shifts = payload.shifts.map((item) => Core.normalizeShift(item, state.settings));
      state.maintenance = payload.maintenance.map(Core.normalizeMaintenance);
      state.goals = payload.goals.map(Core.normalizeGoal);
      state.activeShift = payload.activeShift ? Core.normalizeShift(payload.activeShift, state.settings) : null;
    } else {
      state.shifts = mergeById(state.shifts, payload.shifts, (item) => Core.normalizeShift(item, state.settings));
      state.maintenance = mergeById(state.maintenance, payload.maintenance, Core.normalizeMaintenance);
      state.goals = mergeById(state.goals, payload.goals, Core.normalizeGoal);
      if (!state.activeShift && payload.activeShift) state.activeShift = Core.normalizeShift(payload.activeShift, state.settings);
    }
    ui.pendingImport = null;
    ui.pendingImportFilename = "";
    ui.selectedShiftIds.clear();
    saveState();
    closeModal(false);
    renderApp();
    showToast(mode === "replace" ? "Dashboard data replaced from the import." : "Imported records merged into the dashboard.", "success", 5000);
  }

  async function handleImportFile(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const extension = file.name.toLowerCase().endsWith(".csv") ? "csv" : "json";
      const payload = prepareImportPayload(text, extension);
      openImportReview(payload, file.name);
    } catch (error) {
      showToast(error && error.message ? error.message : "The selected file could not be imported.", "error", 5200);
    }
  }

  function renderTaxRateRow(rate) {
    return `<div class="rate-row" data-rate-row data-rate-id="${escapeAttribute(rate.id)}"><div class="field"><label>Effective date</label><input type="date" name="rateEffective" value="${escapeAttribute(rate.effective)}" required></div><div class="field"><label>Rate per mile</label><div class="input-prefix-wrap"><span class="input-prefix">$</span><input type="number" name="rateAmount" value="${escapeAttribute(rate.rate)}" min="0" step="0.001" required></div></div><div class="field"><label>Label</label><input type="text" name="rateLabel" value="${escapeAttribute(rate.label)}" maxlength="60" required></div><button class="icon-button rate-delete" type="button" data-action="delete-tax-rate" aria-label="Remove mileage rate">${icon("trash", "icon icon-sm")}</button></div>`;
  }

  function submitSettingsForm(form) {
    const data = new FormData(form);
    const allocations = {
      investment: Core.safeNumber(data.get("investmentPct")),
      savings: Core.safeNumber(data.get("savingsPct")),
      vehicle: Core.safeNumber(data.get("vehiclePct"))
    };
    const allocationTotal = allocations.investment + allocations.savings + allocations.vehicle;
    if (allocationTotal > 100.0001) {
      showToast("Allocation percentages must total 100% or less.", "error");
      updateAllocationTotal();
      return;
    }
    const rateRows = Array.from(form.querySelectorAll("[data-rate-row]"));
    const taxRates = rateRows.map((row) => ({
      id: row.dataset.rateId || Core.uid("rate"),
      effective: row.querySelector('[name="rateEffective"]').value,
      rate: Core.safeNumber(row.querySelector('[name="rateAmount"]').value),
      label: row.querySelector('[name="rateLabel"]').value.trim() || "Custom rate"
    })).filter((rate) => rate.effective && rate.rate > 0);
    if (!taxRates.length) {
      showToast("Keep at least one valid mileage rate in the schedule.", "error");
      return;
    }
    state.settings = Core.normalizeSettings({
      ...state.settings,
      theme: data.get("theme"),
      defaultPlatform: data.get("defaultPlatform"),
      weekStartsOn: data.get("weekStartsOn"),
      weeklyNetGoal: data.get("weeklyNetGoal"),
      monthlyNetGoal: data.get("monthlyNetGoal"),
      allocations,
      taxRates,
      vehicle: {
        name: data.get("vehicleName"),
        currentOdometer: data.get("vehicleOdometer"),
        oilInterval: data.get("oilInterval"),
        tireInterval: data.get("tireInterval")
      },
      lastRoute: ui.route
    });
    saveState();
    renderApp();
    showToast("Dashboard settings saved.", "success");
  }

  function deleteShiftById(id) {
    const shift = getShift(id);
    if (!shift) return;
    openConfirm({
      title: "Delete shift?",
      heading: `${formatShortDate(shift.date)} · ${shift.platform}`,
      body: "This permanently removes the shift from your local ledger and recalculates every summary.",
      confirmLabel: "Delete shift",
      onConfirm: () => {
        state.shifts = state.shifts.filter((item) => String(item.id) !== String(id));
        ui.selectedShiftIds.delete(String(id));
        saveState();
        renderApp();
        showToast("Shift deleted.", "success");
      }
    });
  }

  function deleteMaintenanceById(id) {
    const item = getMaintenance(id);
    if (!item) return;
    openConfirm({
      title: "Delete maintenance record?",
      heading: `${item.type} · ${formatShortDate(item.date)}`,
      body: "The cost and service reminder context from this record will be removed.",
      confirmLabel: "Delete record",
      onConfirm: () => {
        state.maintenance = state.maintenance.filter((record) => String(record.id) !== String(id));
        saveState();
        renderApp();
        showToast("Maintenance record deleted.", "success");
      }
    });
  }

  function deleteGoalById(id) {
    const goal = getGoal(id);
    if (!goal) return;
    openConfirm({
      title: "Delete goal?",
      heading: goal.name,
      body: `This also removes ${goal.contributions.length} saved contribution${goal.contributions.length === 1 ? "" : "s"}. Shift history is not affected.`,
      confirmLabel: "Delete goal",
      onConfirm: () => {
        state.goals = state.goals.filter((item) => String(item.id) !== String(id));
        saveState();
        renderApp();
        showToast("Goal deleted.", "success");
      }
    });
  }

  function handleAction(action, element, event) {
    const id = element.dataset.id;
    switch (action) {
      case "toggle-theme":
        state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
        saveState({ silent: true });
        renderApp();
        showToast(`${state.settings.theme === "dark" ? "Dark" : "Light"} theme enabled.`, "success");
        break;
      case "open-add-shift":
        openShiftModal("add", element.dataset.date ? { date: element.dataset.date } : null);
        break;
      case "add-shift-on-date":
        openShiftModal("add", { date: element.dataset.date || ui.calendarSelected });
        break;
      case "start-shift":
        if (state.activeShift) openShiftModal("update", state.activeShift);
        else openShiftModal("start");
        break;
      case "update-active-shift":
        if (state.activeShift) openShiftModal("update", state.activeShift);
        else showToast("There is no active shift to update.", "warning");
        break;
      case "end-active-shift":
        if (state.activeShift) openShiftModal("end", state.activeShift);
        else showToast("There is no active shift to finish.", "warning");
        break;
      case "submit-shift-form":
        submitShiftForm();
        break;
      case "edit-shift": {
        const shift = getShift(id);
        if (shift) openShiftModal("edit", shift);
        break;
      }
      case "duplicate-shift": {
        const shift = getShift(id);
        if (shift) openShiftModal("add", { ...Core.clone(shift), id: "", createdAt: "", updatedAt: "" });
        break;
      }
      case "delete-shift":
        deleteShiftById(id);
        break;
      case "toggle-shift-select":
        if (element.checked) ui.selectedShiftIds.add(String(id));
        else ui.selectedShiftIds.delete(String(id));
        updateShiftResults();
        break;
      case "select-all-shifts": {
        const visible = filteredShifts();
        if (element.checked) visible.forEach((shift) => ui.selectedShiftIds.add(String(shift.id)));
        else visible.forEach((shift) => ui.selectedShiftIds.delete(String(shift.id)));
        updateShiftResults();
        break;
      }
      case "clear-shift-selection":
        ui.selectedShiftIds.clear();
        updateShiftResults();
        break;
      case "export-selected-shifts": {
        const selected = state.shifts.filter((shift) => ui.selectedShiftIds.has(String(shift.id)));
        exportCSV(selected, "selected-shifts");
        break;
      }
      case "delete-selected-shifts": {
        const ids = new Set(Array.from(ui.selectedShiftIds));
        if (!ids.size) return;
        openConfirm({
          title: `Delete ${ids.size} selected shift${ids.size === 1 ? "" : "s"}?`,
          heading: "Bulk delete",
          body: "This permanently removes every selected entry and recalculates all dashboard totals.",
          confirmLabel: `Delete ${ids.size}`,
          onConfirm: () => {
            state.shifts = state.shifts.filter((shift) => !ids.has(String(shift.id)));
            ui.selectedShiftIds.clear();
            saveState();
            renderApp();
            showToast(`${ids.size} shift${ids.size === 1 ? "" : "s"} deleted.`, "success");
          }
        });
        break;
      }
      case "clear-shift-filters":
        ui.shiftFilters = { search: "", range: "all", platform: "all", sort: "dateDesc" };
        ui.selectedShiftIds.clear();
        dom.main.innerHTML = renderShiftsPage();
        updateShiftResults();
        break;
      case "export-csv":
        exportCSV(state.shifts, "shifts");
        if (ui.modal && ui.modal.type === "more") closeModal(false);
        break;
      case "analytics-period":
        ui.analyticsPeriod = element.dataset.period || "month";
        dom.main.innerHTML = renderAnalyticsPage();
        break;
      case "calendar-prev":
        ui.calendarCursor = new Date(ui.calendarCursor.getFullYear(), ui.calendarCursor.getMonth() - 1, 1);
        ui.calendarSelected = Core.localISODate(ui.calendarCursor);
        dom.main.innerHTML = renderCalendarPage();
        break;
      case "calendar-next":
        ui.calendarCursor = new Date(ui.calendarCursor.getFullYear(), ui.calendarCursor.getMonth() + 1, 1);
        ui.calendarSelected = Core.localISODate(ui.calendarCursor);
        dom.main.innerHTML = renderCalendarPage();
        break;
      case "calendar-today":
        ui.calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        ui.calendarSelected = Core.localISODate();
        dom.main.innerHTML = renderCalendarPage();
        break;
      case "calendar-select": {
        const selected = Core.parseISODate(element.dataset.date);
        if (selected) {
          ui.calendarSelected = element.dataset.date;
          if (selected.getMonth() !== ui.calendarCursor.getMonth() || selected.getFullYear() !== ui.calendarCursor.getFullYear()) {
            ui.calendarCursor = new Date(selected.getFullYear(), selected.getMonth(), 1);
          }
          dom.main.innerHTML = renderCalendarPage();
        }
        break;
      }
      case "open-maintenance":
        openMaintenanceModal(null);
        break;
      case "edit-maintenance":
        openMaintenanceModal(getMaintenance(id));
        break;
      case "submit-maintenance-form":
        submitMaintenanceForm();
        break;
      case "delete-maintenance":
        deleteMaintenanceById(id);
        break;
      case "clear-maintenance-filters":
        ui.vehicleFilters = { search: "", type: "all" };
        dom.main.innerHTML = renderVehiclePage();
        updateVehicleResults();
        break;
      case "open-goal":
        openGoalModal(null);
        break;
      case "edit-goal":
        openGoalModal(getGoal(id));
        break;
      case "submit-goal-form":
        submitGoalForm();
        break;
      case "add-contribution":
        openContributionModal(getGoal(id));
        break;
      case "submit-contribution-form":
        submitContributionForm();
        break;
      case "archive-goal": {
        const goal = getGoal(id);
        if (goal) {
          goal.archived = !goal.archived;
          goal.updatedAt = new Date().toISOString();
          saveState();
          renderApp();
          showToast(goal.archived ? "Goal archived." : "Goal restored.", "success");
        }
        break;
      }
      case "delete-goal":
        deleteGoalById(id);
        break;
      case "add-tax-rate": {
        const root = document.getElementById("taxRateList");
        if (!root) return;
        const current = Core.getMileageRate(Core.localISODate(), state.settings.taxRates);
        root.insertAdjacentHTML("beforeend", renderTaxRateRow({ id: Core.uid("rate"), effective: Core.localISODate(), rate: current.rate || 0.67, label: "Custom rate" }));
        const last = root.lastElementChild;
        const input = last && last.querySelector('[name="rateEffective"]');
        if (input) input.focus();
        break;
      }
      case "delete-tax-rate": {
        const row = element.closest("[data-rate-row]");
        const list = document.querySelectorAll("[data-rate-row]");
        if (list.length <= 1) showToast("Keep at least one mileage rate.", "warning");
        else if (row) row.remove();
        break;
      }
      case "restore-default-rates": {
        const root = document.getElementById("taxRateList");
        if (root) {
          root.innerHTML = Core.clone(Core.DEFAULT_TAX_RATES).map(renderTaxRateRow).join("");
          showToast("Built-in mileage schedule restored in the form. Save settings to apply it.", "info");
        }
        break;
      }
      case "export-backup":
        exportBackup();
        break;
      case "import-data":
        dom.importFileInput.click();
        break;
      case "apply-import-merge":
        applyPendingImport("merge");
        break;
      case "apply-import-replace": {
        const pending = ui.pendingImport;
        const filename = ui.pendingImportFilename;
        openConfirm({
          title: "Replace local dashboard?",
          heading: "Imported data will become the source of truth",
          body: "Your current local records will be replaced. Download a backup first if you may need to recover them.",
          confirmLabel: "Replace dashboard",
          onConfirm: () => applyPendingImport("replace"),
          onCancel: () => openImportReview(pending, filename)
        });
        break;
      }
      case "reset-data":
        openConfirm({
          title: "Reset the entire dashboard?",
          heading: "All local records will be erased",
          body: "This removes shifts, maintenance, goals, settings, and any active shift. Export a backup before continuing if you may need the data.",
          confirmLabel: "Reset everything",
          onConfirm: () => {
            [STORAGE_KEY, ...Object.values(LEGACY_KEYS), "investmentPct", "savingsPct", "vehiclePct", "monthlyNetGoal", "dashboardTheme"].forEach((key) => localStorage.removeItem(key));
            state = { version: Core.APP_VERSION, shifts: [], maintenance: [], goals: [], settings: Core.normalizeSettings(Core.clone(Core.DEFAULT_SETTINGS)), activeShift: null };
            ui.selectedShiftIds.clear();
            ui.pendingImport = null;
            ui.route = "overview";
            saveState();
            setRoute("overview", { focus: false });
            showToast("Dashboard reset to a clean state.", "success");
          }
        });
        break;
      case "open-more":
        openMoreModal();
        break;
      case "confirm-modal": {
        const callback = ui.modal && ui.modal.onConfirm;
        closeModal(false);
        if (typeof callback === "function") callback();
        break;
      }
      case "close-modal":
        dismissModal();
        break;
      case "modal-backdrop":
        if (event.target === element) dismissModal();
        break;
      case "close-toast":
        closeToast(element.dataset.toastId);
        break;
      default:
        break;
    }
  }

  function handleClick(event) {
    const routeElement = event.target.closest("[data-route]");
    if (routeElement) {
      event.preventDefault();
      setRoute(routeElement.dataset.route);
      return;
    }
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;
    const action = actionElement.dataset.action;
    if (action !== "toggle-shift-select" && action !== "select-all-shifts") event.preventDefault();
    handleAction(action, actionElement, event);
  }

  function handleInput(event) {
    const target = event.target;
    if (target.matches('[data-form="shift"] input, [data-form="shift"] select, [data-form="shift"] textarea')) {
      updateShiftPreview(target.closest('[data-form="shift"]'));
    }
    if (target.matches("[data-allocation]")) updateAllocationTotal();
    const filter = target.dataset.filter;
    if (filter === "shift-search") {
      ui.shiftFilters.search = target.value;
      ui.selectedShiftIds.clear();
      window.clearTimeout(filterInputTimer);
      filterInputTimer = window.setTimeout(updateShiftResults, 90);
    }
    if (filter === "maintenance-search") {
      ui.vehicleFilters.search = target.value;
      window.clearTimeout(filterInputTimer);
      filterInputTimer = window.setTimeout(updateVehicleResults, 90);
    }
  }

  function handleChange(event) {
    const target = event.target;
    const filter = target.dataset.filter;
    if (filter === "shift-range") {
      ui.shiftFilters.range = target.value;
      ui.selectedShiftIds.clear();
      updateShiftResults();
    } else if (filter === "shift-platform") {
      ui.shiftFilters.platform = target.value;
      ui.selectedShiftIds.clear();
      updateShiftResults();
    } else if (filter === "shift-sort") {
      ui.shiftFilters.sort = target.value;
      updateShiftResults();
    } else if (filter === "maintenance-type") {
      ui.vehicleFilters.type = target.value;
      updateVehicleResults();
    }
  }

  function handleSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    const type = form.dataset.form;
    if (type === "settings") submitSettingsForm(form);
    else if (type === "shift") submitShiftForm();
    else if (type === "maintenance") submitMaintenanceForm();
    else if (type === "goal") submitGoalForm();
    else if (type === "contribution") submitContributionForm();
  }

  function updateLiveElements() {
    if (!state.activeShift) return;
    const duration = formatDuration(activeDurationHours(), true);
    document.querySelectorAll("[data-live-duration]").forEach((element) => {
      element.textContent = duration;
    });
    const shiftForm = dom.modalRoot && dom.modalRoot.querySelector('[data-form="shift"]');
    if (shiftForm && ["update", "end"].includes(shiftForm.dataset.mode)) updateShiftPreview(shiftForm);
  }

  function startLiveTimer() {
    window.clearInterval(liveTimer);
    liveTimer = window.setInterval(updateLiveElements, 1000);
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || !/^https?:$/.test(window.location.protocol)) return;
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // The dashboard remains fully usable without registration (for example under file://).
    });
  }

  function init() {
    dom.versionLabel.textContent = `Version ${Core.APP_VERSION} · Local-first`;
    dom.topbarAddIcon.innerHTML = icon("plus", "icon icon-sm");
    applyTheme();
    renderApp();
    startLiveTimer();
    registerServiceWorker();

    document.addEventListener("click", handleClick);
    document.addEventListener("input", handleInput);
    document.addEventListener("change", handleChange);
    document.addEventListener("submit", handleSubmit);
    dom.importFileInput.addEventListener("change", handleImportFile);
    window.addEventListener("online", updateConnectionStatus);
    window.addEventListener("offline", updateConnectionStatus);
    window.addEventListener("hashchange", () => {
      const route = window.location.hash.replace("#", "");
      if (ROUTES.includes(route) && route !== ui.route) setRoute(route, { focus: false });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && ui.modal) dismissModal();
      else if (event.key === "Tab" && ui.modal) trapModalFocus(event);
    });
  }

  init();
})();
