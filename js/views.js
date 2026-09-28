/* ======================================================================
   views.js  --  MODULE VIEWS (Dashboard, Energy, Water, Waste, Carbon,
                               Transportation)
   ======================================================================
   Each view is a self-contained function stored on App.views.<name> and
   bound to a hash route. It ONLY talks to the service layer
   (App.services.Dashboard.*) and passes the resolved payload straight to
   App.charts.* builders -- never touching js/data.js directly, so the
   whole library stays interchangeable with a real backend later.

   ====================================================================== */
(function () {
  "use strict";

  var App = (window.SustainabilityApp = window.SustainabilityApp || {});
  var H = App.components || {};
  var S = App.services || {};
  var CH = App.charts || {};

  App.views = App.views || {};

  /* ----------------------------------------------------------------------
     Shared sub-header builder (title + DEMO strip + description).
     ---------------------------------------------------------------------- */
  function subHeader(title, icon, desc) {
    var wrap = document.createElement("div");
    wrap.className = "sub-header";
    wrap.innerHTML =
      '<div class="sub-title"><span class="sub-ico">' + icon + "</span>" +
      H.esc(title) + "</div>" +
      '<div class="sub-desc">' +
      (desc ? H.esc(desc) : "") + "</div>";
    return wrap;
  }

  /* ----------------------------------------------------------------------
     KPI card strip builder (reuses H.KpiCard from components.js).
     ---------------------------------------------------------------------- */
  function kpiStrip(cfg) {
    var strip = document.createElement("div");
    strip.className = "view-body";
    cfg.forEach(function (c) {
      strip.appendChild(H.KpiCard(c));
    });
    return strip;
  }

  /* ======================================================================
     DASHBOARD  --  snapshot KPIs + energy trend + transport mix + stream
     ====================================================================== */
  App.views.dashboard = function () {
    var host = document.getElementById("viewDashboard");
    if (!host) return;
    host.innerHTML = "";
    host.appendChild(subHeader("Dashboard", "\uD83C\uDFE1", "Campus sustainability overview. All values are DEMO (sample baseline)."));

    /* loading-first, then paint */
    S.Dashboard.getKpis().then(function (result) {
      var k = (result && result.data && result.data.kpis) || {};
      var cards = [
        { label: "Energy", icon: "\u26A1", value: k.energy && k.energy.value, unit: k.energy && k.energy.unit },
        { label: "Water", icon: "\uD83D\uDCA7", value: k.water && k.water.value, unit: k.water && k.water.unit },
        { label: "Waste", icon: "\u267B\uFE0F", value: k.waste && k.waste.value, unit: k.waste && k.waste.unit },
        { label: "Carbon", icon: "\uD83C\uDF2C\uFE0F", value: k.carbon && k.carbon.value, unit: k.carbon && k.carbon.unit },
      ].filter(function (c) { return c.value !== undefined && c.value !== null; });
      if (cards.length) host.appendChild(kpiStrip(cards));
    });

    /* score ring? use the donut on the dashboard canvas */
    var row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML =
      '<div class="card"><div class="card-title">Energy Trend (kWh)</div>' +
      '<div class="chart-box" style="height:230px"><canvas id="dashEnergyTrend"></canvas></div></div>' +
      '<div class="card"><div class="card-title">Transportation Mix (%)</div>' +
      '<div class="chart-box" style="height:230px"><canvas id="dashTransportMix"></canvas></div></div>';
    host.appendChild(row);

    S.Dashboard.getEnergy().then(function (result) {
      if (result.status === "success" && CH.makeEnergyTrend) {
        CH.makeEnergyTrend(document.getElementById("dashEnergyTrend"), result.data);
      }
    });
    S.Dashboard.getTransportation().then(function (result) {
      if (result.status === "success" && CH.makeTransportMix) {
        CH.makeTransportMix(document.getElementById("dashTransportMix"), result.data);
      }
    });

    /* recent activity stream */
    var feed = document.createElement("div");
    feed.className = "card activity-card";
    feed.innerHTML = '<div class="card-title">Recent Campus Activity</div><div class="activity-list" id="dashActivity"></div>';
    host.appendChild(feed2);
    S.Dashboard.getStream().then(function (result) {
      var feedHost = document.getElementById("dashActivity");
      if (!feedHost) return;
      var acts = (result && result.data && result.data.activity) || [];
      acts.slice(0, 6).forEach(function (a) {
        feedHost.appendChild(H.ActivityRow && H.ActivityRow(a));
      });
      if (!acts.length) feedHost.appendChild(H.EmptyState("No recent activity yet."));
    });
  };

  /* ======================================================================
     ENERGY
     ====================================================================== */
  App.views.energy = function () {
    var host = document.getElementById("viewEnergy");
    if (!host) return;
    host.innerHTML = "";
    host.appendChild(subHeader("Energy", "\u26A1", "Campus electrical consumption and renewable share. DEMO data."));

    var row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML =
      '<div class="card"><div class="card-title">Monthly Usage (kWh)</div>' +
      '<div class="chart-box" style="height:260px"><canvas id="energyTrend"></canvas></div></div>';
    host.appendChild(row);

    S.Dashboard.getEnergy().then(function (result) {
      if (result.status === "success" && CH.makeEnergyTrend) {
        CH.makeEnergyTrend(document.getElementById("energyTrend"), result.data);
      }
    });
  };

  /* ======================================================================
     WATER
     ====================================================================== */
  App.views.water = function () {
    var host = document.getElementById("viewWater");
    if (!host) return;
    host.innerHTML = "";
    host.appendChild(subHeader("Water", "\uD83D\uDCA7", "Campus water usage, savings and leakage watch. DEMO data."));

    var row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML =
      '<div class="card"><div class="card-title">Weekly Use vs Saved (kL)</div>' +
      '<div class="chart-box" style="height:260px"><canvas id="waterWeekly"></canvas></div></div>';
    host.appendChild(row);

    S.Dashboard.getWater().then(function (result) {
      if (result.status === "success" && CH.makeWaterWeekly) {
        CH.makeWaterWeekly(document.getElementById("waterWeekly"), result.data);
      }
    });
  };

  /* ======================================================================
     WASTE
     ====================================================================== */
  App.views.waste = function () {
    var host = document.getElementById("viewWaste");
    if (!host) return;
    host.innerHTML = "";
    host.appendChild(subHeader("Waste", "\u267B\uFE0F", "Campus waste generation and recycling rate. DEMO data."));

    var row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML =
      '<div class="card"><div class="card-title">Monthly Waste (kg)</div>' +
      '<div class="chart-box" style="height:260px"><canvas id="wasteMonthly"></canvas></div></div>';
    host.appendChild(row);

    S.Dashboard.getWaste().then(function (result) {
      if (result.status === "success" && CH.makeWasteMonthly) {
        CH.makeWasteMonthly(document.getElementById("wasteMonthly"), result.data);
      }
    });
  };

  /* ======================================================================
     CARBON
     ====================================================================== */
  App.views.carbon = function () {
    var host = document.getElementById("viewCarbon");
    if (!host) return;
    host.innerHTML = "";
    host.appendChild(subHeader("Carbon", "\uD83C\uDF2C\uFE0F", "Campus carbon footprint and reduction trend. DEMO data."));

    var row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML =
      '<div class="card"><div class="card-title">Carbon Trend (t CO2)</div>' +
      '<div class="chart-box" style="height:260px"><canvas id="carbonTrend"></canvas></div></div>';
    host.appendChild(row);

    S.Dashboard.getCarbon().then(function (result) {
      if (result.status === "success" && CH.makeCarbonTrend) {
        CH.makeCarbonTrend(document.getElementById("carbonTrend"), result.data);
      }
    });
  };

  /* ======================================================================
     TRANSPORTATION
     ====================================================================== */
  App.views.transportation = function () {
    var host = document.getElementById("viewTransportation");
    if (!host) return;
    host.innerHTML = "";
    host.appendChild(subHeader("Transportation", "\uD83D\uDE8C", "Campus travel modal split. DEMO data."));

    var row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML =
      '<div class="card"><div class="card-title">Weekly Mode Mix (%)</div>' +
      '<div class="chart-box" style="height:260px"><canvas id="transportMix"></canvas></div></div>';
    host.appendChild(row);

    S.Dashboard.getTransportation().then(function (result) {
      if (result.status === "success" && CH.makeTransportMix) {
        CH.makeTransportMix(document.getElementById("transportMix"), result.data);
      }
    });
  };
})();
