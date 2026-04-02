// branchUtils.js – template engine with full variable support

const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for',
  'of','with','by','from','as','is','was','are','were','be',
  'been','being','have','has','had','do','does','did','will',
  'would','could','should','may','might','shall','can',
  'this','that','these','those','it','its',
]);

function titleToSlug(title, opts = {}) {
  const { maxWords = 8, maxLength = 60, removeStopWords = true } = opts;
  if (!title) return '';
  let slug = title
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[:/\\_|]+/g, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toLowerCase().replace(/\s+/g, ' ').trim();
  let words = slug.split(' ').filter(Boolean);
  if (removeStopWords && words.length > 3) {
    const f = words.filter(w => !STOP_WORDS.has(w));
    if (f.length >= 2) words = f;
  }
  words = words.slice(0, maxWords);
  slug = words.join('-');
  if (slug.length > maxLength) slug = slug.substring(0, maxLength).replace(/-[^-]*$/, '');
  return slug;
}

/**
 * All supported template variables:
 *
 *  {sprint}     → "s200"          (sprint number, prefixed with s)
 *  {parent}     → "LH-48141"      (parent ticket ID)
 *  {ticket}     → "LH-48913"      (current ticket ID)
 *  {slug}       → "planning-system-implement..." (title slug, stop words removed)
 *  {title}      → "Planning-System-Implement..." (raw title, spaces→dashes)
 *  {assignee}   → "nguyen-van-a"  (assignee display name, slugified)
 *  {label}      → "backend"       (first label)
 *  {component}  → "portal"        (first component)
 *  {priority}   → "high"
 *  {type}       → "story" | "bug" | "task"
 *
 * Segments separated by "/" are auto-dropped when ALL their vars are empty.
 */
function buildVarMap(ticketId, title, opts = {}) {
  const {
    sprintId        = null,
    parentId        = null,
    assignee        = null,
    labels          = [],
    components      = [],
    priority        = null,
    issueType       = null,
    removeStopWords = true,
    uppercaseId     = true,
    maxWords        = 8,
  } = opts;

  const fmt = id => id ? (uppercaseId ? id.toUpperCase() : id.toLowerCase()) : '';

  return {
    sprint:    sprintId   ? `s${sprintId}`        : '',
    parent:    fmt(parentId),
    ticket:    fmt(ticketId),
    slug:      titleToSlug(title, { maxWords, removeStopWords }),
    title:     title      ? title.replace(/\s+/g, '-') : '',
    assignee:  assignee   || '',
    label:     labels?.[0]     || '',
    component: components?.[0] || '',
    priority:  priority   || '',
    type:      issueType  || '',
  };
}

function applyTemplate(template, varMap) {
  const segments = template.split('/');
  const resolved = segments.map(seg =>
    seg.replace(/\{(\w+)\}/g, (_, key) =>
      varMap[key] !== undefined ? varMap[key] : `{${key}}`
    )
  );
  return resolved
    .filter(seg => seg.trim() !== '' && seg.trim() !== '-')
    .map(seg => seg.replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-'))
    .filter(Boolean)
    .join('/');
}

function generateBranchName(ticketId, title, opts = {}) {
  const { template = '{sprint}/{parent}/{ticket}-{slug}' } = opts;
  const varMap = buildVarMap(ticketId, title, opts);
  return applyTemplate(template, varMap);
}

function parseManualInput(raw) {
  const text = raw.trim();
  if (!text) return null;
  const sm = text.match(/\bs(\d+)\b/i) || text.match(/^(\d+)\b/);
  const sprintId = sm ? sm[1] : null;
  const ticketRe = /\b([A-Z]+-\d+)\b/gi;
  const ids = [];
  let m;
  while ((m = ticketRe.exec(text)) !== null) ids.push(m[1].toUpperCase());
  if (!ids.length) return null;
  const ticketId = ids[ids.length - 1];
  const parentId = ids.length >= 2 ? ids[ids.length - 2] : null;
  const lastIdx  = text.toUpperCase().lastIndexOf(ticketId);
  const title    = text.substring(lastIdx + ticketId.length).replace(/^[\]\s:,-]+/, '').trim();
  return { ticketId, parentId, sprintId, title };
}

// Variable metadata for UI rendering
const VAR_META = [
  { key: 'sprint',    label: '{sprint}',    cls: 'sprint',    desc: 's200',           group: 'context'  },
  { key: 'parent',    label: '{parent}',    cls: 'parent',    desc: 'LH-48141',       group: 'context'  },
  { key: 'ticket',    label: '{ticket}',    cls: 'ticket',    desc: 'LH-48913',       group: 'context'  },
  { key: 'slug',      label: '{slug}',      cls: 'slug',      desc: 'title-as-slug',  group: 'title'    },
  { key: 'title',     label: '{title}',     cls: 'title',     desc: 'Raw-Title',      group: 'title'    },
  { key: 'assignee',  label: '{assignee}',  cls: 'assignee',  desc: 'john-doe',       group: 'people'   },
  { key: 'label',     label: '{label}',     cls: 'label',     desc: 'backend',        group: 'classify' },
  { key: 'component', label: '{component}', cls: 'component', desc: 'portal',         group: 'classify' },
  { key: 'type',      label: '{type}',      cls: 'type',      desc: 'bug · story',    group: 'classify' },
  { key: 'priority',  label: '{priority}',  cls: 'priority',  desc: 'high · low',     group: 'classify' },
];

if (typeof module !== 'undefined') {
  module.exports = { titleToSlug, buildVarMap, applyTemplate, generateBranchName, parseManualInput, VAR_META };
}
