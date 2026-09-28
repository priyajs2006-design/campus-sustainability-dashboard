/* ======================================================================
   charts.js   --   CHART BUILDERS  (thin Chart.js wrappers)
   ======================================================================
   Every builder:  App.charts.makeX(canvas, payload)
       - canvas  : the <canvas> element from the view,
       - payload : the SUCCESS payload already fetched by the service
                   layer (i.e. what <result>.data contains), NOT raw
                   data.js and NOT a promise. Views pass data straight
                   through from services.

   Builders DESTROY any existing Chart instance bound to the canvas so a
   view can safely re-render on tab switches / period changes / refresh.

   Chart.js is loaded from CDN in index.html BEFORE this file. If the CDN
   is unreachable the builders bail out silently (the view already shows
   a DEMO/loading state), so nothing breaks when offline.

   Requires (load order): data.js services.js components.js
   Also requires the global `Chart` (Chart.js UMD) to be present.
   ====================================================================== */
(function () {
  "use strict";

  var App = (window.SustainabilityApp = window.SustainabilityApp || {});
  App.charts = App.charts || {};

  /* Theme palette (kept in sync with style.css values) */
  var COLORS = {
    energy: "#22c55e",
    water: "#0ea5e9",
    waste: "#eab308",
    carbon: "#f97316",
    transport: "#8b5cf6",
    text: "#8aa0b5",
    grid: "rgba(120,140,160,0.18)",
  };

  function isReady() {
    return !!window.Chart;
  }

  /* Destroy a previous instance on the same canvas before reuse. */
  function reset(canvas) {
    if (!canvas || !window.Chart) return;
    var existing = window.Chart.getChart && window.Chart.getChart(canvas);
    if (existing) existing.destroy();
  }

  function gridScaled(opts, unit) {
    var base = {
      scales: {
        x: { grid: { color: COLORS.grid }, ticks: { color: COLORS.text } },
        y: { beginAtZero: true, grid: { color: COLORS.grid }, ticks: { color: COLORS.text } },
      },
    };
    for (var k in opts) base[k] = opts[k];
    if (unit) {
      base.scales.y.title = { display: true, text: unit, color: COLORS.text };
    }
    return base;
  }

  /* --------------------------------------------------------------------
     ENERGY -- 12-month usage (kWh) line/area
     payload.data.energy.monthly = [{ label, value }, ...]
     -------------------------------------------------------------------- */
  App.charts.makeEnergyTrend = function (canvas, payload) {
    if (!isReady()) return;
    var m = payload && payload.energy && payload.energy.monthly;
    if (!m || !m.length) return;
    reset(canvas-seg);
    var labels = m.map(function (p) { return p.label; });
    var values = m.map(function (p) { return p.value; });
    return new window.Chart(canvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "kWh",
          data: values,
          borderColor: COLORS.energy,
          backgroundColor: COLORS.energy + "22",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: COLORS.energy,
          pointHoverRadius: 6,
        }],
      },
      options: gridScaled({}, "kWh"),
    });
  };

  /* --------------------------------------------------------------------
     WATER -- weekly used vs saved (kL), grouped bars
     payload.data.water.weekly = [{ label, used, saved }, ...]
     -------------------------------------------------------------------- */
  App.charts.makeWaterWeekly = function (canvas, payload) {
    if (!isReady()) return;
    var w = payload && payload.water;
    var weekly = (w && w.weekly) || [];
    if (!weekly.length) return;
    reset(canvas);
    return new window.Chart(canvas, {
      type: "bar",
      data: {
        labels: weekly.map(function (p) { return p.label; }),
        datasets: [
          { label: "Used (kL)", data: weekly.map(function (p) { return p.used; }), backgroundColor: COLORS.water },
          { label: "Saved (kL)", data: weekly.map(function (p) { return p.saved; }), backgroundColor: COLORS.transport },
        ],
      },
      options: gridScaled({}, "kL"),
    });
  };

  /* --------------------------------------------------------------------
     WASTE -- 12-month total vs recycled (kg), bars
     payload.data.waste.monthly = [{ label, total, recycled }, ...]
     -------------------------------------------------------------------- */
  App.charts.makeWasteMonthly = function (canvas, payload) {
    if (!isReady()) return;
    var w = payload && payload.waste;
    var monthly = (w && w.monthly) || [];
    if (!monthly.length) return;
    reset(canvas);
    return new window.Chart(canvas, {
      type: "bar",
      data: {
        labels: monthly.map(function (p) { return p.label; }),
        datasets: [
          { label: "Total (kg)", data: monthly.map(function (p) { return p.total; }), backgroundColor: COLORS.waste },
          { label: "Recycled (kg)", data: monthly.map(function (p) { return p.recycled; }), backgroundColor: COLORS.energy },
        ],
      },
      options: gridScaled({}, "kg"),
    });
  };

  /* --------------------------------------------------------------------
     CARBON -- emissions trend (t CO2), line
     payload.data.carbon.trend = [{ label, value }, ...]
     -------------------------------------------------------------------- */
  App.charts.makeCarbonTrend = function (canvas, payload) {
    if (!isReady()) return;
    var c = payload && payload.carbon;
    var trend = (c && c.trend) || [];
    if (!trend.length) return;
    reset(canvas);
    return new window.Chart(canvas, {
      type: "line",
      data: {
        labels: trend.map(function (p) { return p.label; }),
        datasets: [{
          label: "t CO2",
          data: trend.map(function (p) { return p.value; }),
          borderColor: COLORS.carbon,
          backgroundColor: COLORS.carbon + "22",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: COLORS.carbon,
          pointHoverRadius: 6,
        }],
      },
      options: gridScaled({}, "t CO2"),
    });
  };

  /* --------------------------------------------------------------------
     TRANSPORTATION -- weekly mode split (%), stacked bars
     payload.data.transportation.weekly = [{ label, public, ev, bike, other }, ...]
     -------------------------------------------------------------------- */
  App.charts.makeTransportMix = function (canvas, payload) {
    if (!isReady()) return;
    var t = payload && payload.transportation;
    var weekly = (t && t.weekly) || [];
    if (!weekly.length) return;
    reset(canvas);
    return new window.Chart(canvas, {
      type: "bar",
      data: {
        labels: weekly.map(function (p) { return p.label; }),
        datasets: [
          { label: "Public", data: weekly.map(function (p) { return p.public; }), backgroundColor: COLORS.transport, stack: "mix" },
          { label: "EV", data: weekly.map(function (p) { return p.ev; }), backgroundColor: COLORS.energy, stack: "mix" },
          { label: "Bike/Walk", data: weekly.map(function (p) { return p.bike; }), backgroundColor: COLORS.waste, stack: "mix" },
          { label: "Other", data: weekly.map(function (p) { return p.other; }), backgroundColor: COLORS.carbon, stack: "mix" },
        ],
      },
      options: gridScaled({ scales: {
        x: { stacked: true, grid: { color: COLORS.grid }, ticks: { color: COLORS.text } },
        y: { stacked: true, beginAtZero: true, grid: { color: COLORS.grid }, ticks: { color: COLORS.text, callback: function (v) { return v + "%"; } } },
      } }, "%"),
    });
  };

  /* --------------------------------------------------------------------
     SCORE -- sustainability score donut (overall + category mix)
     payload.data.summary.sustainabilityScore = { overall, categories:[{key,label,score}] }
     -------------------------------------------------------------------- */
  App.charts.makeScoreDonut = function (canvas, payload) {
    if (!isReady()) return;
    var s = payload && payload.summary && payload.summary.sustainabilityScore;
    if (!s) s = payload && payload.sustainabilityScore;
    if (!s || !s.categories) return;
    reset(canvas);
    return new window.Chart(canvas, {
      type: "doughnut",
      data: {
        labels: s.categories.map(function (c) { return c.label; }),
        datasets: [{
          data: s.categories.map(function (c) { return c.score; }),
          backgroundColor: [COLORS.energy, COLORS.water, COLORS.waste, COLORS.carbon, COLORS.transport],
          borderWidth: 2,
        }],
      },
      options: {
        cutout: "62%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: COLORS.text, padding: 12, usePointStyle: true },
          },
          tooltip: {
            callbacks: { label: function (ctx) {
              return ctx.label + ": " + ctx.parsed + "/100";
            } },
          },
        },
      },
    });
  };
})();
