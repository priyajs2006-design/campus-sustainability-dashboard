/* ======================================================================
   reports.js  --  REPORTS view  (campus sustainability report document)
   ======================================================================
   Renders a professional DEMO report card into #viewReports:

     * report identity header (title / period / campus),
     * period selector (8 periods -> re-paints the document),
     * KPI snapshot strip,                      (DEMO numbers)
     * metric sections from the Reports service with a metric table each,
     * DEMO notice band (always visible -- this is sample data),
     * CSV export + CSV-select CSV, and an ASCII-safe Print/PDF button.

   The view NEVER reads js/data.js directly. It only calls
   App.services.Reports.* -- swap the service for a real API later and
   nothing in this view changes.

   Requires (load order): data.js services.js components.js charts.js
   ====================================================================== */
(function () {
  "use strict";

  var App = (window.SustainabilityApp = window.SustainabilityApp || {});
  var H = App.components || {};
  var S = App.services || {};

  var PERIODS = ["2026-Q3", "2026-Q2", "2026-Q1", "2025-Q4", "2025-Q3", "2025-Q2", "2025-Q1", "2024-Q4"];
  var _period = PERIODS[0];

  /* --------------------------------------------------------------------
     ASCII escaper (local copy -- component layer provides its own).
     -------------------------------------------------------------------- */
  function esc(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ====================================================================
     Main entry: mount everything under #viewReports.
     ==================================================================== */
  App.views = App.views || {};
  App.views.reports = function () {
    var host = document.getElementById("viewReports");
    if (!host) return;
    host.innerHTML = "";

    /* ---- header ---- */
    var head = document.createElement("div");
    head.className = "view-head";
    head.innerHTML =
      '<h2><span class="ico">&#128196;</span> Sustainability Report</h2>' +
      '<p class="view-sub">Generated report document (DEMO DATA &#8212; sample ' +
      "baseline metrics, not a live campus measurement). Use CSV / Print to " +
      "export the current period.</p>";
    host.appendChild(head);

    /* ---- controls: period select + export buttons ---- */
    var ctl = document.createElement("div");
    ctl.className = "report-actions";
    ctl.id = "reportActions";
    ctl.innerHTML =
      '<label class="field-label" for="periodSelect">Period</label>' +
      '<select id="periodSelect" class="select">' +
      PERIODS.map(function (p) {
        return '<option value="' + p + '"' + (p === _period ? " selected" : "") + ">" + esc(p) + "</option>";
      }).join("") +
      "</select>" +
      '<button class="btn btn-ghost" id="btnCsv">&#11015; CSV</button>' +
      '<button class="btn btn-ghost" id="btnPrint">&#128424; Print / PDF</button>';
    host.appendChild(ctl);

    /* ---- document body ---- */
    var doc = document.createElement("div");
    doc.className = "report-doc";
    doc.id = "reportDoc";
    host.appendChild(doc);

    /* ---- wire controls ---- */
    document.getElementById("periodSelect").addEventListener("change", function (e) {
      _period = e.target.value;
      paint(doc);
    });
    document.getElementById("btnPrint").addEventListener("click", function () {
      window.print();
    });
    document.getElementById("btnCsv").addEventListener("click", function () {
      S.Reports.getReport(_period).then(function (r) {
        if (r.status !== "success") return;
        var csv = toCsv(r.data);
        var href =
          "data:text/csv;charset=utf-8," + encodeURIComponent("\uFEFF" + csv);
        var a = document.createElement("a");
        a.href = href;
        a.download = "campus-sustainability-report-" + String(_period).toLowerCase() + ".csv";
        a.click();
      });
    });

    /* ---- initial paint ---- */
    paint(doc);
  };

  /* ====================================================================
     Paint the report document from the service payload.
     ==================================================================== */
  function paint(doc) {
    if (!doc) return;
    doc.innerHTML = "";

    S.Reports.getReport(_period).then(function (r) {
      if (r.status !== "success") {
        if (H && H.ErrorState) doc.appendChild(H.ErrorState("Could not build the report."));
        else doc.textContent = "Could not load report data.";
        return;
      }
      var rep = (r.data && r.data) || {};
      var campus = (rep.campus || {}).name || "Campus";

      /* ---- cover ---- */
      var cover = document.createElement("div");
      cover.className = "report-cover";
      cover.innerHTML =
        '<div class="rc-campus">' + esc(campus) + "</div>" +
        '<div class="rc-title">' + esc(rep.title || "Sustainability Report") + "</div>" +
        '<div class="rc-period">Period: <b>' + esc(rep.period || _period) + "</b></div>" +
        '<div class="rc-badge">DEMO DATA &#8212; sample baseline, not live readings</div>';
      doc.appendChild(cover);

      /* ---- summary strip ---- */
      var sum = document.createElement("div");
      sum.className = "report-summary";
      var sc = rep.score || {};
      sum.innerHTML =
        '<div class="rs-item"><b>' + esc(sc.overall != null ? sc.overall : "--") + "</b><span>Score /100</span></div>" +
        '<div class="rs-item"><b>' + esc(sc.segments && sc.segments.length ? sc.segments.length : "--") + "</b><span>Categories</span></div>" +
        '<div class="rs-item"><b>' + esc(rep.metrics && rep.metrics.length ? rep.metrics.length : "--") + "</b><span>Indicators</span></div>";
      doc.appendChild(sum);

      /* ---- metric sections ---- */
      var sections = rep.sections || [];
      if (!sections.length) {
        if (H && H.EmptyState) doc.appendChild(H.EmptyState("No metric sections in this period."));
        return;
      }
      sections.forEach(function (sec) {
        var box = document.createElement("section");
        box.className = "report-section";
        box.innerHTML =
          '<div class="rs-heading">' + esc(sec.heading || "Section") + "</div>";
        var rows = sec.metricRows || [];
        if (rows.length) {
          rows.forEach(function (row) {
            box.innerHTML +=
              '<div class="rs-row"><span class="rs-key">' + esc(row.metric || row) +
              '</span><span class="rs-val">' + esc(row.value != null ? row.value : "") + "</span></div>";
          });
        }
        doc.appendChild(box);
      });

      /* ---- footer note ---- */
      var foot = document.createElement("div");
      foot.className = "report-foot";
      foot.innerHTML =
        "Generated " + esc(new Date().toLocaleString()) +
        " \u00B7 Source: <b>DEMO DATA</b> \u00B7 All campus SustainabilityApp " +
        "values are synthetic sample baselines for demonstration.";
      doc.appendChild(foot);
    });
  }

  /* ====================================================================
     CSV serializer for the export button.
     ==================================================================== */
  function toCsv(rep) {
    var lines = [
      "Campus Sustainability Report",
      'Title,"' + String(rep.title || "") + '"',
      'Period,"' + String(rep.period || "") + '"',
      'Campus,"' + String((rep.campus && rep.campus.name) || "") + '"',
      "Source,DEMO DATA (sample baseline - not live)",
      "",
      "Section,Metric,Value",
    ];
    (rep.sections || []).forEach(function (sec) {
      (sec.metricRows || []).forEach(function (row) {
        lines.push(
          '"' + String(sec.heading || "").replace(/"/g, "''") + '",' +
          '"' + String(row.metric || row || "").replace(/"/g, "''") + '",' +
          '"' + String(row.value != null ? row.value : "").replace(/"/g, "''") + '"'
        );
      });
    });
    return lines.join("\r\n");
  }
})();
