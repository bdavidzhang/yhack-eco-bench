/* ==============================================
   EcoBench — Interactive logic & placeholder data
   ============================================== */

const MODELS = [
  { id: 'alpha',   name: 'Model Alpha',   org: 'Org A', avatar: 'A', scores: { overall: 92.4, catA: 95.1, catB: 88.7, catC: 93.4 }, date: '2026-03-28' },
  { id: 'beta',    name: 'Model Beta',    org: 'Org B', avatar: 'B', scores: { overall: 89.1, catA: 91.2, catB: 90.3, catC: 85.8 }, date: '2026-03-27' },
  { id: 'gamma',   name: 'Model Gamma',   org: 'Org C', avatar: 'G', scores: { overall: 86.7, catA: 82.4, catB: 92.1, catC: 85.6 }, date: '2026-03-26' },
  { id: 'delta',   name: 'Model Delta',   org: 'Org D', avatar: 'D', scores: { overall: 83.2, catA: 85.9, catB: 78.4, catC: 85.3 }, date: '2026-03-25' },
  { id: 'epsilon', name: 'Model Epsilon', org: 'Org E', avatar: 'E', scores: { overall: 79.8, catA: 76.3, catB: 81.2, catC: 81.9 }, date: '2026-03-24' },
  { id: 'zeta',    name: 'Model Zeta',    org: 'Org F', avatar: 'Z', scores: { overall: 75.5, catA: 78.1, catB: 70.9, catC: 77.5 }, date: '2026-03-23' },
];

const CATEGORIES = [
  { id: 'cat-a', name: 'Category A', icon: '⚡', desc: 'Performance and speed evaluation across standard benchmarks.', tasks: 24, key: 'catA' },
  { id: 'cat-b', name: 'Category B', icon: '🧠', desc: 'Reasoning and comprehension evaluation across complex tasks.', tasks: 18, key: 'catB' },
  { id: 'cat-c', name: 'Category C', icon: '🔗', desc: 'Integration and tool-use evaluation in real-world scenarios.', tasks: 31, key: 'catC' },
];

const SCORE_KEY_MAP = {
  'overall': 'overall',
  'category-a': 'catA',
  'category-b': 'catB',
  'category-c': 'catC',
};

/* --- Init --- */
document.addEventListener('DOMContentLoaded', () => {
  renderHeroStats();
  renderLeaderboard('overall');
  renderCategoryCards();
  populateSelects();
  bindEvents();
});

/* --- Hero Stats --- */
function renderHeroStats() {
  const el = document.getElementById('hero-stats');
  if (!el) return;

  const stats = [
    { value: MODELS.length, label: 'Models Evaluated' },
    { value: CATEGORIES.reduce((sum, c) => sum + c.tasks, 0), label: 'Tasks' },
    { value: CATEGORIES.length, label: 'Categories' },
    { value: 1842, label: 'Total Runs' },
  ];

  el.innerHTML = stats.map(s => `
    <div class="stat">
      <span class="stat-value" data-target="${s.value}">0</span>
      <span class="stat-label">${s.label}</span>
    </div>
  `).join('');

  el.querySelectorAll('.stat-value').forEach(node => {
    animateCount(node, parseInt(node.dataset.target, 10));
  });
}

function animateCount(el, target) {
  const duration = 700;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    el.textContent = Math.round(eased * target).toLocaleString();
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* --- Leaderboard --- */
function renderLeaderboard(filter) {
  const tbody = document.getElementById('leaderboard-body');
  if (!tbody) return;

  const key = SCORE_KEY_MAP[filter] || 'overall';
  const sorted = [...MODELS].sort((a, b) => b.scores[key] - a.scores[key]);

  tbody.innerHTML = sorted.map((m, i) => `
    <tr>
      <td class="rank rank-${i + 1}">${i + 1}</td>
      <td>
        <div class="model-info">
          <div class="model-avatar">${m.avatar}</div>
          <div>
            <div class="model-name">${m.name}</div>
            <div class="model-org">${m.org}</div>
          </div>
        </div>
      </td>
      <td class="score">${m.scores[key].toFixed(1)}</td>
      <td class="bar-cell">
        <div class="bar-track">
          <div class="bar-fill" style="width: ${m.scores[key]}%"></div>
        </div>
      </td>
      <td class="cat-score">${m.scores.catA.toFixed(1)}</td>
      <td class="cat-score">${m.scores.catB.toFixed(1)}</td>
      <td class="cat-score">${m.scores.catC.toFixed(1)}</td>
      <td class="date-cell">${formatDate(m.date)}</td>
    </tr>
  `).join('');

  // Animate bars via double-rAF
  requestAnimationFrame(() => {
    tbody.querySelectorAll('.bar-fill').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0%';
      requestAnimationFrame(() => { bar.style.width = w; });
    });
  });
}

function formatDate(str) {
  return new Date(str + 'T00:00:00')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* --- Category Cards --- */
function renderCategoryCards() {
  const grid = document.getElementById('category-cards');
  if (!grid) return;

  grid.innerHTML = CATEGORIES.map(cat => {
    const leader = [...MODELS].sort((a, b) => b.scores[cat.key] - a.scores[cat.key])[0];
    return `
      <div class="card">
        <div class="card-top">
          <span class="card-icon">${cat.icon}</span>
          <span class="card-tasks">${cat.tasks} tasks</span>
        </div>
        <h3>${cat.name}</h3>
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

/* --- Comparison Selects --- */
function populateSelects() {
  ['compare-a', 'compare-b'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    MODELS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.name} (${m.org})`;
      sel.appendChild(opt);
    });
  });
}

function renderComparison(a, b) {
  const chart = document.getElementById('compare-chart');
  if (!chart) return;

  if (!a || !b) {
    chart.innerHTML = '<div class="compare-placeholder">Select two models above to see a comparison.</div>';
    return;
  }

  const dims = [
    { label: 'Overall', vA: a.scores.overall, vB: b.scores.overall },
    ...CATEGORIES.map(c => ({ label: c.name, vA: a.scores[c.key], vB: b.scores[c.key] })),
  ];

  chart.innerHTML = `
    <div class="compare-legend">
      <span class="legend-a">${a.name}</span>
      <span class="legend-b">${b.name}</span>
    </div>
    ${dims.map(d => `
      <div class="compare-row">
        <span class="compare-label">${d.label}</span>
        <div class="bar-track"><div class="compare-bar-a" style="width: ${d.vA}%"></div></div>
        <span class="compare-val">${d.vA.toFixed(1)}</span>
        <div class="bar-track"><div class="compare-bar-b" style="width: ${d.vB}%"></div></div>
        <span class="compare-val">${d.vB.toFixed(1)}</span>
      </div>
    `).join('')}
  `;

  // Animate comparison bars
  requestAnimationFrame(() => {
    chart.querySelectorAll('.compare-bar-a, .compare-bar-b').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0%';
      requestAnimationFrame(() => { bar.style.width = w; });
    });
  });
}

/* --- Event Binding --- */
function bindEvents() {
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderLeaderboard(btn.dataset.filter);
    });
  });

  // Comparison dropdowns
  const selA = document.getElementById('compare-a');
  const selB = document.getElementById('compare-b');
  if (selA && selB) {
    const update = () => renderComparison(
      MODELS.find(m => m.id === selA.value),
      MODELS.find(m => m.id === selB.value),
    );
    selA.addEventListener('change', update);
    selB.addEventListener('change', update);
  }

  // Theme toggle
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    const icon = toggle.querySelector('.theme-icon');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (prefersDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (icon) icon.textContent = '☾';
    }

    toggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      if (icon) icon.textContent = isDark ? '☀' : '☾';
    });
  }
}
