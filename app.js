/* ==========================================================================
   Green LLM Bench — Rendering, Charts & Interactivity
   Requires data.js (BENCHMARK_DATA, CARBON_PRESETS) to be loaded first.
   Uses Chart.js for visualizations, vanilla JS for everything else.
   ========================================================================== */

// ─── Read Chart Colors from CSS Custom Properties ─────────────────────────────
function getCSSColor(prop) {
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
}

function getChartColors() {
  return {
    quantNoneBg: getCSSColor("--chart-quant-none-bg"),
    quantNoneBorder: getCSSColor("--chart-quant-none-border"),
    quantGptq4Bg: getCSSColor("--chart-quant-gptq4-bg"),
    quantGptq4Border: getCSSColor("--chart-quant-gptq4-border"),
    quantGptq8Bg: getCSSColor("--chart-quant-gptq8-bg"),
    quantGptq8Border: getCSSColor("--chart-quant-gptq8-border"),
    quantAwq4Bg: getCSSColor("--chart-quant-awq4-bg"),
    quantAwq4Border: getCSSColor("--chart-quant-awq4-border"),
    quantAwq8Bg: getCSSColor("--chart-quant-awq8-bg"),
    quantAwq8Border: getCSSColor("--chart-quant-awq8-border"),
    paretoLine: getCSSColor("--chart-pareto-line"),
    paretoLineAccent: getCSSColor("--chart-pareto-line-accent"),
    tooltipBg: getCSSColor("--chart-tooltip-bg"),
    tooltipText: getCSSColor("--chart-tooltip-text"),
    operational: getCSSColor("--chart-operational"),
    embodied: getCSSColor("--chart-embodied"),
    barPrimary: getCSSColor("--chart-bar-primary"),
    barSecondary: getCSSColor("--chart-bar-secondary"),
    barTertiary: getCSSColor("--chart-bar-tertiary"),
    barMuted: getCSSColor("--chart-bar-muted"),
  };
}

// Quantization color map — reads from CSS tokens
function getQuantColors() {
  const c = getChartColors();
  return {
    "none":      { bg: c.quantNoneBg, border: c.quantNoneBorder },
    "gptq-4bit": { bg: c.quantGptq4Bg, border: c.quantGptq4Border },
    "gptq-8bit": { bg: c.quantGptq8Bg, border: c.quantGptq8Border },
    "awq-4bit":  { bg: c.quantAwq4Bg, border: c.quantAwq4Border },
    "awq-8bit":  { bg: c.quantAwq8Bg, border: c.quantAwq8Border }
  };
}

// ─── Animation Helpers ───────────────────────────────────────────────────────
function animateCountUp(el, target, duration = 600, suffix = "") {
  const start = 0;
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;
    el.textContent = (Number.isInteger(target) ? Math.round(current) : current.toFixed(target < 10 ? 2 : 1)) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function staggerRows(container, selector, delayStep = 30) {
  const rows = container.querySelectorAll(selector);
  rows.forEach((row, i) => {
    row.classList.add("kz-table-row--stagger");
    row.style.animationDelay = `${i * delayStep}ms`;
  });
}

function flashElement(el) {
  el.classList.remove("kz-result-flash");
  void el.offsetWidth; // force reflow
  el.classList.add("kz-result-flash");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shortModel(name) {
  return name.split("/").pop();
}

function fmtNum(v, digits = 2) {
  if (v === null || v === undefined) return "--";
  if (Math.abs(v) < 0.001 && v !== 0) return v.toExponential(digits);
  return v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

function completedData() {
  return BENCHMARK_DATA.filter(d => d.status === "completed");
}

// Quantization → tag CSS class (color-coded by type)
function quantTagClass(quant) {
  const map = {
    "none": "kz-tag--quant-none",
    "gptq-4bit": "kz-tag--quant-gptq4",
    "gptq-8bit": "kz-tag--quant-gptq8",
    "awq-4bit": "kz-tag--quant-awq4",
    "awq-8bit": "kz-tag--quant-awq8"
  };
  return map[quant] || "kz-tag--informative";
}

function quantLabel(quant) {
  return quant === "none" ? "FP16" : quant.toUpperCase();
}

// Semantic color class based on SCI score (lower = better)
function sciScoreClass(sci) {
  const ug = sci * 1e6;
  if (ug <= 60) return "kz-score--good";
  if (ug <= 200) return "kz-score--ok";
  return "kz-score--bad";
}

// Semantic color class for energy/joules (lower = better)
function energyScoreClass(j) {
  if (j <= 0.3) return "kz-score--good";
  if (j <= 1.0) return "kz-score--ok";
  return "kz-score--bad";
}

// Semantic color class for temperature
function tempScoreClass(temp) {
  if (temp <= 55) return "kz-score--good";
  if (temp <= 70) return "kz-score--ok";
  return "kz-score--bad";
}

// ─── Navigation ───────────────────────────────────────────────────────────────
const pages = {
  dashboard: document.getElementById("page-dashboard"),
  leaderboards: document.getElementById("page-leaderboards"),
  calculator: document.getElementById("page-calculator"),
  methodology: document.getElementById("page-methodology")
};

// Track which pages have been initialized (lazy chart init)
const pageInitialized = { dashboard: false, leaderboards: false, calculator: false, methodology: true };

function navigate(page) {
  Object.values(pages).forEach(p => p.classList.remove("is-active"));
  if (pages[page]) pages[page].classList.add("is-active");

  document.querySelectorAll(".kz-nav__link").forEach(link => {
    const isActive = link.dataset.nav === page;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  // Lazy initialize page content
  if (!pageInitialized[page]) {
    pageInitialized[page] = true;
    if (page === "calculator") initCalculator();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-nav]").forEach(el => {
  el.addEventListener("click", e => {
    e.preventDefault();
    navigate(el.dataset.nav);
    document.getElementById("nav-links").classList.remove("is-open");
    document.getElementById("nav-toggle").setAttribute("aria-expanded", "false");
  });
});

const navToggle = document.getElementById("nav-toggle");
navToggle.addEventListener("click", () => {
  const links = document.getElementById("nav-links");
  const isOpen = links.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function renderStatsBar() {
  const data = completedData();
  const bestSCI = Math.min(...data.map(d => d.metrics.sci_per_token));
  const bestEfficiency = Math.max(...data.map(d => d.metrics.gpu_efficiency));

  const stats = [
    { label: "Experiments Run", value: data.length, unit: "", numericTarget: data.length, suffix: "", semantic: "count" },
    { label: "Best SCI Score", value: (bestSCI * 1e6).toFixed(1), unit: "\u00B5gCO2/tok", numericTarget: bestSCI * 1e6, suffix: "", semantic: "sci" },
    { label: "Best Efficiency", value: bestEfficiency.toFixed(2), unit: "tok/J", numericTarget: bestEfficiency, suffix: "", semantic: "efficiency" },
    { label: "Grid Region", value: "CT", unit: "ISO-NE", semantic: "region" }
  ];

  const bar = document.getElementById("stats-bar");
  bar.innerHTML = stats.map(s => `
    <div class="kz-stat-tile${s.semantic ? " kz-stat-tile--" + s.semantic : ""}">
      <div class="kz-stat-tile__label">${s.label}</div>
      <div>
        <span class="kz-stat-tile__value" data-target="${s.numericTarget !== undefined ? s.numericTarget : ""}" data-suffix="${s.suffix || ""}">${s.value}</span>
        <span class="kz-stat-tile__unit">${s.unit}</span>
      </div>
    </div>
  `).join("");

  // Animate numeric values
  bar.querySelectorAll(".kz-stat-tile__value[data-target]").forEach(el => {
    const target = parseFloat(el.dataset.target);
    if (!isNaN(target) && target > 0) {
      animateCountUp(el, target, 800, el.dataset.suffix);
    }
  });
}

// ─── Pareto Chart ─────────────────────────────────────────────────────────────
let paretoChart = null;

function renderParetoChart() {
  const data = completedData();
  const ctx = document.getElementById("pareto-chart").getContext("2d");
  const quantColors = getQuantColors();
  const cc = getChartColors();

  const quants = [...new Set(data.map(d => d.config.quantization))];
  const datasets = quants.map(q => {
    const points = data.filter(d => d.config.quantization === q);
    const colors = quantColors[q] || { bg: getCSSColor("--color-gray-500"), border: getCSSColor("--color-gray-600") };
    return {
      label: q === "none" ? "No Quantization" : q.toUpperCase(),
      data: points.map(p => ({
        x: p.metrics.val_bpb,
        y: p.metrics.sci_per_token * 1e6,
        r: Math.max(4, Math.min(20, p.metrics.tokens_per_sec / 10)),
        _raw: p
      })),
      backgroundColor: colors.bg + "BB",
      borderColor: colors.border,
      borderWidth: 1.5,
      hoverBorderWidth: 3
    };
  });

  // Pareto frontier line
  const paretoPoints = data
    .filter(d => d.pareto_rank === 0)
    .sort((a, b) => a.metrics.val_bpb - b.metrics.val_bpb);

  if (paretoPoints.length > 1) {
    datasets.push({
      label: "Pareto Frontier",
      type: "line",
      data: paretoPoints.map(p => ({ x: p.metrics.val_bpb, y: p.metrics.sci_per_token * 1e6 })),
      borderColor: cc.paretoLine,
      borderWidth: 2.5,
      borderDash: [6, 3],
      pointRadius: 0,
      fill: false,
      tension: 0.3,
      order: -1
    });
  }

  if (paretoChart) paretoChart.destroy();

  paretoChart = new Chart(ctx, {
    type: "bubble",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const raw = ctx.raw._raw;
              if (!raw) return ctx.dataset.label;
              const c = raw.config;
              const m = raw.metrics;
              return [
                `${shortModel(c.model_name)} | ${c.quantization === "none" ? "FP16" : c.quantization}`,
                `Batch: ${c.batch_size} | ${m.tokens_per_sec.toFixed(0)} tok/s`,
                `SCI: ${(m.sci_per_token * 1e6).toFixed(1)} \u00B5gCO2/tok`,
                `BPB: ${m.val_bpb.toFixed(3)} | Power: ${m.gpu_power_avg_w}W`
              ];
            }
          },
          backgroundColor: cc.tooltipBg,
          titleColor: cc.tooltipText,
          bodyColor: cc.tooltipText,
          padding: 12,
          cornerRadius: 7
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Validation BPB (lower = better quality)", font: { weight: 600 } },
          grid: { color: "rgba(0,0,0,0.05)" }
        },
        y: {
          title: { display: true, text: "SCI (\u00B5gCO2 / token) \u2014 lower = greener", font: { weight: 600 } },
          grid: { color: "rgba(0,0,0,0.05)" }
        }
      },
      onClick: (evt, elements) => {
        if (elements.length > 0) {
          const el = elements[0];
          const raw = paretoChart.data.datasets[el.datasetIndex].data[el.index]._raw;
          if (raw) openDetailModal(raw);
        }
      }
    }
  });

  // Legend
  const legendEl = document.getElementById("pareto-legend");
  legendEl.innerHTML = quants.map(q => {
    const c = quantColors[q] || { bg: getCSSColor("--color-gray-500") };
    const label = q === "none" ? "No Quantization" : q.toUpperCase();
    return `<span class="kz-legend__item"><span class="kz-legend__dot" style="background:${c.bg}"></span>${label}</span>`;
  }).join("") + `<span class="kz-legend__item"><span class="kz-legend__dot" style="background:${cc.paretoLine};border:2px dashed ${cc.paretoLineAccent};"></span>Pareto Frontier</span>`;
}

// ─── Preview Table (Top 5 Greenest) — uses event delegation ──────────────────
function renderPreviewTable() {
  const data = completedData()
    .sort((a, b) => a.metrics.sci_per_token - b.metrics.sci_per_token)
    .slice(0, 5);

  document.getElementById("preview-table-body").innerHTML = data.map((d, i) => {
    const c = d.config;
    const m = d.metrics;
    const isPareto = d.pareto_rank === 0;
    return `
      <tr class="kz-table-row kz-table-row--clickable ${isPareto ? "kz-table-row--pareto" : ""}" data-hash="${d.config_hash}" tabindex="0" role="row">
        <td class="kz-table-cell kz-table-cell--rank">${i + 1}</td>
        <td class="kz-table-cell"><strong>${shortModel(c.model_name)}</strong></td>
        <td class="kz-table-cell"><span class="kz-tag kz-tag--sm ${quantTagClass(c.quantization)}">${quantLabel(c.quantization)}</span></td>
        <td class="kz-table-cell kz-table-cell--right">${c.batch_size}</td>
        <td class="kz-table-cell kz-table-cell--right kz-table-cell--mono ${sciScoreClass(m.sci_per_token)}">${(m.sci_per_token * 1e6).toFixed(2)}\u00B5g</td>
        <td class="kz-table-cell kz-table-cell--right kz-table-cell--mono">${m.val_bpb.toFixed(3)}</td>
        <td class="kz-table-cell kz-table-cell--right kz-table-cell--mono">${m.tokens_per_sec.toFixed(0)}</td>
        <td class="kz-table-cell kz-table-cell--center">${isPareto ? '<span class="kz-badge kz-badge--pareto">Pareto</span>' : ""}</td>
      </tr>`;
  }).join("");

  staggerRows(document.getElementById("preview-table-body"), ".kz-table-row");
}

// Event delegation for preview table
document.getElementById("preview-table-body").addEventListener("click", e => {
  const row = e.target.closest(".kz-table-row--clickable");
  if (row) {
    const exp = BENCHMARK_DATA.find(d => d.config_hash === row.dataset.hash);
    if (exp) openDetailModal(exp);
  }
});
document.getElementById("preview-table-body").addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") {
    const row = e.target.closest(".kz-table-row--clickable");
    if (row) {
      e.preventDefault();
      const exp = BENCHMARK_DATA.find(d => d.config_hash === row.dataset.hash);
      if (exp) openDetailModal(exp);
    }
  }
});

// ─── Leaderboards ─────────────────────────────────────────────────────────────
const LEADERBOARD_DEFS = {
  greenest: {
    title: "Greenest \u2014 SCI Score",
    sortKey: "sci_per_token",
    sortDir: "asc",
    columns: [
      { key: "rank", label: "#", align: "center" },
      { key: "model", label: "Model" },
      { key: "quant", label: "Quant" },
      { key: "batch", label: "Batch", align: "right" },
      { key: "sci_per_token", label: "SCI (\u00B5gCO2/tok)", align: "right", fmt: v => (v * 1e6).toFixed(2), colorFn: v => sciScoreClass(v) },
      { key: "carbon_operational_g", label: "Operational (g)", align: "right", fmt: v => v.toExponential(2) },
      { key: "carbon_embodied_g", label: "Embodied (g)", align: "right", fmt: v => v.toExponential(2) },
      { key: "val_bpb", label: "BPB", align: "right", fmt: v => v.toFixed(3) },
      { key: "tokens_per_sec", label: "tok/s", align: "right", fmt: v => v.toFixed(0) },
      { key: "pareto", label: "Pareto", align: "center" }
    ]
  },
  efficient: {
    title: "Most Energy Efficient \u2014 J/Token",
    sortKey: "energy_per_token_j",
    sortDir: "asc",
    columns: [
      { key: "rank", label: "#", align: "center" },
      { key: "model", label: "Model" },
      { key: "quant", label: "Quant" },
      { key: "batch", label: "Batch", align: "right" },
      { key: "energy_per_token_j", label: "J/token", align: "right", fmt: v => v.toFixed(3), colorFn: v => energyScoreClass(v) },
      { key: "energy_kwh_per_token", label: "kWh/token", align: "right", fmt: v => v.toExponential(2) },
      { key: "gpu_power_avg_w", label: "Watts avg", align: "right", fmt: v => v.toFixed(1) },
      { key: "gpu_util_avg_pct", label: "GPU Util%", align: "right", fmt: v => v.toFixed(1) + "%" },
      { key: "tokens_per_sec", label: "tok/s", align: "right", fmt: v => v.toFixed(0) },
      { key: "pareto", label: "Pareto", align: "center" }
    ]
  },
  perfwatt: {
    title: "Best Performance per Watt \u2014 tok/J",
    sortKey: "gpu_efficiency",
    sortDir: "desc",
    columns: [
      { key: "rank", label: "#", align: "center" },
      { key: "model", label: "Model" },
      { key: "quant", label: "Quant" },
      { key: "batch", label: "Batch", align: "right" },
      { key: "gpu_efficiency", label: "tok/J", align: "right", fmt: v => v.toFixed(3), colorFn: v => v > 5 ? "kz-score--good" : v > 1 ? "kz-score--ok" : "kz-score--bad" },
      { key: "tokens_per_sec", label: "tok/s", align: "right", fmt: v => v.toFixed(0) },
      { key: "gpu_power_avg_w", label: "Watts", align: "right", fmt: v => v.toFixed(1) },
      { key: "gpu_util_avg_pct", label: "GPU Util%", align: "right", fmt: v => v.toFixed(1) + "%" },
      { key: "val_bpb", label: "BPB", align: "right", fmt: v => v.toFixed(3) },
      { key: "pareto", label: "Pareto", align: "center" }
    ]
  },
  quality: {
    title: "Best Quality \u2014 Validation BPB",
    sortKey: "val_bpb",
    sortDir: "asc",
    columns: [
      { key: "rank", label: "#", align: "center" },
      { key: "model", label: "Model" },
      { key: "quant", label: "Quant" },
      { key: "batch", label: "Batch", align: "right" },
      { key: "val_bpb", label: "BPB", align: "right", fmt: v => v.toFixed(3), colorFn: v => v <= 1.5 ? "kz-score--good" : v <= 2.0 ? "kz-score--ok" : "kz-score--bad" },
      { key: "sci_per_token", label: "SCI (\u00B5g)", align: "right", fmt: v => (v * 1e6).toFixed(2) },
      { key: "energy_per_token_j", label: "J/token", align: "right", fmt: v => v.toFixed(3) },
      { key: "tokens_per_sec", label: "tok/s", align: "right", fmt: v => v.toFixed(0) },
      { key: "mem_used_gb", label: "Mem GB", align: "right", fmt: v => v.toFixed(1) },
      { key: "pareto", label: "Pareto", align: "center" }
    ]
  },
  fastest: {
    title: "Fastest \u2014 Throughput",
    sortKey: "tokens_per_sec",
    sortDir: "desc",
    columns: [
      { key: "rank", label: "#", align: "center" },
      { key: "model", label: "Model" },
      { key: "quant", label: "Quant" },
      { key: "batch", label: "Batch", align: "right" },
      { key: "tokens_per_sec", label: "tok/s", align: "right", fmt: v => v.toFixed(0), colorFn: v => v > 100 ? "kz-score--good" : v > 30 ? "kz-score--ok" : "kz-score--bad" },
      { key: "latency_p50_ms", label: "P50 (ms)", align: "right", fmt: v => v.toFixed(1) },
      { key: "gpu_power_avg_w", label: "Watts", align: "right", fmt: v => v.toFixed(1) },
      { key: "energy_per_token_j", label: "J/token", align: "right", fmt: v => v.toFixed(3) },
      { key: "val_bpb", label: "BPB", align: "right", fmt: v => v.toFixed(3) },
      { key: "pareto", label: "Pareto", align: "center" }
    ]
  },
  cheapest: {
    title: "Cheapest \u2014 Cost per Token",
    sortKey: "cost_per_token_usd",
    sortDir: "asc",
    columns: [
      { key: "rank", label: "#", align: "center" },
      { key: "model", label: "Model" },
      { key: "quant", label: "Quant" },
      { key: "batch", label: "Batch", align: "right" },
      { key: "cost_per_token_usd", label: "$/1M tokens", align: "right", fmt: v => "$" + (v * 1e6).toFixed(4), colorFn: v => v * 1e6 < 0.005 ? "kz-score--good" : v * 1e6 < 0.05 ? "kz-score--ok" : "kz-score--bad" },
      { key: "cost_per_token_usd_raw", label: "$/token", align: "right", fmt: v => v.toExponential(2) },
      { key: "energy_kwh_per_token", label: "kWh/token", align: "right", fmt: v => v.toExponential(2) },
      { key: "sci_per_token", label: "SCI (\u00B5g)", align: "right", fmt: v => (v * 1e6).toFixed(2) },
      { key: "val_bpb", label: "BPB", align: "right", fmt: v => v.toFixed(3) },
      { key: "pareto", label: "Pareto", align: "center" }
    ]
  }
};

let currentBoard = "greenest";
let currentSort = { key: "sci_per_token", dir: "asc" };

function getFilteredData() {
  let data = completedData();
  const modelFilter = document.getElementById("filter-model").value;
  const quantFilter = document.getElementById("filter-quant").value;
  const batchFilter = document.getElementById("filter-batch").value;

  if (modelFilter !== "all") data = data.filter(d => shortModel(d.config.model_name) === modelFilter);
  if (quantFilter !== "all") data = data.filter(d => d.config.quantization === quantFilter);
  if (batchFilter !== "all") data = data.filter(d => String(d.config.batch_size) === batchFilter);

  return data;
}

function getCellValue(d, key) {
  if (key === "rank") return 0;
  if (key === "model") return shortModel(d.config.model_name);
  if (key === "quant") return d.config.quantization;
  if (key === "batch") return d.config.batch_size;
  if (key === "pareto") return d.pareto_rank === 0 ? 0 : 1;
  if (key === "cost_per_token_usd_raw") return d.metrics.cost_per_token_usd;
  return d.metrics[key] !== undefined ? d.metrics[key] : 0;
}

function renderLeaderboard() {
  const def = LEADERBOARD_DEFS[currentBoard];
  if (!def) return;

  let data = getFilteredData();
  const sortMul = currentSort.dir === "asc" ? 1 : -1;
  data.sort((a, b) => {
    const av = getCellValue(a, currentSort.key);
    const bv = getCellValue(b, currentSort.key);
    if (typeof av === "string") return sortMul * av.localeCompare(bv);
    return sortMul * (av - bv);
  });

  // Header with scope attributes
  document.getElementById("leaderboard-thead").innerHTML = `
    <tr class="kz-table-header">
      ${def.columns.map(col => {
        const isSorted = currentSort.key === col.key;
        const sortClass = isSorted ? (currentSort.dir === "asc" ? "kz-table-header-cell--sorted-asc" : "kz-table-header-cell--sorted-desc") : "";
        const alignClass = col.align === "right" ? "kz-table-header-cell--right" : col.align === "center" ? "kz-table-header-cell--center" : "";
        const sortable = col.key !== "rank" && col.key !== "pareto" ? "kz-table-header-cell--sortable" : "";
        const ariaSort = isSorted ? ` aria-sort="${currentSort.dir === "asc" ? "ascending" : "descending"}"` : "";
        return `<th class="kz-table-header-cell ${alignClass} ${sortable} ${sortClass}" scope="col" data-sort="${col.key}"${sortable ? ' tabindex="0"' : ""}${ariaSort}>${col.label}</th>`;
      }).join("")}
    </tr>`;

  // Body with keyboard accessible rows
  document.getElementById("leaderboard-tbody").innerHTML = data.map((d, i) => {
    const isPareto = d.pareto_rank === 0;
    return `<tr class="kz-table-row kz-table-row--clickable ${isPareto ? "kz-table-row--pareto" : ""}" data-hash="${d.config_hash}" tabindex="0" role="row">
      ${def.columns.map(col => {
        const alignClass = col.align === "right" ? "kz-table-cell--right" : col.align === "center" ? "kz-table-cell--center" : "";
        let val;
        if (col.key === "rank") val = i + 1;
        else if (col.key === "model") val = `<strong>${shortModel(d.config.model_name)}</strong>`;
        else if (col.key === "quant") val = `<span class="kz-tag kz-tag--sm ${quantTagClass(d.config.quantization)}">${quantLabel(d.config.quantization)}</span>`;
        else if (col.key === "batch") val = d.config.batch_size;
        else if (col.key === "pareto") val = isPareto ? '<span class="kz-badge kz-badge--pareto">Pareto</span>' : "";
        else if (col.key === "cost_per_token_usd_raw") val = `<span class="kz-table-cell--mono">${col.fmt(d.metrics.cost_per_token_usd)}</span>`;
        else {
          const raw = d.metrics[col.key];
          const colorClass = col.colorFn ? " " + col.colorFn(raw) : "";
          val = `<span class="kz-table-cell--mono${colorClass}">${col.fmt ? col.fmt(raw) : fmtNum(raw)}</span>`;
        }
        const rankClass = col.key === "rank" ? "kz-table-cell--rank" : "";
        return `<td class="kz-table-cell ${alignClass} ${rankClass}">${val}</td>`;
      }).join("")}
    </tr>`;
  }).join("");

  staggerRows(document.getElementById("leaderboard-tbody"), ".kz-table-row");

  // Update tabpanel's aria-labelledby
  document.getElementById("leaderboard-panel").setAttribute("aria-labelledby", `tab-${currentBoard}`);
}

// Event delegation for leaderboard table (sort headers + row clicks)
document.getElementById("leaderboard-thead").addEventListener("click", e => {
  const th = e.target.closest(".kz-table-header-cell--sortable");
  if (!th) return;
  handleSort(th.dataset.sort);
});
document.getElementById("leaderboard-thead").addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") {
    const th = e.target.closest(".kz-table-header-cell--sortable");
    if (th) { e.preventDefault(); handleSort(th.dataset.sort); }
  }
});
document.getElementById("leaderboard-tbody").addEventListener("click", e => {
  const row = e.target.closest(".kz-table-row--clickable");
  if (row) {
    const exp = BENCHMARK_DATA.find(d => d.config_hash === row.dataset.hash);
    if (exp) openDetailModal(exp);
  }
});
document.getElementById("leaderboard-tbody").addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") {
    const row = e.target.closest(".kz-table-row--clickable");
    if (row) {
      e.preventDefault();
      const exp = BENCHMARK_DATA.find(d => d.config_hash === row.dataset.hash);
      if (exp) openDetailModal(exp);
    }
  }
});

function handleSort(key) {
  if (currentSort.key === key) {
    currentSort.dir = currentSort.dir === "asc" ? "desc" : "asc";
  } else {
    currentSort.key = key;
    const def = LEADERBOARD_DEFS[currentBoard];
    currentSort.dir = key === def.sortKey ? def.sortDir : "asc";
  }
  renderLeaderboard();
}

// Tab switching with ARIA + arrow key navigation
const tabContainer = document.getElementById("leaderboard-tabs");
tabContainer.addEventListener("click", e => {
  const tab = e.target.closest(".kz-tab");
  if (!tab) return;
  activateTab(tab);
});
tabContainer.addEventListener("keydown", e => {
  const tabs = [...tabContainer.querySelectorAll(".kz-tab")];
  const current = tabs.indexOf(e.target);
  if (current === -1) return;

  let next;
  if (e.key === "ArrowRight") next = (current + 1) % tabs.length;
  else if (e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = tabs.length - 1;
  else return;

  e.preventDefault();
  tabs[next].focus();
  activateTab(tabs[next]);
});

function activateTab(tab) {
  tabContainer.querySelectorAll(".kz-tab").forEach(t => {
    t.classList.remove("is-selected");
    t.setAttribute("aria-selected", "false");
    t.setAttribute("tabindex", "-1");
  });
  tab.classList.add("is-selected");
  tab.setAttribute("aria-selected", "true");
  tab.setAttribute("tabindex", "0");
  currentBoard = tab.dataset.board;
  const def = LEADERBOARD_DEFS[currentBoard];
  currentSort = { key: def.sortKey, dir: def.sortDir };
  renderLeaderboard();
}

// Filters
function populateFilters() {
  const data = completedData();
  const models = [...new Set(data.map(d => shortModel(d.config.model_name)))].sort();
  const quants = [...new Set(data.map(d => d.config.quantization))].sort();
  const batches = [...new Set(data.map(d => d.config.batch_size))].sort((a, b) => a - b);

  const modelSelect = document.getElementById("filter-model");
  models.forEach(m => { const o = document.createElement("option"); o.value = m; o.textContent = m; modelSelect.appendChild(o); });

  const quantSelect = document.getElementById("filter-quant");
  quants.forEach(q => { const o = document.createElement("option"); o.value = q; o.textContent = q === "none" ? "No Quantization" : q.toUpperCase(); quantSelect.appendChild(o); });

  const batchSelect = document.getElementById("filter-batch");
  batches.forEach(b => { const o = document.createElement("option"); o.value = b; o.textContent = b; batchSelect.appendChild(o); });
}

document.getElementById("filter-model").addEventListener("change", renderLeaderboard);
document.getElementById("filter-quant").addEventListener("change", renderLeaderboard);
document.getElementById("filter-batch").addEventListener("change", renderLeaderboard);

// ─── Experiment Detail Modal with Focus Trap ──────────────────────────────────
let modalPieChart = null;
let modalLatencyChart = null;
let previouslyFocused = null;

function openDetailModal(exp) {
  const overlay = document.getElementById("detail-modal");
  const modal = overlay.querySelector(".kz-modal");
  const c = exp.config;
  const m = exp.metrics;
  const cc = getChartColors();

  previouslyFocused = document.activeElement;

  // Title
  document.getElementById("modal-title").textContent = shortModel(c.model_name) + " \u2014 Detail";

  // Config tags
  document.getElementById("modal-config-tags").innerHTML = [
    `<span class="kz-tag ${quantTagClass(c.quantization)}">${quantLabel(c.quantization)}</span>`,
    `<span class="kz-tag">Batch ${c.batch_size}</span>`,
    `<span class="kz-tag">Seq ${c.sequence_length}</span>`,
    `<span class="kz-tag">${c.dtype}</span>`,
    c.use_kv_cache ? `<span class="kz-tag kz-tag--positive">KV Cache</span>` : "",
    exp.pareto_rank === 0 ? `<span class="kz-badge kz-badge--pareto">Pareto Optimal</span>` : "",
    `<span class="kz-tag kz-tag--draft">${exp.strategy_used}</span>`
  ].filter(Boolean).join(" ");

  // Metrics grid
  const metrics = [
    { label: "SCI Score", value: (m.sci_per_token * 1e6).toFixed(2) + " \u00B5gCO2/tok", color: "green" },
    { label: "Energy/Token", value: m.energy_per_token_j.toFixed(3) + " J", color: "green" },
    { label: "kWh/Token", value: m.energy_kwh_per_token.toExponential(2), color: "" },
    { label: "Throughput", value: m.tokens_per_sec.toFixed(0) + " tok/s", color: "blue" },
    { label: "GPU Efficiency", value: m.gpu_efficiency.toFixed(3) + " tok/J", color: "blue" },
    { label: "Cost/Token", value: "$" + (m.cost_per_token_usd * 1e6).toFixed(4) + "/1M", color: "" },
    { label: "Avg Power", value: m.gpu_power_avg_w.toFixed(1) + " W", color: "" },
    { label: "Max Power", value: m.gpu_power_max_w.toFixed(1) + " W", color: m.gpu_power_max_w > 80 ? "yellow" : "" },
    { label: "GPU Utilization", value: m.gpu_util_avg_pct.toFixed(1) + "%", color: "" },
    { label: "GPU Temp (avg)", value: m.gpu_temp_avg_c.toFixed(1) + " \u00B0C", color: m.gpu_temp_avg_c > 60 ? "yellow" : "" },
    { label: "GPU Temp (max)", value: m.gpu_temp_max_c.toFixed(1) + " \u00B0C", color: m.gpu_temp_max_c > 75 ? "red" : "" },
    { label: "Thermal Throttled", value: m.thermal_throttled ? "YES" : "No", color: m.thermal_throttled ? "red" : "green" },
    { label: "Memory Used", value: m.mem_used_gb.toFixed(1) + " GB", color: "" },
    { label: "Memory Pressure", value: m.mem_pressure_pct.toFixed(1) + "%", color: "" },
    { label: "Validation BPB", value: m.val_bpb.toFixed(4), color: "blue" },
    { label: "Total Tokens", value: m.total_tokens.toLocaleString(), color: "" }
  ];

  document.getElementById("modal-metrics").innerHTML = metrics.map(met =>
    `<div class="kz-metric-card${met.color ? " kz-metric-card--" + met.color : ""}">
      <div class="kz-metric-card__label">${met.label}</div>
      <div class="kz-metric-card__value">${met.value}</div>
    </div>`
  ).join("");

  // SCI breakdown details
  const opPct = (m.carbon_operational_g / (m.carbon_operational_g + m.carbon_embodied_g) * 100).toFixed(1);
  const emPct = (100 - parseFloat(opPct)).toFixed(1);
  document.getElementById("modal-sci-details").innerHTML = `
    <div class="kz-well kz-well--gray kz-mb-0">
      <div class="kz-heading-5 kz-mb-8">SCI = (E \u00D7 I) + M per token</div>
      <div class="kz-small kz-mb-16">
        <div class="kz-flex kz-flex--between kz-mb-8">
          <span>Operational Carbon</span>
          <span class="kz-text--bold kz-text--green">${opPct}%</span>
        </div>
        <div class="kz-score-bar"><div class="kz-score-bar__fill" style="width:${opPct}%"></div></div>
        <div class="kz-extra-small kz-text--muted kz-mt-8">${m.carbon_operational_g.toExponential(2)} g/token</div>
      </div>
      <div class="kz-small">
        <div class="kz-flex kz-flex--between kz-mb-8">
          <span>Embodied Carbon</span>
          <span class="kz-text--bold" style="color:var(--color-purple-500)">${emPct}%</span>
        </div>
        <div class="kz-score-bar"><div class="kz-score-bar__fill" style="width:${emPct}%;background:var(--color-purple-400)"></div></div>
        <div class="kz-extra-small kz-text--muted kz-mt-8">${m.carbon_embodied_g.toExponential(2)} g/token</div>
      </div>
    </div>`;

  // Pie chart
  const pieCtx = document.getElementById("modal-pie-chart").getContext("2d");
  if (modalPieChart) modalPieChart.destroy();
  modalPieChart = new Chart(pieCtx, {
    type: "doughnut",
    data: {
      labels: ["Operational", "Embodied"],
      datasets: [{
        data: [m.carbon_operational_g, m.carbon_embodied_g],
        backgroundColor: [cc.operational, cc.embodied],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom", labels: { padding: 16 } } },
      cutout: "60%"
    }
  });

  // Latency chart
  const latCtx = document.getElementById("modal-latency-chart").getContext("2d");
  if (modalLatencyChart) modalLatencyChart.destroy();
  modalLatencyChart = new Chart(latCtx, {
    type: "bar",
    data: {
      labels: ["P50", "P95", "P99"],
      datasets: [{
        label: "Latency (ms)",
        data: [m.latency_p50_ms, m.latency_p95_ms, m.latency_p99_ms],
        backgroundColor: [cc.barPrimary, cc.barSecondary, cc.barTertiary],
        borderRadius: 4,
        barPercentage: 0.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { title: { display: true, text: "ms" }, beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
        x: { grid: { display: false } }
      }
    }
  });

  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  // Focus close button
  document.getElementById("modal-close").focus();
}

function closeDetailModal() {
  const overlay = document.getElementById("detail-modal");
  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (previouslyFocused) {
    previouslyFocused.focus();
    previouslyFocused = null;
  }
}

// Focus trap inside modal
document.getElementById("detail-modal").addEventListener("keydown", e => {
  if (e.key === "Escape") { closeDetailModal(); return; }
  if (e.key !== "Tab") return;

  const modal = document.querySelector(".kz-modal");
  const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

document.getElementById("modal-close").addEventListener("click", closeDetailModal);
document.getElementById("detail-modal").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeDetailModal();
});

// ─── Carbon Calculator (lazy initialized) ─────────────────────────────────────
let regionChart = null;

function initCalculator() {
  const expSelect = document.getElementById("calc-experiment");
  completedData().forEach(d => {
    const o = document.createElement("option");
    o.value = d.config_hash;
    o.textContent = `${shortModel(d.config.model_name)} | ${d.config.quantization === "none" ? "FP16" : d.config.quantization} | batch=${d.config.batch_size}`;
    expSelect.appendChild(o);
  });

  const regSelect = document.getElementById("calc-region");
  Object.keys(CARBON_PRESETS).forEach(r => {
    const o = document.createElement("option");
    o.value = r;
    o.textContent = `${r} (${CARBON_PRESETS[r]} gCO2/kWh)`;
    regSelect.appendChild(o);
  });

  expSelect.addEventListener("change", updateCalculator);
  regSelect.addEventListener("change", updateCalculator);

  updateCalculator();
}

function updateCalculator() {
  const hash = document.getElementById("calc-experiment").value;
  const region = document.getElementById("calc-region").value;
  const exp = BENCHMARK_DATA.find(d => d.config_hash === hash);
  if (!exp) return;

  const cc = getChartColors();
  const intensity = CARBON_PRESETS[region] || 210;
  document.getElementById("calc-intensity-value").textContent = intensity;

  const m = exp.metrics;
  const operational = m.energy_kwh_per_token * intensity;
  const embodied = m.carbon_embodied_g;
  const sci = operational + embodied;

  const sciEl = document.getElementById("calc-sci-result");
  sciEl.textContent = (sci * 1e6).toFixed(2) + " \u00B5g";
  flashElement(sciEl);
  document.getElementById("calc-operational").textContent = (operational * 1e6).toFixed(2) + " \u00B5g";
  document.getElementById("calc-embodied").textContent = (embodied * 1e6).toFixed(2) + " \u00B5g";

  // Region comparison chart
  const regions = Object.keys(CARBON_PRESETS);
  const pairs = regions.map(r => ({
    region: r,
    sci: (m.energy_kwh_per_token * CARBON_PRESETS[r] + embodied) * 1e6,
    isSelected: r === region
  }));
  pairs.sort((a, b) => a.sci - b.sci);

  const ctx = document.getElementById("region-chart").getContext("2d");
  if (regionChart) regionChart.destroy();

  regionChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: pairs.map(p => p.region.split(" (")[0]),
      datasets: [{
        label: "SCI (\u00B5gCO2/token)",
        data: pairs.map(p => p.sci),
        backgroundColor: pairs.map(p => p.isSelected ? cc.barPrimary : cc.barMuted),
        borderRadius: 4,
        barPercentage: 0.7
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => `${ctx.parsed.x.toFixed(2)} \u00B5gCO2/token` }
        }
      },
      scales: {
        x: { title: { display: true, text: "SCI (\u00B5gCO2/token)" }, grid: { color: "rgba(0,0,0,0.05)" } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

// ─── Initialize ───────────────────────────────────────────────────────────────
function init() {
  renderStatsBar();
  renderParetoChart();
  renderPreviewTable();
  populateFilters();
  renderLeaderboard();

  // Set initial tab ARIA state
  const tabs = document.querySelectorAll("#leaderboard-tabs .kz-tab");
  tabs.forEach((t, i) => {
    t.setAttribute("tabindex", i === 0 ? "0" : "-1");
  });

  pageInitialized.dashboard = true;
  pageInitialized.leaderboards = true;
}

// Wait for Chart.js if deferred
if (typeof Chart !== "undefined") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  window.addEventListener("load", init);
}
