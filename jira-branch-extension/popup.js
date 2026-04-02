// popup.js – v4 dynamic fields

const MAX_HISTORY = 15;
const DEFAULT_TPL = '{sprint}/{parent}/{ticket}-{slug}';

// All field definitions used to build the editable grid
const FIELDS = [
  { key: 'sprintId',   label: 'Sprint',     cls: 'fc-sprint',    placeholder: '200',          col: 1 },
  { key: 'parentId',   label: 'Parent',     cls: 'fc-parent',    placeholder: 'LH-48141',     col: 1 },
  { key: 'ticketId',   label: 'Ticket',     cls: 'fc-ticket',    placeholder: 'LH-48913',     col: 1 },
  { key: 'assignee',   label: 'Assignee',   cls: 'fc-assignee',  placeholder: 'john-doe',     col: 1 },
  { key: 'labels',     label: 'Label',      cls: 'fc-label',     placeholder: 'backend',      col: 1, isArray: true },
  { key: 'components', label: 'Component',  cls: 'fc-component', placeholder: 'portal',       col: 1, isArray: true },
  { key: 'issueType',  label: 'Type',       cls: 'fc-type',      placeholder: 'story',        col: 1 },
  { key: 'priority',   label: 'Priority',   cls: 'fc-priority',  placeholder: 'high',         col: 1 },
  { key: 'title',      label: 'Title',      cls: 'fc-title',     placeholder: 'Ticket title', col: 3, wide: true },
];

const PRESETS = [
  { tpl: '{sprint}/{parent}/{ticket}-{slug}',         name: 'Full (default)' },
  { tpl: '{parent}/{ticket}-{slug}',                  name: 'No sprint' },
  { tpl: '{sprint}/{ticket}-{slug}',                  name: 'No parent' },
  { tpl: '{ticket}-{slug}',                           name: 'Minimal' },
  { tpl: 'feat/{ticket}-{slug}',                      name: 'feat/' },
  { tpl: 'fix/{ticket}-{slug}',                       name: 'fix/' },
  { tpl: '{type}/{sprint}/{ticket}-{slug}',           name: 'type/sprint/ticket' },
  { tpl: '{assignee}/{sprint}/{ticket}-{slug}',       name: 'assignee/sprint/ticket' },
  { tpl: '{component}/{ticket}-{slug}',               name: 'component/ticket' },
  { tpl: '{label}/{sprint}/{ticket}-{slug}',          name: 'label/sprint/ticket' },
];

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  ticketId:   '',
  title:      '',
  sprintId:   '',
  parentId:   '',
  assignee:   '',
  labels:     [],
  components: [],
  issueType:  '',
  priority:   '',
  branch:     '',
  baseBranch: '',
  template:   DEFAULT_TPL,
};

// Field input refs keyed by field key
const fieldInputs = {};

// ── DOM ────────────────────────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const dot          = $('dot');
const statusTxt    = $('statusTxt');
const fieldsSection= $('fieldsSection');
const fieldsGrid   = $('fieldsGrid');
const branchWrap     = $('branchWrap');
const branchBox      = $('branchBox');
const branchDisp     = $('branchDisplay');
const copyBtn        = $('copyBtn');
const baseBranchRow  = $('baseBranchRow');
const baseBranchBox  = $('baseBranchBox');
const baseBranchDisp = $('baseBranchDisplay');
const baseCopyBtn    = $('baseCopyBtn');
const baseChip       = $('baseChip');
const baseChk        = $('baseChk');
const optChips       = $('optChips');
const swChip       = $('swChip');
const swChk        = $('swChk');
const upperChip    = $('upperChip');
const upperChk     = $('upperChk');
const manualInput  = $('manualInput');
const genBtn       = $('genBtn');
const tplInput     = $('tplInput');
const tplPreview   = $('tplPreview');
const tplPreviewBox= $('tplPreviewBox');
const tplCopyBtn   = $('tplCopyBtn');
const presetList   = $('presetList');
const varGrid      = $('varGrid');
const histList     = $('histList');
const clearBtn     = $('clearBtn');
const toast        = $('toast');

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  buildFieldsGrid();
  setupTabs();
  setupPresets();
  setupVarPills();
  await loadOptions();
  await renderHistory();
  await detectFromTab();
}

// ── Build editable fields grid ─────────────────────────────────────────────
function buildFieldsGrid() {
  FIELDS.forEach(f => {
    const card = document.createElement('div');
    card.className = `field-card ${f.cls}${f.wide ? ' wide' : ''} empty`;
    card.dataset.key = f.key;

    const lbl = document.createElement('div');
    lbl.className = 'fc-lbl';
    lbl.innerHTML = `<span class="fc-dot"></span>${f.label}`;

    const inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = f.placeholder;
    inp.addEventListener('input', () => {
      const v = inp.value.trim();
      if (f.isArray) {
        state[f.key] = v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
      } else {
        state[f.key] = v;
      }
      card.classList.toggle('empty', !v);
      rebuild();
    });

    fieldInputs[f.key] = inp;
    card.appendChild(lbl);
    card.appendChild(inp);
    fieldsGrid.appendChild(card);
  });
}

// ── Tabs ───────────────────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      $('page-' + tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'history') renderHistory();
    });
  });
}

// ── Presets ────────────────────────────────────────────────────────────────
function setupPresets() {
  PRESETS.forEach(p => {
    const el = document.createElement('div');
    el.className = 'preset';
    el.textContent = p.tpl;
    el.title = p.name;
    el.addEventListener('click', () => {
      tplInput.value = p.tpl;
      state.template = p.tpl;
      highlightPreset(p.tpl);
      saveOptions();
      rebuild();
    });
    presetList.appendChild(el);
  });
}

function highlightPreset(tpl) {
  presetList.querySelectorAll('.preset').forEach(el =>
    el.classList.toggle('active', el.textContent === tpl)
  );
}

// ── Variable pills ─────────────────────────────────────────────────────────
function setupVarPills() {
  VAR_META.forEach(v => {
    const el = document.createElement('span');
    el.className = `vp ${v.cls}`;
    el.textContent = v.label;
    el.title = `e.g. "${v.desc}"`;
    el.addEventListener('click', () => {
      const pos = tplInput.selectionStart ?? tplInput.value.length;
      const val = tplInput.value;
      tplInput.value = val.slice(0, pos) + v.label + val.slice(pos);
      tplInput.focus();
      tplInput.setSelectionRange(pos + v.label.length, pos + v.label.length);
      state.template = tplInput.value;
      highlightPreset(state.template);
      saveOptions();
      rebuild();
    });
    varGrid.appendChild(el);
  });
}

tplInput.addEventListener('input', () => {
  state.template = tplInput.value || DEFAULT_TPL;
  highlightPreset(state.template);
  saveOptions();
  rebuild();
});

// ── Detect from Jira tab ───────────────────────────────────────────────────
async function detectFromTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    const isJira = /atlassian\.net|jira\.com/.test(tab.url || '');
    if (!isJira) {
      setStatus('off', 'Not Jira');
      const m = (tab.title || '').match(/\[?([A-Z]+-\d+)\]?\s*[-:]?\s*(.*?)(?:\s*[-|]\s*Jira.*)?$/i);
      if (m?.[1]) fillContext({ ticketId: m[1].toUpperCase(), title: m[2]?.trim() || '' });
      return;
    }

    setStatus('loading', 'Reading…');
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }).catch(() => {});
    const resp = await chrome.tabs.sendMessage(tab.id, { action: 'getTicketInfo' }).catch(() => null);

    if (resp?.ticketId) {
      setStatus('on', 'Detected');
      fillContext(resp);
    } else {
      setStatus('off', 'No ticket');
    }
  } catch(e) {
    setStatus('err', 'Error');
    console.error(e);
  }
}

// ── Fill all context fields ────────────────────────────────────────────────
function fillContext(info) {
  state.ticketId   = (info.ticketId   || '').toUpperCase();
  state.title      = info.title       || '';
  state.sprintId   = info.sprintId    || '';
  state.parentId   = (info.parentId   || '').toUpperCase();
  state.assignee   = info.assignee    || '';
  state.labels     = info.labels      || [];
  state.components = info.components  || [];
  state.issueType  = info.issueType   || '';
  state.priority   = info.priority    || '';

  // Update inputs
  const setField = (key, val) => {
    const inp = fieldInputs[key];
    if (!inp) return;
    inp.value = Array.isArray(val) ? val.join(', ') : (val || '');
    inp.closest('.field-card').classList.toggle('empty', !inp.value);
  };

  setField('ticketId',   state.ticketId);
  setField('title',      state.title);
  setField('sprintId',   state.sprintId);
  setField('parentId',   state.parentId);
  setField('assignee',   state.assignee);
  setField('labels',     state.labels);
  setField('components', state.components);
  setField('issueType',  state.issueType);
  setField('priority',   state.priority);

  fieldsSection.style.display = 'flex';
  rebuild();
}

// ── Rebuild branch from current state ─────────────────────────────────────
function rebuild() {
  if (!state.ticketId) {
    branchWrap.classList.remove('show');
    optChips.style.display = 'none';
    tplPreview.textContent = '—';
    return;
  }

  const branch = generateBranchName(state.ticketId, state.title, {
    sprintId:        state.sprintId  || null,
    parentId:        state.parentId  || null,
    assignee:        state.assignee  || null,
    labels:          state.labels,
    components:      state.components,
    issueType:       state.issueType || null,
    priority:        state.priority  || null,
    removeStopWords: swChk.checked,
    uppercaseId:     upperChk.checked,
    maxWords:        8,
    template:        state.template || DEFAULT_TPL,
  });

  state.branch = branch;

  // Build varMap for colorising
  const varMap = buildVarMap(state.ticketId, state.title, {
    sprintId: state.sprintId || null,
    parentId: state.parentId || null,
    assignee: state.assignee || null,
    labels:   state.labels,
    components: state.components,
    issueType: state.issueType || null,
    priority: state.priority || null,
    uppercaseId: upperChk.checked,
  });

  const coloured = coloriseBranch(branch, varMap, upperChk.checked);
  branchDisp.innerHTML = coloured;
  tplPreview.innerHTML = coloured;

  // ── Base branch ──
  const hasParent = !!(state.parentId);
  const showBase  = hasParent && baseChk.checked;
  baseBranchRow.style.display = hasParent ? 'flex' : 'none';

  if (showBase) {
    // Build base branch using same template but replace ticket+slug with "base"
    // Formula: {sprint}/{parent}/base  (dropping any segment that has no value)
    const baseParts = [];
    if (state.sprintId) baseParts.push(`s${state.sprintId}`);
    baseParts.push(upperChk.checked ? state.parentId.toUpperCase() : state.parentId.toLowerCase());
    baseParts.push('base');
    const baseBranch = baseParts.join('/');
    state.baseBranch = baseBranch;

    // Colorise base branch segments
    const baseParsed = baseBranch.split('/');
    baseBranchDisp.innerHTML = baseParsed.map((part, i) => {
      const sep = i < baseParsed.length - 1 ? `<span class="t-sep">/</span>` : '';
      let html;
      if (part === `s${state.sprintId}`)                                      html = `<span class="t-sprint">${esc(part)}</span>`;
      else if (part.toUpperCase() === state.parentId.toUpperCase())           html = `<span class="t-parent">${esc(part)}</span>`;
      else                                                                     html = `<span class="t-raw" style="color:var(--txm)">${esc(part)}</span>`;
      return html + sep;
    }).join('');

    baseBranchBox.style.display = '';
  } else {
    state.baseBranch = '';
    baseBranchBox.style.display = hasParent ? '' : 'none';
  }

  branchWrap.classList.add('show');
  optChips.style.display = '';
}

// ── Colorise branch string using varMap values ─────────────────────────────
function coloriseBranch(branch, varMap, upper) {
  // Map each rendered value back to its variable name for colouring
  const valueToClass = {};
  const classMap = {
    sprint: 't-sprint', parent: 't-parent', ticket: 't-ticket',
    slug: 't-slug', assignee: 't-assignee', label: 't-label',
    component: 't-component', type: 't-type', priority: 't-priority',
    title: 't-slug',
  };

  // Build reverse lookup: rendered string → css class
  Object.entries(varMap).forEach(([k, v]) => {
    if (v && classMap[k]) valueToClass[v] = classMap[k];
  });

  const parts = branch.split('/');
  return parts.map((part, i) => {
    const sep = i < parts.length - 1 ? `<span class="t-sep">/</span>` : '';

    // Try to match this segment (or prefix of it) to a known var value
    let html = `<span class="t-raw">${esc(part)}</span>`;

    for (const [val, cls] of Object.entries(valueToClass)) {
      if (!val) continue;
      if (part === val) {
        html = `<span class="${cls}">${esc(part)}</span>`;
        break;
      }
    }

    // Special: ticket-slug (last segment typically)
    const ticketVal = varMap.ticket || '';
    if (ticketVal && part.startsWith(ticketVal)) {
      const rest = part.slice(ticketVal.length);
      html = `<span class="t-ticket">${esc(ticketVal)}</span><span class="t-slug">${esc(rest)}</span>`;
    }

    return html + sep;
  }).join('');
}

// ── Copy ───────────────────────────────────────────────────────────────────
function doCopy(text, box) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    if (box) { box.classList.add('copied'); setTimeout(() => box.classList.remove('copied'), 1200); }
    showToast('✓ Copied!');
    saveHistory(text).then(renderHistory);
  });
}

branchBox.addEventListener('click', () => doCopy(state.branch, branchBox));
copyBtn.addEventListener('click', e => { e.stopPropagation(); doCopy(state.branch, branchBox); });
baseBranchBox.addEventListener('click', () => doCopy(state.baseBranch, baseBranchBox));
baseCopyBtn.addEventListener('click', e => { e.stopPropagation(); doCopy(state.baseBranch, baseBranchBox); });
tplPreviewBox.addEventListener('click', () => doCopy(state.branch, tplPreviewBox));
tplCopyBtn.addEventListener('click', e => { e.stopPropagation(); doCopy(state.branch, tplPreviewBox); });

// ── Manual generate ────────────────────────────────────────────────────────
genBtn.addEventListener('click', handleManual);
manualInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleManual(); });

function handleManual() {
  const raw = manualInput.value.trim();
  if (!raw) return;
  const parsed = parseManualInput(raw);
  if (!parsed?.ticketId) { flash(manualInput); return; }
  fillContext(parsed);
  setStatus('on', 'Manual');
}

// ── Options ────────────────────────────────────────────────────────────────
swChip.addEventListener('click', () => {
  swChk.checked = !swChk.checked;
  swChip.classList.toggle('on', swChk.checked);
  saveOptions(); rebuild();
});
upperChip.addEventListener('click', () => {
  upperChk.checked = !upperChk.checked;
  upperChip.classList.toggle('on', upperChk.checked);
  saveOptions(); rebuild();
});
baseChip.addEventListener('click', () => {
  baseChk.checked = !baseChk.checked;
  baseChip.classList.toggle('on', baseChk.checked);
  saveOptions(); rebuild();
});

async function saveOptions() {
  await chrome.storage.local.set({ opts: { sw: swChk.checked, upper: upperChk.checked, tpl: state.template, base: baseChk.checked } });
}

async function loadOptions() {
  const { opts } = await chrome.storage.local.get('opts');
  if (opts) {
    swChk.checked    = opts.sw    !== false;
    upperChk.checked = opts.upper !== false;
    baseChk.checked  = opts.base  !== false;
    state.template   = opts.tpl   || DEFAULT_TPL;
  }
  swChip.classList.toggle('on', swChk.checked);
  upperChip.classList.toggle('on', upperChk.checked);
  baseChip.classList.toggle('on', baseChk.checked);
  tplInput.value = state.template;
  highlightPreset(state.template);
}

// ── History ────────────────────────────────────────────────────────────────
async function saveHistory(branch) {
  const { history: h = [] } = await chrome.storage.local.get('history');
  await chrome.storage.local.set({ history: [branch, ...h.filter(b => b !== branch)].slice(0, MAX_HISTORY) });
}

async function renderHistory() {
  const { history: h = [] } = await chrome.storage.local.get('history');
  histList.innerHTML = '';
  if (!h.length) { histList.innerHTML = '<div class="hint" style="padding:8px 0">No history yet.</div>'; return; }
  h.forEach(branch => {
    const el = document.createElement('div');
    el.className = 'hi';
    el.innerHTML = `<span class="hi-name">${esc(branch)}</span><span class="hi-icon">⎘</span>`;
    el.addEventListener('click', () => navigator.clipboard.writeText(branch).then(() => showToast('✓ Copied!')));
    histList.appendChild(el);
  });
}

clearBtn.addEventListener('click', async () => {
  await chrome.storage.local.set({ history: [] });
  renderHistory();
});

// ── Helpers ────────────────────────────────────────────────────────────────
function setStatus(type, txt) {
  dot.className = 'dot' + (type === 'on' ? ' on' : type === 'err' ? ' err' : '');
  statusTxt.textContent = txt;
}
function showToast(msg) {
  toast.textContent = msg; toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}
function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function flash(el) {
  el.style.borderColor = 'var(--red)';
  setTimeout(() => { el.style.borderColor = ''; }, 700);
}

init();
