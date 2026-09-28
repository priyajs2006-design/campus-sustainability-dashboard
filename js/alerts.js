/* ======================================================================
   alerts.js  --  ALERT CENTER  (single, self-contained, ASCII-clean)
   ======================================================================
   Renders into #viewAlerts:
     * DEMO source strip + title,
     * severity summary counts (CRITICAL/HIGH/MEDIUM/LOW),
     * topic filter chips (ALL | ENERGY | WATER | WASTE | CARBON),
     * the matching alert rows (severity pills + DEMO badge each).

   Data ALWAYS via App.services.Alerts.getAll()/getCounts(); never reads
   js/data.js directly (:data-contract). Requires components.js for
   AlertRow + SeverityPill + esc + StateBlock only.

   Load order: data.js services.js components.js
   ====================================================================== */
(function () {
  "use strict";

  var App = (window.SustainabilityApp = window.SustainabilityApp || {});
  var H = App.components || {};
  var S = App.services || {};

  var TOPICS = ["ALL", "ENERGY", "WATER", "WASTE", "CARBON"];
  var _topic = "ALL";
  var _rows = []; /* last successfully loaded alert list */

  function esc(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* severity -> pill class key */
  function sevKey(level) {
    level = String(level || "").toUpperCase();
    if (level === "CRITICAL") return "crit";
    if (level === "HIGH") return "high";
    if (level === "MEDIUM") return "med";
    return "low";
  }

  App.views = App.views || {};
  App.views.alerts = function () {
    var host = document.getElementById("viewAlerts");
    if (!host) return;
    host.innerHTML = "";

    /* ---- title + source strip ---- */
    var head = document.createElement("div");
    head.className = "view-head";
    head.innerHTML =
      '<h2><span class="ico">&#128276;</span> Alert Center</h2>' +
      '<p class="view-sub">Campus alerts by severity. <span class="warn-chip">DEMO DATA</span> &#8212; ' +
      "sample notifications explaining the workflow, not real incident reports.</p>";
    host.appendChild(head);

    /* ---- severity summary ---- */
    var sumRow = document.createElement("div");
    sumRow.className = "alert-summary";
    sumRow.id = "alertSummary";
    host.appendChild(sumRow);

    /* ---- topic chips ---- */
    var chips = document.createElement("div");
    chips.className = "chips";
    var chipBox = document.createElement("div");
    chipBox.className = "chips";
    host.appendChild(chipBoxiam);
    host.appendChild(chipBox);

    /* ---- list host ---- */
    var listBox = document.createElement("div");
    listBox.className = "alert-list";
    listBox.id = "alertList";
    host.appendChild(listBox);

    paintChips();
    paintList();
  };

  /* --------------------------------------------------------------------
     Draw the topic filter chips (re-paints on click).
     -------------------------------------------------------------------- */
  function paintChips() {
    var box = document.getElementById("chips");
    if (!box) return;
    box.innerHTML = "";
    TOPICS.forEach(function (t) {
      var b = document.createElement("button");
      b.className = "chip" + (_topic === t ? " active" : "");
      b.dataset.topic = t;
      b.textContent = t;
      b.addEventListener("click", function () { _topic = t; paintChips(); paintList(); });
      box.appendChild(b);
    });
  }

  /* --------------------------------------------------------------------
     Fetch + paint severity summary + filtered alert rows.
     -------------------------------------------------------------------- */
  function paintList() {
    var listEl = document.getElementById("alertList");
    var sumEl = document.getElementById("alertSummary");
    if (!listEl) return;

    S.Alerts.getAll().then(function (result) {
      if (result.status !== "success") {
        if (H.ErrorState) listEl.appendChild(H.ErrorState("Could not load alerts."));
        return;
      }
      var alerts = (result.data && result.data.alerts) || [];

      /* ---- severity counts (unfiltered) ---- */
      var counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      alerts.forEach(function (a) {
        var k = sevKey(a.severity).toUpperCase() || "LOW";
        if (counts.hasOwnProperty(k)) counts[k] += 1;
      });
      if (sumEl) {
        sumEl.innerHTML = "";
        ["CRITICAL", "HIGH", "MEDIUM", "LOW"].forEach(function (lv) {
          var pill = document.createElement("span");
          pill.className = "sev-count sev-" + sevKey(lv);
          pill.innerHTML = "<b>" + (counts[lv] || 0) + "</b> " + lv;
          sumEl.appendChild(pill);
        });
      }

      /* ---- topic filter ---- */
      var filtered = alerts.filter(function (a) {
        if (_topic === "ALL") return true;
        return String(a.topic || a.type || "").toUpperCase() === _topic;
      });

      listEl.innerHTML = "";
      if (!filtered.length) {
        if (H.EmptyState) listEl.appendChild(H.EmptyState("No alerts match " + _topic + " right now."));
        return;
      }
      filtered.forEach(function (a) {
        if (H.AlertRow) listEl.appendChild(H.AlertRow(a));
      });
    });
  }
})();
