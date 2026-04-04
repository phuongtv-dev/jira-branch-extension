// popup.js – v6: OAuth + App Password + Create Branch modal

const MAX_HISTORY   = 15;
const DEFAULT_TPL   = '{sprint}/{parent}/{ticket}-{slug}';
const DEFAULT_PRESETS = [
  { name:'Full (default)',         tpl:'{sprint}/{parent}/{ticket}-{slug}' },
  { name:'No sprint',              tpl:'{parent}/{ticket}-{slug}' },
  { name:'No parent',              tpl:'{sprint}/{ticket}-{slug}' },
  { name:'Minimal',                tpl:'{ticket}-{slug}' },
  { name:'feat/',                  tpl:'feat/{ticket}-{slug}' },
  { name:'fix/',                   tpl:'fix/{ticket}-{slug}' },
  { name:'type/sprint/ticket',     tpl:'{type}/{sprint}/{ticket}-{slug}' },
  { name:'assignee/sprint/ticket', tpl:'{assignee}/{sprint}/{ticket}-{slug}' },
  { name:'component/ticket',       tpl:'{component}/{ticket}-{slug}' },
];

const FIELDS = [
  { key:'sprintId',   label:'Sprint',    cls:'fc-sprint',    placeholder:'200'       },
  { key:'parentId',   label:'Parent',    cls:'fc-parent',    placeholder:'LH-48141'  },
  { key:'ticketId',   label:'Ticket',    cls:'fc-ticket',    placeholder:'LH-48913'  },
  { key:'assignee',   label:'Assignee',  cls:'fc-assignee',  placeholder:'john-doe'  },
  { key:'labels',     label:'Label',     cls:'fc-label',     placeholder:'backend',   isArray:true },
  { key:'components', label:'Component', cls:'fc-component', placeholder:'portal',    isArray:true },
  { key:'issueType',  label:'Type',      cls:'fc-type',      placeholder:'story'     },
  { key:'priority',   label:'Priority',  cls:'fc-priority',  placeholder:'high'      },
  { key:'title',      label:'Title',     cls:'fc-title',     placeholder:'Ticket title', wide:true },
];

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  ticketId:'', title:'', sprintId:'', parentId:'',
  assignee:'', labels:[], components:[], issueType:'', priority:'',
  branch:'', baseBranch:'', template:DEFAULT_TPL,
  pendingBranch:'',
};
const fieldInputs = {};

// ── DOM ────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const dot           = $('dot');
const statusTxt     = $('statusTxt');
const fieldsSection = $('fieldsSection');
const fieldsGrid    = $('fieldsGrid');
const branchWrap    = $('branchWrap');
const branchBox     = $('branchBox');
const branchDisp    = $('branchDisplay');
const copyBtn       = $('copyBtn');
const createBtn     = $('createBtn');
const baseRow       = $('baseRow');
const baseBranchBox = $('baseBranchBox');
const baseBranchDisp= $('baseBranchDisplay');
const baseCopyBtn   = $('baseCopyBtn');
const baseCreateBtn = $('baseCreateBtn');
const baseChip      = $('baseChip');
const baseChk       = $('baseChk');
const optChips      = $('optChips');
const swChip        = $('swChip');
const swChk         = $('swChk');
const upperChip     = $('upperChip');
const upperChk      = $('upperChk');
const manualInput   = $('manualInput');
const genBtn        = $('genBtn');
const bbTab         = $('bbTab');

// template
const presetList    = $('presetList');
const newPresetName = $('newPresetName');
const newPresetTpl  = $('newPresetTpl');
const addPresetBtn  = $('addPresetBtn');
const varGrid       = $('varGrid');

// bitbucket
const bbUserCard    = $('bbUserCard');
const bbAuthPanel   = $('bbAuthPanel');
const bbAvatar      = $('bbAvatar');
const bbUserName    = $('bbUserName');
const bbLogoutBtn   = $('bbLogoutBtn');
const bbUsername    = $('bbUsername');
const bbAppPass     = $('bbAppPass');
const bbSaveAppPass = $('bbSaveAppPass');
const bbFavsSection = $('bbFavsSection');
const wsSelect      = $('wsSelect');
const repoSelect    = $('repoSelect');
const addFavBtn     = $('addFavBtn');
const favList       = $('favList');

// github
const ghUserCard    = $('ghUserCard');
const ghAuthPanel   = $('ghAuthPanel');
const ghAvatar      = $('ghAvatar');
const ghUserName    = $('ghUserName');
const ghLogoutBtn   = $('ghLogoutBtn');
const ghUsernameInp = $('ghUsername');
const ghTokenInp    = $('ghToken');
const ghSaveBtn     = $('ghSaveBtn');
const ghFavsSection = $('ghFavsSection');
const ghFavList     = $('ghFavList');
const ghRepoInput   = $('ghRepoInput');
const ghOrgSelect   = $('ghOrgSelect');
const ghRepoSelect  = $('ghRepoSelect');
const ghAddFavBtn   = $('ghAddFavBtn');
const ghTab         = $('ghTab');

// modal
const modalOverlay    = $('modalOverlay');
const modalTitle      = $('modalTitle');
const modalBranchName = $('modalBranchName');
const modalBody       = $('modalBody');
const modalCancel     = $('modalCancel');
const modalConfirm    = $('modalConfirm');

// history
const histList      = $('histList');
const clearBtn      = $('clearBtn');
const toast         = $('toast');
const themeBtn      = $('themeBtn');

// ── Theme ──────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

themeBtn.addEventListener('click', async () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  await chrome.storage.local.set({ theme: next });
});

async function loadTheme() {
  const { theme } = await chrome.storage.local.get('theme');
  applyTheme(theme || 'dark');
}

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  await loadTheme();
  buildFieldsGrid();
  setupTabs();
  setupVarPills();
  await loadOptions();
  await loadPresets();
  await renderHistory();
  await detectFromTab();
  await initBitbucket();
  await initGitHub();
}

// ── Fields grid ────────────────────────────────────────────────────────────
function buildFieldsGrid() {
  FIELDS.forEach(f => {
    const card = document.createElement('div');
    card.className = `field-card ${f.cls}${f.wide?' wide':''} empty`;
    const lbl = document.createElement('div');
    lbl.className = 'fc-lbl';
    lbl.innerHTML = `<span class="fc-dot"></span>${f.label}`;
    const inp = document.createElement('input');
    inp.type = 'text'; inp.placeholder = f.placeholder;
    inp.addEventListener('input', () => {
      const v = inp.value.trim();
      state[f.key] = f.isArray ? (v?v.split(',').map(s=>s.trim()).filter(Boolean):[]) : v;
      card.classList.toggle('empty', !v);
      rebuild();
    });
    fieldInputs[f.key] = inp;
    card.appendChild(lbl); card.appendChild(inp);
    fieldsGrid.appendChild(card);
  });
}

// ── Tabs ───────────────────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      $('page-'+tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab==='history') renderHistory();
      if (tab.dataset.tab==='bitbucket') renderFavorites();
      if (tab.dataset.tab==='github') renderGhFavorites();
    });
  });
}

function switchToTab(name) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelector(`[data-tab="${name}"]`).classList.add('active');
  $('page-'+name).classList.add('active');
  if (name==='bitbucket') renderFavorites();
  if (name==='github') renderGhFavorites();
}

// ── Detect from Jira tab ───────────────────────────────────────────────────
async function detectFromTab() {
  try {
    const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
    if (!tab) return;
    const isJira = /atlassian\.net|jira\.com/.test(tab.url||'');
    if (!isJira) {
      setStatus('off','Not Jira');
      const m = (tab.title||'').match(/\[?([A-Z]+-\d+)\]?\s*[-:]?\s*(.*?)(?:\s*[-|]\s*Jira.*)?$/i);
      if (m?.[1]) fillContext({ticketId:m[1].toUpperCase(), title:m[2]?.trim()||''});
      return;
    }
    setStatus('loading','Reading…');
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']}).catch(()=>{});
    const resp = await chrome.tabs.sendMessage(tab.id,{action:'getTicketInfo'}).catch(()=>null);
    if (resp?.ticketId) { setStatus('on','Detected'); fillContext(resp); }
    else setStatus('off','No ticket');
  } catch(e) { setStatus('err','Error'); }
}

function fillContext(info) {
  state.ticketId   = (info.ticketId  ||'').toUpperCase();
  state.title      = info.title      ||'';
  state.sprintId   = info.sprintId   ||'';
  state.parentId   = (info.parentId  ||'').toUpperCase();
  state.assignee   = info.assignee   ||'';
  state.labels     = info.labels     ||[];
  state.components = info.components ||[];
  state.issueType  = info.issueType  ||'';
  state.priority   = info.priority   ||'';
  Object.keys(fieldInputs).forEach(k => {
    const inp = fieldInputs[k];
    if (!inp) return;
    inp.value = Array.isArray(state[k]) ? state[k].join(', ') : (state[k]||'');
    inp.closest('.field-card').classList.toggle('empty', !inp.value);
  });
  fieldsSection.style.display = 'flex';
  rebuild();
}

// ── Rebuild branch ─────────────────────────────────────────────────────────
function rebuild() {
  if (!state.ticketId) { branchWrap.classList.remove('show'); optChips.style.display='none'; return; }
  const opts = {
    sprintId:state.sprintId||null, parentId:state.parentId||null,
    assignee:state.assignee||null, labels:state.labels, components:state.components,
    issueType:state.issueType||null, priority:state.priority||null,
    removeStopWords:swChk.checked, uppercaseId:upperChk.checked,
    maxWords:8, template:state.template||DEFAULT_TPL,
  };
  state.branch = generateBranchName(state.ticketId, state.title, opts);
  const varMap = buildVarMap(state.ticketId, state.title, opts);
  branchDisp.innerHTML = coloriseBranch(state.branch, varMap);

  // Base branch
  const hasParent = !!state.parentId;
  baseRow.classList.toggle('show', hasParent);
  if (hasParent && baseChk.checked) {
    const parts = [];
    if (state.sprintId) parts.push(`s${state.sprintId}`);
    parts.push(upperChk.checked ? state.parentId.toUpperCase() : state.parentId.toLowerCase());
    parts.push('base');
    state.baseBranch = parts.join('/');
    baseBranchDisp.innerHTML = state.baseBranch.split('/').map((p,i,arr) => {
      const sep = i<arr.length-1?`<span class="t-sep">/</span>`:'';
      if (/^s\d+$/.test(p)) return `<span class="t-sprint">${esc(p)}</span>${sep}`;
      if (p.toUpperCase()===state.parentId.toUpperCase()) return `<span class="t-parent">${esc(p)}</span>${sep}`;
      return `<span class="t-raw" style="color:var(--txm)">${esc(p)}</span>${sep}`;
    }).join('');
  } else { state.baseBranch = ''; }

  branchWrap.classList.add('show');
  optChips.style.display = '';
}

function coloriseBranch(branch, varMap) {
  const classMap = {sprint:'t-sprint',parent:'t-parent',ticket:'t-ticket',slug:'t-slug',
    assignee:'t-assignee',label:'t-label',component:'t-component',type:'t-type',priority:'t-priority',title:'t-slug'};
  const v2c = {};
  Object.entries(varMap).forEach(([k,v]) => { if (v && classMap[k]) v2c[v]=classMap[k]; });
  return branch.split('/').map((part,i,arr) => {
    const sep = i<arr.length-1?`<span class="t-sep">/</span>`:'';
    let html = `<span class="t-raw">${esc(part)}</span>`;
    for (const [val,cls] of Object.entries(v2c)) {
      if (val && part===val) { html=`<span class="${cls}">${esc(part)}</span>`; break; }
    }
    const tv = varMap.ticket||'';
    if (tv && part.startsWith(tv)) {
      html=`<span class="t-ticket">${esc(tv)}</span><span class="t-slug">${esc(part.slice(tv.length))}</span>`;
    }
    return html+sep;
  }).join('');
}

// ── Copy & Create ──────────────────────────────────────────────────────────
function doCopy(text, box) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    if (box) { box.classList.add('copied'); setTimeout(()=>box.classList.remove('copied'),1200); }
    showToast('✓ Copied!');
    saveHistory(text).then(renderHistory);
  });
}

branchBox.addEventListener('click', e => { if (!e.target.closest('button')) doCopy(state.branch, branchBox); });
copyBtn.addEventListener('click', e => { e.stopPropagation(); doCopy(state.branch, branchBox); });
baseBranchBox.addEventListener('click', e => { if (!e.target.closest('button')) doCopy(state.baseBranch, baseBranchBox); });
baseCopyBtn.addEventListener('click', e => { e.stopPropagation(); doCopy(state.baseBranch, baseBranchBox); });

createBtn.addEventListener('click', e => { e.stopPropagation(); openModal(state.branch); });
baseCreateBtn.addEventListener('click', e => { e.stopPropagation(); openModal(state.baseBranch); });

// ── Options ────────────────────────────────────────────────────────────────
swChip.addEventListener('click', () => { swChk.checked=!swChk.checked; swChip.classList.toggle('on',swChk.checked); saveOptions(); rebuild(); });
upperChip.addEventListener('click', () => { upperChk.checked=!upperChk.checked; upperChip.classList.toggle('on',upperChk.checked); saveOptions(); rebuild(); });
baseChip.addEventListener('click', () => { baseChk.checked=!baseChk.checked; baseChip.classList.toggle('on',baseChk.checked); saveOptions(); rebuild(); });

async function saveOptions() {
  await chrome.storage.local.set({opts:{sw:swChk.checked,upper:upperChk.checked,base:baseChk.checked,tpl:state.template}});
}
async function loadOptions() {
  const {opts} = await chrome.storage.local.get('opts');
  if (opts) {
    swChk.checked=opts.sw!==false; upperChk.checked=opts.upper!==false;
    baseChk.checked=opts.base!==false; state.template=opts.tpl||DEFAULT_TPL;
  }
  swChip.classList.toggle('on',swChk.checked);
  upperChip.classList.toggle('on',upperChk.checked);
  baseChip.classList.toggle('on',baseChk.checked);
}

// ── Manual ─────────────────────────────────────────────────────────────────
genBtn.addEventListener('click', handleManual);
manualInput.addEventListener('keydown', e => { if (e.key==='Enter') handleManual(); });
function handleManual() {
  const raw = manualInput.value.trim(); if (!raw) return;
  const p = parseManualInput(raw); if (!p?.ticketId) { flash(manualInput); return; }
  fillContext(p); setStatus('on','Manual');
}

// ── Presets ────────────────────────────────────────────────────────────────
async function loadPresets() {
  const {presets} = await chrome.storage.local.get('presets');
  const list = presets || DEFAULT_PRESETS;
  if (!presets) await chrome.storage.local.set({presets:DEFAULT_PRESETS});
  renderPresets(list);
}
async function renderPresets(list) {
  if (!list) { const {presets}=await chrome.storage.local.get('presets'); list=presets||DEFAULT_PRESETS; }
  presetList.innerHTML='';
  list.forEach((p,idx) => {
    const el = document.createElement('div');
    el.className='preset-item'+(p.tpl===state.template?' active':'');
    el.innerHTML=`
      <span class="pi-tpl" title="${esc(p.name)}">${esc(p.tpl)}</span>
      <span class="pi-name">${esc(p.name)}</span>
      <button class="pi-del" title="Remove">×</button>`;
    el.querySelector('.pi-tpl').addEventListener('click', () => {
      state.template=p.tpl; saveOptions(); rebuild(); renderPresets(list);
    });
    el.querySelector('.pi-del').addEventListener('click', async () => {
      const {presets:cur}=await chrome.storage.local.get('presets');
      const next=(cur||DEFAULT_PRESETS).filter((_,i)=>i!==idx);
      await chrome.storage.local.set({presets:next});
      if (state.template===p.tpl&&next.length){state.template=next[0].tpl;saveOptions();rebuild();}
      renderPresets(next);
    });
    presetList.appendChild(el);
  });
}
addPresetBtn.addEventListener('click', async () => {
  const name=newPresetName.value.trim(), tpl=newPresetTpl.value.trim();
  if (!tpl) { flash(newPresetTpl); return; }
  const {presets:cur}=await chrome.storage.local.get('presets');
  const list=cur||DEFAULT_PRESETS;
  if (list.find(p=>p.tpl===tpl)) { showToast('Already exists!'); return; }
  const next=[...list,{name:name||tpl,tpl}];
  await chrome.storage.local.set({presets:next});
  newPresetName.value=''; newPresetTpl.value='';
  state.template=tpl; saveOptions(); rebuild(); renderPresets(next);
});

// ── Var pills ──────────────────────────────────────────────────────────────
function setupVarPills() {
  VAR_META.forEach(v => {
    const el=document.createElement('span');
    el.className=`vp ${v.cls}`; el.textContent=v.label; el.title=`e.g. "${v.desc}"`;
    el.addEventListener('click', () => {
      const pos=newPresetTpl.selectionStart??newPresetTpl.value.length;
      newPresetTpl.value=newPresetTpl.value.slice(0,pos)+v.label+newPresetTpl.value.slice(pos);
      newPresetTpl.focus();
      newPresetTpl.setSelectionRange(pos+v.label.length,pos+v.label.length);
    });
    varGrid.appendChild(el);
  });
}

// ── Bitbucket ──────────────────────────────────────────────────────────────
async function initBitbucket() {
  try {
    const info = await bbIsLoggedIn();
    if (info?.loggedIn) showBBConnected();
  } catch(e) {}
}

function showBBConnected() {
  bbAuthPanel.style.display   = 'none';
  bbUserCard.style.display    = '';
  bbFavsSection.style.display = 'flex';
  bbTab.classList.add("connected");
  loadBBUser();
  loadWorkspaces();
}
function showBBDisconnected() {
  bbAuthPanel.style.display = '';
  bbUserCard.style.display  = 'none';
  bbFavsSection.style.display = 'none';
  bbTab.classList.remove("connected");
  bbAvatar.src = ''; bbUserName.textContent='—';
}

async function loadBBUser() {
  try {
    const user = await bbGetUser();
    bbUserName.textContent = user.display_name || user.nickname || '—';
    if (user.links?.avatar?.href) bbAvatar.src = user.links.avatar.href;
  } catch(e) {}
}
async function loadWorkspaces() {
  try {
    wsSelect.innerHTML='<option value="">Loading…</option>';
    const ws = await bbGetWorkspaces();
    wsSelect.innerHTML='<option value="">Select workspace</option>';
    ws.forEach(w => {
      const o=document.createElement('option');
      o.value = w.slug || w.uuid;
      o.textContent = w.name || w.slug || w.uuid;
      wsSelect.appendChild(o);
    });
  } catch(e) { wsSelect.innerHTML='<option value="">Error loading</option>'; }
}
wsSelect.addEventListener('change', async () => {
  const ws=wsSelect.value;
  repoSelect.innerHTML='<option value="">Loading…</option>';
  if (!ws) { repoSelect.innerHTML='<option value="">Select workspace first</option>'; return; }
  try {
    const repos=await bbGetRepos(ws);
    repoSelect.innerHTML='<option value="">Select repo</option>';
    repos.forEach(r => {
      const o=document.createElement('option');
      o.value=r.slug; o.textContent=r.name||r.slug;
      repoSelect.appendChild(o);
    });
  } catch(e) { repoSelect.innerHTML='<option value="">Error</option>'; }
});
addFavBtn.addEventListener('click', async () => {
  const ws=wsSelect.value, repo=repoSelect.value;
  if (!ws||!repo) { showToast('Select workspace and repo'); return; }
  await addFavorite(ws,repo); renderFavorites(); showToast('★ Added!');
});
async function renderFavorites() {
  const favs=await getFavorites();
  favList.innerHTML='';
  if (!favs.length) { favList.innerHTML='<div class="hint" style="padding:4px 0">No favorites yet.</div>'; return; }
  favs.forEach(f => {
    const el=document.createElement('div');
    el.className='fav-item';
    el.innerHTML=`<span class="fi-name">${esc(f.key)}</span><button class="fi-del">×</button>`;
    el.querySelector('.fi-del').addEventListener('click', async () => {
      await removeFavorite(f.workspace,f.repo); renderFavorites();
    });
    favList.appendChild(el);
  });
}

// API Token
bbSaveAppPass.addEventListener('click', async () => {
  const u=bbUsername.value.trim(), p=bbAppPass.value.trim();
  if (!u||!p) { if(!u)flash(bbUsername); if(!p)flash(bbAppPass); return; }
  bbSaveAppPass.disabled=true;
  bbSaveAppPass.innerHTML='<span class="spinner"></span> Verifying…';
  try {
    await bbAppPasswordLogin(u,p);
    showBBConnected();
    renderFavorites();
    showToast('✓ Connected!');
    bbUsername.value=''; bbAppPass.value='';
  } catch(e) {
    showToast(e.message, true);
    flash(bbAppPass);
  } finally {
    bbSaveAppPass.disabled=false;
    bbSaveAppPass.innerHTML='Save & Connect';
  }
});

bbLogoutBtn.addEventListener('click', async () => {
  await clearTokens(); showBBDisconnected(); showToast('Disconnected');
});

// ── Create branch modal ────────────────────────────────────────────────────
async function openModal(branchName) {
  if (!branchName) return;

  const bbLoggedIn = await bbIsLoggedIn().catch(()=>null);
  const ghLoggedIn = await ghIsLoggedIn().catch(()=>false);

  if (!bbLoggedIn?.loggedIn && !ghLoggedIn) {
    showToast('Connect Bitbucket or GitHub first');
    switchToTab('bitbucket');
    return;
  }

  state.pendingBranch = branchName;
  modalBranchName.textContent = branchName;
  modalTitle.textContent = 'Create Branch';
  modalBody.innerHTML='';
  modalConfirm.disabled=false;

  const bbFavs = bbLoggedIn?.loggedIn ? await getFavorites() : [];
  const ghFavs = ghLoggedIn ? await ghGetFavorites() : [];

  if (!bbFavs.length && !ghFavs.length) {
    modalBody.innerHTML=`<div class="hint" style="padding:8px 0">No favorite repos. Add some in <strong>Bitbucket</strong> or <strong>GitHub</strong> tab.</div>`;
    modalConfirm.disabled=true;
  } else {
    const list=document.createElement('div'); list.className='repo-list';

    // Bitbucket repos
    if (bbFavs.length) {
      const lbl=document.createElement('div');
      lbl.style.cssText='font-size:10px;color:var(--blue);font-weight:600;padding:2px 0;';
      lbl.textContent='🪣 Bitbucket';
      list.appendChild(lbl);
      bbFavs.forEach(f => {
        const item=document.createElement('div');
        item.className='repo-item checked';
        item.dataset.platform='bitbucket';
        item.dataset.workspace=f.workspace;
        item.dataset.repo=f.repo;
        item.innerHTML=`<div class="repo-check">✓</div><div><div class="repo-name">${esc(f.repo)}</div><div class="repo-ws">${esc(f.workspace)}</div></div>`;
        item.addEventListener('click',()=>item.classList.toggle('checked'));
        list.appendChild(item);
      });
    }

    // GitHub repos
    if (ghFavs.length) {
      const lbl=document.createElement('div');
      lbl.style.cssText='font-size:10px;color:var(--green);font-weight:600;padding:6px 0 2px;';
      lbl.textContent='🐙 GitHub';
      list.appendChild(lbl);
      ghFavs.forEach(f => {
        const item=document.createElement('div');
        item.className='repo-item checked';
        item.dataset.platform='github';
        item.dataset.owner=f.owner;
        item.dataset.repo=f.repo;
        item.dataset.key=f.key;
        item.innerHTML=`<div class="repo-check">✓</div><div><div class="repo-name">${esc(f.repo)}</div><div class="repo-ws">${esc(f.owner)}</div></div>`;
        item.addEventListener('click',()=>item.classList.toggle('checked'));
        list.appendChild(item);
      });
    }

    modalBody.appendChild(list);

    // From branch input
    const fromRow = document.createElement('div');
    fromRow.style.cssText = 'display:flex;flex-direction:column;gap:4px;margin-top:4px;';
    fromRow.innerHTML = `
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--tx3);">Branch from</div>
      <input class="txt" type="text" id="fromBranchInput" placeholder="Leave empty to use default branch (main/master)" style="font-size:11px" />
      <div class="hint">Leave empty → auto-detect each repo's default branch</div>
    `;
    modalBody.appendChild(fromRow);
  }
  modalOverlay.classList.add('show');
}

modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e=>{ if(e.target===modalOverlay) closeModal(); });
function closeModal() { modalOverlay.classList.remove('show'); state.pendingBranch=''; }

modalConfirm.addEventListener('click', async () => {
  const selected=[...modalBody.querySelectorAll('.repo-item.checked')];
  if (!selected.length) { showToast('Select at least one repo'); return; }
  const fromBranch = ($('fromBranchInput')?.value.trim()) || null;
  modalConfirm.disabled=true;
  modalConfirm.innerHTML='<span class="spinner"></span> Creating…';

  const resultsDiv=document.createElement('div');
  resultsDiv.style.cssText='display:flex;flex-direction:column;gap:4px;margin-top:8px;';
  modalBody.appendChild(resultsDiv);

  const results=await Promise.allSettled(
    selected.map(item => {
      if (item.dataset.platform === 'github') {
        return ghCreateBranch(item.dataset.owner, item.dataset.repo, state.pendingBranch, fromBranch);
      } else {
        return bbCreateBranch(item.dataset.workspace, item.dataset.repo, state.pendingBranch, fromBranch);
      }
    })
  );

  resultsDiv.innerHTML='';
  let allOk=true;
  results.forEach((r,i)=>{
    const item=selected[i];
    const el=document.createElement('div');
    const repoLabel = item.dataset.platform==='github'
      ? `${item.dataset.owner}/${item.dataset.repo}`
      : `${item.dataset.workspace}/${item.dataset.repo}`;
    const icon = item.dataset.platform==='github' ? '🐙' : '🪣';
    if (r.status==='fulfilled') {
      el.className='result-item ok';
      el.innerHTML=`<span>✓</span><span class="ri-repo">${icon} ${esc(repoLabel)}</span>`;
    } else {
      allOk=false;
      el.className='result-item err';
      el.innerHTML=`<span>✗</span><span class="ri-repo">${icon} ${esc(repoLabel)}</span><span style="font-size:10px;margin-left:4px">${esc(r.reason?.message||'Error')}</span>`;
    }
    resultsDiv.appendChild(el);
  });

  modalConfirm.innerHTML='Done'; modalConfirm.disabled=false;
  if (allOk) { saveHistory(state.pendingBranch).then(renderHistory); setTimeout(closeModal,1500); }
});

// ── GitHub ─────────────────────────────────────────────────────────────────
async function initGitHub() {
  const loggedIn = await ghIsLoggedIn();
  if (loggedIn) showGhConnected();
}

function showGhConnected() {
  ghAuthPanel.style.display   = 'none';
  ghUserCard.style.display    = '';
  ghFavsSection.style.display = 'flex';
  ghTab.classList.add("gh-connected");
  loadGhUser();
  loadGhOrgs();
}
function showGhDisconnected() {
  ghAuthPanel.style.display   = '';
  ghUserCard.style.display    = 'none';
  ghFavsSection.style.display = 'none';
  ghTab.classList.remove("gh-connected");
  ghAvatar.src=''; ghUserName.textContent='—';
}

async function loadGhUser() {
  try {
    const { gh_token } = await chrome.storage.local.get('gh_token');
    if (!gh_token) return;
    const resp = await fetch('https://api.github.com/user', {
      headers: { 'Authorization': `Bearer ${gh_token}`, 'Accept': 'application/vnd.github+json' }
    });
    if (resp.ok) {
      const user = await resp.json();
      ghUserName.textContent = user.login || '—';
      if (user.avatar_url) ghAvatar.src = user.avatar_url;
    }
  } catch(e) {}
}

async function loadGhOrgs() {
  try {
    ghOrgSelect.innerHTML = '<option value="">Loading…</option>';
    const orgs = await ghGetOrgs();
    ghOrgSelect.innerHTML = '<option value="">Select account/org</option>';
    orgs.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.login;
      opt.textContent = o.login + (o.type === 'Organization' ? ' (org)' : ' (you)');
      ghOrgSelect.appendChild(opt);
    });
  } catch(e) {
    ghOrgSelect.innerHTML = '<option value="">Error loading</option>';
  }
}

ghSaveBtn.addEventListener('click', async () => {
  const t = ghTokenInp.value.trim();
  const u = ghUsernameInp.value.trim();
  if (!t) { flash(ghTokenInp); return; }
  ghSaveBtn.disabled=true;
  ghSaveBtn.innerHTML='<span class="spinner"></span> Verifying…';
  try {
    await ghLogin(u, t);
    showGhConnected();
    renderGhFavorites();
    showToast('✓ Connected to GitHub!');
    ghUsernameInp.value=''; ghTokenInp.value='';
  } catch(e) {
    showToast(e.message, true);
    flash(ghTokenInp);
  } finally {
    ghSaveBtn.disabled=false;
    ghSaveBtn.innerHTML='🔗 Save & Connect';
  }
});

ghLogoutBtn.addEventListener('click', async () => {
  await ghClearToken();
  showGhDisconnected();
  showToast('Disconnected from GitHub');
});

ghOrgSelect.addEventListener('change', async () => {
  const org = ghOrgSelect.value;
  ghRepoSelect.innerHTML = '<option value="">Loading…</option>';
  if (!org) { ghRepoSelect.innerHTML = '<option value="">Select account first</option>'; return; }
  try {
    const repos = await ghGetRepos(org);
    ghRepoSelect.innerHTML = '<option value="">Select repo</option>';
    repos.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.name;
      opt.textContent = r.name + (r.private ? ' 🔒' : '');
      ghRepoSelect.appendChild(opt);
    });
  } catch(e) {
    ghRepoSelect.innerHTML = '<option value="">Error loading</option>';
  }
});

ghAddFavBtn.addEventListener('click', async () => {
  // Try dropdown first, fall back to manual input
  const org  = ghOrgSelect?.value;
  const repo = ghRepoSelect?.value;
  const manual = ghRepoInput?.value.trim();

  const val = (org && repo) ? `${org}/${repo}` : manual;
  if (!val || !val.includes('/')) {
    showToast('Select a repo or type owner/repo', true);
    return;
  }
  ghAddFavBtn.disabled=true;
  ghAddFavBtn.textContent='Checking…';
  try {
    await ghAddFavorite(val);
    if (ghRepoInput) ghRepoInput.value='';
    renderGhFavorites();
    showToast('★ Added!');
  } catch(e) {
    showToast(e.message, true);
  } finally {
    ghAddFavBtn.disabled=false;
    ghAddFavBtn.textContent='★ Add to favorites';
  }
});

async function renderGhFavorites() {
  const favs = await ghGetFavorites();
  ghFavList.innerHTML='';
  if (!favs.length) {
    ghFavList.innerHTML='<div class="hint" style="padding:4px 0">No favorites yet.</div>';
    return;
  }
  favs.forEach(f => {
    const el=document.createElement('div');
    el.className='fav-item';
    el.innerHTML=`<span class="fi-name">${esc(f.key)}</span><button class="fi-del">×</button>`;
    el.querySelector('.fi-del').addEventListener('click', async () => {
      await ghRemoveFavorite(f.key); renderGhFavorites();
    });
    ghFavList.appendChild(el);
  });
}

// ── History ────────────────────────────────────────────────────────────────
async function saveHistory(b) {
  const {history:h=[]}=await chrome.storage.local.get('history');
  await chrome.storage.local.set({history:[b,...h.filter(x=>x!==b)].slice(0,MAX_HISTORY)});
}
async function renderHistory() {
  const {history:h=[]}=await chrome.storage.local.get('history');
  histList.innerHTML='';
  if (!h.length){histList.innerHTML='<div class="hint" style="padding:8px 0">No history yet.</div>';return;}
  h.forEach(b=>{
    const el=document.createElement('div'); el.className='hi';
    el.innerHTML=`<span class="hi-name">${esc(b)}</span><span class="hi-icon">⎘</span>`;
    el.addEventListener('click',()=>navigator.clipboard.writeText(b).then(()=>showToast('✓ Copied!')));
    histList.appendChild(el);
  });
}
clearBtn.addEventListener('click',async()=>{await chrome.storage.local.set({history:[]});renderHistory();});

// ── Helpers ────────────────────────────────────────────────────────────────
function setStatus(t,txt){dot.className='dot'+(t==='on'?' on':t==='err'?' err':'');statusTxt.textContent=txt;}
function showToast(msg,isErr=false){
  toast.textContent=msg;
  toast.classList.toggle('error',isErr);
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),2000);
}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function flash(el){el.style.borderColor='var(--red)';setTimeout(()=>{el.style.borderColor='';},700);}

init();
