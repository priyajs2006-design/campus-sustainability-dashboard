/* =============================================================
   data.js  —  DEMO DATA LAYER  (plain script → global namespace)
   =============================================================
   IMPORTANT (data rule):
   All values in this file are SYNTHETIC / DEMO data used to make
   the prototype look and behave realistically. They are sample
   baseline figures — NOT real campus sensor measurements.

   They are organized here inside ONE central place so that, later,
   the backend (Flask + SQLite) can replace them without touching
   the UI components. Chart components read from functions in
   services.js, never from raw numbers scattered in views.

   Loaded BEFORE all other scripts. Plain <script> (works on file://
   when opened by double-clicking index.html).
   ============================================================= */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     Central namespace — everything hangs off this.
     ------------------------------------------------------------------ */
  const App = (window.SustainabilityApp = window.SustainabilityApp || {});
  const D = (App.data = {});

  /* How long this data represents (always labelled DEMO). */
  D.metadata = {
    source: "DEMO",
    sourceLabel: "DEMO DATA (sample baseline — not live campus measurements)",
    generatedAt: new Date().toISOString(),
    note: "Replace via js/services.js → backend API when available.",
  };

  /* ------------------------------------------------------------------
     Campus overview
     ------------------------------------------------------------------ */
  D.campus = {
    name: "SRM Ramapuram",
    subtitle: "Go Green Campus · Sustainability Monitoring",
    status: "GOOD", // GOOD | MODERATE | CRITICAL
    statusLabel: "Campus Sustainability Status",
    roleLabels: { Admin: "Administrator", Manager: "Facility / Sustainability Manager", Student: "Student" },
  };

  /* ------------------------------------------------------------------
     Sustainability score (category breakdown → radial indicators)
     ------------------------------------------------------------------ */
  D.sustainabilityScore = {
    overall: 78,
    categories: [
      { key: "Energy", label: "Energy", score: 82 },
      { key: "Water", label: "Water", score: 74 },
      { key: "Waste", label: "Waste", score: 80 },
      { key: "Carbon", label: "Carbon", score: 71 },
      { key: "Transportation", label: "Transportation", score: 85 },
    ],
    disclaimer: "Calculated demo score. Will be generated from backend data.",
  };

  /* ------------------------------------------------------------------
     KPI summary (dashboard top cards)
     ------------------------------------------------------------------ */
  D.kpis = {
    energy: { value: 4620, unit: "kWh", label: "Current Energy Consumption", sub: "today" },
    water: { value: 362, unit: "kL", label: "Daily Water Consumption", sub: "today" },
    waste: { value: 4860, unit: "kg", label: "Total Waste Generated", sub: "this month" },
    carbon: { value: 1285, unit: "t CO\u2082", label: "Estimated CO\u2082 Emissions", sub: "this month", lowIsGood: true },
    score: { value: 78, unit: "/100", label: "Campus Sustainability Score", sub: "demo estimate" },
  };

  /* ==================================================================
     DATASETS — each mirrors a future API resource.
     ================================================================== */

  /* ------------------------------------------------------------------
     Energy
     ------------------------------------------------------------------ */
  D.energy = {
    demo: true,
    today: 4620, // kWh
    month: 141200, // kWh
    saved: 31800, // kWh saved this month
    renewablePct: 28, // % from renewables
    solar_kwh: 1180, // solar produced today
    peak: { value: 912, time: "14:00" }, // kW peak today
    monthly: [
      { label: "Jan", value: 132000 },
      { label: "Feb", value: 128500 },
      { label: "Mar", value: 135100 },
      { label: "Apr", value: 139600 },
      { label: "May", value: 144300 },
      { label: "Jun", value: 121800 },
      { label: "Jul", value: 118400 },
      { label: "Aug", value: 126900 },
    ],
    opportunities: [
      "Stagger AC start-ups to shave the 2 PM peak.",
      "Upgrade remaining T8 tubes to LED.",
      "Adopt weekend shutdown for lab equipment.",
    ],
  };

  /* ------------------------------------------------------------------
     Water
     ------------------------------------------------------------------ */
  D.water = {
    demo: true,
    today_kL: 362,
    month_kL: 10450,
    saved_kL: 1890,
    leakageAlerts: 3,
    budgetPct: 12, // % under monthly budget
    daily: [
      { label: "6 AM", value: 44 },
      { label: "8 AM", value: 52 },
      { label: "10 AM", value: 38 },
      { label: "12 PM", value: 30 },
      { label: "2 PM", value: 26 },
      { label: "4 PM", value: 27 },
      { label: "6 PM", value: 32 },
      { label: "8 PM", value: 40 },
    ],
    weekly: [
      { label: "Mon", value: 372 },
      { label: "Tue", value: 360 },
      { label: "Wed", value: 366 },
      { label: "Thu", value: 355 },
      { label: "Fri", value: 348 },
      { label: "Sat", value: 330 },
      { label: "Sun", value: 318 },
    ],
    tips: [
      "Rainwater harvesting refilled rooftop tanks.",
      "Low-flow fixtures saved ~9% in hostels.",
      "Check leaky taps in the science block.",
    ],
  };

  /* ------------------------------------------------------------------
     Waste
     ------------------------------------------------------------------ */
  D.waste = {
    demo: true,
    total_kg: 4860,
    recyclable_kg: 3390,
    organic_kg: 1470,
    general_kg: 910,
    recyclable_pct: 710, // 71.0%
    recyclingGoal_pct: 90,
    monthly: [
      { label: "Jan", total: 5100, recycled: 3700 },
      { label: "Feb", total: 4950, recycled: 3720 },
      { label: "Mar", total: 5220, recycled: 3880 },
      { label: "Apr", total: 5040, recycled: 3790 },
      { label: "May", total: 4720, recycled: 3560 },
      { label: "Jun", total: 4580, recycled: 3490 },
      { label: "Jul", total: 4490, recycled: 3440 },
      { label: "Aug", total: 4860, recycled: 3750 },
    ],
    drives: [
      "E-waste drive collected 85 kg of electronics.",
      "Recycling drive turned in 560 kg of paper & plastic.",
    ],
  };

  /* ------------------------------------------------------------------
     Carbon
     ------------------------------------------------------------------ */
  D.carbon = {
    demo: true,
    co2_t: 1285,
    reductionPct: 11,
    perCapita: 0.42,
    trend: [
      { label: "Jan", value: 1420 },
      { label: "Feb", value: 1390 },
      { label: "Mar", value: 1375 },
      { label: "Apr", value: 1335 },
      { label: "May", value: 1290 },
      { label: "Jun", value: 1260 },
      { label: "Jul", value: 1240 },
      { label: "Aug", value: 1285 },
    ],
    sources: [
      { label: "Electricity", value: 46 },
      { label: "Transportation", value: 24 },
      { label: "Natural gas", value: 17 },
      { label: "Other", value: 13 },
    ],
  };

  /* ------------------------------------------------------------------
     Transportation
     ------------------------------------------------------------------ */
  D.transportation = {
    demo: true,
    publicShare_pct: 41,
    evShare_pct: 18,
    active_pct: 22, // cycling/walking
    vehicles_pct: 19,
    emissions_t: 302,
    weekly: [
      { label: "Mon", public: 44, ev: 17, bike: 21, other: 18 },
      { label: "Tue", public: 42, ev: 18, bike: 23, other: 17 },
      { label: "Wed", public: 45, ev: 19, bike: 20, other: 16 },
      { label: "Thu", public: 43, ev: 20, bike: 22, other: 15 },
      { label: "Fri", public: 47, ev: 21, bike: 19, other: 13 },
      { label: "Sat", public: 38, ev: 12, bike: 30, other: 20 },
      { label: "Sun", public: 35, ev: 10, bike: 32, other: 23 },
    ],
  };

  /* ------------------------------------------------------------------
     Buildings — campus live-status demo cards
     ------------------------------------------------------------------ */
  D.buildings = [
    { id: "b1", name: "Main Block", icon: "\uD83C\uDFDB\uFE0F", status: "ok", energy: 380, water: 68, waste: 14 },
    { id: "b2", name: "Central Library", icon: "\uD83D\uDCDA", status: "ok", energy: 210, water: 42, waste: 9 },
    { id: "b3", name: "Science Block", icon: "\uD83E\uDDEA", status: "warn", energy: 520, water: 96, waste: 21 },
    { id: "b4", name: "New Academic Block", icon: "\uD83C\uDF93", status: "ok", energy: 340, water: 61, waste: 15 },
    { id: "b5", name: "Hostel Block", icon: "\uD83C\uDFE0", status: "crit", energy: 640, water: 150, waste: 34 },
    { id: "b6", name: "Campus Canteen", icon: "\uD83C\uDF7D\uFE0F", status: "ok", energy: 150, water: 55, waste: 18 },
  ];

  /* ------------------------------------------------------------------
     Campus Environmental Monitoring — map placeholder points
     (Demo placeholder only. NOT real GPS/sensor data.)
     ------------------------------------------------------------------ */
  D.monitoringPoints = [
    { id: "e1", name: "Main Block Energy Meter", icon: "\u26A1", type: "Energy", status: "NORMAL", x: 30, y: 40 },
    { id: "e2", name: "Science Block Energy Meter", icon: "\u26A1", type: "Energy", status: "WARNING", x: 62, y: 30 },
    { id: "w1", name: "Hostel Water Point", icon: "\uD83D\uDCA7", type: "Water", status: "NORMAL", x: 74, y: 58 },
    { id: "w2", name: "Canteen Water Point", icon: "\uD83D\uDCA7", type: "Water", status: "CRITICAL", x: 44, y: 74 },
    { id: "s1", name: "Science Waste Collection", icon: "\u267B\uFE0F", type: "Waste", status: "NORMAL", x: 18, y: 62 },
    { id: "s2", name: "Hostel Waste Collection", icon: "\u267B\uFE0F", type: "Waste", status: "OFFLINE", x: 82, y: 46 },
    { id: "a1", name: "Library Air-Quality Sensor", icon: "\uD83C\uDF2C\uFE0F", type: "Carbon", status: "WARNING", x: 50, y: 22 },
    { id: "a2", name: "Main Block Air-Quality Sensor", icon: "\uD83C\uDF2C\uFE0F", type: "Carbon", status: "NORMAL", x: 12, y: 18 },
  ];

  /* ------------------------------------------------------------------
     Alerts center — severity LOW..CRITICAL
     (Demo alerts only — replace via alertService/API.)
     ------------------------------------------------------------------ */
  D.alerts = [
    { id: 1, severity: "CRITICAL", title: "Hostel Block water leakage", detail: "Water flow above normal range for 2+ hours.", time: "10 min ago", type: "Water" },
    { id: 2, severity: "HIGH", title: "High energy consumption", detail: "Science Block peak load 18% above target.", time: "35 min ago", type: "Energy" },
    { id: 3, severity: "MEDIUM", title: "Recycling rate decreased", detail: "Recycling % dropped below weekly goal.", time: "2 hr ago", type: "Waste" },
    { id: 4, severity: "MEDIUM", title: "Carbon emissions increased", detail: "Estimated CO\u2082 up 3% vs last week.", time: "5 hr ago", type: "Carbon" },
    { id: 5, severity: "LOW", title: "Sensor offline", detail: "Hostel waste sensor not reporting.", time: "1 day ago", type: "Waste" },
  ];

  /* ------------------------------------------------------------------
     Recent activity feed (reusable — backend events populate later)
     ------------------------------------------------------------------ */
  D.activity = [
    { icon: "\u2600\uFE0F", text: "Solar energy production updated", time: "2 min ago" },
    { icon: "\uD83D\uDCA7", text: "Water consumption recorded", time: "18 min ago" },
    { icon: "\u267B\uFE0F", text: "Recycling target achieved", time: "1 hr ago" },
    { icon: "\u26A1", text: "Energy alert generated", time: "2 hr ago" },
    { icon: "\uD83D\uDCC8", text: "Sensor status updated", time: "3 hr ago" },
  ];

  /* Activity suggestions reused by the live feed simulation. */
  D.activityPool = [
    { icon: "\u2600\uFE0F", text: "Solar array production peaked at <b>1,240 kWh</b> today" },
    { icon: "\uD83D\uDCA7", text: "Rainwater harvesting system refilled rooftop tanks" },
    { icon: "\u267B\uFE0F", text: "E-waste drive collected <b>85 kg</b> of electronics" },
    { icon: "\uD83D\uDEB2", text: "Bike-to-campus day recorded <b>312</b> participants" },
    { icon: "\uD83D\uDCA1", text: "Motion-sensor lighting saved <b>14%</b> hostel energy" },
    { icon: "\uD83C\uDF31", text: "Campus garden planted <b>40</b> native saplings" },
    { icon: "\uD83C\uDFED", text: "Compactor reduced landfill waste by <b>22%</b> this week" },
    { icon: "\uD83D\uDCCA", text: "Energy audit of Main Block completed" },
    { icon: "\uD83D\uDEBF", text: "Low-flow fixtures installed in Hostel A" },
    { icon: "\uD83D\uDD04", text: "Recycling drive turned in <b>560 kg</b> of paper & plastic" },
  ];

  /* Student initiative ideas — separate module (initiatives) */
  D.initiatives = [
    { title: "Tree Plantation Drive", desc: "Plant 200 native saplings around campus.", status: "Open", volunteers: 46 },
    { title: "E-Waste Collection Week", desc: "Campus-wide e-waste drop-off drive.", status: "Open", volunteers: 28 },
    { title: "Zero-Plastic Canteen", desc: "Encourage reusable containers in canteens.", status: "In planning", volunteers: 0 },
  ];

  /* ------------------------------------------------------------------
     Reports structure (view template + export-ready CSV/PDF later)
     ------------------------------------------------------------------ */
  D.reports = {
    title: "Monthly Sustainability Report",
    period: "August 2026",
    sections: [
      { heading: "Energy", metricRows: [
        ["Consumption", "141,200 kWh"],
        ["Renewable share", "28%"],
        ["Energy saved", "31,800 kWh"],
      ]},
      { heading: "Water", metricRows: [
        ["Consumption", "10,450 kL"],
        ["Saved", "1,890 kL"],
        ["Leakage alerts", "3"],
      ]},
      { heading: "Waste", metricRows: [
        ["Total", "4,860 kg"],
        ["Recyclable", "3,390 kg"],
        ["Recycling rate", "71%"],
      ]},
      { heading: "Carbon", metricRows: [
        ["Estimated CO\u2082", "1,285 t"],
        ["Reduction", "11%"],
        ["Per capita", "0.42 t"],
      ]},
    ],
    exportNote: "Export-ready (CSV/PDF) — backend to generate later.",
  };
})();
