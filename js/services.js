/* ======================================================================
   services.js  --  SERVICE LAYER  (mock, API-ready)
   ======================================================================
   UI rule: views NEVER read js/data.js directly. Every view asks this
   layer for its data, and every call resolves asynchronously with a
   RESULT object:

     { status: "loading" | "success" | "error" | "empty" | "offline",
       data:   <payload>, or <message string> when status != success }

   That lets each component render a proper loading / success / error /
   empty / offline state -- and it means we can swap the DEMO dataset
   for a real backend later WITHOUT touching any view.

   HOW TO CONNECT A REAL BACKEND (later)
   -------------------------------------
   Each method below currently returns DEMO data from SustainabilityApp.data
   (js/data.js). To go live, replace the body of any method (or the
   shared `read` helper) with a real network call, but KEEP the exact
   RESULT shape, e.g.:

     getKpis: function () {
       return fetch("/api/kpis")
         .then(function (r) { return r.json(); })
         .then(function (payload) { return { status:"success", data: payload }; })
         .catch(function () { return { status:"offline", data:"Offline." }; });
     }

   Because views only depend on the RESULT shape, nothing in the UI
   changes when you go live.

   IMPORTANT (data rule):
   Every value served here originates from the SYNTHETIC DEMO dataset in
   js/data.js. It is clearly labelled DEMO and is NOT a real campus
   measurement. `result` payloads include the source label so the UI can
   show a "DEMO DATA" badge (see components.js -> DemoBadge).

   Requires:  js/data.js  (must load BEFORE this file)
   ==================================================================== */
(function () {
  "use strict";

  /* Central namespace created by data.js: window.SustainabilityApp */
  var App = (window.SustainabilityApp = window.SustainabilityApp || {});

  /* --------------------------------------------------------------------
     Guard: if data.js did not run first, surface a clear dependency error
     instead of a silent crash.
     -------------------------------------------------------------------- */
  if (!App.data) {
    App.services = App.services || {
      _bootstrapError:
        "services.js loaded before data.js. Fix the <script> order in index.html.",
    };
    // Still export the helpers so errors are graceful, then stop.
    return;
  }

  var D = App.data; // the centralized dataset (global namespace)

  /* Simulated network latency so loading states are visible (ms). */
  var LATENCY_MS = 400;

  /* --------------------------------------------------------------------
     Internal result builders (keep shapes stable for the UI)
     -------------------------------------------------------------------- */
  function asLoading() {
    return { status: "loading", data: null };
  }
  function asSuccess(payload, source) {
    return { status: "success", data: payload, source: source || D.metadata.source };
  }
  function asEmpty(message) {
    return { status: "empty", data: message || "No data available yet." };
  }
  function asError(err) {
    return {
      status: "error",
      data: (err && err.message) || "Something went wrong while loading data.",
    };
  }
  function asOffline(message) {
    return { status: "offline", data: message || "Offline -- showing cached/demo values." };
  }

  /* Simulate an async read from the dataset. Returns a Promise of a RESULT.
     Replace the setTimeout with a real HTTP call when you add a backend. */
  function read(resolveFn) {
    return new Promise(function (resolve) {
      window.setTimeout(function () {
        try {
          resolve(resolveFn());
        } catch (e) {
          resolve(asError(e));
        }
      }, LATENCY_MS);
    });
  }

  /* Small helper: label a payload with the DEMO notice (used by views). */
  function withDemoTag(payload) {
    payload = payload || {};
    payload.demo = D.metadata.source === "DEMO";
    payload.demoLabel = D.metadata.demoLabel || D.metadata.source;
    return payload;
  }

  /* ====================================================================
     DASHBOARD service
     ==================================================================== */
  var Dashboard = {
    /* Campus identity + overall sustainability score and category split */
    getSummary: function () {
      return read(function () {
        return asSuccess(withDemoTag({
          campus: D.campus,
          sustainabilityScore: D.sustainabilityScore_section ? null : D.sustainabilityScore,
          score: D.sustainabilityScore,
          sourceLabel: D.metadata.demoLabel,
        }));
      });
    },

    /* KPI top cards (energy/water/waste/carbon/score) */
    getKpis: function () {
      return read(function () {
        return asSuccess(withDemoTag({ kpis: D.kpis }));
      });
    },

    /* Energy: today + month + monthly series for the chart */
    getEnergy: function () {
      return read(function () {
        return asSuccess(withDemoTag({
          today: D.energy.today,
          month: D.energy.month,
          saved: D.energy.saved,
          renewablePct: D.energy.renewablePct,
          monthly: D.energy.monthly,
        }));
      });
    },

    /* Water: today + week + month */
    getWater: function () {
      return read(function () {
        return asSuccess(withDemoTag({ water: D.water }));
      });
    },

    /* Waste: totals + recycling rate + monthly series */
    getWaste: function () {
      return read(function () {
        return asSuccess(withDemoTag({ waste: D.waste }));
      });
    },

    /* Carbon: emissions + trend + sources */
    getCarbon: function () {
      return read(function () {
        return asSuccess(withDemoTag({ carbon: D.carbon }));
      });
    },

    /* Transportation: modal split + weekly series */
    getTransportation: function () {
      return read(function () {
        return asSuccess(withDemoTag({ transportation: D.transportation }));
      });
    },

    /* Recent activity feed + initiatives */
    getStream: function () {
      return read(function () {
        return asSuccess(withDemoTag({
          activity: D.activity,
          activityPool: D.activityPool,
          initiatives: D.initiatives,
        }));
      });
    },
  };

  /* ====================================================================
     MONITORING service  (campus map + building live status)
     ==================================================================== */
  var Monitoring = {
    /* Building live-status cards (placeholder map uses these + dots) */
    getBuildings: function () {
      return read(function () {
        return asSuccess(withDemoTag({ buildings: D.buildings }));
      });
    },

    /* Monitoring points for the campus map placeholder */
    getMonitoringPoints: function () {
      return read(function () {
        return asSuccess(withDemoTag({ points: D.monitoringPoints }));
      });
    },

    /* Everything the monitoring view needs in one call */
    getCampusOverview: function () {
      return read(function () {
        return asSuccess(withDemoTag({
          buildings: D.buildings,
          points: D.monitoringPoints,
          campus: D.campus,
        }));
      });
    },
  };

  /* ====================================================================
     ALERTS service  (alert center / severity levels)
     ==================================================================== */
  var Alerts = {
    /* All alerts (for the alert center) */
    getAll: function () {
      return read(function () {
        return asSuccess(withDemoTag({ alerts: D.alerts }));
      });
    },

    /* Counts per severity (for sidebar badge / filter chips) */
    getCounts: function () {
      return read(function () {
        var counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
        D.alerts.forEach(function (a) {
          if (a.severity && counts[a.severity] !== undefined) counts[a.severity] += 1;
        });
        return asSuccess(withDemoTag({
          counts: counts,
          total: D.alerts.length,
        }));
      });
    },

    /* A single alert by id (for detail view/modal) */
    getById: function (id) {
      return read(function () {
        var found = D.alerts.filter(function (a) { return String(a.id) === String(id); })[0];
        return found
          ? asSuccess(withDemoTag({ alert: found }))
          : asEmpty("No alert with id '" + id + "' found.");
      });
    },
  };

  /* ====================================================================
     REPORTS service  (report builder view + export-ready data)
     ==================================================================== */
  var Reports = {
    /* Full report document (headline + sections of metric rows) */
    getReport: function () {
      return read(function () {
        return asSuccess(withDemoTag({
          campus: D.campus,
          report: D.reports,
        }));
      });
    },

    /* Flat table rows for CSV/PDF export (category, metric, value) */
    getExportRows: function () {
      return read(function () {
        var rows = [];
        D.reports.sections.forEach(function (sec) {
          sec.metricRows.forEach(function (row) {
            rows.push({
              category: sec.heading,
              metric: row,
            });
          });
        });
        return asSuccess(withDemoTag({
          rows: rows,
          period: D.reports.period,
          title: D.reports.title,
        }));
      });
    },

    /* Energy & water snapshot numbers reused by the report builder */
    getSnapshot: function () {
      return read(function () {
        return asSuccess(withDemoTag({
          energy: D.energy,
          water: D.water,
          waste: D.waste,
          carbon: D.carbon,
          campus: D.campus,
        }));
      });
    },

    /* Static insights used by the insights card in each module view */
    getInsight: function (moduleKey) {
      return read(function () {
        var insight = null;
        if (moduleKey === "energy") insight = { tip: D.energy.opportunities };
        else if (moduleKey === "water") insight = { tip: D.water.tips };
        else insight = { tip: [] };
        if (!insight.tip || !insight.tip.length) return asEmpty("No insights for " + moduleKey + " yet.");
        insight.demo = D.metadata.source === "DEMO";
        return asSuccess(withDemoTag(insight));
      });
    },
  };

  /* ====================================================================
     EXPORT -- attach to the global namespace (no ES modules, works on file://)
     ==================================================================== */
  App.services = {
    Dashboard: Dashboard,
    Monitoring: Monitoring,
    Alerts: Alerts,
    Reports: Reports,
    /* Future hook: set to true when a real backend transport is attached.
       Views already render an appropriate offline/offline-ish state based
       on the RESULT.status, so adding it later needs no UI changes. */
    getDataSource: function () {
      return D.metadata;
    },
  };
})();
