(function () {
  "use strict";

  const Core = window.DriverCore;
  if (!Core) {
    document.body.innerHTML = "<p style='padding:24px;font-family:sans-serif'>Driver Command could not load its calculation module.</p>";
    return;
  }

  const LEGACY_KEYS = {
    shifts: ["uberEntries", "uberEntriesV3"],
    maintenance: ["uberMaintenance"],
    goals: ["uberSpendingGoals"],
    activeShift: ["activeShiftDraft"],
    clockIn: ["clockInTime"]
  };

  const ROUTES = ["overview", "shifts", "analytics", "calendar", "vehicle", "goals", "settings"];
  const PAGE_META = {
    overview: { eyebrow: "Command center", title: "Overview", subtitle: "Your shift, money, and vehicle at a glance." },
    shifts: { eyebrow: "Operations", title: "Shift ledger", subtitle: "Review, edit, and manage every driving session." },
    analytics: { eyebrow: "Money directions", title: "Money plan", subtitle: "See exactly what to move, invest, and keep." },
    calendar: { eyebrow: "Daily history", title: "Calendar", subtitle: "Open any date for its earnings and money breakdown." },
    vehicle: { eyebrow: "Vehicle", title: "Vehicle center", subtitle: "Track your reserve, mileage, and service costs." },
    goals: { eyebrow: "Planning", title: "Goals", subtitle: "Build targets from the money you keep available." },
    settings: { eyebrow: "System", title: "Settings & data", subtitle: "Manage preferences, backups, and local storage." }
  };

  const NAV_ITEMS = [
    { route: "overview", label: "Overview", icon: "home", section: "Command" },
    { route: "shifts", label: "Shifts", icon: "receipt" },
    { route: "analytics", label: "Money plan", icon: "wallet" },
    { route: "calendar", label: "Calendar", icon: "calendar" },
    { route: "vehicle", label: "Vehicle", icon: "car", section: "Planning" },
    { route: "goals", label: "Goals", icon: "target" },
    { route: "settings", label: "Settings & data", icon: "settings" }
  ];

  const MOBILE_NAV_ITEMS = [
    { route: "overview", label: "Home", icon: "home" },
    { route: "shifts", label: "Shifts", icon: "receipt" },
    { route: "analytics", label: "Money", icon: "wallet" },
    { route: "vehicle", label: "Vehicle", icon: "car" },
    { route: "more", label: "More", icon: "more" }
  ];

  const PLATFORM_OPTIONS = ["Uber", "Lyft", "Uber + Lyft", "DoorDash", "Other"];
  const MAINTENANCE_TYPES = ["Oil Change", "Tire Rotation", "Tires", "Brakes", "Car Wash", "Inspection", "Registration", "Repair", "Other"];

  const ICONS = {
    home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    receipt: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    wallet: '<path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12"/><path d="M16 11h6v4h-6a2 2 0 0 1 0-4Z"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/>',
    car: '<path d="M5 17h14l2-6-3-5H6l-3 5 2 6Z"/><path d="M7 17v2M17 17v2M6 11h12"/><circle cx="7.5" cy="14" r="1"/><circle cx="16.5" cy="14" r="1"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><path d="m16 8 5-5M17 3h4v4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a7.8 7.8 0 0 0 .1-6l2-1.5-2-3.4-2.4 1a8 8 0 0 0-5.2-3L11.5 2h-4L7 4.1a8 8 0 0 0-5.2 3l-2.4-1-2 3.4 2 1.5a7.8 7.8 0 0 0 .1 6l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 5.2 3l.4 2.1h4l.4-2.1a8 8 0 0 0 5.2-3l2.4 1 2-3.4-2-1.5Z" transform="translate(2.5 0) scale(.78)"/>',
    more: '<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    resume: '<path d="m8 5 11 7-11 7V5Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    route: '<path d="M5 19c0-4 5-4 5-8s-5-4-5-8M19 5c0 4-5 4-5 8s5 4 5 8"/><circle cx="5" cy="3" r="1.5"/><circle cx="19" cy="21" r="1.5"/>',
    dollar: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/>',
    fuel: '<path d="M5 21V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17M7 8h8"/><path d="M17 7h2l2 3v8a2 2 0 0 1-2 2h-2"/>',
    chart: '<path d="M4 19V9M10 19V5M16 19v-7M22 19V2"/>',
    stock: '<path d="m3 17 6-6 4 4 8-10"/><path d="M15 5h6v6"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M9 8.5h4.5a2.5 2.5 0 0 1 0 5H9m3-7v11m-3-4h5a2.5 2.5 0 0 1 0 5H9"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5 5L4 17v3h3l5.7-5.7a4 4 0 0 0 5-5l-3 3-3-3 3-3Z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    warning: '<path d="M10.3 3.2 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0Z"/><path d="M12 8v4M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 21h14"/>',
    upload: '<path d="M12 21V9M7 14l5-5 5 5"/><path d="M5 3h14"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
    archive: '<path d="M3 4h18v5H3zM5 9v11h14V9M10 13h4"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3"/>',
    spark: '<path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>'
  };

  const dom = {
    sidebarNav: document.getElementById("sidebarNav"),
    mobileNav: document.getElementById("mobileNav"),
    main: document.getElementById("mainContent"),
    pageEyebrow: document.getElementById("pageEyebrow"),
    pageTitle: document.getElementById("pageTitle"),
    pageSubtitle: document.getElementById("pageSubtitle"),
    themeToggle: document.getElementById("themeToggle"),
    topbarShiftIcon: document.getElementById("topbarShiftIcon"),
    topbarShiftLabel: document.getElementById("topbarShiftLabel"),
    modalRoot: document.getElementById("modalRoot"),
    toastRoot: document.getElementById("toastRoot"),
    importFileInput: document.getElementById("importFileInput"),
    versionLabel: document.getElementById("versionLabel")
  };

  function icon(name, className) {
    return `<svg class="${className || "icon"}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
    })[char]);
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function formatMoney(value, options) {
    const opts = options || {};
    const number = Core.safeNumber(value);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: opts.compact && Math.abs(number) >= 1000 ? "compact" : "standard",
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
    return new Intl.DateTimeFormat("en-US", options || { month: "short", day: "numeric", year: "numeric" }).format(date);
  }

  function formatTime(value) {
    const match = /^(\d{1,2}):(\d{2})/.exec(String(value || ""));
    if (!match) return "—";
    const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  }

  function currentTimeValue(value) {
    const now = value instanceof Date ? value : new Date();
    return `${Core.pad(now.getHours())}:${Core.pad(now.getMinutes())}`;
  }

  function formatDuration(milliseconds, includeSeconds) {
    const totalSeconds = Math.max(0, Math.floor(Core.safeNumber(milliseconds) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = totalSeconds % 60;
    return includeSeconds ? `${Core.pad(hours)}:${Core.pad(minutes)}:${Core.pad(seconds)}` : `${hours}h ${Core.pad(minutes)}m`;
  }

  function dateTimeFromLocal(dateValue, timeValue) {
    const date = Core.parseISODate(dateValue);
    const match = /^(\d{1,2}):(\d{2})/.exec(String(timeValue || ""));
    if (!date || !match) return null;
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return date;
  }

  const memoryStorage = new Map();

  function safeStorageGet(key) {
    try {
      const value = window.localStorage.getItem(key);
      return value == null && memoryStorage.has(key) ? memoryStorage.get(key) : value;
    } catch (error) {
      return memoryStorage.has(key) ? memoryStorage.get(key) : null;
    }
  }

  function safeStorageSet(key, value) {
    const text = String(value);
    memoryStorage.set(key, text);
    try { window.localStorage.setItem(key, text); return true; } catch (error) { return false; }
  }

  function safeStorageRemove(key) {
    memoryStorage.delete(key);
    try { window.localStorage.removeItem(key); } catch (error) {}
  }

  function parseStoredJSON(key, fallback) {
    try {
      const raw = safeStorageGet(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function loadLegacyState() {
    const readFirst = (keys, fallback) => {
      for (const key of keys) {
        const value = parseStoredJSON(key, null);
        if (value != null) return value;
      }
      return fallback;
    };
    const shifts = readFirst(LEGACY_KEYS.shifts, []);
    const maintenance = readFirst(LEGACY_KEYS.maintenance, []);
    const goals = readFirst(LEGACY_KEYS.goals, []);
    const activeShift = readFirst(LEGACY_KEYS.activeShift, null);
    const clockIn = safeStorageGet(LEGACY_KEYS.clockIn[0]);
    if (activeShift && clockIn && !activeShift.startedAt) activeShift.startedAt = clockIn;
    return { shifts, maintenance, goals, activeShift, settings: {} };
  }

  function loadState() {
    let source = parseStoredJSON(Core.STORAGE_KEY, null);
    if (source && source.state && typeof source.state === "object") source = source.state;
    if (!source) source = loadLegacyState();
    if (!Array.isArray(source.shifts) && Array.isArray(source.entries)) source.shifts = source.entries;
    const normalized = Core.normalizeState(source);
    // This release intentionally locks future shifts to Bobby's 5/10/10 plan.
    normalized.settings.moneyPlan = Core.normalizeMoneyPlan(Core.DEFAULT_MONEY_PLAN);
    return normalized;
  }

  let state = loadState();
  const ui = {
    route: initialRoute(),
    moneyPeriod: "day",
    moneyAnchor: new Date(),
    shiftFilter: "30",
    shiftSearch: "",
    calendarCursor: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    calendarSelected: Core.localISODate(),
    modalMeta: null,
    modalReturnFocus: null,
    pendingImport: null,
    pendingImportName: "",
    toastCounter: 0
  };

  function serializeState() {
    return {
      schemaVersion: Core.APP_VERSION,
      appVersion: Core.APP_VERSION,
      shifts: state.shifts,
      maintenance: state.maintenance,
      goals: state.goals,
      settings: state.settings,
      activeShift: state.activeShift
    };
  }

  function saveState() {
    const snapshot = JSON.stringify(serializeState());
    const persisted = safeStorageSet(Core.STORAGE_KEY, snapshot);
    safeStorageSet("uberEntries", JSON.stringify(state.shifts));
    safeStorageSet("uberMaintenance", JSON.stringify(state.maintenance));
    safeStorageSet("uberSpendingGoals", JSON.stringify(state.goals));
    if (state.activeShift) {
      safeStorageSet("activeShiftDraft", JSON.stringify(state.activeShift));
      safeStorageSet("clockInTime", state.activeShift.startedAt || "");
    } else {
      safeStorageRemove("activeShiftDraft");
      safeStorageRemove("clockInTime");
    }
    return persisted;
  }

  function initialRoute() {
    const hash = window.location.hash.replace(/^#/, "");
    if (ROUTES.includes(hash)) return hash;
    const stored = state && state.settings && state.settings.lastRoute;
    return ROUTES.includes(stored) ? stored : "overview";
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.settings.theme;
    dom.themeToggle.innerHTML = icon(state.settings.theme === "dark" ? "sun" : "moon");
    dom.themeToggle.setAttribute("aria-label", state.settings.theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", state.settings.theme === "dark" ? "#07110c" : "#eff4f0");
  }

  function setRoute(route, options) {
    const opts = options || {};
    const next = ROUTES.includes(route) ? route : "overview";
    ui.route = next;
    state.settings.lastRoute = next;
    if (window.location.hash !== `#${next}`) history.replaceState(null, "", `#${next}`);
    saveState({ silent: true });
    closeModal(false);
    renderApp();
    if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: "smooth" });
    if (opts.focus !== false) dom.main.focus({ preventScroll: true });
  }

  function renderNavigation() {
    let section = "";
    dom.sidebarNav.innerHTML = NAV_ITEMS.map((item) => {
      const heading = item.section && item.section !== section ? `<div class="nav-section">${escapeHtml(item.section)}</div>` : "";
      if (item.section) section = item.section;
      const active = ui.route === item.route;
      let badge = "";
      if (item.route === "shifts" && state.activeShift) badge = `<span class="nav-badge${state.activeShift.pauseStartedAt ? " is-paused" : ""}">${state.activeShift.pauseStartedAt ? "PAUSED" : "LIVE"}</span>`;
      return `${heading}<button class="nav-item${active ? " is-active" : ""}" type="button" data-route="${item.route}">${icon(item.icon)}<span>${escapeHtml(item.label)}</span>${badge}</button>`;
    }).join("");

    const moreActive = ["calendar", "goals", "settings"].includes(ui.route);
    dom.mobileNav.innerHTML = MOBILE_NAV_ITEMS.map((item) => {
      const active = item.route === "more" ? moreActive : ui.route === item.route;
      const attrs = item.route === "more" ? 'data-action="open-more"' : `data-route="${item.route}"`;
      return `<button class="mobile-nav-item${active ? " is-active" : ""}" type="button" ${attrs}>${icon(item.icon)}<span>${escapeHtml(item.label)}</span></button>`;
    }).join("");
  }

  function renderHeader() {
    const meta = PAGE_META[ui.route] || PAGE_META.overview;
    dom.pageEyebrow.textContent = meta.eyebrow;
    dom.pageTitle.textContent = meta.title;
    dom.pageSubtitle.textContent = meta.subtitle;
    document.title = `${meta.title} · Driver Command`;
    if (state.activeShift) {
      dom.topbarShiftIcon.innerHTML = icon("stop", "icon icon-sm");
      dom.topbarShiftLabel.textContent = "End shift";
    } else {
      dom.topbarShiftIcon.innerHTML = icon("play", "icon icon-sm");
      dom.topbarShiftLabel.textContent = "Start shift";
    }
  }

  function showToast(message, type, duration) {
    const id = `toast_${++ui.toastCounter}`;
    const kind = type || "info";
    const toastIcon = kind === "error" ? "warning" : kind === "warning" ? "warning" : "check";
    const node = document.createElement("div");
    node.className = `toast${kind === "error" ? " is-error" : kind === "warning" ? " is-warning" : ""}`;
    node.dataset.toastId = id;
    node.innerHTML = `<span class="toast-icon">${icon(toastIcon, "icon icon-sm")}</span><p>${escapeHtml(message)}</p><button type="button" data-action="dismiss-toast" data-id="${id}" aria-label="Dismiss">${icon("close", "icon icon-sm")}</button>`;
    dom.toastRoot.appendChild(node);
    window.setTimeout(() => {
      const current = dom.toastRoot.querySelector(`[data-toast-id="${id}"]`);
      if (current) current.remove();
    }, duration || 4300);
  }

  function openModal(options) {
    const opts = options || {};
    ui.modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ui.modalMeta = opts.meta || null;
    dom.modalRoot.hidden = false;
    document.body.style.overflow = "hidden";
    dom.modalRoot.innerHTML = `<div class="modal-card ${escapeAttribute(opts.className || "")}" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-header"><div><h2 id="modalTitle">${escapeHtml(opts.title || "")}</h2>${opts.subtitle ? `<p>${escapeHtml(opts.subtitle)}</p>` : ""}</div><button class="icon-button" type="button" data-action="close-modal" aria-label="Close">${icon("close", "icon icon-sm")}</button></div>
      <div class="modal-body">${opts.body || ""}</div>
      ${opts.footer === false ? "" : `<div class="modal-footer">${opts.footer || '<button class="button button-primary" type="button" data-action="close-modal">Done</button>'}</div>`}
    </div>`;
    window.setTimeout(() => {
      const focusTarget = dom.modalRoot.querySelector("[autofocus], input:not([type=hidden]), select, textarea, button");
      if (focusTarget instanceof HTMLElement) focusTarget.focus({ preventScroll: true });
    }, 0);
  }

  function closeModal(returnFocus) {
    if (dom.modalRoot.hidden) return;
    dom.modalRoot.hidden = true;
    dom.modalRoot.innerHTML = "";
    document.body.style.overflow = "";
    ui.modalMeta = null;
    if (returnFocus !== false && ui.modalReturnFocus instanceof HTMLElement && document.contains(ui.modalReturnFocus)) ui.modalReturnFocus.focus({ preventScroll: true });
    ui.modalReturnFocus = null;
  }

  function emptyState(options) {
    const opts = options || {};
    return `<div class="empty-state panel"><div class="empty-state-inner"><span class="empty-icon">${icon(opts.icon || "receipt", "icon icon-lg")}</span><h3>${escapeHtml(opts.title || "Nothing here yet")}</h3><p>${escapeHtml(opts.body || "Your information will appear here.")}</p>${opts.action ? `<button class="button button-primary" type="button" data-action="${escapeAttribute(opts.action)}">${opts.actionIcon ? icon(opts.actionIcon, "icon icon-sm") : ""}${escapeHtml(opts.actionLabel || "Add")}</button>` : ""}</div></div>`;
  }

  function metricCard(options) {
    const opts = options || {};
    return `<article class="metric-card"><div class="metric-head"><span class="metric-icon ${escapeAttribute(opts.iconClass || "")}">${icon(opts.icon || "dollar", "icon icon-sm")}</span>${opts.badge || ""}</div><span class="metric-label">${escapeHtml(opts.label || "")}</span><strong class="metric-value">${opts.value || "—"}</strong><div class="metric-meta">${opts.meta || ""}</div></article>`;
  }

  function sortedShifts(list) {
    return (Array.isArray(list) ? list : state.shifts).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.startTime || "").localeCompare(String(a.startTime || "")) || String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }

  function findShift(id) {
    return state.shifts.find((item) => item.id === id) || null;
  }

  function todayShifts() {
    const today = Core.localISODate();
    return state.shifts.filter((item) => item.date === today);
  }

  function renderActiveHero() {
    const active = state.activeShift;
    if (!active) {
      const today = Core.summarizeShifts(todayShifts(), state.settings);
      return `<section class="shift-hero panel"><div class="hero-content">
        <div class="hero-top"><div><span class="hero-kicker">Shift control</span><span class="pill">Off duty</span></div><span class="metric-icon">${icon("car", "icon icon-lg")}</span></div>
        <div class="hero-main"><h2>Ready when you are.</h2><p>Start with your current mileage. Driver Command will handle the timer, pauses, earnings, and your end-of-shift money directions.</p></div>
        <div class="hero-actions"><button class="button button-primary" type="button" data-action="start-shift">${icon("play", "icon icon-sm")}Start shift</button><button class="button button-ghost" type="button" data-action="add-shift">${icon("plus", "icon icon-sm")}Add past shift</button></div>
        <div class="hero-stats"><div class="hero-stat"><span>Today gross</span><strong>${formatMoney(today.gross)}</strong></div><div class="hero-stat"><span>Today net</span><strong>${formatMoney(today.net)}</strong></div><div class="hero-stat"><span>Move out</span><strong>${formatMoney(today.takeOut)}</strong></div></div>
      </div></section>`;
    }

    const paused = Boolean(active.pauseStartedAt);
    const now = new Date();
    const workMs = Core.activeDurationMs(active, now);
    const pauseMs = Core.activePausedMs(active, now);
    return `<section class="shift-hero panel"><div class="hero-content">
      <div class="hero-top"><div><span class="hero-kicker">${escapeHtml(active.platform)} · ${escapeHtml(formatDate(active.date, { weekday: "short", month: "short", day: "numeric" }))}</span><span class="pill ${paused ? "pill-warning" : "pill-success"}">${paused ? "Paused" : "Live shift"}</span></div><span class="metric-icon ${paused ? "is-amber" : ""}">${icon(paused ? "pause" : "clock", "icon icon-lg")}</span></div>
      <div class="hero-main"><h2 data-live-work>${formatDuration(workMs, true)}</h2><p>${paused ? "Work time is frozen. Resume when you are ready to drive again." : "Active driving time. Lunches and errands will not count after you pause."}</p></div>
      <div class="hero-actions">
        <button class="button ${paused ? "button-primary" : "button-warning"}" type="button" data-action="${paused ? "resume-shift" : "pause-shift"}">${icon(paused ? "resume" : "pause", "icon icon-sm")}${paused ? "Resume shift" : "Pause shift"}</button>
        <button class="button button-secondary" type="button" data-action="end-shift">${icon("stop", "icon icon-sm")}End shift</button>
        <button class="button button-ghost" type="button" data-action="cancel-active-shift">${icon("trash", "icon icon-sm")}Cancel shift</button>
      </div>
      <div class="hero-stats"><div class="hero-stat"><span>Started</span><strong>${formatTime(active.startTime)}</strong></div><div class="hero-stat"><span>Start mileage</span><strong>${formatNumber(active.startOdometer, 1)} mi</strong></div><div class="hero-stat"><span>Paused total</span><strong data-live-paused>${formatDuration(pauseMs, false)}</strong></div></div>
    </div></section>`;
  }

  function renderTodayPlan() {
    const list = todayShifts();
    const summary = Core.summarizeShifts(list, state.settings);
    return `<section class="today-plan panel">
      <div class="panel-header"><div><h2 class="panel-title">Today’s money move</h2><p class="panel-subtitle">Gas plus your 25% plan</p></div><button class="button button-ghost button-small" type="button" data-action="open-today-money">Details${icon("chevronRight", "icon icon-sm")}</button></div>
      <div class="plan-total"><span>Take out / move</span><strong>${formatMoney(summary.takeOut)}</strong><p>${list.length ? `${formatMoney(summary.fuel)} gas + ${formatMoney(summary.allocated)} allocated` : "Finish a shift and your directions will appear here."}</p></div>
      <div class="mini-plan-grid"><div class="mini-plan"><span>Vehicle 5%</span><strong>${formatMoney(summary.vehicleFund)}</strong></div><div class="mini-plan"><span>Stocks 10%</span><strong>${formatMoney(summary.stock)}</strong></div><div class="mini-plan"><span>Crypto 10%</span><strong>${formatMoney(summary.crypto)}</strong></div><div class="mini-plan"><span>Keep available</span><strong>${formatMoney(summary.spendable)}</strong></div></div>
    </section>`;
  }

  function renderRecentShifts(limit) {
    const list = sortedShifts().slice(0, limit || 5);
    if (!list.length) return `<div class="empty-state" style="min-height:150px"><div class="empty-state-inner"><span class="empty-icon">${icon("receipt", "icon icon-lg")}</span><h3>No saved shifts yet</h3><p>Your completed shifts will show here.</p></div></div>`;
    return `<div class="recent-list">${list.map((raw) => {
      const shift = Core.calculateShift(raw, state.settings);
      return `<div class="recent-row"><div class="recent-main"><strong>${escapeHtml(formatDate(shift.date, { weekday: "short", month: "short", day: "numeric" }))} · ${escapeHtml(shift.platform)}</strong><span>${formatTime(shift.startTime)}–${formatTime(shift.endTime)} · ${formatNumber(shift.miles, 1)} mi · ${formatNumber(shift.hours, 1)} hr</span></div><div class="recent-money"><strong>${formatMoney(shift.net)}</strong><span>${formatMoney(shift.takeOut)} move</span></div><button class="icon-button" type="button" data-action="view-money-plan" data-id="${escapeAttribute(shift.id)}" aria-label="View money plan">${icon("wallet", "icon icon-sm")}</button></div>`;
    }).join("")}</div>`;
  }

  function renderOverviewPage() {
    const weekRange = Core.rangeForPeriod("week", new Date(), state.settings.weekStartsOn);
    const weekList = Core.filterShiftsByDate(state.shifts, weekRange.start, weekRange.end);
    const week = Core.summarizeShifts(weekList, state.settings);
    const goal = Core.safeNumber(state.settings.weeklyNetGoal);
    const goalPct = goal > 0 ? Math.min(100, Math.max(0, week.net / goal * 100)) : 0;
    return `<div class="overview-stack">
      <div class="overview-grid">${renderActiveHero()}${renderTodayPlan()}</div>
      <section class="metric-strip" aria-label="This week">
        ${metricCard({ icon: "dollar", label: "Week net", value: formatMoney(week.net), meta: `${formatMoney(week.gross)} gross · ${formatMoney(week.expenses)} expenses` })}
        ${metricCard({ icon: "clock", iconClass: "is-blue", label: "Net hourly", value: `${formatMoney(week.hourly)}/hr`, meta: `${formatNumber(week.hours, 1)} active hours` })}
        ${metricCard({ icon: "wallet", iconClass: "is-violet", label: "Move out", value: formatMoney(week.takeOut), meta: `Gas + ${formatMoney(week.allocated)} plan` })}
        ${metricCard({ icon: "target", iconClass: "is-amber", label: "Weekly goal", value: `${formatNumber(goalPct, 0)}%`, meta: goal ? `${formatMoney(Math.max(0, goal - week.net))} remaining` : "Set a goal in settings" })}
      </section>
      <div class="lower-grid">
        <section class="panel panel-pad"><div class="panel-header"><div><h2 class="panel-title">Recent shifts</h2><p class="panel-subtitle">Tap the wallet for exact directions</p></div><button class="button button-ghost button-small" type="button" data-route="shifts">All shifts${icon("chevronRight", "icon icon-sm")}</button></div>${renderRecentShifts(5)}</section>
        <aside class="panel panel-pad"><div class="panel-header"><div><h2 class="panel-title">Quick controls</h2><p class="panel-subtitle">The things you use most</p></div></div><div class="action-stack">
          <button class="quick-action" type="button" data-action="${state.activeShift ? (state.activeShift.pauseStartedAt ? "resume-shift" : "pause-shift") : "start-shift"}"><span class="quick-action-icon">${icon(state.activeShift ? (state.activeShift.pauseStartedAt ? "resume" : "pause") : "play", "icon icon-sm")}</span><span><strong>${state.activeShift ? (state.activeShift.pauseStartedAt ? "Resume current shift" : "Pause current shift") : "Start a new shift"}</strong><span>${state.activeShift ? "Keep lunch and errands out of work time." : "Enter your starting mileage first."}</span></span>${icon("chevronRight", "icon icon-sm")}</button>
          <button class="quick-action" type="button" data-action="open-today-money"><span class="quick-action-icon">${icon("wallet", "icon icon-sm")}</span><span><strong>Today’s money directions</strong><span>See gas, vehicle, stocks, crypto, and what stays available.</span></span>${icon("chevronRight", "icon icon-sm")}</button>
          <button class="quick-action" type="button" data-action="export-backup"><span class="quick-action-icon">${icon("download", "icon icon-sm")}</span><span><strong>Back up the dashboard</strong><span>Download a complete local-data safety copy.</span></span>${icon("chevronRight", "icon icon-sm")}</button>
        </div></aside>
      </div>
    </div>`;
  }

  function filteredShifts() {
    let list = state.shifts.slice();
    if (ui.shiftFilter !== "all") {
      const days = Math.max(1, Core.safeNumber(ui.shiftFilter, 30));
      const end = Core.endOfDay(new Date());
      const start = Core.startOfDay(new Date());
      start.setDate(start.getDate() - (days - 1));
      list = Core.filterShiftsByDate(list, start, end);
    }
    const query = ui.shiftSearch.trim().toLowerCase();
    if (query) {
      list = list.filter((item) => {
        const shift = Core.calculateShift(item, state.settings);
        return [shift.date, shift.platform, shift.notes, shift.gross, shift.net, shift.miles].join(" ").toLowerCase().includes(query);
      });
    }
    return sortedShifts(list);
  }

  function shiftTableRows(list) {
    return list.map((raw) => {
      const shift = Core.calculateShift(raw, state.settings);
      return `<tr><td><span class="table-primary">${escapeHtml(formatDate(shift.date, { month: "short", day: "numeric", year: "numeric" }))}</span><span class="table-secondary">${escapeHtml(shift.platform)} · ${formatTime(shift.startTime)}–${formatTime(shift.endTime)}</span></td><td class="table-number">${formatNumber(shift.hours, 1)} hr</td><td class="table-number">${formatNumber(shift.miles, 1)} mi</td><td class="table-number">${formatMoney(shift.gross)}</td><td class="table-number">${formatMoney(shift.expenses)}</td><td class="table-number">${formatMoney(shift.net)}</td><td class="table-number">${formatMoney(shift.takeOut)}</td><td class="table-number">${formatMoney(shift.spendable)}</td><td><div class="row-actions"><button class="icon-button" type="button" data-action="view-money-plan" data-id="${escapeAttribute(shift.id)}" aria-label="Money plan">${icon("wallet", "icon icon-sm")}</button><button class="icon-button" type="button" data-action="edit-shift" data-id="${escapeAttribute(shift.id)}" aria-label="Edit">${icon("edit", "icon icon-sm")}</button><button class="icon-button is-danger" type="button" data-action="delete-shift" data-id="${escapeAttribute(shift.id)}" aria-label="Delete">${icon("trash", "icon icon-sm")}</button></div></td></tr>`;
    }).join("");
  }

  function shiftMobileCards(list) {
    return list.map((raw) => {
      const shift = Core.calculateShift(raw, state.settings);
      return `<article class="shift-card panel"><div class="shift-card-head"><div class="shift-card-title"><strong>${escapeHtml(formatDate(shift.date, { weekday: "short", month: "short", day: "numeric" }))} · ${escapeHtml(shift.platform)}</strong><span>${formatTime(shift.startTime)}–${formatTime(shift.endTime)}${shift.pausedMs ? ` · ${formatDuration(shift.pausedMs, false)} paused` : ""}</span></div><strong class="shift-card-net">${formatMoney(shift.net)}</strong></div><div class="shift-card-grid"><div class="shift-mini"><span>Gross</span><strong>${formatMoney(shift.gross)}</strong></div><div class="shift-mini"><span>Miles</span><strong>${formatNumber(shift.miles, 1)}</strong></div><div class="shift-mini"><span>Move out</span><strong>${formatMoney(shift.takeOut)}</strong></div><div class="shift-mini"><span>Keep</span><strong>${formatMoney(shift.spendable)}</strong></div></div><div class="shift-card-actions"><button class="button button-primary button-small" type="button" data-action="view-money-plan" data-id="${escapeAttribute(shift.id)}">${icon("wallet", "icon icon-sm")}Plan</button><button class="button button-secondary button-small" type="button" data-action="edit-shift" data-id="${escapeAttribute(shift.id)}">${icon("edit", "icon icon-sm")}Edit</button><button class="button button-danger button-small" type="button" data-action="delete-shift" data-id="${escapeAttribute(shift.id)}">${icon("trash", "icon icon-sm")}Delete</button></div></article>`;
    }).join("");
  }

  function renderShiftsPage() {
    const list = filteredShifts();
    const summary = Core.summarizeShifts(list, state.settings);
    const chips = [["7", "7 days"], ["30", "30 days"], ["90", "90 days"], ["365", "Year"], ["all", "All"]];
    return `<div class="page-stack">
      <section class="toolbar panel"><div class="toolbar-row"><div class="search-field">${icon("search", "icon icon-sm")}<input type="search" data-input="shift-search" value="${escapeAttribute(ui.shiftSearch)}" placeholder="Search shifts, notes, or amounts" aria-label="Search shifts"></div><button class="button button-primary" type="button" data-action="add-shift">${icon("plus", "icon icon-sm")}Add shift</button></div><div class="toolbar-row"><div class="filter-chips">${chips.map(([value, label]) => `<button class="filter-chip${ui.shiftFilter === value ? " is-active" : ""}" type="button" data-action="shift-filter" data-value="${value}">${label}</button>`).join("")}</div><span class="pill">${list.length} result${list.length === 1 ? "" : "s"}</span></div></section>
      <section class="metric-strip">
        ${metricCard({ icon: "dollar", label: "Net", value: formatMoney(summary.net), meta: `${formatMoney(summary.gross)} gross` })}
        ${metricCard({ icon: "clock", iconClass: "is-blue", label: "Hours", value: formatNumber(summary.hours, 1), meta: `${formatMoney(summary.hourly)}/hr net` })}
        ${metricCard({ icon: "route", iconClass: "is-violet", label: "Miles", value: formatNumber(summary.miles, 1), meta: `${formatMoney(summary.netPerMile)}/mi net` })}
        ${metricCard({ icon: "wallet", iconClass: "is-amber", label: "Move out", value: formatMoney(summary.takeOut), meta: `${formatMoney(summary.spendable)} left available` })}
      </section>
      ${list.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Shift</th><th>Hours</th><th>Miles</th><th>Gross</th><th>Expenses</th><th>Net</th><th>Move out</th><th>Keep</th><th></th></tr></thead><tbody>${shiftTableRows(list)}</tbody></table></div><div class="mobile-shift-list">${shiftMobileCards(list)}</div>` : emptyState({ icon: "receipt", title: "No matching shifts", body: "Start a shift or add a past one to build your ledger.", action: "start-shift", actionIcon: "play", actionLabel: "Start shift" })}
    </div>`;
  }

  function moneyRange() {
    return Core.rangeForPeriod(ui.moneyPeriod, ui.moneyAnchor, state.settings.weekStartsOn);
  }

  function moneyPeriodLabel() {
    const range = moneyRange();
    if (ui.moneyPeriod === "all") return "All recorded shifts";
    if (ui.moneyPeriod === "day") return formatDate(Core.localISODate(range.start), { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    if (ui.moneyPeriod === "week") return `${formatDate(Core.localISODate(range.start), { month: "short", day: "numeric" })} – ${formatDate(Core.localISODate(range.end), { month: "short", day: "numeric", year: "numeric" })}`;
    if (ui.moneyPeriod === "month") return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(range.start);
    return new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(range.start);
  }

  function moneyList() {
    const range = moneyRange();
    return Core.filterShiftsByDate(state.shifts, range.start, range.end);
  }

  function dailyMoneyRows(list) {
    const groups = Core.groupShiftsByDate(list);
    const dates = Object.keys(groups).sort().reverse();
    if (!dates.length) return `<div class="empty-state" style="min-height:150px"><div class="empty-state-inner"><span class="empty-icon">${icon("wallet", "icon icon-lg")}</span><h3>No money directions here yet</h3><p>Complete a shift in this period to create the breakdown.</p></div></div>`;
    return `<div class="daily-list">${dates.map((date) => {
      const summary = Core.summarizeShifts(groups[date], state.settings);
      return `<button class="daily-row" type="button" data-action="open-money-day" data-date="${date}"><span class="daily-date"><strong>${escapeHtml(formatDate(date, { weekday: "short", month: "short", day: "numeric" }))}</strong><span>${summary.count} shift${summary.count === 1 ? "" : "s"} · ${formatNumber(summary.hours, 1)} hr</span></span><span class="daily-metric"><span>Net</span><strong>${formatMoney(summary.net)}</strong></span><span class="daily-metric"><span>Gas</span><strong>${formatMoney(summary.fuel)}</strong></span><span class="daily-metric"><span>Move out</span><strong>${formatMoney(summary.takeOut)}</strong></span></button>`;
    }).join("")}</div>`;
  }

  function renderMoneyPage() {
    const list = moneyList();
    const summary = Core.summarizeShifts(list, state.settings);
    const periods = [["day", "Day"], ["week", "Week"], ["month", "Month"], ["year", "Year"], ["all", "All"]];
    return `<div class="page-stack">
      <section class="period-toolbar panel"><div class="segmented">${periods.map(([value, label]) => `<button class="segment${ui.moneyPeriod === value ? " is-active" : ""}" type="button" data-action="money-period" data-value="${value}">${label}</button>`).join("")}</div><div class="date-nav"><button class="icon-button" type="button" data-action="money-prev" aria-label="Previous period" ${ui.moneyPeriod === "all" ? "disabled" : ""}>${icon("chevronLeft", "icon icon-sm")}</button><button class="button button-ghost button-small date-nav-label" type="button" data-action="money-today">${escapeHtml(moneyPeriodLabel())}</button><button class="icon-button" type="button" data-action="money-next" aria-label="Next period" ${ui.moneyPeriod === "all" ? "disabled" : ""}>${icon("chevronRight", "icon icon-sm")}</button></div></section>
      <div class="money-layout">
        <section class="money-hero panel"><div class="money-hero-top"><div><span class="money-hero-label">Take out / move</span><strong class="money-hero-value">${formatMoney(summary.takeOut)}</strong><p class="money-hero-copy">${formatMoney(summary.fuel)} gas + ${formatMoney(summary.allocated)} from the allocation plan</p></div><span class="command-icon">${icon("wallet", "icon icon-lg")}</span></div><div class="allocation-cards"><div class="allocation-card"><span>Gas replacement</span><strong>${formatMoney(summary.fuel)}</strong><small>Add back what you spent</small></div><div class="allocation-card"><span>Vehicle fund · 5%</span><strong>${formatMoney(summary.vehicleFund)}</strong><small>From positive net</small></div><div class="allocation-card"><span>Stocks · 10%</span><strong>${formatMoney(summary.stock)}</strong><small>From positive net</small></div><div class="allocation-card"><span>Crypto · 10%</span><strong>${formatMoney(summary.crypto)}</strong><small>Split below</small></div></div><div class="keep-box"><div><span>Keep available</span><p>After all expenses and allocations</p></div><strong>${formatMoney(summary.spendable)}</strong></div></section>
        <aside class="money-side"><section class="panel panel-pad"><div class="panel-header"><div><h2 class="panel-title">Crypto directions</h2><p class="panel-subtitle">Inside the 10% crypto bucket</p></div><span class="pill pill-blue">${formatMoney(summary.crypto)}</span></div><div class="crypto-grid"><div class="crypto-coin"><span>Bitcoin</span><strong>${formatMoney(summary.bitcoin)}</strong><small>55% of crypto</small></div><div class="crypto-coin"><span>Solana</span><strong>${formatMoney(summary.solana)}</strong><small>25% of crypto</small></div><div class="crypto-coin"><span>Ethereum</span><strong>${formatMoney(summary.ethereum)}</strong><small>15% of crypto</small></div><div class="crypto-coin"><span>AAVE</span><strong>${formatMoney(summary.aave)}</strong><small>5% of crypto</small></div></div></section>
        <section class="panel panel-pad"><div class="panel-header"><div><h2 class="panel-title">Period totals</h2><p class="panel-subtitle">How the money was calculated</p></div></div><div class="breakdown-list"><div class="breakdown-row"><span class="breakdown-dot"></span><span>Gross earnings</span><strong>${formatMoney(summary.gross)}</strong></div><div class="breakdown-row"><span class="breakdown-dot is-amber"></span><span>All expenses</span><strong>−${formatMoney(summary.expenses)}</strong></div><div class="breakdown-row"><span class="breakdown-dot is-blue"></span><span>Net after expenses</span><strong>${formatMoney(summary.net)}</strong></div><div class="breakdown-row"><span class="breakdown-dot is-violet"></span><span>25% allocation</span><strong>−${formatMoney(summary.allocated)}</strong></div>${summary.legacyInvestment ? `<div class="breakdown-row"><span class="breakdown-dot is-cyan"></span><span>Includes older saved allocation</span><strong>${formatMoney(summary.legacyInvestment)}</strong></div>` : ""}<div class="breakdown-row"><span class="breakdown-dot is-cyan"></span><span>Keep available</span><strong>${formatMoney(summary.spendable)}</strong></div></div></section></aside>
      </div>
      <section class="panel panel-pad"><div class="panel-header"><div><h2 class="panel-title">Day-by-day breakdown</h2><p class="panel-subtitle">Tap a day to isolate it</p></div><span class="pill">${list.length} shift${list.length === 1 ? "" : "s"}</span></div>${dailyMoneyRows(list)}</section>
      <div class="notice">${icon("info", "icon icon-sm")}<p>The 5% vehicle, 10% stock, and 10% crypto amounts use positive earnings after all logged expenses. “Take out” adds your gas back on top. This is your custom money-management plan, not investment or tax advice.</p></div>
    </div>`;
  }

  function calendarData() {
    const cursor = ui.calendarCursor;
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const monthStart = new Date(year, month, 1);
    const leading = (monthStart.getDay() - state.settings.weekStartsOn + 7) % 7;
    const gridStart = new Date(year, month, 1 - leading);
    const groups = Core.groupShiftsByDate(state.shifts);
    const monthList = Core.filterShiftsByDate(state.shifts, monthStart, Core.endOfMonth(cursor));
    const monthSummary = Core.summarizeShifts(monthList, state.settings);
    const maxNet = Math.max(1, ...Object.keys(groups).filter((key) => key.slice(0, 7) === Core.localISODate(monthStart).slice(0, 7)).map((key) => Math.max(0, Core.summarizeShifts(groups[key], state.settings).net)));
    const days = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const iso = Core.localISODate(date);
      const summary = Core.summarizeShifts(groups[iso] || [], state.settings);
      const heat = summary.net > 0 ? Math.min(4, Math.max(1, Math.ceil(summary.net / maxNet * 4))) : 0;
      days.push({ date, iso, outside: date.getMonth() !== month, summary, heat });
    }
    return { year, month, monthStart, days, monthSummary, groups };
  }

  function renderCalendarPage() {
    const data = calendarData();
    const selected = data.groups[ui.calendarSelected] || [];
    const summary = Core.summarizeShifts(selected, state.settings);
    const weekdays = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(2026, 0, 4 + ((state.settings.weekStartsOn + i) % 7));
      weekdays.push(new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date));
    }
    return `<div class="page-stack"><div class="calendar-layout"><section class="calendar-panel panel"><div class="calendar-toolbar"><button class="icon-button" type="button" data-action="calendar-prev">${icon("chevronLeft", "icon icon-sm")}</button><div class="calendar-title"><strong>${new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(data.monthStart)}</strong><span>${data.monthSummary.count} shifts · ${formatMoney(data.monthSummary.net)} net</span></div><div style="display:flex;gap:5px"><button class="button button-ghost button-small" type="button" data-action="calendar-today">Today</button><button class="icon-button" type="button" data-action="calendar-next">${icon("chevronRight", "icon icon-sm")}</button></div></div><div class="calendar-grid">${weekdays.map((day) => `<div class="calendar-weekday">${escapeHtml(day)}</div>`).join("")}${data.days.map((day) => `<button class="calendar-day${day.outside ? " is-outside" : ""}${day.iso === Core.localISODate() ? " is-today" : ""}${day.iso === ui.calendarSelected ? " is-selected" : ""}${day.heat ? ` heat-${day.heat}` : ""}" type="button" data-action="calendar-select" data-date="${day.iso}"><span class="calendar-day-number">${day.date.getDate()}</span>${day.summary.count ? `<span class="calendar-day-net">${formatMoney(day.summary.net, { compact: true })}</span><span class="calendar-day-move">${formatMoney(day.summary.takeOut, { compact: true })} move</span>` : ""}</button>`).join("")}</div></section><aside class="calendar-detail panel"><div class="panel-header"><div><h2 class="detail-date">${escapeHtml(formatDate(ui.calendarSelected, { weekday: "long", month: "long", day: "numeric" }))}</h2><p class="panel-subtitle">${summary.count} completed shift${summary.count === 1 ? "" : "s"}</p></div><button class="button button-primary button-small" type="button" data-action="add-shift-for-date" data-date="${ui.calendarSelected}">${icon("plus", "icon icon-sm")}Add</button></div><div class="detail-summary"><div class="detail-stat"><span>Gross</span><strong>${formatMoney(summary.gross)}</strong></div><div class="detail-stat"><span>Net</span><strong>${formatMoney(summary.net)}</strong></div><div class="detail-stat"><span>Move out</span><strong>${formatMoney(summary.takeOut)}</strong></div><div class="detail-stat"><span>Keep</span><strong>${formatMoney(summary.spendable)}</strong></div></div>${selected.length ? `<div class="recent-list">${sortedShifts(selected).map((raw) => { const shift = Core.calculateShift(raw, state.settings); return `<div class="recent-row"><div class="recent-main"><strong>${escapeHtml(shift.platform)}</strong><span>${formatTime(shift.startTime)}–${formatTime(shift.endTime)} · ${formatNumber(shift.miles, 1)} mi</span></div><div class="recent-money"><strong>${formatMoney(shift.net)}</strong><span>${formatMoney(shift.takeOut)} move</span></div><button class="icon-button" type="button" data-action="view-money-plan" data-id="${escapeAttribute(shift.id)}">${icon("wallet", "icon icon-sm")}</button></div>`; }).join("")}</div>` : `<div class="empty-state" style="min-height:160px"><div class="empty-state-inner"><span class="empty-icon">${icon("calendar", "icon icon-lg")}</span><h3>No shift saved</h3><p>Add one for this date or choose another day.</p></div></div>`}</aside></div></div>`;
  }

  function vehicleFundSummary() {
    const total = Core.summarizeShifts(state.shifts, state.settings);
    const spent = Core.round(state.maintenance.reduce((sum, item) => sum + Core.safeNumber(item.amount), 0), 2);
    return { contributions: total.vehicleFund, spent, balance: Core.round(total.vehicleFund - spent, 2) };
  }

  function renderMaintenanceList() {
    const list = state.maintenance.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)) || Core.safeNumber(b.odometer) - Core.safeNumber(a.odometer));
    if (!list.length) return `<div class="empty-state" style="min-height:160px"><div class="empty-state-inner"><span class="empty-icon">${icon("wrench", "icon icon-lg")}</span><h3>No maintenance logged</h3><p>Add oil changes, tires, repairs, and other vehicle costs.</p></div></div>`;
    return `<div class="maintenance-list">${list.map((item) => `<div class="maintenance-row"><div class="maintenance-main"><strong>${escapeHtml(item.type)}</strong><span>${escapeHtml(formatDate(item.date, { month: "short", day: "numeric", year: "numeric" }))}${item.odometer ? ` · ${formatNumber(item.odometer, 0)} mi` : ""}${item.note ? ` · ${escapeHtml(item.note)}` : ""}</span></div><strong class="maintenance-amount">${formatMoney(item.amount)}</strong><div class="row-actions"><button class="icon-button" type="button" data-action="edit-maintenance" data-id="${escapeAttribute(item.id)}">${icon("edit", "icon icon-sm")}</button><button class="icon-button is-danger" type="button" data-action="delete-maintenance" data-id="${escapeAttribute(item.id)}">${icon("trash", "icon icon-sm")}</button></div></div>`).join("")}</div>`;
  }

  function renderVehiclePage() {
    const fund = vehicleFundSummary();
    const odometer = Core.currentOdometer(state.shifts, state.maintenance, state.settings);
    const latest = state.maintenance.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
    return `<div class="page-stack"><div class="vehicle-grid"><section class="vehicle-fund panel"><div class="panel-header"><div><h2 class="panel-title">Vehicle reserve</h2><p class="panel-subtitle">5% from every new positive-net shift</p></div><span class="pill pill-success">Fund</span></div><strong class="vehicle-fund-value">${formatMoney(fund.balance)}</strong><p class="vehicle-fund-copy">Reserve balance after subtracting all logged maintenance costs.</p><div class="vehicle-mini-grid"><div class="vehicle-mini"><span>Contributed</span><strong>${formatMoney(fund.contributions)}</strong></div><div class="vehicle-mini"><span>Spent</span><strong>${formatMoney(fund.spent)}</strong></div><div class="vehicle-mini"><span>New rate</span><strong>5%</strong></div></div></section><section class="odometer-card panel"><div class="panel-header"><div><h2 class="panel-title">Current odometer</h2><p class="panel-subtitle">Highest mileage in your records</p></div><span class="metric-icon is-blue">${icon("route", "icon icon-sm")}</span></div><strong class="odometer-value">${formatNumber(odometer, 1)}</strong><p class="odometer-copy">${escapeHtml(state.settings.vehicle.name)}${latest ? ` · Last service ${formatDate(latest.date, { month: "short", day: "numeric" })}` : " · Add maintenance to build service history"}</p><button class="button button-secondary button-wide" style="margin-top:15px" type="button" data-action="update-odometer">${icon("edit", "icon icon-sm")}Update odometer</button></section></div><section class="panel panel-pad"><div class="panel-header"><div><h2 class="panel-title">Maintenance & vehicle expenses</h2><p class="panel-subtitle">These costs reduce the displayed vehicle reserve</p></div><button class="button button-primary button-small" type="button" data-action="add-maintenance">${icon("plus", "icon icon-sm")}Add service</button></div>${renderMaintenanceList()}</section></div>`;
  }

  function goalTiming(goal) {
    if (!goal.targetDate) return "No deadline";
    const target = Core.parseISODate(goal.targetDate);
    const today = Core.startOfDay(new Date());
    if (!target) return "No deadline";
    const days = Math.ceil((target.getTime() - today.getTime()) / 86400000);
    if (days < 0) return `${Math.abs(days)} days past target`;
    if (days === 0) return "Target is today";
    return `${days} day${days === 1 ? "" : "s"} remaining`;
  }

  function renderGoalCard(goal) {
    const saved = Core.goalSaved(goal);
    const percent = goal.target > 0 ? Math.min(100, Math.max(0, saved / goal.target * 100)) : 0;
    const complete = goal.target > 0 && saved >= goal.target;
    return `<article class="goal-card panel${complete ? " is-complete" : ""}"><div class="goal-card-top"><div style="min-width:0"><h3>${escapeHtml(goal.name)}</h3><p>${escapeHtml(goal.archived ? "Archived" : goalTiming(goal))}</p></div><span class="goal-percent">${formatNumber(percent, 0)}%</span></div><div class="goal-money"><strong>${formatMoney(saved, { noCents: true })}</strong><span>of ${formatMoney(goal.target, { noCents: true })}</span></div><div style="margin-top:10px"><div class="progress"><div class="progress-fill" style="width:${percent.toFixed(2)}%"></div></div></div>${goal.note ? `<p style="margin-top:10px">${escapeHtml(goal.note)}</p>` : ""}<div class="goal-actions"><button class="button button-primary button-small" type="button" data-action="add-contribution" data-id="${escapeAttribute(goal.id)}">${icon("plus", "icon icon-sm")}Add funds</button><button class="icon-button" type="button" data-action="edit-goal" data-id="${escapeAttribute(goal.id)}" aria-label="Edit goal">${icon("edit", "icon icon-sm")}</button><button class="icon-button ${goal.archived ? "" : "is-danger"}" type="button" data-action="${goal.archived ? "restore-goal" : "archive-goal"}" data-id="${escapeAttribute(goal.id)}" aria-label="${goal.archived ? "Restore" : "Archive"} goal">${icon(goal.archived ? "copy" : "archive", "icon icon-sm")}</button></div></article>`;
  }

  function renderGoalsPage() {
    const goals = state.goals.slice().sort((a, b) => Number(a.archived) - Number(b.archived) || String(a.targetDate || "9999").localeCompare(String(b.targetDate || "9999")) || String(a.name).localeCompare(String(b.name)));
    const active = goals.filter((goal) => !goal.archived);
    const target = active.reduce((sum, goal) => sum + Core.safeNumber(goal.target), 0);
    const saved = active.reduce((sum, goal) => sum + Core.goalSaved(goal), 0);
    const completed = active.filter((goal) => goal.target > 0 && Core.goalSaved(goal) >= goal.target).length;
    return `<div class="page-stack"><section class="goals-summary"><article class="goal-summary-card panel"><span>Active goals</span><strong>${active.length}</strong></article><article class="goal-summary-card panel"><span>Total saved</span><strong>${formatMoney(saved, { noCents: true })}</strong></article><article class="goal-summary-card panel"><span>Completed</span><strong>${completed}</strong></article></section><div class="section-heading"><div><h2>Your goals</h2><p>Use the money left available after the shift plan.</p></div><button class="button button-primary" type="button" data-action="add-goal">${icon("plus", "icon icon-sm")}New goal</button></div>${goals.length ? `<section class="goals-grid">${goals.map(renderGoalCard).join("")}</section>` : emptyState({ icon: "target", title: "No goals yet", body: "Create a target for something you want to fund.", action: "add-goal", actionIcon: "plus", actionLabel: "Create goal" })}${target ? `<div class="notice">${icon("info", "icon icon-sm")}<p>You have ${formatMoney(Math.max(0, target - saved))} left across active goals.</p></div>` : ""}</div>`;
  }

  function formatBytes(bytes) {
    const number = Math.max(0, Core.safeNumber(bytes));
    if (number < 1024) return `${formatNumber(number, 0)} B`;
    if (number < 1024 ** 2) return `${formatNumber(number / 1024, 1)} KB`;
    return `${formatNumber(number / 1024 ** 2, 1)} MB`;
  }

  function renderSettingsPage() {
    const plan = state.settings.moneyPlan;
    const serializedBytes = new Blob([JSON.stringify(serializeState())]).size;
    return `<div class="settings-layout"><form class="settings-stack" data-form="settings"><section class="settings-section panel"><div class="panel-header"><div><h2 class="panel-title">Dashboard preferences</h2><p class="panel-subtitle">Defaults used for future entries</p></div><span class="pill">Local</span></div><div class="form-grid"><div class="field"><label for="settingPlatform">Default platform</label><select id="settingPlatform" name="defaultPlatform">${PLATFORM_OPTIONS.map((option) => `<option value="${escapeAttribute(option)}"${state.settings.defaultPlatform === option ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></div><div class="field"><label for="settingWeekStart">Week starts on</label><select id="settingWeekStart" name="weekStartsOn"><option value="0"${state.settings.weekStartsOn === 0 ? " selected" : ""}>Sunday</option><option value="1"${state.settings.weekStartsOn === 1 ? " selected" : ""}>Monday</option></select></div><div class="field"><label for="settingWeeklyGoal">Weekly net goal</label><div class="input-shell"><span class="input-prefix">$</span><input id="settingWeeklyGoal" name="weeklyNetGoal" type="number" min="0" step="1" value="${escapeAttribute(state.settings.weeklyNetGoal)}"></div></div><div class="field"><label for="settingMonthlyGoal">Monthly net goal</label><div class="input-shell"><span class="input-prefix">$</span><input id="settingMonthlyGoal" name="monthlyNetGoal" type="number" min="0" step="1" value="${escapeAttribute(state.settings.monthlyNetGoal)}"></div></div><div class="field span-2"><label for="settingVehicleName">Vehicle name</label><input id="settingVehicleName" name="vehicleName" value="${escapeAttribute(state.settings.vehicle.name)}" maxlength="60"></div></div><button class="button button-primary button-wide" style="margin-top:12px" type="submit">${icon("check", "icon icon-sm")}Save preferences</button></section><section class="settings-section panel"><div class="panel-header"><div><h2 class="panel-title">Your fixed 25% money plan</h2><p class="panel-subtitle">Applied to positive net earnings on new shifts</p></div><span class="pill pill-success">25%</span></div><div class="settings-plan-grid"><div class="settings-plan-item"><span>Vehicle fund</span><strong>${formatNumber(plan.vehiclePct, 0)}%</strong></div><div class="settings-plan-item"><span>Stocks</span><strong>${formatNumber(plan.stockPct, 0)}%</strong></div><div class="settings-plan-item"><span>Crypto</span><strong>${formatNumber(plan.cryptoPct, 0)}%</strong></div></div><div class="crypto-rules"><div class="crypto-rule"><span>Bitcoin</span><strong>${formatNumber(plan.cryptoMix.bitcoin, 0)}%</strong></div><div class="crypto-rule"><span>Solana</span><strong>${formatNumber(plan.cryptoMix.solana, 0)}%</strong></div><div class="crypto-rule"><span>Ethereum</span><strong>${formatNumber(plan.cryptoMix.ethereum, 0)}%</strong></div><div class="crypto-rule"><span>AAVE</span><strong>${formatNumber(plan.cryptoMix.aave, 0)}%</strong></div></div><div class="notice is-success" style="margin-top:10px">${icon("check", "icon icon-sm")}<p>The app also adds gas to the final “take out” number. Older shifts keep their previously saved allocation rather than being rewritten.</p></div></section></form><aside class="settings-stack"><section class="settings-section panel"><div class="panel-header"><div><h2 class="panel-title">Backups & exports</h2><p class="panel-subtitle">Protect the records stored on this device</p></div></div><div class="data-actions"><button class="data-action" type="button" data-action="export-backup"><span class="metric-icon">${icon("download", "icon icon-sm")}</span><strong>Full backup</strong><span>Download shifts, goals, maintenance, settings, and an active shift.</span></button><button class="data-action" type="button" data-action="import-data"><span class="metric-icon is-blue">${icon("upload", "icon icon-sm")}</span><strong>Import data</strong><span>Restore a JSON backup or import compatible shift CSV rows.</span></button><button class="data-action" type="button" data-action="export-csv"><span class="metric-icon is-violet">${icon("receipt", "icon icon-sm")}</span><strong>Export shifts</strong><span>Download a spreadsheet-friendly CSV with money-plan amounts.</span></button><button class="data-action" type="button" data-action="reset-data"><span class="metric-icon is-amber">${icon("trash", "icon icon-sm")}</span><strong>Reset dashboard</strong><span>Erase this dashboard’s locally stored data after confirmation.</span></button></div></section><section class="settings-section panel"><div class="panel-header"><div><h2 class="panel-title">Storage & version</h2><p class="panel-subtitle">No account, server, or analytics</p></div><span class="pill pill-blue">v${Core.APP_VERSION}</span></div><div class="breakdown-list"><div class="breakdown-row"><span class="breakdown-dot"></span><span>Saved shifts</span><strong>${state.shifts.length}</strong></div><div class="breakdown-row"><span class="breakdown-dot is-blue"></span><span>Maintenance records</span><strong>${state.maintenance.length}</strong></div><div class="breakdown-row"><span class="breakdown-dot is-violet"></span><span>Goals</span><strong>${state.goals.length}</strong></div><div class="breakdown-row"><span class="breakdown-dot is-amber"></span><span>Approx. backup size</span><strong>${formatBytes(serializedBytes)}</strong></div></div></section></aside></div>`;
  }

  function renderCurrentRoute() {
    switch (ui.route) {
      case "shifts": dom.main.innerHTML = renderShiftsPage(); break;
      case "analytics": dom.main.innerHTML = renderMoneyPage(); break;
      case "calendar": dom.main.innerHTML = renderCalendarPage(); break;
      case "vehicle": dom.main.innerHTML = renderVehiclePage(); break;
      case "goals": dom.main.innerHTML = renderGoalsPage(); break;
      case "settings": dom.main.innerHTML = renderSettingsPage(); break;
      case "overview":
      default: dom.main.innerHTML = renderOverviewPage(); break;
    }
  }

  function renderApp() {
    applyTheme();
    renderNavigation();
    renderHeader();
    renderCurrentRoute();
  }

  function platformOptions(selected) {
    const current = selected || state.settings.defaultPlatform;
    const options = PLATFORM_OPTIONS.includes(current) ? PLATFORM_OPTIONS : PLATFORM_OPTIONS.concat(current);
    return options.map((option) => `<option value="${escapeAttribute(option)}"${option === current ? " selected" : ""}>${escapeHtml(option)}</option>`).join("");
  }

  function moneyPreviewMarkup(shiftValue) {
    const shift = Core.calculateShift(shiftValue, state.settings);
    return `<div class="preview-strip"><div class="preview-item"><span>Net after expenses</span><strong data-preview-net>${formatMoney(shift.net)}</strong></div><div class="preview-item"><span>25% plan</span><strong data-preview-allocated>${formatMoney(shift.allocated)}</strong></div><div class="preview-item"><span>Take out + gas</span><strong data-preview-takeout>${formatMoney(shift.takeOut)}</strong></div><div class="preview-item"><span>Keep available</span><strong data-preview-keep>${formatMoney(shift.spendable)}</strong></div></div>`;
  }

  function openStartShiftModal() {
    if (state.activeShift) {
      showToast("A shift is already active.", "warning");
      return;
    }
    const now = new Date();
    const currentOdometer = Core.currentOdometer(state.shifts, state.maintenance, state.settings);
    const body = `<form data-form="start-shift"><div class="notice is-success">${icon("route", "icon icon-sm")}<p>Starting mileage comes first so the shift is ready before the timer begins.</p></div><div class="form-section" style="margin-top:11px"><div class="form-section-title">${icon("play", "icon icon-sm")}Start details</div><div class="form-grid"><div class="field"><label for="startPlatform">Platform</label><select id="startPlatform" name="platform">${platformOptions(state.settings.defaultPlatform)}</select></div><div class="field"><label for="startOdometer">Starting mileage</label><div class="input-shell has-suffix"><input id="startOdometer" name="startOdometer" type="number" min="0" step="0.1" value="${currentOdometer ? escapeAttribute(currentOdometer) : ""}" inputmode="decimal" autofocus required><span class="input-suffix">mi</span></div></div><div class="field"><label for="startDate">Date</label><input id="startDate" name="date" type="date" value="${Core.localISODate(now)}" required></div><div class="field"><label for="startTime">Start time</label><input id="startTime" name="startTime" type="time" value="${currentTimeValue(now)}" required></div><div class="field span-2"><label for="startNotes">Shift note <span style="color:var(--muted);font-weight:500">(optional)</span></label><input id="startNotes" name="notes" maxlength="160" placeholder="Airport run, evening shift, weekend drive…"></div></div></div></form>`;
    openModal({
      title: "Start shift",
      subtitle: "Enter the odometer, then the work timer begins.",
      body,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="submit-start-shift">${icon("play", "icon icon-sm")}Start shift</button>`,
      meta: { type: "start-shift" }
    });
  }

  function submitStartShift() {
    const form = dom.modalRoot.querySelector('[data-form="start-shift"]');
    if (!form) return;
    const data = new FormData(form);
    const date = String(data.get("date") || "");
    const startTime = String(data.get("startTime") || "");
    const mileageRaw = String(data.get("startOdometer") || "").trim();
    if (!Core.parseISODate(date) || !startTime || mileageRaw === "") {
      showToast("Add the date, time, and starting mileage.", "warning");
      return;
    }
    const started = dateTimeFromLocal(date, startTime);
    if (!started) {
      showToast("The shift start date or time is invalid.", "warning");
      return;
    }
    if (started.getTime() > Date.now() + 300000) {
      showToast("The shift start cannot be in the future.", "warning");
      return;
    }
    state.activeShift = Core.normalizeActiveShift({
      id: Core.uid("active"),
      date,
      platform: String(data.get("platform") || state.settings.defaultPlatform),
      startTime,
      startedAt: started.toISOString(),
      startOdometer: Math.max(0, Core.safeNumber(mileageRaw)),
      pausedMs: 0,
      pauseStartedAt: "",
      pauseHistory: [],
      notes: String(data.get("notes") || ""),
      createdAt: new Date().toISOString()
    }, state.settings);
    saveState();
    closeModal(false);
    setRoute("overview", { focus: false });
    showToast("Shift started. Your active timer is running.");
  }

  function endPreviewFromForm(form) {
    const data = new FormData(form);
    return {
      date: state.activeShift ? state.activeShift.date : Core.localISODate(),
      gross: data.get("gross"),
      fuel: data.get("fuel"),
      tolls: data.get("tolls"),
      otherExpenses: data.get("otherExpenses"),
      moneyPlanRates: state.settings.moneyPlan,
      startOdometer: state.activeShift ? state.activeShift.startOdometer : 0,
      endOdometer: data.get("endOdometer"),
      manualHours: state.activeShift ? Core.activeDurationMs(state.activeShift) / 3600000 : 0
    };
  }

  function updateEndPreview() {
    const form = dom.modalRoot.querySelector('[data-form="end-shift"]');
    if (!form) return;
    const shift = Core.calculateShift(endPreviewFromForm(form), state.settings);
    const map = {
      "[data-preview-net]": shift.net,
      "[data-preview-allocated]": shift.allocated,
      "[data-preview-takeout]": shift.takeOut,
      "[data-preview-keep]": shift.spendable
    };
    Object.entries(map).forEach(([selector, value]) => {
      const node = dom.modalRoot.querySelector(selector);
      if (node) node.textContent = formatMoney(value);
    });
  }

  function openEndShiftModal() {
    const active = state.activeShift;
    if (!active) {
      showToast("There is no active shift to end.", "warning");
      return;
    }
    const now = new Date();
    const paused = Boolean(active.pauseStartedAt);
    const preview = {
      gross: 0,
      fuel: 0,
      tolls: 0,
      otherExpenses: 0,
      moneyPlanRates: state.settings.moneyPlan,
      manualHours: Core.activeDurationMs(active, now) / 3600000,
      startOdometer: active.startOdometer,
      endOdometer: active.startOdometer
    };
    const body = `<form data-form="end-shift"><div class="notice ${paused ? "is-warning" : "is-success"}">${icon(paused ? "pause" : "clock", "icon icon-sm")}<p>${paused ? "This shift is paused. Finishing it will close the current pause and keep paused time out of your work hours." : `Active work time: ${formatDuration(Core.activeDurationMs(active, now), false)}. Paused time: ${formatDuration(Core.activePausedMs(active, now), false)}.`}</p></div><div class="form-section" style="margin-top:11px"><div class="form-section-title">${icon("route", "icon icon-sm")}Ending mileage</div><div class="form-grid"><div class="field"><label>Starting mileage</label><input value="${escapeAttribute(active.startOdometer)}" disabled></div><div class="field"><label for="endOdometer">Ending mileage</label><div class="input-shell has-suffix"><input id="endOdometer" name="endOdometer" type="number" min="${escapeAttribute(active.startOdometer)}" step="0.1" value="${escapeAttribute(Math.max(active.startOdometer, Core.currentOdometer(state.shifts, state.maintenance, state.settings)))}" inputmode="decimal" autofocus required><span class="input-suffix">mi</span></div></div></div></div><div class="form-section"><div class="form-section-title">${icon("dollar", "icon icon-sm")}Earnings & expenses</div><div class="form-grid"><div class="field"><label for="endGross">Gross earnings</label><div class="input-shell"><span class="input-prefix">$</span><input id="endGross" name="gross" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" required></div></div><div class="field"><label for="endFuel">Gas</label><div class="input-shell"><span class="input-prefix">$</span><input id="endFuel" name="fuel" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"></div></div><div class="field"><label for="endTolls">Tolls / parking</label><div class="input-shell"><span class="input-prefix">$</span><input id="endTolls" name="tolls" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"></div></div><div class="field"><label for="endOther">Other expenses</label><div class="input-shell"><span class="input-prefix">$</span><input id="endOther" name="otherExpenses" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"></div></div></div>${moneyPreviewMarkup(preview)}</div><div class="form-section"><div class="form-section-title">${icon("receipt", "icon icon-sm")}Shift notes</div><div class="form-grid"><div class="field"><label for="endTrips">Trips / deliveries</label><input id="endTrips" name="trips" type="number" min="0" step="1" inputmode="numeric" placeholder="0"></div><div class="field"><label for="endNotes">Notes</label><input id="endNotes" name="notes" maxlength="220" value="${escapeAttribute(active.notes || "")}" placeholder="Optional"></div></div></div></form>`;
    openModal({
      title: "Finish shift",
      subtitle: "Save the numbers, then get your exact money directions.",
      body,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="submit-end-shift">${icon("wallet", "icon icon-sm")}Finish & show money plan</button>`,
      className: "modal-wide",
      meta: { type: "end-shift" }
    });
  }

  function submitEndShift() {
    const form = dom.modalRoot.querySelector('[data-form="end-shift"]');
    const activeOriginal = state.activeShift;
    if (!form || !activeOriginal) return;
    const data = new FormData(form);
    const endRaw = String(data.get("endOdometer") || "").trim();
    const grossRaw = String(data.get("gross") || "").trim();
    const endOdometer = Core.safeNumber(endRaw);
    if (endRaw === "" || endOdometer < Core.safeNumber(activeOriginal.startOdometer)) {
      showToast("Ending mileage must be at least the starting mileage.", "warning");
      return;
    }
    if (grossRaw === "" || Core.safeNumber(grossRaw) < 0) {
      showToast("Enter the shift’s gross earnings.", "warning");
      return;
    }
    const now = new Date();
    const active = Core.finalizeActivePause(activeOriginal, now);
    const workHours = Core.activeDurationMs(active, now) / 3600000;
    const record = Core.normalizeShift({
      id: Core.uid("shift"),
      date: active.date,
      platform: active.platform,
      startTime: active.startTime,
      endTime: currentTimeValue(now),
      startedAt: active.startedAt,
      endedAt: now.toISOString(),
      gross: Math.max(0, Core.safeNumber(grossRaw)),
      fuel: Math.max(0, Core.safeNumber(data.get("fuel"))),
      tolls: Math.max(0, Core.safeNumber(data.get("tolls"))),
      otherExpenses: Math.max(0, Core.safeNumber(data.get("otherExpenses"))),
      startOdometer: active.startOdometer,
      endOdometer,
      manualHours: Core.round(workHours, 4),
      pausedMs: active.pausedMs,
      pauseHistory: active.pauseHistory,
      trips: Math.max(0, Math.floor(Core.safeNumber(data.get("trips")))),
      notes: String(data.get("notes") || ""),
      moneyPlanRates: state.settings.moneyPlan,
      moneyPlanVersion: 2,
      createdAt: active.createdAt || now.toISOString(),
      updatedAt: now.toISOString()
    }, state.settings);
    state.shifts.push(record);
    state.settings.vehicle.currentOdometer = Math.max(Core.safeNumber(state.settings.vehicle.currentOdometer), endOdometer);
    state.activeShift = null;
    saveState();
    renderApp();
    openMoneyPlanModal(record.id, true);
  }

  function pauseShift() {
    if (!state.activeShift) {
      showToast("Start a shift before pausing.", "warning");
      return;
    }
    if (state.activeShift.pauseStartedAt) {
      showToast("The shift is already paused.", "warning");
      return;
    }
    state.activeShift.pauseStartedAt = new Date().toISOString();
    saveState();
    renderApp();
    showToast("Shift paused. Work time is no longer counting.");
  }

  function resumeShift() {
    if (!state.activeShift || !state.activeShift.pauseStartedAt) {
      showToast("The current shift is not paused.", "warning");
      return;
    }
    state.activeShift = Core.finalizeActivePause(state.activeShift, new Date());
    saveState();
    renderApp();
    showToast("Shift resumed. Work time is counting again.");
  }

  function moneyPlanMarkup(raw) {
    const shift = Core.calculateShift(raw, state.settings);
    if (!shift.isNewMoneyPlan) {
      return `<div class="money-command"><div class="money-command-top"><div><span>Take out / move</span><strong>${formatMoney(shift.takeOut)}</strong><p>${formatMoney(shift.fuel)} gas + ${formatMoney(shift.allocated)} saved historical allocation</p></div><span class="command-icon">${icon("wallet", "icon icon-lg")}</span></div><div class="money-instructions"><div class="instruction-card"><span class="instruction-number">1</span><span><span>Replace gas</span><strong>Put back what this shift used</strong></span><strong class="instruction-amount">${formatMoney(shift.fuel)}</strong></div><div class="instruction-card"><span class="instruction-number">2</span><span><span>Older allocation</span><strong>Preserved from the original shift</strong></span><strong class="instruction-amount">${formatMoney(shift.allocated)}</strong></div></div></div><div class="keep-box"><div><span>Keep available</span><p>After expenses and that saved allocation</p></div><strong>${formatMoney(shift.spendable)}</strong></div><div class="notice" style="margin-top:11px">${icon("info", "icon icon-sm")}<p>This is an older shift, so its original allocation is preserved instead of being retroactively split into stocks and crypto.</p></div>`;
    }
    return `<div class="money-command"><div class="money-command-top"><div><span>Take out / move</span><strong>${formatMoney(shift.takeOut)}</strong><p>${formatMoney(shift.fuel)} gas + ${formatMoney(shift.allocated)} from the 25% plan</p></div><span class="command-icon">${icon("wallet", "icon icon-lg")}</span></div><div class="money-instructions"><div class="instruction-card"><span class="instruction-number">1</span><span><span>Replace gas</span><strong>Put back what the shift used</strong></span><strong class="instruction-amount">${formatMoney(shift.fuel)}</strong></div><div class="instruction-card"><span class="instruction-number">2</span><span><span>Vehicle fund · 5%</span><strong>Set aside for maintenance</strong></span><strong class="instruction-amount">${formatMoney(shift.vehicleFund)}</strong></div><div class="instruction-card"><span class="instruction-number">3</span><span><span>Stocks · 10%</span><strong>Move to the stock account</strong></span><strong class="instruction-amount">${formatMoney(shift.stock)}</strong></div><div class="instruction-card"><span class="instruction-number">4</span><span><span>Crypto · 10%</span><strong>Split across four coins</strong></span><strong class="instruction-amount">${formatMoney(shift.crypto)}</strong></div></div></div><div class="crypto-box"><div class="crypto-box-head"><strong>Split the ${formatMoney(shift.crypto)} crypto bucket</strong><span class="pill pill-blue">100%</span></div><div class="crypto-grid"><div class="crypto-coin"><span>Bitcoin</span><strong>${formatMoney(shift.cryptoBreakdown.bitcoin)}</strong><small>55%</small></div><div class="crypto-coin"><span>Solana</span><strong>${formatMoney(shift.cryptoBreakdown.solana)}</strong><small>25%</small></div><div class="crypto-coin"><span>Ethereum</span><strong>${formatMoney(shift.cryptoBreakdown.ethereum)}</strong><small>15%</small></div><div class="crypto-coin"><span>AAVE</span><strong>${formatMoney(shift.cryptoBreakdown.aave)}</strong><small>5%</small></div></div></div><div class="keep-box"><div><span>Keep available</span><p>After all expenses and the 25% plan</p></div><strong>${formatMoney(shift.spendable)}</strong></div><div class="notice" style="margin-top:11px">${icon("info", "icon icon-sm")}<p>The percentage base is ${formatMoney(shift.positiveNet)}—your positive earnings after gas, tolls, and other expenses.</p></div>`;
  }

  function openMoneyPlanModal(id, justFinished) {
    const shift = findShift(id);
    if (!shift) {
      showToast("That shift could not be found.", "error");
      return;
    }
    const calculated = Core.calculateShift(shift, state.settings);
    openModal({
      title: justFinished ? "Shift saved — here’s what to do" : "Shift money directions",
      subtitle: `${formatDate(calculated.date, { weekday: "long", month: "long", day: "numeric" })} · ${calculated.platform} · ${formatMoney(calculated.gross)} gross`,
      body: moneyPlanMarkup(shift),
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Done</button><button class="button button-primary" type="button" data-action="view-money-page" data-date="${escapeAttribute(calculated.date)}">${icon("wallet", "icon icon-sm")}Open money dashboard</button>`,
      className: "modal-plan",
      meta: { type: "money-plan", id }
    });
  }

  function manualPreviewFromForm(form, existing) {
    const data = new FormData(form);
    const isLegacy = existing && !existing.moneyPlanRates;
    return {
      ...(existing || {}),
      date: String(data.get("date") || Core.localISODate()),
      startTime: String(data.get("startTime") || ""),
      endTime: String(data.get("endTime") || ""),
      pausedMs: Math.max(0, Core.safeNumber(data.get("pausedMinutes"))) * 60000,
      manualHours: Math.max(0, Core.safeNumber(data.get("manualHours"))),
      startOdometer: data.get("startOdometer"),
      endOdometer: data.get("endOdometer"),
      manualMiles: data.get("manualMiles"),
      gross: data.get("gross"),
      fuel: data.get("fuel"),
      tolls: data.get("tolls"),
      otherExpenses: data.get("otherExpenses"),
      moneyPlanRates: isLegacy ? null : (existing && existing.moneyPlanRates ? existing.moneyPlanRates : state.settings.moneyPlan),
      moneyPlanVersion: isLegacy ? existing.moneyPlanVersion : 2
    };
  }

  function updateManualPreview() {
    const form = dom.modalRoot.querySelector('[data-form="manual-shift"]');
    if (!form) return;
    const existing = form.dataset.id ? findShift(form.dataset.id) : null;
    const shift = Core.calculateShift(manualPreviewFromForm(form, existing), state.settings);
    const map = {
      "[data-preview-net]": shift.net,
      "[data-preview-allocated]": shift.allocated,
      "[data-preview-takeout]": shift.takeOut,
      "[data-preview-keep]": shift.spendable
    };
    Object.entries(map).forEach(([selector, value]) => {
      const node = dom.modalRoot.querySelector(selector);
      if (node) node.textContent = formatMoney(value);
    });
  }

  function openManualShiftModal(id, suppliedDate) {
    const existing = id ? findShift(id) : null;
    if (id && !existing) {
      showToast("That shift could not be found.", "error");
      return;
    }
    const defaults = existing ? Core.calculateShift(existing, state.settings) : {
      date: suppliedDate && Core.parseISODate(suppliedDate) ? suppliedDate : Core.localISODate(),
      platform: state.settings.defaultPlatform,
      startTime: "",
      endTime: "",
      pausedMs: 0,
      manualHours: 0,
      startOdometer: Core.currentOdometer(state.shifts, state.maintenance, state.settings),
      endOdometer: 0,
      manualMiles: 0,
      gross: 0,
      fuel: 0,
      tolls: 0,
      otherExpenses: 0,
      trips: 0,
      notes: "",
      moneyPlanRates: state.settings.moneyPlan
    };
    const preview = existing || { ...defaults, moneyPlanRates: state.settings.moneyPlan };
    const body = `<form data-form="manual-shift" data-id="${escapeAttribute(existing ? existing.id : "")}"><div class="form-section"><div class="form-section-title">${icon("calendar", "icon icon-sm")}Shift details</div><div class="form-grid is-three"><div class="field"><label for="manualDate">Date</label><input id="manualDate" name="date" type="date" value="${escapeAttribute(defaults.date)}" required></div><div class="field"><label for="manualPlatform">Platform</label><select id="manualPlatform" name="platform">${platformOptions(defaults.platform)}</select></div><div class="field"><label for="manualTrips">Trips</label><input id="manualTrips" name="trips" type="number" min="0" step="1" value="${defaults.trips || ""}" inputmode="numeric"></div><div class="field"><label for="manualStartTime">Start time</label><input id="manualStartTime" name="startTime" type="time" value="${escapeAttribute(defaults.startTime || "")}"></div><div class="field"><label for="manualEndTime">End time</label><input id="manualEndTime" name="endTime" type="time" value="${escapeAttribute(defaults.endTime || "")}"></div><div class="field"><label for="manualHours">Manual active hours</label><div class="input-shell has-suffix"><input id="manualHours" name="manualHours" type="number" min="0" step="0.01" value="${defaults.manualHours ? escapeAttribute(Core.round(defaults.manualHours, 2)) : ""}" inputmode="decimal"><span class="input-suffix">hr</span></div><p class="field-help">Overrides start/end time when entered.</p></div><div class="field"><label for="manualPause">Paused minutes</label><div class="input-shell has-suffix"><input id="manualPause" name="pausedMinutes" type="number" min="0" step="1" value="${defaults.pausedMs ? escapeAttribute(Core.round(defaults.pausedMs / 60000, 0)) : ""}" inputmode="numeric"><span class="input-suffix">min</span></div></div></div></div><div class="form-section"><div class="form-section-title">${icon("route", "icon icon-sm")}Mileage</div><div class="form-grid is-three"><div class="field"><label for="manualStartOdo">Start odometer</label><div class="input-shell has-suffix"><input id="manualStartOdo" name="startOdometer" type="number" min="0" step="0.1" value="${defaults.startOdometer ? escapeAttribute(defaults.startOdometer) : ""}" inputmode="decimal"><span class="input-suffix">mi</span></div></div><div class="field"><label for="manualEndOdo">End odometer</label><div class="input-shell has-suffix"><input id="manualEndOdo" name="endOdometer" type="number" min="0" step="0.1" value="${defaults.endOdometer ? escapeAttribute(defaults.endOdometer) : ""}" inputmode="decimal"><span class="input-suffix">mi</span></div></div><div class="field"><label for="manualMiles">Manual business miles</label><div class="input-shell has-suffix"><input id="manualMiles" name="manualMiles" type="number" min="0" step="0.1" value="${defaults.manualMiles ? escapeAttribute(defaults.manualMiles) : ""}" inputmode="decimal"><span class="input-suffix">mi</span></div><p class="field-help">Used when odometer values are unavailable.</p></div></div></div><div class="form-section"><div class="form-section-title">${icon("dollar", "icon icon-sm")}Earnings & expenses</div><div class="form-grid"><div class="field"><label for="manualGross">Gross earnings</label><div class="input-shell"><span class="input-prefix">$</span><input id="manualGross" name="gross" type="number" min="0" step="0.01" value="${defaults.gross ? escapeAttribute(defaults.gross) : ""}" inputmode="decimal" required></div></div><div class="field"><label for="manualFuel">Gas</label><div class="input-shell"><span class="input-prefix">$</span><input id="manualFuel" name="fuel" type="number" min="0" step="0.01" value="${defaults.fuel ? escapeAttribute(defaults.fuel) : ""}" inputmode="decimal"></div></div><div class="field"><label for="manualTolls">Tolls / parking</label><div class="input-shell"><span class="input-prefix">$</span><input id="manualTolls" name="tolls" type="number" min="0" step="0.01" value="${defaults.tolls ? escapeAttribute(defaults.tolls) : ""}" inputmode="decimal"></div></div><div class="field"><label for="manualOther">Other expenses</label><div class="input-shell"><span class="input-prefix">$</span><input id="manualOther" name="otherExpenses" type="number" min="0" step="0.01" value="${defaults.otherExpenses ? escapeAttribute(defaults.otherExpenses) : ""}" inputmode="decimal"></div></div></div>${moneyPreviewMarkup(preview)}</div><div class="form-section"><div class="form-section-title">${icon("receipt", "icon icon-sm")}Notes</div><div class="field"><label for="manualNotes">Notes</label><textarea id="manualNotes" name="notes" maxlength="500" placeholder="Optional">${escapeHtml(defaults.notes || "")}</textarea></div></div>${existing && !existing.moneyPlanRates ? `<div class="notice" style="margin-top:11px">${icon("info", "icon icon-sm")}<p>This older shift will keep its original saved allocation when edited.</p></div>` : ""}</form>`;
    openModal({
      title: existing ? "Edit shift" : "Add completed shift",
      subtitle: existing ? "Update the record without changing its historical allocation plan." : "New entries use the 5% vehicle, 10% stock, and 10% crypto plan.",
      body,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="submit-manual-shift">${icon("check", "icon icon-sm")}${existing ? "Save changes" : "Save & show plan"}</button>`,
      className: "modal-wide",
      meta: { type: "manual-shift", id: existing ? existing.id : "" }
    });
  }

  function submitManualShift() {
    const form = dom.modalRoot.querySelector('[data-form="manual-shift"]');
    if (!form) return;
    const existing = form.dataset.id ? findShift(form.dataset.id) : null;
    const data = new FormData(form);
    const date = String(data.get("date") || "");
    const grossRaw = String(data.get("gross") || "").trim();
    if (!Core.parseISODate(date) || grossRaw === "") {
      showToast("Add a valid date and gross earnings.", "warning");
      return;
    }
    const startOdoRaw = String(data.get("startOdometer") || "").trim();
    const endOdoRaw = String(data.get("endOdometer") || "").trim();
    if (startOdoRaw && endOdoRaw && Core.safeNumber(endOdoRaw) < Core.safeNumber(startOdoRaw)) {
      showToast("Ending mileage cannot be lower than starting mileage.", "warning");
      return;
    }
    const now = new Date().toISOString();
    const base = existing ? { ...existing } : {
      id: Core.uid("shift"),
      createdAt: now,
      moneyPlanRates: state.settings.moneyPlan,
      moneyPlanVersion: 2
    };
    const record = Core.normalizeShift({
      ...base,
      date,
      platform: String(data.get("platform") || state.settings.defaultPlatform),
      startTime: String(data.get("startTime") || ""),
      endTime: String(data.get("endTime") || ""),
      manualHours: Math.max(0, Core.safeNumber(data.get("manualHours"))),
      pausedMs: Math.max(0, Core.safeNumber(data.get("pausedMinutes"))) * 60000,
      startOdometer: Math.max(0, Core.safeNumber(data.get("startOdometer"))),
      endOdometer: Math.max(0, Core.safeNumber(data.get("endOdometer"))),
      manualMiles: Math.max(0, Core.safeNumber(data.get("manualMiles"))),
      gross: Math.max(0, Core.safeNumber(grossRaw)),
      fuel: Math.max(0, Core.safeNumber(data.get("fuel"))),
      tolls: Math.max(0, Core.safeNumber(data.get("tolls"))),
      otherExpenses: Math.max(0, Core.safeNumber(data.get("otherExpenses"))),
      trips: Math.max(0, Math.floor(Core.safeNumber(data.get("trips")))),
      notes: String(data.get("notes") || ""),
      updatedAt: now
    }, state.settings);
    if (existing) state.shifts = state.shifts.map((item) => item.id === existing.id ? record : item);
    else state.shifts.push(record);
    state.settings.vehicle.currentOdometer = Math.max(Core.safeNumber(state.settings.vehicle.currentOdometer), Core.safeNumber(record.endOdometer));
    saveState();
    renderApp();
    if (existing) {
      closeModal(false);
      showToast("Shift updated.");
    } else {
      openMoneyPlanModal(record.id, true);
    }
  }

  function confirmDeleteShift(id) {
    const shift = findShift(id);
    if (!shift) return;
    const calculated = Core.calculateShift(shift, state.settings);
    openModal({
      title: "Delete this shift?",
      subtitle: `${formatDate(calculated.date)} · ${formatMoney(calculated.net)} net`,
      body: `<div class="notice is-warning">${icon("warning", "icon icon-sm")}<p>This removes the shift from earnings, mileage, vehicle-fund, and money-plan totals. It cannot be undone unless you have a backup.</p></div>`,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Keep shift</button><button class="button button-danger" type="button" data-action="confirm-delete-shift" data-id="${escapeAttribute(id)}">${icon("trash", "icon icon-sm")}Delete shift</button>`,
      meta: { type: "delete-shift", id }
    });
  }

  function deleteShift(id) {
    const before = state.shifts.length;
    state.shifts = state.shifts.filter((item) => item.id !== id);
    if (state.shifts.length === before) return;
    saveState();
    closeModal(false);
    renderApp();
    showToast("Shift deleted.");
  }

  function confirmCancelActiveShift() {
    if (!state.activeShift) return;
    openModal({
      title: "Cancel the active shift?",
      subtitle: "The unfinished timer and starting mileage will be removed.",
      body: `<div class="notice is-warning">${icon("warning", "icon icon-sm")}<p>This does not save earnings, mileage, or pause history. Use End shift instead when the work is complete.</p></div>`,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Keep shift</button><button class="button button-danger" type="button" data-action="confirm-cancel-active">${icon("trash", "icon icon-sm")}Cancel shift</button>`,
      meta: { type: "cancel-active" }
    });
  }

  function cancelActiveShift() {
    state.activeShift = null;
    saveState();
    closeModal(false);
    renderApp();
    showToast("Active shift canceled.");
  }

  function findMaintenance(id) {
    return state.maintenance.find((item) => item.id === id) || null;
  }

  function openMaintenanceModal(id) {
    const existing = id ? findMaintenance(id) : null;
    if (id && !existing) return;
    const defaults = existing || {
      date: Core.localISODate(),
      type: "Oil Change",
      amount: 0,
      odometer: Core.currentOdometer(state.shifts, state.maintenance, state.settings),
      nextDueOdometer: 0,
      note: ""
    };
    const body = `<form data-form="maintenance" data-id="${escapeAttribute(existing ? existing.id : "")}"><div class="form-grid"><div class="field"><label for="serviceDate">Date</label><input id="serviceDate" name="date" type="date" value="${escapeAttribute(defaults.date)}" required></div><div class="field"><label for="serviceType">Service / expense</label><select id="serviceType" name="type">${MAINTENANCE_TYPES.map((type) => `<option value="${escapeAttribute(type)}"${type === defaults.type ? " selected" : ""}>${escapeHtml(type)}</option>`).join("")}</select></div><div class="field"><label for="serviceAmount">Amount</label><div class="input-shell"><span class="input-prefix">$</span><input id="serviceAmount" name="amount" type="number" min="0" step="0.01" value="${defaults.amount ? escapeAttribute(defaults.amount) : ""}" inputmode="decimal" required></div></div><div class="field"><label for="serviceOdometer">Odometer</label><div class="input-shell has-suffix"><input id="serviceOdometer" name="odometer" type="number" min="0" step="0.1" value="${defaults.odometer ? escapeAttribute(defaults.odometer) : ""}" inputmode="decimal"><span class="input-suffix">mi</span></div></div><div class="field"><label for="serviceNext">Next due mileage</label><div class="input-shell has-suffix"><input id="serviceNext" name="nextDueOdometer" type="number" min="0" step="1" value="${defaults.nextDueOdometer ? escapeAttribute(defaults.nextDueOdometer) : ""}" inputmode="numeric"><span class="input-suffix">mi</span></div></div><div class="field"><label for="serviceNote">Note</label><input id="serviceNote" name="note" maxlength="220" value="${escapeAttribute(defaults.note || "")}" placeholder="Shop, parts, details…"></div></div></form>`;
    openModal({
      title: existing ? "Edit vehicle expense" : "Add vehicle expense",
      subtitle: "Logged costs are subtracted from the vehicle reserve balance.",
      body,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="submit-maintenance">${icon("check", "icon icon-sm")}${existing ? "Save changes" : "Add record"}</button>`,
      meta: { type: "maintenance", id: existing ? existing.id : "" }
    });
  }

  function submitMaintenance() {
    const form = dom.modalRoot.querySelector('[data-form="maintenance"]');
    if (!form) return;
    const data = new FormData(form);
    const date = String(data.get("date") || "");
    const amountRaw = String(data.get("amount") || "").trim();
    if (!Core.parseISODate(date) || amountRaw === "") {
      showToast("Add a valid date and amount.", "warning");
      return;
    }
    const existing = form.dataset.id ? findMaintenance(form.dataset.id) : null;
    const now = new Date().toISOString();
    const record = Core.normalizeMaintenance({
      ...(existing || { id: Core.uid("maintenance"), createdAt: now }),
      date,
      type: String(data.get("type") || "Other"),
      amount: Math.max(0, Core.safeNumber(amountRaw)),
      odometer: Math.max(0, Core.safeNumber(data.get("odometer"))),
      nextDueOdometer: Math.max(0, Core.safeNumber(data.get("nextDueOdometer"))),
      note: String(data.get("note") || ""),
      updatedAt: now
    });
    if (existing) state.maintenance = state.maintenance.map((item) => item.id === existing.id ? record : item);
    else state.maintenance.push(record);
    state.settings.vehicle.currentOdometer = Math.max(Core.safeNumber(state.settings.vehicle.currentOdometer), record.odometer);
    saveState();
    closeModal(false);
    renderApp();
    showToast(existing ? "Vehicle record updated." : "Vehicle expense added.");
  }

  function confirmDeleteMaintenance(id) {
    const item = findMaintenance(id);
    if (!item) return;
    openModal({
      title: "Delete vehicle record?",
      subtitle: `${item.type} · ${formatMoney(item.amount)}`,
      body: `<div class="notice is-warning">${icon("warning", "icon icon-sm")}<p>Deleting it will add this cost back to the displayed vehicle reserve balance.</p></div>`,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Keep record</button><button class="button button-danger" type="button" data-action="confirm-delete-maintenance" data-id="${escapeAttribute(id)}">${icon("trash", "icon icon-sm")}Delete</button>`,
      meta: { type: "delete-maintenance", id }
    });
  }

  function deleteMaintenance(id) {
    state.maintenance = state.maintenance.filter((item) => item.id !== id);
    saveState();
    closeModal(false);
    renderApp();
    showToast("Vehicle record deleted.");
  }

  function openOdometerModal() {
    const current = Core.currentOdometer(state.shifts, state.maintenance, state.settings);
    openModal({
      title: "Update current odometer",
      subtitle: "This becomes the starting suggestion for your next shift.",
      body: `<form data-form="odometer"><div class="field"><label for="odometerValue">Current mileage</label><div class="input-shell has-suffix"><input id="odometerValue" name="odometer" type="number" min="0" step="0.1" value="${escapeAttribute(current)}" inputmode="decimal" autofocus required><span class="input-suffix">mi</span></div></div></form>`,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="submit-odometer">${icon("check", "icon icon-sm")}Update</button>`,
      meta: { type: "odometer" }
    });
  }

  function submitOdometer() {
    const form = dom.modalRoot.querySelector('[data-form="odometer"]');
    if (!form) return;
    const value = new FormData(form).get("odometer");
    state.settings.vehicle.currentOdometer = Math.max(0, Core.safeNumber(value));
    saveState();
    closeModal(false);
    renderApp();
    showToast("Current odometer updated.");
  }

  function findGoal(id) {
    return state.goals.find((item) => item.id === id) || null;
  }

  function openGoalModal(id) {
    const existing = id ? findGoal(id) : null;
    if (id && !existing) return;
    const defaults = existing || { name: "", target: 0, targetDate: "", note: "" };
    openModal({
      title: existing ? "Edit goal" : "Create a goal",
      subtitle: "Track a target using the money left available after your shift plan.",
      body: `<form data-form="goal" data-id="${escapeAttribute(existing ? existing.id : "")}"><div class="form-grid"><div class="field span-2"><label for="goalName">Goal name</label><input id="goalName" name="name" maxlength="80" value="${escapeAttribute(defaults.name)}" placeholder="Emergency fund, trip, new equipment…" autofocus required></div><div class="field"><label for="goalTarget">Target amount</label><div class="input-shell"><span class="input-prefix">$</span><input id="goalTarget" name="target" type="number" min="0" step="0.01" value="${defaults.target ? escapeAttribute(defaults.target) : ""}" inputmode="decimal" required></div></div><div class="field"><label for="goalDate">Target date</label><input id="goalDate" name="targetDate" type="date" value="${escapeAttribute(defaults.targetDate || "")}"></div><div class="field span-2"><label for="goalNote">Note</label><textarea id="goalNote" name="note" maxlength="500" placeholder="Optional">${escapeHtml(defaults.note || "")}</textarea></div></div></form>`,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="submit-goal">${icon("check", "icon icon-sm")}${existing ? "Save goal" : "Create goal"}</button>`,
      meta: { type: "goal", id: existing ? existing.id : "" }
    });
  }

  function submitGoal() {
    const form = dom.modalRoot.querySelector('[data-form="goal"]');
    if (!form) return;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const targetRaw = String(data.get("target") || "").trim();
    if (!name || targetRaw === "" || Core.safeNumber(targetRaw) <= 0) {
      showToast("Add a goal name and a target greater than zero.", "warning");
      return;
    }
    const existing = form.dataset.id ? findGoal(form.dataset.id) : null;
    const now = new Date().toISOString();
    const record = Core.normalizeGoal({
      ...(existing || { id: Core.uid("goal"), contributions: [], createdAt: now }),
      name,
      target: Math.max(0, Core.safeNumber(targetRaw)),
      targetDate: String(data.get("targetDate") || ""),
      note: String(data.get("note") || ""),
      updatedAt: now
    });
    if (existing) state.goals = state.goals.map((item) => item.id === existing.id ? record : item);
    else state.goals.push(record);
    saveState();
    closeModal(false);
    renderApp();
    showToast(existing ? "Goal updated." : "Goal created.");
  }

  function openContributionModal(id) {
    const goal = findGoal(id);
    if (!goal) return;
    openModal({
      title: `Add funds to ${goal.name}`,
      subtitle: `${formatMoney(Core.goalSaved(goal))} saved of ${formatMoney(goal.target)}`,
      body: `<form data-form="contribution" data-id="${escapeAttribute(id)}"><div class="form-grid"><div class="field"><label for="contributionAmount">Amount</label><div class="input-shell"><span class="input-prefix">$</span><input id="contributionAmount" name="amount" type="number" min="0.01" step="0.01" inputmode="decimal" autofocus required></div></div><div class="field"><label for="contributionDate">Date</label><input id="contributionDate" name="date" type="date" value="${Core.localISODate()}" required></div><div class="field span-2"><label for="contributionNote">Note</label><input id="contributionNote" name="note" maxlength="220" placeholder="Optional"></div></div></form>`,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button button-primary" type="button" data-action="submit-contribution">${icon("plus", "icon icon-sm")}Add funds</button>`,
      meta: { type: "contribution", id }
    });
  }

  function submitContribution() {
    const form = dom.modalRoot.querySelector('[data-form="contribution"]');
    if (!form) return;
    const goal = findGoal(form.dataset.id);
    if (!goal) return;
    const data = new FormData(form);
    const amount = Core.safeNumber(data.get("amount"));
    const date = String(data.get("date") || "");
    if (amount <= 0 || !Core.parseISODate(date)) {
      showToast("Add a positive amount and valid date.", "warning");
      return;
    }
    goal.contributions.push({ id: Core.uid("contribution"), amount: Core.round(amount, 2), date, note: String(data.get("note") || "") });
    goal.updatedAt = new Date().toISOString();
    saveState();
    closeModal(false);
    renderApp();
    showToast("Funds added to the goal.");
  }

  function archiveGoal(id, archived) {
    const goal = findGoal(id);
    if (!goal) return;
    goal.archived = Boolean(archived);
    goal.updatedAt = new Date().toISOString();
    saveState();
    renderApp();
    showToast(archived ? "Goal archived." : "Goal restored.");
  }

  function submitSettings(form) {
    const data = new FormData(form);
    state.settings.defaultPlatform = String(data.get("defaultPlatform") || "Uber");
    state.settings.weekStartsOn = Math.max(0, Math.min(1, Math.floor(Core.safeNumber(data.get("weekStartsOn")))));
    state.settings.weeklyNetGoal = Math.max(0, Core.safeNumber(data.get("weeklyNetGoal")));
    state.settings.monthlyNetGoal = Math.max(0, Core.safeNumber(data.get("monthlyNetGoal")));
    state.settings.vehicle.name = String(data.get("vehicleName") || "My vehicle").trim() || "My vehicle";
    state.settings.moneyPlan = Core.normalizeMoneyPlan(Core.DEFAULT_MONEY_PLAN);
    saveState();
    renderApp();
    showToast("Preferences saved.");
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type: type || "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function exportBackup() {
    const backup = {
      app: "Driver Command",
      schemaVersion: Core.APP_VERSION,
      exportedAt: new Date().toISOString(),
      ...serializeState()
    };
    downloadFile(`driver-command-backup-${Core.localISODate()}.json`, JSON.stringify(backup, null, 2), "application/json;charset=utf-8");
    showToast("Full dashboard backup downloaded.");
  }

  function csvProtect(value) {
    const text = String(value == null ? "" : value);
    return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  }

  function csvEscape(value) {
    const text = csvProtect(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function shiftsToCSV() {
    const headers = [
      "id", "date", "platform", "startTime", "endTime", "activeHours", "pausedMinutes", "startOdometer", "endOdometer", "miles", "trips",
      "gross", "gas", "tollsParking", "otherExpenses", "totalExpenses", "netAfterExpenses", "vehicleFund5Pct", "stocks10Pct", "crypto10Pct",
      "bitcoin55PctOfCrypto", "solana25PctOfCrypto", "ethereum15PctOfCrypto", "aave5PctOfCrypto", "totalAllocation", "gasPlusAllocationTakeOut", "keepAvailable", "notes"
    ];
    const rows = sortedShifts().map((raw) => {
      const shift = Core.calculateShift(raw, state.settings);
      return [
        shift.id, shift.date, shift.platform, shift.startTime, shift.endTime, shift.hours, Core.round(shift.pausedMs / 60000, 2), shift.startOdometer, shift.endOdometer, shift.miles, shift.trips,
        shift.gross, shift.fuel, shift.tolls, shift.otherExpenses, shift.expenses, shift.net, shift.vehicleFund, shift.stock, shift.crypto,
        shift.cryptoBreakdown.bitcoin, shift.cryptoBreakdown.solana, shift.cryptoBreakdown.ethereum, shift.cryptoBreakdown.aave, shift.allocated, shift.takeOut, shift.spendable, shift.notes
      ];
    });
    return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n");
  }

  function exportCSV() {
    if (!state.shifts.length) {
      showToast("There are no shifts to export.", "warning");
      return;
    }
    downloadFile(`driver-command-shifts-${Core.localISODate()}.csv`, shiftsToCSV(), "text/csv;charset=utf-8");
    showToast("Shift CSV downloaded.");
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else if (char === '"') quoted = false;
        else field += char;
      } else if (char === '"') quoted = true;
      else if (char === ",") { row.push(field); field = ""; }
      else if (char === "\n") { row.push(field.replace(/\r$/, "")); if (row.some((value) => value !== "")) rows.push(row); row = []; field = ""; }
      else field += char;
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
    const find = (row, aliases) => {
      for (const alias of aliases) {
        const index = headers.indexOf(alias);
        if (index >= 0 && row[index] != null) return row[index];
      }
      return "";
    };
    return rows.slice(1).map((row) => {
      const date = String(find(row, ["date", "shiftdate"])).replace(/^'/, "").trim();
      if (!Core.parseISODate(date)) return null;
      const vehicle = find(row, ["vehiclefund5pct", "vehiclefund", "vehicleamount"]);
      const stock = find(row, ["stocks10pct", "stock", "stockamount"]);
      const crypto = find(row, ["crypto10pct", "crypto", "cryptoamount"]);
      const hasNewPlan = [vehicle, stock, crypto].some((value) => String(value).trim() !== "");
      return Core.normalizeShift({
        id: String(find(row, ["id", "shiftid"])).replace(/^'/, "") || undefined,
        date,
        platform: String(find(row, ["platform", "app"])).replace(/^'/, ""),
        startTime: find(row, ["starttime", "start"]),
        endTime: find(row, ["endtime", "end"]),
        manualHours: find(row, ["activehours", "manualhours", "hours"]),
        pausedMs: Core.safeNumber(find(row, ["pausedminutes", "pauseminutes"])) * 60000,
        startOdometer: find(row, ["startodometer", "startmiles"]),
        endOdometer: find(row, ["endodometer", "endmiles"]),
        manualMiles: find(row, ["miles", "manualmiles", "businessmiles"]),
        trips: find(row, ["trips", "rides", "deliveries"]),
        gross: find(row, ["gross", "grossearnings", "earnings"]),
        fuel: find(row, ["gas", "fuel", "fuelcost"]),
        tolls: find(row, ["tollsparking", "tolls", "parking"]),
        otherExpenses: find(row, ["otherexpenses", "othercosts"]),
        notes: String(find(row, ["notes", "note"])).replace(/^'/, ""),
        moneyPlanRates: hasNewPlan ? state.settings.moneyPlan : undefined,
        moneyPlanVersion: hasNewPlan ? 2 : undefined,
        vehicleFund: vehicle,
        stock,
        crypto
      }, state.settings);
    }).filter(Boolean);
  }

  function prepareImport(text, filename) {
    const extension = String(filename || "").split(".").pop().toLowerCase();
    if (extension === "csv") {
      const shifts = csvRowsToShifts(parseCSV(text));
      if (!shifts.length) throw new Error("No valid shift rows were found in the CSV file.");
      return Core.normalizeState({ shifts, maintenance: [], goals: [], settings: state.settings, activeShift: null });
    }
    const parsed = JSON.parse(text);
    const source = Array.isArray(parsed) ? { shifts: parsed } : (parsed.state && typeof parsed.state === "object" ? parsed.state : parsed);
    if (!source || typeof source !== "object") throw new Error("The JSON file does not contain dashboard data.");
    if (!Array.isArray(source.shifts) && Array.isArray(source.entries)) source.shifts = source.entries;
    return Core.normalizeState(source);
  }

  function openImportReview(payload, filename) {
    ui.pendingImport = payload;
    ui.pendingImportName = filename;
    openModal({
      title: "Review import",
      subtitle: filename,
      body: `<div class="metric-strip" style="grid-template-columns:repeat(3,minmax(0,1fr))">${metricCard({ icon: "receipt", label: "Shifts", value: String(payload.shifts.length), meta: "Completed records" })}${metricCard({ icon: "wrench", iconClass: "is-blue", label: "Vehicle", value: String(payload.maintenance.length), meta: "Maintenance records" })}${metricCard({ icon: "target", iconClass: "is-violet", label: "Goals", value: String(payload.goals.length), meta: "Savings targets" })}</div><div class="notice" style="margin-top:12px">${icon("info", "icon icon-sm")}<p><strong>Merge</strong> keeps current records and adds imported items by ID. <strong>Replace</strong> swaps the current dashboard for the imported backup. The new 5/10/10 money plan remains the default for future shifts either way.</p></div>`,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button button-secondary" type="button" data-action="apply-import" data-mode="merge">Merge</button><button class="button button-danger" type="button" data-action="apply-import" data-mode="replace">Replace</button>`,
      className: "modal-wide",
      meta: { type: "import-review" }
    });
  }

  function mergeById(current, incoming) {
    const map = new Map();
    current.forEach((item) => map.set(item.id, item));
    incoming.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  }

  function applyImport(mode) {
    const payload = ui.pendingImport;
    if (!payload) return;
    if (mode === "replace") {
      state = Core.normalizeState(payload);
    } else {
      state.shifts = mergeById(state.shifts, payload.shifts);
      state.maintenance = mergeById(state.maintenance, payload.maintenance);
      state.goals = mergeById(state.goals, payload.goals);
      if (!state.activeShift && payload.activeShift) state.activeShift = payload.activeShift;
    }
    state.settings.moneyPlan = Core.normalizeMoneyPlan(Core.DEFAULT_MONEY_PLAN);
    saveState();
    ui.pendingImport = null;
    ui.pendingImportName = "";
    closeModal(false);
    renderApp();
    showToast(mode === "replace" ? "Dashboard replaced from backup." : "Imported data merged.");
  }

  function confirmResetData() {
    openModal({
      title: "Reset Driver Command?",
      subtitle: "This erases the dashboard data stored in this browser.",
      body: `<div class="notice is-warning">${icon("warning", "icon icon-sm")}<p>Download a full backup first if you might need these shifts, goals, or vehicle records again.</p></div>`,
      footer: `<button class="button button-ghost" type="button" data-action="close-modal">Cancel</button><button class="button button-secondary" type="button" data-action="export-backup">${icon("download", "icon icon-sm")}Back up first</button><button class="button button-danger" type="button" data-action="confirm-reset">${icon("trash", "icon icon-sm")}Erase data</button>`,
      meta: { type: "reset" }
    });
  }

  function resetData() {
    safeStorageRemove(Core.STORAGE_KEY);
    Object.values(LEGACY_KEYS).flat().forEach((key) => safeStorageRemove(key));
    state = Core.normalizeState({ settings: {} });
    state.settings.moneyPlan = Core.normalizeMoneyPlan(Core.DEFAULT_MONEY_PLAN);
    ui.route = "overview";
    ui.moneyPeriod = "day";
    ui.moneyAnchor = new Date();
    closeModal(false);
    saveState();
    renderApp();
    showToast("Dashboard reset.");
  }

  function openMoreModal() {
    openModal({
      title: "More",
      subtitle: "Planning and dashboard controls",
      body: `<div class="action-stack"><button class="quick-action" type="button" data-route="calendar"><span class="quick-action-icon">${icon("calendar", "icon icon-sm")}</span><span><strong>Calendar</strong><span>Open daily earnings and money history.</span></span>${icon("chevronRight", "icon icon-sm")}</button><button class="quick-action" type="button" data-route="goals"><span class="quick-action-icon">${icon("target", "icon icon-sm")}</span><span><strong>Goals</strong><span>Track targets with your available money.</span></span>${icon("chevronRight", "icon icon-sm")}</button><button class="quick-action" type="button" data-route="settings"><span class="quick-action-icon">${icon("settings", "icon icon-sm")}</span><span><strong>Settings & data</strong><span>Backups, exports, defaults, and storage.</span></span>${icon("chevronRight", "icon icon-sm")}</button></div>`,
      footer: false,
      meta: { type: "more" }
    });
  }

  function adjustMoneyPeriod(direction) {
    if (ui.moneyPeriod === "all") return;
    const date = new Date(ui.moneyAnchor);
    if (ui.moneyPeriod === "day") date.setDate(date.getDate() + direction);
    else if (ui.moneyPeriod === "week") date.setDate(date.getDate() + 7 * direction);
    else if (ui.moneyPeriod === "month") date.setMonth(date.getMonth() + direction);
    else if (ui.moneyPeriod === "year") date.setFullYear(date.getFullYear() + direction);
    ui.moneyAnchor = date;
    renderCurrentRoute();
  }

  function openTodayMoney() {
    ui.moneyPeriod = "day";
    ui.moneyAnchor = new Date();
    setRoute("analytics");
  }

  function openMoneyDay(dateValue) {
    const date = Core.parseISODate(dateValue);
    if (!date) return;
    ui.moneyPeriod = "day";
    ui.moneyAnchor = date;
    if (ui.route === "analytics") renderCurrentRoute();
    else setRoute("analytics");
  }

  function moveCalendar(direction) {
    const date = new Date(ui.calendarCursor);
    date.setMonth(date.getMonth() + direction, 1);
    ui.calendarCursor = date;
    renderCurrentRoute();
  }

  function selectCalendarDate(dateValue) {
    const date = Core.parseISODate(dateValue);
    if (!date) return;
    ui.calendarSelected = dateValue;
    if (date.getMonth() !== ui.calendarCursor.getMonth() || date.getFullYear() !== ui.calendarCursor.getFullYear()) {
      ui.calendarCursor = new Date(date.getFullYear(), date.getMonth(), 1);
    }
    renderCurrentRoute();
  }

  function handleAction(action, element) {
    const id = element.dataset.id || "";
    switch (action) {
      case "toggle-theme":
        state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
        saveState({ silent: true });
        renderApp();
        break;
      case "primary-shift-action": state.activeShift ? openEndShiftModal() : openStartShiftModal(); break;
      case "start-shift": openStartShiftModal(); break;
      case "end-shift": openEndShiftModal(); break;
      case "pause-shift": pauseShift(); break;
      case "resume-shift": resumeShift(); break;
      case "cancel-active-shift": confirmCancelActiveShift(); break;
      case "confirm-cancel-active": cancelActiveShift(); break;
      case "submit-start-shift": submitStartShift(); break;
      case "submit-end-shift": submitEndShift(); break;
      case "add-shift": openManualShiftModal(); break;
      case "add-shift-for-date": openManualShiftModal("", element.dataset.date); break;
      case "edit-shift": openManualShiftModal(id); break;
      case "submit-manual-shift": submitManualShift(); break;
      case "view-money-plan": openMoneyPlanModal(id, false); break;
      case "delete-shift": confirmDeleteShift(id); break;
      case "confirm-delete-shift": deleteShift(id); break;
      case "shift-filter":
        ui.shiftFilter = element.dataset.value || "30";
        renderCurrentRoute();
        break;
      case "open-today-money": openTodayMoney(); break;
      case "view-money-page":
        closeModal(false);
        openMoneyDay(element.dataset.date || Core.localISODate());
        break;
      case "money-period":
        ui.moneyPeriod = element.dataset.value || "day";
        renderCurrentRoute();
        break;
      case "money-prev": adjustMoneyPeriod(-1); break;
      case "money-next": adjustMoneyPeriod(1); break;
      case "money-today": ui.moneyAnchor = new Date(); renderCurrentRoute(); break;
      case "open-money-day": openMoneyDay(element.dataset.date); break;
      case "calendar-prev": moveCalendar(-1); break;
      case "calendar-next": moveCalendar(1); break;
      case "calendar-today":
        ui.calendarCursor = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        ui.calendarSelected = Core.localISODate();
        renderCurrentRoute();
        break;
      case "calendar-select": selectCalendarDate(element.dataset.date); break;
      case "add-maintenance": openMaintenanceModal(); break;
      case "edit-maintenance": openMaintenanceModal(id); break;
      case "submit-maintenance": submitMaintenance(); break;
      case "delete-maintenance": confirmDeleteMaintenance(id); break;
      case "confirm-delete-maintenance": deleteMaintenance(id); break;
      case "update-odometer": openOdometerModal(); break;
      case "submit-odometer": submitOdometer(); break;
      case "add-goal": openGoalModal(); break;
      case "edit-goal": openGoalModal(id); break;
      case "submit-goal": submitGoal(); break;
      case "add-contribution": openContributionModal(id); break;
      case "submit-contribution": submitContribution(); break;
      case "archive-goal": archiveGoal(id, true); break;
      case "restore-goal": archiveGoal(id, false); break;
      case "export-backup": exportBackup(); break;
      case "export-csv": exportCSV(); break;
      case "import-data": dom.importFileInput.click(); break;
      case "apply-import": applyImport(element.dataset.mode || "merge"); break;
      case "reset-data": confirmResetData(); break;
      case "confirm-reset": resetData(); break;
      case "open-more": openMoreModal(); break;
      case "close-modal": closeModal(); break;
      case "dismiss-toast": {
        const toast = dom.toastRoot.querySelector(`[data-toast-id="${escapeAttribute(id)}"]`);
        if (toast) toast.remove();
        break;
      }
      default: break;
    }
  }

  document.addEventListener("click", (event) => {
    const routeElement = event.target.closest("[data-route]");
    if (routeElement) {
      event.preventDefault();
      setRoute(routeElement.dataset.route);
      return;
    }
    const actionElement = event.target.closest("[data-action]");
    if (actionElement) {
      event.preventDefault();
      handleAction(actionElement.dataset.action, actionElement);
      return;
    }
    if (event.target === dom.modalRoot) closeModal();
  });

  let searchTimer = null;
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
    if (target.dataset.input === "shift-search") {
      ui.shiftSearch = target.value;
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(() => {
        if (ui.route !== "shifts") return;
        renderCurrentRoute();
        const replacement = dom.main.querySelector('[data-input="shift-search"]');
        if (replacement instanceof HTMLInputElement) {
          replacement.focus({ preventScroll: true });
          replacement.setSelectionRange(replacement.value.length, replacement.value.length);
        }
      }, 130);
    }
    if (target.closest('[data-form="end-shift"]')) updateEndPreview();
    if (target.closest('[data-form="manual-shift"]')) updateManualPreview();
  });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    if (form.dataset.form === "settings") submitSettings(form);
    else if (form.dataset.form === "start-shift") submitStartShift();
    else if (form.dataset.form === "end-shift") submitEndShift();
    else if (form.dataset.form === "manual-shift") submitManualShift();
    else if (form.dataset.form === "maintenance") submitMaintenance();
    else if (form.dataset.form === "odometer") submitOdometer();
    else if (form.dataset.form === "goal") submitGoal();
    else if (form.dataset.form === "contribution") submitContribution();
  });

  dom.importFileInput.addEventListener("change", () => {
    const file = dom.importFileInput.files && dom.importFileInput.files[0];
    dom.importFileInput.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const payload = prepareImport(String(reader.result || ""), file.name);
        openImportReview(payload, file.name);
      } catch (error) {
        showToast(error && error.message ? error.message : "The selected file could not be imported.", "error", 6500);
      }
    });
    reader.addEventListener("error", () => showToast("The selected file could not be read.", "error"));
    reader.readAsText(file);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !dom.modalRoot.hidden) {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key === "Tab" && !dom.modalRoot.hidden) {
      const focusable = Array.from(dom.modalRoot.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((node) => node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  window.addEventListener("hashchange", () => {
    const route = window.location.hash.replace(/^#/, "");
    if (ROUTES.includes(route) && route !== ui.route) {
      ui.route = route;
      renderApp();
    }
  });

  function updateLiveElements() {
    if (!state.activeShift) return;
    const now = new Date();
    document.querySelectorAll("[data-live-work]").forEach((node) => { node.textContent = formatDuration(Core.activeDurationMs(state.activeShift, now), true); });
    document.querySelectorAll("[data-live-paused]").forEach((node) => { node.textContent = formatDuration(Core.activePausedMs(state.activeShift, now), false); });
  }

  function initialize() {
    state.settings.moneyPlan = Core.normalizeMoneyPlan(Core.DEFAULT_MONEY_PLAN);
    dom.versionLabel.textContent = `Version ${Core.APP_VERSION}`;
    saveState({ silent: true });
    renderApp();
    window.setInterval(updateLiveElements, 1000);
    document.addEventListener("visibilitychange", updateLiveElements);
    if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
      window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
    }
  }

  window.DriverCommand = {
    version: Core.APP_VERSION,
    getState: () => JSON.parse(JSON.stringify(serializeState())),
    calculateShift: (shift) => Core.calculateShift(shift, state.settings),
    renderMoneyPlan: moneyPlanMarkup
  };

  initialize();
})();
