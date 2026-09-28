let currentTab = "Energy";
let currentPeriod = "day";

const buildings = [
  { id: "b1", name: "🏛️ Main Block", energy: 0, water: 0, waste: 0, status: "ok" },
  { id: "b2", name: "📚 Central Library", energy: 0, water: 0, waste: 0, status: "ok" },
  { id: "b3", name: "🧪 Science Block", energy: 0, water: 0, waste: 0, status: "ok" },
  { id: "b4", name: "🏫 New Academic Block", energy: 0, water: 0, waste: 0, status: "ok" },
  { id: "b5", name: "🏘️ Hostel Block", energy: 0, water: 0, waste: 0, status: "ok" },
  { id: "b6", name: "🍽️ Campus Canteen", energy: 0, water: 0, waste: 0, status: "ok" },
];

const activityPool = [
  { icon: "🌞", text: "Solar array production peaked at <b>1,240 kWh</b> today" },
  { icon: "💧", text: "Rainwater harvesting system refilled rooftop tanks" },
  { icon: "♻️", text: "E-waste drive collected <b>85 kg</b> of electronics" },
  { icon: "🚲", text: "Bike-to-campus day recorded <b>312</b> participants" },
  { icon: "💡", text: "Motion-sensor lighting saved <b>14%</b> hostel energy" },
  { icon: "🌱", text: "Campus garden planted <b>40</b> native saplings" },
  { icon: "🏭", text: "Compactor reduced landfill waste by <b>22%</b> this week" },
  { icon: "📊", text: "Energy audit of Main Block completed" },
  { icon: "🚿", text: "Low-flow fixtures installed in Hostel A" },
  { icon: "🔄", text: "Recycling drive turned in <b>560 kg</b> of paper & plastic" },
  { icon: "🎓", text: "Sustainability lecture attended by <b>480</b> students" },
  { icon: "🧊", text: "Cooling tower optimization cut water use <b>9%</b>" },
];

const reasons = {
  Energy: {
    day: ["Peak load at 2 PM is inside office hours — consider staggered AC start.", "Solar contributed ~28% of today's demand."],
    week: ["This week is 6% below last week — good lighting discipline.", "Weekend usage dropped 31% as expected."],
    month: ["Monthly consumption is trending 4% lower than the target.", "Labs use the largest share (38%)."],
  },
  Water: {
    day: ["Usage is within the daily budget; peak from 6–8 AM hostel showers.", "Rainwater tanks are at 76% capacity."],
    week: ["Water use down 9% vs last week thanks to low-flow fixtures.", "No leak alerts flagged in the past 7 days."],
    month: ["Monthly usage is 12% under target — on track for the 30% reduction goal.", "Canteen is the top consumer this month."],
  },
  Waste: {
    day: ["Recycling rate today: 72% — above the 68% baseline.", "Canteen contributes the largest organic share."],
    week: ["Weekly landfill waste dropped 22% after compactor service.", "E-waste drive diverted another 85 kg from landfill."],
    month: ["Recycling rate this month is 74%, trending toward the 90% goal.", "Organic composting reduced mixed waste by 15%."],
  },
};

function randomAround(base, spread) {
  return Math.max(0, Math.round((base + (Math.random() - 0.5) * spread) * 10) / 10);
}

let series = {
  Energy: [],
  Water: [],
  Waste: [],
};
let totals = { day: { Energy: 0, Water: 0, Waste: 0 }, week: { Energy: 0, Water: 0, Waste: 0 }, month: { Energy: 0, Water: 0, Waste: 0 } };

function seedSeries() {
  const N = 24;
  for (let i = 0; i < N; i++) {
    const hourFactor = 0.7 + 0.5 * Math.sin(((i - 4) / 24) * Math.PI * 2);
    series.Energy.push(randomAround(420 * hourFactor, 60));
    series.Water.push(randomAround(34 * hourFactor, 6));
    series.Waste.push(randomAround(12 * hourFactor, 3));
  }
}
seedSeries();

function makeLabels(period) {
  if (period === "day") return series.Energy.map((_, i) => `${String(i).padStart(2, "0")}:00`);
  if (period === "week") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];
}

function aggregatePeriod(period, dataset) {
  if (period === "day") return dataset.reduce((a, b) => a + b, 0);
  if (period === "week") return Math.round(dataset.reduce((a, b) => a + b, 0) * 0.9);
  return Math.round(dataset.reduce((a, b) => a + b, 0) * 3.4);
}

function periodSamples(period) {
  return period === "day" ? series.Energy.length : 7;
}

let chart;
function buildChart() {
  const ctx = document.getElementById("mainChart").getContext("2d");
  const colors = {
    Energy: { line: "#fbbf24", fill: "rgba(251,191,36,0.18)" },
    Water: { line: "#38bdf8", fill: "rgba(56,189,248,0.18)" },
    Waste: { line: "#f87171", fill: "rgba(248,113,113,0.18)" },
  };
  const c = colors[currentTab];
  const n = periodSamples(currentPeriod);
  const dataArr = series[currentTab].slice(0, n);
  const labels = makeLabels(currentPeriod);

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: currentTab,
        data: dataArr,
        borderColor: c.line,
        backgroundColor: c.fill,
        fill: true,
        tension: 0.42,
        pointRadius: n > 10 ? 3 : 5,
        pointBackgroundColor: c.line,
        borderWidth: 2.5,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0d1f17",
          borderColor: c.line,
          borderWidth: 1,
          titleColor: "#e8f5ee",
        },
      },
      scales: {
        x: { ticks: { color: "#9fc7b2", maxTicksLimit: n > 10 ? 8 : 7 }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: {
          ticks: { color: "#9fc7b2" },
          grid: { color: "rgba(255,255,255,0.05)" },
          beginAtZero: true,
        },
      },
    },
  });
}

function updateInsight() {
  const list = reasons[currentTab][currentPeriod];
  const pick = list[Math.floor(Math.random() * list.length)];
  const total = aggregatePeriod(currentPeriod, series[currentTab]);
  const unit = currentTab === "Energy" ? "kWh" : currentTab === "Water" ? "kL" : "kg";
  document.getElementById("insightBar").innerHTML =
    `📈 <b>${currentTab}</b> (this ${currentPeriod}): <b>${total.toLocaleString()} ${unit}</b> &nbsp;·&nbsp; ${pick}`;
}

function updateKpis() {
  const energy = aggregatePeriod("day", series.Energy);
  const water = aggregatePeriod("day", series.Water);
  const waste = aggregatePeriod("day", series.Waste);
  const score = Math.min(100, Math.round(45 + energy * 0.02 + water * 0.2 + waste * 0.5));

  document.getElementById("kpiEnergy").innerHTML = `${energy.toLocaleString()} <small>kWh</small>`;
  document.getElementById("kpiWater").innerHTML = `${water} <small>kL</small>`;
  document.getElementById("kpiWaste").innerHTML = `${waste.toLocaleString()} <small>kg</small>`;
  document.getElementById("kpiScore").innerHTML = `${score} <small>/100</small>`;

  const subs = {
    kpiEnergySub: score > 80 ? "⚡ Green future cut 18% vs last week" : "Energy use in normal range",
    kpiWaterSub: "💧 12% under monthly budget",
    kpiWasteSub: "♻️ 74% recycled this month",
    kpiScoreSub: score >= 75 ? "Excellent — keep it up 👍" : "Improving — every action counts",
  };
  for (const [id, txt] of Object.entries(subs)) document.getElementById(id).textContent = txt;
}

function updateGoals() {
  const energy = aggregatePeriod("month", series.Energy);
  const water = aggregatePeriod("month", series.Water);
  const waste = aggregatePeriod("month", series.Waste);

  const goalEnergy = Math.min(100, Math.round((650 - energy * 0.3) / 4.5));
  const goalWater = Math.min(100, Math.round(30 + (360 - water) * 0.25));
  const goalWaste = Math.min(100, Math.round(74 + (waste < 340 ? 12 : 0)));
  const goalScore = Math.round((goalEnergy + goalWater + goalWaste) / 3);

  setBar("goalEnergy", "goalEnergyPct", goalEnergy);
  setBar("goalWater", "goalWaterPct", goalWater);
  setBar("goalWaste", "goalWastePct", goalWaste);
  setBar("goalScore", "goalScorePct", goalScore);
}

function setBar(barId, pctId, pct) {
  document.getElementById(barId).style.width = pct + "%";
  document.getElementById(pctId).textContent = pct + "%";
}

function addActivity() {
  const item = activityPool[Math.floor(Math.random() * activityPool.length)];
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const li = document.createElement("li");
  li.innerHTML = `<span class="act-ico">${item.icon}</span><div class="act-text">${item.text}<span class="act-time">🕒 ${time}</span></div>`;
  const list = document.getElementById("activityList");
  list.prepend(li);
  while (list.children.length > 8) list.lastChild.remove();
}

function updateBuildings() {
  const grid = document.getElementById("buildingGrid");
  grid.innerHTML = "";
  buildings.forEach((b) => {
    b.energy = randomAround(380, 120);
    b.water = randomAround(30, 10);
    b.waste = randomAround(10, 4);
    const r = Math.random();
    b.status = r > 0.85 ? "crit" : r > 0.65 ? "warn" : "ok";
    const badge = { ok: ["OK", "badge ok"], warn: ["WATCH", "badge warn"], crit: ["ALERT", "badge crit"] }[b.status];

    const el = document.createElement("div");
    el.className = "building";
    el.innerHTML = `
      <h4>${b.name} <span class="${badge[1]}">${badge[0]}</span></h4>
      <div class="b-row"><span>⚡</span><b>${b.energy.toLocaleString()} kWh</b></div>
      <div class="b-row"><span>💧</span><b>${b.water} kL</b></div>
      <div class="b-row"><span>♻️</span><b>${b.waste} kg</b></div>`;
    grid.appendChild(el);
  });
}

function tick() {
  series.Energy.push(randomAround(420, 60));
  series.Water.push(randomAround(34, 6));
  series.Waste.push(randomAround(12, 3));
  for (const k of ["Energy", "Water", "Waste"]) if (series[k].length > 24) series[k].shift();

  updateKpis();
  updateGoals();
  updateInsight();
  buildChart();
  updateBuildings();
  if (Math.random() < 0.5) addActivity();
}

function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  document.getElementById("date").textContent =
    now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentTab = btn.dataset.tab;
    buildChart();
    updateInsight();
  });
});

document.querySelectorAll(".period-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".period-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentPeriod = btn.dataset.period;
    buildChart();
    updateInsight();
  });
});

updateClock();
updateKpis();
updateGoals();
buildChart();
updateInsight();
updateBuildings();
for (let i = 0; i < 4; i++) addActivity();

setInterval(updateClock, 1000);
setInterval(tick, 3000);