/* ======================================================================
   monitoring.js  --  CAMPUS LIVE MONITORING view (live status board)
   ======================================================================
   Features:
     * DEMO DATA strip + live clock,
     * building live-status grid (energy/water/waste per building),
     * campus monitoring "points" (positioned demo watch-points),
     * live refresh ticker that rotates every few seconds to feel alive.

   IMPORTANT (data rule):
     This view NEVER reads js/data.js directly. It only talks to the
     SERVICE layer (App.services.Monitoring + App.services.Dashboard),
     which serves the DEMO dataset with a clearly-labelled DEMO state.

   Requires (load order): data.js services.js components.js charts.js
   ====================================================================== */
(function () {
  "use strict";

  var App = (window.SustainabilityApp = window.SustainabilityApp || {});
  var H = App.components || {};
  var S = App.services || {};

  var _refreshTimer = null; /* live "refreshing…" ticker handle */
  var _tickCount = 0;

  /* --------------------------------------------------------------------
     Main entry point — called by the router when this view is active.
     Renders everything into #viewMonitoring.
     -------------------------------------------------------------------- */
  App.views = App.views || {};
  App.views.monitoring = function () {
    var host = document.getElementById("viewMonitoring");
    if (!host) return;
    host.innerHTML = "";

    /* ---- data source strip (DEMO) + live clock ---- */
    var strip = document.createElement("div");
    strip.className = "data-source-strip";
    strip.innerHTML =
      '<span class="pulse-dot"></span> Live campus monitoring board' +
      ' <span class="src">DEMO DATA</span>' +
      ' <span class="refresh-ticker" id="monTick">refreshing live\u2026</span>';
    host.appendChild(strip);

    /* ---- campus map placeholder card ---- */
    var mapCard = document.createElement("section");
    mapCard.className = "card mon-map-card";
    mapCard.innerHTML =
      '<div class="card-title">Campus Map \u00B7 Live Sensor Watch-Points</div>' +
      '<div class="map-placeholder" id="campusMap"></div>' +
      '<p class="map-note">Campus map placeholder \u2014 replace with a real ' +
      "campus map (static image or Leaflet tiles) + sensor pins in the " +
      "production build. Dots below are DEMO watch-points.</p>";
    host.appendChild(mapCard);

    /* ---- legend for the map dots ---- */
    var legend = document.createElement("div");
    legend.className = "legend-row";
    legend.innerHTML =
      '<span class="legend-dot d-normal"></span> Normal' +
      '<span class="legend-dot d-warning"></span> Warning' +
      '<span class="legend-dot d-critical"></span> Critical' +
      '<span class="legend-dot d-offline"></span> Offline';
    host.appendChild(legend);

    /* ---- live building status ---- */
    var bwrap = document.createElement("section");
    bwrap.className = "card mon-buildings-card";
    bwrap.innerHTML =
      '<div class="card-title">Building Live Status</div>' +
      '<div class="building-grid" id="buildingGrid"></div>';
    host.appendChild(bwrap);

    /* ---- activity feed (recent campus events) ---- */
    var feed = document.createElement("section");
    feed.className = "card mon-feed-card";
    feed.innerHTML =
      '<div class="card-title">Recent Campus Activity</div>' +
      '<div class="activity-list" id="monActivity"></div>';
    host.appendChild(feed);

    /* ---- paint everything from the services layer ---- */
    paintMap();
    paintBuildings();
    paintActivity();

    /* ---- start the live "refreshing" ticker (feel-alive effect) ---- */
    if (_refreshTimer) window.clearInterval(_refreshTimer);
    _refreshTimer = window.setInterval(function () {
      _tickCount += 1;
      var t = document.getElementById("monTick");
      if (t) {
        var words = [
          "refreshing live\u2026", "sampling sensors\u2026", "checking meters\u2026",
          "syncing DEMO stream\u2026", "updating dashboards\u2026",
        ];
        t.textContent = words[_tickCount % words.length];
      }
    }, 1500);
  };

  /* --------------------------------------------------------------------
     Campus map placeholder: a soft-styled "campus" rectangle with the
     DEMO watch-point dots coloured by status + positioned by x/y %.
     -------------------------------------------------------------------- */
  function paintMap() {
    var host = document.getElementById("campusMap");
    if (!host) return;
    host.innerHTML = "";

    /* decorative campus outline (pure CSS) */
    var bg = document.createElement("div");
    bg.className = "campus-green";
    bg.innerHTML = '<span class="campus-label">CAMPUS MAP \u00B7 DEMO</span>';
    host.appendChild(bg);

    S.Monitoring.getMonitoringPoints().then(function (r) {
      if (r.status !== "success") return;
      var points = (r.data && r.data.points) || [];
      points.forEach(function (pt) {
        var dot = document.createElement("button");
        dot.className = "mon-dot dot-" + String(pt.status || "normal").toLowerCase();
        dot.style.left = pt.x + "%";
        dot.style.top = pt.y + "%";
        dot.setAttribute("title", pt.name + " \u00B7 " + pt.type + " \u00B7 " + pt.status);
        dot.textContent = pt.icon || "";
        dot.addEventListener("click", function () {
          if (H.MonitoringDot) H.MonitoringDot(pt);
        });
        host.appendChild(dot);
      });
    });
  }

  /* --------------------------------------------------------------------
     Building status grid (energy / water / waste live numbers).
     -------------------------------------------------------------------- */
  function paintBuildings() {
    var host = document.getElementById("buildingGrid");
    if (!host) return;
    host.innerHTML = "";

    S.Monitoring.getBuildings().then(function (r) {
      if (r.status !== "success") {
        host.appendChild(H.ErrorState && H.ErrorState("Could not load building status."));
        return;
      }
      var buildings = (r.data && r.data.buildings) || [];
      if (!buildings.length) {
        host.appendChild(H.EmptyState && H.EmptyState("No buildings yet."));
        return;
      }
      buildings.forEach(function (b) {
        var card = document.createElement("div");
        card.className = "building-card bd-" + String(b.status || "ok").toLowerCase();
        card.innerHTML =
          '<div class="building-head">' +
          '<span class="b-icon">' + b.icon + "</span>" +
          '<div><div class="b-name">' + H.esc(b.name) + "</div>" +
          "<div class=\"b-status\">" + (H.StatusPill ? H.StatusPill(b.status).outerHTML : "") + "</div></div></div>" +
          '<div class="b-kpis">' +
          miniKpi(b.energy, "kWh", "Energy") + miniKpi(b.water, "kL", "Water") +
          miniKpi(b.waste, "kg", "Waste") +
          "</div>";
        host.appendChild(card);
      });
    });
  }

  function miniKpi(value, unit, label) {
    return '<div class="b-kpi"><b>' + (value != null ? value : "--") + "</b>" +
      "<span>" + label + " \u00B7 " + unit + "</span></div>";
  }

  /* --------------------------------------------------------------------
     Recent activity list (from the stream service).
     -------------------------------------------------------------------- */
  function paintActivity() {
    var host = document.getElementById("monActivity");
    if (!host) return;

    S.Dashboard.getStream().then(function (r) {
      if (r.status !== "success") return;
      var items = (r.data && r.data.activity) || [];
      if (!items.length) { host.innerHTML = '<p class="muted">No recent activity.</p>'; return; }
      host.innerHTML = "";
      items.forEach(function (a) {
        var row = document.createElement("div");
        row.className = "activity-row";
        row.innerHTML =
          '<span class="a-ico">' + a.icon + "</span>" +
          '<span class="a-txt">' + H.esc(a.text) + "</span>" +
          '<span class="a-time">' + H.esc(a.time) + "</span>";
        host.appendChild(row);
      });
    });
  }

})();
