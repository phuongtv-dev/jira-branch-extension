// content.js – Jira Cloud field extractor
// Extracts: ticketId, title, sprintId, parentId,
//           assignee, labels[], components[], priority, issueType

function extractTicketInfo() {
  const result = {
    ticketId:   null,
    title:      null,
    sprintId:   null,
    parentId:   null,
    assignee:   null,   // e.g. "nguyen-van-a"  (slugified)
    labels:     [],     // e.g. ["backend","api"]
    components: [],     // e.g. ["portal","auth"]
    priority:   null,   // e.g. "high"
    issueType:  null,   // e.g. "story","bug","task"
    url: window.location.href,
  };

  // ── 1. TICKET ID ───────────────────────────────────────────────────────

  const urlMatch = window.location.pathname.match(/\/browse\/([A-Z]+-\d+)|\/issues\/([A-Z]+-\d+)/i);
  if (urlMatch) result.ticketId = (urlMatch[1] || urlMatch[2]).toUpperCase();

  // Also check URL params: ?selectedIssue=LH-48913 or ?issueKey=LH-48913
  if (!result.ticketId) {
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('selectedIssue') || params.get('issueKey') || params.get('issue');
    if (paramId) {
      const m = paramId.match(/([A-Z]+-\d+)/i);
      if (m) result.ticketId = m[1].toUpperCase();
    }
  }

  if (!result.ticketId) {
    const m = document.title.match(/\[?([A-Z]+-\d+)\]?/i);
    if (m) result.ticketId = m[1].toUpperCase();
  }

  for (const sel of [
    // Standard issue page
    '[data-testid="issue.views.issue-base.foundation.breadcrumbs.current-issue.item"]',
    '[class*="IssueKey"]', '[data-issue-key]', '#key-val', '.ghx-key',
    // Sidebar / panel view (Jira board, backlog, list view)
    '[data-testid*="issue-key"]',
    '[data-testid*="issueKey"]',
    '[class*="issueKey"]',
    '[class*="issue-key"]',
    // Jira work item panel (from screenshot)
    '[data-component-selector="issue-view-foundation.ui.issue-key"] a',
    '[data-testid="platform-board-kit.ui.card.card"] [data-testid*="key"]',
    // Breadcrumb in sidebar panel
    'nav[aria-label*="breadcrumb"] a[href*="/browse/"]',
    'a[href*="/browse/"][class*="issue"]',
  ]) {
    if (result.ticketId) break;
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      const text = (el.textContent || el.getAttribute('href') || '').trim();
      const m = text.match(/\b([A-Z]+-\d+)\b/i);
      if (m) { result.ticketId = m[1].toUpperCase(); break; }
    }
  }

  // Last resort: scan all links on page for /browse/TICKET-ID pattern
  if (!result.ticketId) {
    for (const a of document.querySelectorAll('a[href*="/browse/"]')) {
      const m = a.getAttribute('href').match(/\/browse\/([A-Z]+-\d+)/i);
      if (m) {
        // Skip if it's a parent/epic link (usually in breadcrumbs above)
        result.ticketId = m[1].toUpperCase();
        break;
      }
    }
  }

  // ── 2. TITLE ───────────────────────────────────────────────────────────

  for (const sel of [
    '[data-testid="issue.views.issue-base.foundation.summary.heading"]',
    'h1[class*="summary"]', '#summary-val', '[class*="issueTitle"]',
    // Sidebar panel selectors
    '[data-testid*="summary"] h1',
    '[data-testid*="issue-title"]',
    '[class*="issue-title"]',
    '[class*="issueSummary"]',
    // Panel header
    '[role="dialog"] h1',
    '[role="complementary"] h1',
    'h1',
  ]) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.textContent.trim().replace(/^\[?[A-Z]+-\d+\]?\s*[-:]?\s*/i, '').trim();
      if (text.length > 3) { result.title = text; break; }
    }
  }
  if (!result.title) {
    const t = document.title
      .replace(/\[?[A-Z]+-\d+\]?\s*/gi, '')
      .replace(/[-|]\s*(Jira|Atlassian).*$/i, '').trim();
    if (t.length > 3) result.title = t;
  }

  // ── 3. PARENT ──────────────────────────────────────────────────────────

  result.parentId = extractParentId(result.ticketId);

  // ── 4. SPRINT ──────────────────────────────────────────────────────────

  result.sprintId = extractSprintId();

  // ── 5. ASSIGNEE ────────────────────────────────────────────────────────

  result.assignee = extractAssignee();

  // ── 6. LABELS ──────────────────────────────────────────────────────────

  result.labels = extractLabels();

  // ── 7. COMPONENTS ──────────────────────────────────────────────────────

  result.components = extractComponents();

  // ── 8. PRIORITY ────────────────────────────────────────────────────────

  result.priority = extractPriority();

  // ── 9. ISSUE TYPE ──────────────────────────────────────────────────────

  result.issueType = extractIssueType();

  return result;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Extract text from a sidebar field by its label name (case-insensitive). */
function getSidebarFieldText(labelName) {
  // New Jira Cloud: data-testid pattern
  const testIdPatterns = [
    `[data-testid*="${labelName.toLowerCase()}"]`,
    `[data-testid*="${labelName.replace(/\s+/g,'-').toLowerCase()}"]`,
  ];
  for (const sel of testIdPatterns) {
    const el = document.querySelector(sel + ' [class*="field-value"]')
             || document.querySelector(sel + ' span')
             || document.querySelector(sel + ' a');
    if (el) {
      const t = el.textContent.trim();
      if (t && t !== 'None' && t !== '-') return t;
    }
  }

  // Fallback: scan all sidebar label elements
  for (const label of document.querySelectorAll(
    '[class*="label"],[class*="field-label"],[class*="FieldLabel"],[data-testid*="label"]'
  )) {
    if (!new RegExp(`^${labelName}$`, 'i').test(label.textContent.trim())) continue;
    const container = label.closest('[class*="field"],[class*="Field"]') || label.parentElement;
    if (!container) continue;
    const val = container.querySelector('[class*="value"] span, [class*="value"] a, a, span');
    if (val) {
      const t = val.textContent.trim();
      if (t && t !== 'None' && t !== '-') return t;
    }
  }
  return null;
}

/** Get all text values from a multi-value sidebar field (labels, components). */
function getSidebarFieldMulti(labelName) {
  const results = [];

  // Try data-testid approach first
  const container = document.querySelector(
    `[data-testid*="${labelName.toLowerCase()}"], [data-testid*="${labelName.replace(/\s+/g,'-').toLowerCase()}"]`
  );
  if (container) {
    container.querySelectorAll('a, span[class*="tag"], span[class*="label"], span[class*="lozenge"]')
      .forEach(el => {
        const t = el.textContent.trim();
        if (t && t !== 'None' && !results.includes(t)) results.push(t);
      });
    if (results.length) return results;
  }

  // Fallback: scan sidebar labels
  for (const label of document.querySelectorAll(
    '[class*="label"],[class*="field-label"],[class*="FieldLabel"],[data-testid*="label"]'
  )) {
    if (!new RegExp(`^${labelName}$`, 'i').test(label.textContent.trim())) continue;
    const fieldContainer = label.closest('[class*="field"],[class*="Field"]') || label.parentElement;
    if (!fieldContainer) continue;
    fieldContainer.querySelectorAll('a, span[class*="tag"], span[class*="label"]').forEach(el => {
      const t = el.textContent.trim();
      if (t && t !== 'None' && !results.includes(t)) results.push(t);
    });
    break;
  }
  return results;
}

/** Slugify a display name for use in branch names. */
function slugify(text) {
  if (!text) return '';
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Field extractors ───────────────────────────────────────────────────────

function extractParentId(selfId) {
  for (const sel of [
    '[data-testid="issue.views.issue-base.foundation.breadcrumbs.parent-issue.item"]',
    '[data-testid*="parent"] a',
    '[data-testid*="parentLink"] a',
    '[data-testid*="epic-link"] a',
    '[class*="ParentLink"] a',
    '[class*="breadcrumb"] a[href*="/browse/"]',
    '.parentIssue a',
  ]) {
    for (const el of document.querySelectorAll(sel)) {
      const href = el.getAttribute('href') || '';
      const text = el.textContent.trim();
      const fromHref = href.match(/\/browse\/([A-Z]+-\d+)/i);
      const fromText = text.match(/^([A-Z]+-\d+)$/i);
      const id = ((fromHref?.[1]) || (fromText?.[1]) || '').toUpperCase();
      if (id && id !== selfId) return id;
    }
  }
  return null;
}

function extractSprintId() {
  for (const sel of [
    '[data-testid*="sprint"] [class*="field-value"]',
    '[data-testid*="sprint"] a',
    '[data-testid*="sprint"] span',
    '[class*="SprintField"] span',
    '#sprint-field .value',
    '[data-field-id="sprint"] .value',
  ]) {
    for (const el of document.querySelectorAll(sel)) {
      const num = parseSprintNumber(el.textContent.trim());
      if (num) return num;
    }
  }
  const t = getSidebarFieldText('Sprint');
  if (t) { const n = parseSprintNumber(t); if (n) return n; }

  // Deep text scan
  const area = document.querySelector('[data-testid*="issue-details"],aside') || document.body;
  const m = (area.innerText || '').match(/\bSprint\s+(\d+)\b/i);
  return m ? m[1] : null;
}

function parseSprintNumber(text) {
  if (!text || text === 'None') return null;
  if (/^\d+$/.test(text)) return text;
  const m = text.match(/sprint\s+(\d+)/i) || text.match(/\b(\d+)\b/);
  return m ? m[1] : null;
}

function extractAssignee() {
  // Jira Cloud new UI: assignee field
  const selectors = [
    '[data-testid*="assignee"] [class*="display-name"]',
    '[data-testid*="assignee"] span[class*="user"]',
    '[data-testid*="assignee"] a',
    '[class*="assignee"] [class*="user-name"]',
    '#assignee-val',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const t = el.textContent.trim();
      if (t && t !== 'Unassigned') return slugify(t);
    }
  }
  const t = getSidebarFieldText('Assignee');
  return t && t !== 'Unassigned' ? slugify(t) : null;
}

function extractLabels() {
  const raw = getSidebarFieldMulti('Labels');
  // Also try "Label" singular
  if (!raw.length) {
    const t = getSidebarFieldText('Label');
    if (t) return [slugify(t)];
  }
  return raw.map(slugify).filter(Boolean);
}

function extractComponents() {
  const raw = getSidebarFieldMulti('Components');
  if (!raw.length) {
    const t = getSidebarFieldText('Component');
    if (t) return [slugify(t)];
  }
  return raw.map(slugify).filter(Boolean);
}

function extractPriority() {
  const selectors = [
    '[data-testid*="priority"] img',      // icon alt text
    '[data-testid*="priority"] span',
    '#priority-val',
    '[class*="priority"] span',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const t = (el.getAttribute('alt') || el.textContent || '').trim();
      if (t && t !== 'None') return slugify(t);
    }
  }
  const t = getSidebarFieldText('Priority');
  return t ? slugify(t) : null;
}

function extractIssueType() {
  const selectors = [
    '[data-testid*="issue-type"] img',
    '[data-testid*="issuetype"] img',
    '[data-testid*="issue-type"] span',
    '[class*="issue-type"] span',
    '#type-val',
    '.issue-type-icon',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const t = (el.getAttribute('alt') || el.textContent || '').trim();
      if (t) return slugify(t);
    }
  }
  const t = getSidebarFieldText('Issue Type') || getSidebarFieldText('Type');
  return t ? slugify(t) : null;
}

// ── Listen ─────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTicketInfo') sendResponse(extractTicketInfo());
  return true;
});
