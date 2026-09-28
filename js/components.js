/* ======================================================================
   components.js  --  REUSABLE UI COMPONENTS
   ======================================================================
   Tiny, dependency-free DOM builders. Every module view composes its
   markup through these helpers so the look & feel stays consistent and
   all state rendering (loading / success / empty / error / offline) is
   handled in ONE place.

   NOTE ON EMOJI: every icon is written as a \uXXXX ES2019 escape so the
   file stays 100% ASCII on disk (avoids editor/mojibake problems, and
   still renders the actual emoji in the browser). There are NO real
   emoji characters inside this source file.

   Requires:  js/data.js, js/services.js (in that order)
   ==================================================================== */
(function () {
  "use strict";

  var App = (window.SustainabilityApp = window.SustainabilityApp || {});
  var S = App.services || {};
  var D = App.data || {};

  /* --------------------------------------------------------------------
     Small escape helper for metric labels / user text (prevents breaking
     the HTML when a value contains < > &).
     -------------------------------------------------------------------- */
  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* --------------------------------------------------------------------
     Demo badge  —  shown wherever data came from the DEMO dataset so it
     is always obvious the numbers are not live campus measurements.
     -------------------------------------------------------------------- */
  function DemoBadge(label) {
    var el = document.createElement("span");
    el.className = "demo-badge";
    el.setAttribute("title",
      "DEMO DATA (sample baseline) — not real campus sensor measurements.");
    el.textContent = label || "DEMO";
    return el;
  }

  /* --------------------------------------------------------------------
     Status pill  —  colored label for building / sensor status.
     Supported states: ok/normal | warn/warning | crit/critical | offline
     -------------------------------------------------------------------- */
  var STATUS_MAP = {
    ok: "ok", normal: "ok", good: "ok", success: "ok",
    warn: "warn", warning: "warn", warning_ok: "warn",
    crit: "crit", critical: "crit", danger: "crit",
    offline: "offline", na: "offline", unknown: "offline",
  };

  function StatusPill(status, label) {
    var key = STATUS_MAP[String(status).toLowerCase()] || "offline";
    var text = label;
    if (!text) {
      text = { ok: "Active", warn: "Warning", crit: "Critical", offline: "Offline" }[key] || "Unknown";
    }
    var el = document.createElement("span");
    el.className = "pill pill-" + key;
    el.textContent = text;
    return el;
  }

  /* Severity pill reused by the alert center (LOW..CRITICAL) */
  var SEVERITY_MAP = {
    LOW: "low", MEDIUM: "med", HIGH: "high", CRITICAL: "crit",
  };
  function SeverityPill(level) {
    var key = SEVERITY_MAP[String(level).toUpperCase()] || "low";
    var el = document.createElement("span");
    el.className = "pill pill-sev pill-sev-" + key;
    el.textContent = level;
    return el;
  }

  /* --------------------------------------------------------------------
     Score ring  —  circular progress for an overall / category score.
     -------------------------------------------------------------------- */
  function ScoreRing(value, label, sizePx) {
    sizePx = sizePx || 140;
    var stroke = sizePx * 0.08;
    var r = (sizePx - stroke) / 2;
    var c = 2 * Math.PI * r;
    var pct = Math.max(0, Math.min(100, Number(value) || 0));
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 " + sizePx + " " + sizePx);
    svg.setAttribute("class", "score-ring");
    svg.style.width = sizePx + "px";
    svg.style.height = sizePx + "px";

    var bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bg.setAttribute("cx", sizePx / 2); bg.setAttribute("cy", sizePx / 2);
    bg.setAttribute("r", r); bg.setAttribute("fill", "none");
    bg.setAttribute("stroke", "var(--chart-grid)"); bg.setAttribute("stroke-width", strokeopera);

    var fg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    fg.setAttribute("cx", sizePx / 2); fg.setAttribute("cy", sizePx / 2);
    fg.setAttribute("r", r); fg.setAttribute("fill", "none");
    fg.setAttribute("stroke", "var(--accent)"); fg.setAttribute("stroke-width", stroke);
    fg.setAttribute("stroke-linecap", "round");
    fg.setAttribute("stroke-dasharray", c);
    fg.setAttribute("stroke-dashoffset", c * (1 - pct / 100));
    fg.setAttribute("transform", "rotate(-90 " + sizePx / 2 + " " + sizePx / 2 + ")");

    var wrap = document.createElement("div");
    wrap.className = "score-ring-wrap";
    wrap.style.width = sizePx + "px";

    var num = document.createElement("div");
    num.className = "score-ring-num";
    num.textContent = Math.round(pct) + "";
    var cap = document.createElement("div");
    cap.className = "score-ring-label";
    cap.textContent = label || "Score";

    svg.appendChild(bg); svg.appendChild(fg);
    wrap.appendChild(svg); wrap.appendChild(num); wrap.appendChild(cap);
    return wrap;
  }

  /* --------------------------------------------------------------------
     KPI card  —  top-of-dashboard stat (value + unit + trend hint).
     -------------------------------------------------------------------- */
  function KpiCard(opts) {
    opts = opts || {};
    var card = document.createElement("div");
    card.className = "kpi-card card";
    card.setAttribute("data-trend", opts.trend || "flat");

    var head = document.createElement("div");
    head.className = "kpi-head";
    head.innerHTML = '<span class="kpi-ico">' + (opts.icon || "") + "</span> "
      + esc(opts.label || "");

    var value = document.createElement("div");
    value.className = "kpi-value";
    value.innerHTML = esc(opts.value != null ? opts.value : "--")
      + (opts.unit ? " <small>" + esc(opts.unit) + "</small>" : "");

    var sub = document.createElement("div");
    sub.className = "kpi-sub";
    sub.innerHTML = (opts.arrow || "&nbsp;&nbsp;") + (opts.sub || "");

    card.appendChild(head); card.appendChild(value); card.appendChild(sub);
    return card;
  }

  /* --------------------------------------------------------------------
     Generic "empty / loading / error / offline" blocks used by every view.
     -------------------------------------------------------------------- */
  function StateBlock(icon, title, message) {
    var el = document.createElement("div");
    el.className = "state-block";
    el.innerHTML = '<div class="state-ico">' + (icon || "&#128228;")
      + "</div><div class=\"state-title\">" + esc(title || "")
      + "</div><div class=\"state-msg\">" + esc(message || "") + "</div>";
    return el;
  }

  function LoadingState() {
    var el = document.createElement("div");
    el.className = "state-block";
    el.innerHTML = '<div class="spinner"></div>'
      + '<div class="state-title">Loading data\u2026</div>'
      + '<div class="state-msg">(demo latency applies)</div>';
    return el;
  }

  function ErrorState(message) {
    var el = StateBlock("&#9888;&#65039;", "Could not load data",
      message || "Something went wrong. Please try again.");
    el.classList.add("is-error");
    return el;
  }

  function OfflineState(message) {
    var el = StateBlock("&#128276;", "You appear to be offline",
      message || "Latest values could not be refreshed.");
    el.classList.add("is-offline");
    return el;
  }

  function EmptyState(message) {
    var el = StateBlock("&#128269;", "No data yet",
      message || "There is nothing to show for this view right now.");
    el.classList.add("is-empty");
    return el;
  }

  /* --------------------------------------------------------------------
     Alert row (used in the alert center) — icon + severity + title/detail
     -------------------------------------------------------------------- */
  function AlertRow(alert) {
    var row = document.createElement("div");
    row.className = "alert-row";
    row.dataset.severity = alert.severity;
    row.dataset.id = alert.id;

    var typeIco = document.createElement("span");
    typeIco.className = "alert-ico";
    typeIco.textContent = alert.icon || "&#128276;";

    var body = document.createElement("div");
    body.className = "alert-body";
    var t = document.createElement("div");
    t.className = "alert-title";
    t.textContent = alert.title || "Untitled alert";
    var d = document.createElement("div");
    d.className = "alert-detail";
    d.textContent = alert.detail || "";
    body.appendChild(t); body.appendChild(d);

    var right = document.createElement("div");
    right.className = "alert-meta";
    right.appendChild(SeverityPill(alert.severity));
    var time = document.createElement("span");
    time.className = "alert-time";
    time.textContent = alert.time || "";
    right.appendChild(time);

    row.appendChild(typeIco); row.appendChild(body); row.appendChild(right);
    return row;
  }

  /* --------------------------------------------------------------------
     Monitoring "dot" for the campus map placeholder (building markers).
     -------------------------------------------------------------------- */
  function MonitoringDot(pt, onSelect) {
    var dot = document.createElement("button");
    dot.className = "mon-dot dot-" + String(pt.status || "normal").toLowerCase().trim();
    dot.style.left = pt.x + "%";
    dot.style.top = pt.y + "%";
    dot.setAttribute("title", (pt.name || "Point") + " \u00B7 " + (pt.type || "") + " \u00B7 " + (pt.status || ""));
    dot.textContent = pt.icon || "";
    if (typeof onSelect === "function") {
      dot.addEventListener("click", function () { onSelect(pt); });
    }
    return dot;
  }

  /* --------------------------------------------------------------------
     Export public component namespace
     -------------------------------------------------------------------- */
  App.components = {
    esc: esc,
    DemoBadge: DemoBadge,
    StatusPill: StatusPill,
    SeverityPill: SeverityPill,
    ScoreRing: ScoreRing,
    KpiCard: KpiCard,
    LoadingState: LoadingState,
    ErrorState: ErrorState,
    OfflineState: OfflineState,
    EmptyState: EmptyState,
    StateBlock: StateBlock,
    AlertRow: AlertRow,
    MonitoringDot: MonitoringDot,
  };
})();
