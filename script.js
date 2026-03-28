/* ============================================
   EcoBench — Benchmark Results
   Interactive logic & placeholder data
   ============================================ */

// ---- Placeholder Data ----
// Replace these with real benchmark data when available.

const MODELS = [
  { id: 'model-a', name: 'Model Alpha',   org: 'Org A', avatar: 'A', scores: { overall: 92.4, catA: 95.1, catB: 88.7, catC: 93.4 }, date: '2026-03-28' },
  { id: 'model-b', name: 'Model Beta',    org: 'Org B', avatar: 'B', scores: { overall: 89.1, catA: 91.2, catB: 90.3, catC: 85.8 }, date: '2026-03-27' },
  { id: 'model-c', name: 'Model Gamma',   org: 'Org C', avatar: 'G', scores: { overall: 86.7, catA: 82.4, catB: 92.1, catC: 85.6 }, date: '2026-03-26' },
  { id: 'model-d', name: 'Model Delta',   org: 'Org D', avatar: 'D', scores: { overall: 83.2, catA: 85.9, catB: 78.4, catC: 85.3 }, date: '2026-03-25' },
  { id: 'model-e', name: 'Model Epsilon', org: 'Org E', avatar: 'E', scores: { overall: 79.8, catA: 76.3, catB: 81.2, catC: 81.9 }, date: '2026-03-24' },
  { id: 'model-f', name: 'Model Zeta',    org: 'Org F', avatar: 'Z', scores: { overall: 75.5, catA: 78.1, catB: 70.9, catC: 77.5 }, date: '2026-03-23' },
];

const CATEGORIES = [
  { id: 'cat-a', name: 'Category A', icon: '⚡', desc: 'Description of Category A evaluation criteria and what it measures.', tasks: 24, key: 'catA' },
  { id: 'cat-b', name: 'Category B', icon: '🧠', desc: 'Description of Category B evaluation criteria and what it measures.', tasks: 18, key: 'catB' },
  { id: 'cat-c', name: 'Category C', icon: '🔗', desc: 'Description of Category C evaluation criteria and what it measures.', tasks: 31, key: 'catC' },
];

const HERO_STATS = [
  { value: MODELS.length, label: 'Models Evaluated' },
  { value: CATEGORIES.reduce((s, c) => s + c.tasks, 0), label: 'Tasks' },
  { value: CATEGORIES.length, label: 'Categories' },
  { value: 1842, label: 'Total Runs' },
];

// ---- DOM Ready ----
document.addEventListener('DOMContentLoaded', () => {
  renderHeroStats();
  renderLeaderboard('overall');
  renderCategoryCards();
  populateCompareSelects();
  bindFilterButtons();
  bindCompareSelects();
  bindThemeToggle();
});

// ---- Hero Stats ----
function renderHeroStats() {
  const cards = document.querySelectorAll('.stat-card');
  HERO_STATS.forEach((stat, i) => {
    if (!cards[i]) return;
    const el = cards[i].querySelector('.stat-value');
    animateCount(el, stat.value);
  });
}

function animateCount(el, target) {
  const duration = 800;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ---- Leaderboard ----
function renderLeaderboard(sortKey) {
  const tbody = document.getElementById('leaderboard-body');
  if (!tbody) return;

  const scoreKey = sortKey === 'overall' ? 'overall'
    : sortKey === 'category-a' ? 'catA'
    : sortKey === 'category-b' ? 'catB'
    : 'catC';

  const sorted = [...MODELS].sort((a, b) => b.scores[scoreKey] - a.scores[scoreKey]);

  tbody.innerHTML = sorted.map((m, i) => `
    <tr>
      <td class="rank-cell rank-${i + 1}">${i + 1}</td>
      <td>
        <div class="model-cell">
          <div class="model-avatar">${m.avatar}</div>
          <div>
            <div class="model-name">${m.name}</div>
            <div class="model-org">${m.org}</div>
          </div>
        </div>
      </td>
      <td class="score-cell">${m.scores[scoreKey].toFixed(1)}</td>
      <td>
        <div class="score-bar-wrapper">
          <div class="score-bar" style="width: ${m.scores[scoreKey]}%"></div>
        </div>
      </td>
      <td class="cat-score">${m.scores.catA.toFixed(1)}</td>
      <td class="cat-score">${m.scores.catB.toFixed(1)}</td>
      <td class="cat-score">${m.scores.catC.toFixed(1)}</td>
      <td class="date-cell">${formatDate(m.date)}</td>
    </tr>
  `).join('');

  // Animate bars in
  requestAnimationFrame(() => {
    tbody.querySelectorAll('.score-bar').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0%';
      requestAnimationFrame(() => { bar.style.width = w; });
    });
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---- Category Cards ----
function renderCategoryCards() {
  const grid = document.getElementById('category-cards');
  if (!grid) return;

  grid.innerHTML = CATEGORIES.map(cat => {
    const leader = [...MODELS].sort((a, b) => b.scores[cat.key] - a.scores[cat.key])[0];
    return `
      <div class="category-card">
        <div class="card-header">
          <div class="card-icon">${cat.icon}</div>
          <span class="card-count">${cat.tasks} tasks</span>
        </div>
        <h3 class="card-title">${cat.name}</h3>
        <p class="card-desc">${cat.desc}</p>
        <div class="card-leader">
          <div>
            <span class="card-leader-label">Leader: </span>
            <span class="card-leader-name">${leader.name}</span>
          </div>
          <span class="card-leader-score">${leader.scores[cat.key].toFixed(1)}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Filters ----
function bindFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLeaderboard(btn.dataset.filter);
    });
  });
}

// ---- Comparison ----
function populateCompareSelects() {
  const selects = [document.getElementById('compare-a'), document.getElementById('compare-b')];
  selects.forEach(sel => {
    if (!sel) return;
    MODELS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.name} (${m.org})`;
      sel.appendChild(opt);
    });
  });
}

function bindCompareSelects() {
  const selA = document.getElementById('compare-a');
  const selB = document.getElementById('compare-b');
  if (!selA || !selB) return;

  const update = () => {
    const a = MODELS.find(m => m.id === selA.value);
    const b = MODELS.find(m => m.id === selB.value);
    renderComparison(a, b);
  };
  selA.addEventListener('change', update);
  selB.addEventListener('change', update);
}

function renderComparison(a, b) {
  const chart = document.getElementById('comparison-chart');
  if (!chart) return;

  if (!a || !b) {
    chart.innerHTML = '<div class="chart-placeholder"><p>Select two models above to see a detailed comparison.</p></div>';
    return;
  }

  const dims = [
    { label: 'Overall', keyA: a.scores.overall, keyB: b.scores.overall },
    ...CATEGORIES.map(c => ({ label: c.name, keyA: a.scores[c.key], keyB: b.scores[c.key] })),
  ];

  chart.innerHTML = `
    <div class="comparison-bars">
      <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-md); font-size: 14px; font-weight: 600;">
        <span style="color: var(--purple-400)">${a.name}</span>
        <span style="color: var(--purple-200)">${b.name}</span>
      </div>
      ${dims.map(d => `
        <div class="compare-row">
          <div class="compare-label">${d.label}</div>
          <div class="compare-bar-a" style="width: ${d.keyA}%"></div>
          <div class="compare-score">${d.keyA.toFixed(1)}</div>
          <div class="compare-bar-b" style="width: ${d.keyB}%"></div>
          <div class="compare-score">${d.keyB.toFixed(1)}</div>
        </div>
      `).join('')}
    </div>
  `;

  // Animate bars
  requestAnimationFrame(() => {
    chart.querySelectorAll('.compare-bar-a, .compare-bar-b').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0%';
      requestAnimationFrame(() => { bar.style.width = w; });
    });
  });
}

// ---- Theme Toggle ----
function bindThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggleThemeIcon(true);
  }

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    toggleThemeIcon(!isDark);
  });
}

function toggleThemeIcon(isDark) {
  const sun = document.querySelector('.icon-sun');
  const moon = document.querySelector('.icon-moon');
  if (sun) sun.style.display = isDark ? 'none' : 'inline';
  if (moon) moon.style.display = isDark ? 'inline' : 'none';
}
