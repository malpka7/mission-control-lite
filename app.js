const LS_KEY = 'mission_control_lite_v1';

const STATUSES = [
  { key: 'open', label: 'Open', dot: '#4dd9ff' },
  { key: 'doing', label: 'W toku', dot: '#7c5cff' },
  { key: 'blocked', label: 'Zablokowane', dot: '#ff5577' },
  { key: 'done', label: 'Done', dot: '#31d0aa' },
];

function nowIso() {
  return new Date().toISOString().slice(0, 19);
}

function uid() {
  return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state, null, 0));
}

function defaultState() {
  return {
    meta: { createdAt: nowIso(), updatedAt: nowIso() },
    tasks: [
      { id: uid(), title: 'Podłącz Chrome Huberta (Browser Relay)', owner: 'Ahmed', status: 'doing', notes: '', createdAt: nowIso(), updatedAt: nowIso() },
      { id: uid(), title: 'Dashboard wydatków: filtry + PDF export', owner: 'Ahmed', status: 'open', notes: '', createdAt: nowIso(), updatedAt: nowIso() },
    ],
  };
}

let state = loadState() || defaultState();

// ---- Tabs ----
const tabButtons = Array.from(document.querySelectorAll('[role="tab"]'));
const views = {
  tasks: document.getElementById('view_tasks'),
  cron: document.getElementById('view_cron'),
  memory: document.getElementById('view_memory'),
  team: document.getElementById('view_team'),
  settings: document.getElementById('view_settings'),
};

function showTab(key) {
  for (const b of tabButtons) {
    b.setAttribute('aria-selected', b.dataset.tab === key ? 'true' : 'false');
  }
  Object.entries(views).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle('hidden', k !== key);
  });
}

tabButtons.forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

// ---- Tasks ----
function renderKanban() {
  const root = document.getElementById('kanban');
  root.innerHTML = '';

  const byStatus = new Map(STATUSES.map(s => [s.key, []]));
  for (const t of state.tasks) {
    if (!byStatus.has(t.status)) t.status = 'open';
    byStatus.get(t.status).push(t);
  }

  for (const s of STATUSES) {
    const col = document.createElement('div');
    col.className = 'col';
    col.innerHTML = `<h3>${s.label}</h3><div class="items"></div>`;

    const items = col.querySelector('.items');
    const tasks = byStatus.get(s.key);

    for (const t of tasks) {
      const el = document.createElement('div');
      el.className = 'item';

      const owner = t.owner ? ` • ${escapeHtml(t.owner)}` : '';
      el.innerHTML = `
        <div class="t">${escapeHtml(t.title)}</div>
        <div class="s"><span class="pill"><span class="dot" style="background:${s.dot}"></span>${s.label}${owner}</span></div>
        <div style="height:8px"></div>
        <label class="k">Status</label>
        <select data-action="status" data-id="${t.id}">${STATUSES.map(x => `<option value="${x.key}" ${x.key===t.status?'selected':''}>${x.label}</option>`).join('')}</select>
        <div style="height:8px"></div>
        <label class="k">Notatki</label>
        <textarea data-action="notes" data-id="${t.id}" placeholder="krótko">${escapeHtml(t.notes||'')}</textarea>
        <div style="height:8px"></div>
        <div style="display:flex;gap:8px;justify-content:space-between;align-items:center">
          <div class="k">${escapeHtml(t.updatedAt||'')}</div>
          <button class="btn danger" data-action="delete" data-id="${t.id}">Usuń</button>
        </div>
      `;
      items.appendChild(el);
    }

    root.appendChild(col);
  }

  // stats
  const openN = state.tasks.filter(t => t.status === 'open' || t.status === 'blocked').length;
  const doingN = state.tasks.filter(t => t.status === 'doing').length;
  const doneN = state.tasks.filter(t => t.status === 'done').length;
  document.getElementById('stat_open').textContent = String(openN);
  document.getElementById('stat_doing').textContent = String(doingN);
  document.getElementById('stat_done').textContent = String(doneN);

  // wire events
  root.querySelectorAll('[data-action="status"]').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const t = state.tasks.find(x => x.id === id);
      if (!t) return;
      t.status = e.target.value;
      t.updatedAt = nowIso();
      persistAndRender();
    });
  });

  root.querySelectorAll('[data-action="notes"]').forEach(tx => {
    tx.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const t = state.tasks.find(x => x.id === id);
      if (!t) return;
      t.notes = e.target.value;
      t.updatedAt = nowIso();
      persistAndRender(false);
    });
  });

  root.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.dataset.id;
      if (!confirm('Usunąć zadanie?')) return;
      state.tasks = state.tasks.filter(x => x.id !== id);
      persistAndRender();
    });
  });
}

function escapeHtml(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function persistAndRender(scrollTop=true) {
  state.meta.updatedAt = nowIso();
  saveState(state);
  const st = document.documentElement.scrollTop;
  renderKanban();
  if (!scrollTop) document.documentElement.scrollTop = st;
}

// add task
const addBtn = document.getElementById('addTask');
addBtn.addEventListener('click', () => {
  const title = prompt('Tytuł zadania:');
  if (!title) return;
  const owner = prompt('Kto? (Hubert/Ahmed):', 'Ahmed') || '';
  state.tasks.unshift({ id: uid(), title, owner, status: 'open', notes: '', createdAt: nowIso(), updatedAt: nowIso() });
  persistAndRender();
});

// export/import
const expBtn = document.getElementById('exportBtn');
expBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mission-control-lite.json';
  a.click();
  URL.revokeObjectURL(url);
});

const impBtn = document.getElementById('importBtn');
impBtn.addEventListener('click', () => {
  const raw = document.getElementById('importBox').value.trim();
  if (!raw) return;
  try {
    const tasks = JSON.parse(raw);
    if (!Array.isArray(tasks)) throw new Error('Expected array');
    // merge
    for (const t of tasks) {
      if (!t.title) continue;
      state.tasks.push({
        id: t.id || uid(),
        title: String(t.title),
        owner: t.owner || '',
        status: t.status || 'open',
        notes: t.notes || '',
        createdAt: t.createdAt || nowIso(),
        updatedAt: nowIso(),
      });
    }
    persistAndRender();
    alert('Import OK');
  } catch (e) {
    alert('Import fail: ' + e.message);
  }
});

const resetBtn = document.getElementById('resetBtn');
resetBtn.addEventListener('click', () => {
  if (!confirm('Reset do domyślnych?')) return;
  state = defaultState();
  persistAndRender();
});

// init
renderKanban();
showTab('tasks');
