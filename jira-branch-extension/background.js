// background.js – API Token authentication for Bitbucket

const BB_CLIENT_ID = 'dNpvVVbcCL5k69YUuA';
const BB_API       = 'https://api.bitbucket.org/2.0';

// ── Auth storage ──────────────────────────────────────────────────────────

async function saveAppPassword(username, password) {
  await chrome.storage.local.set({
    bb_auth_method:  'app_password',
    bb_username:     username,
    bb_app_password: password,
  });
}

async function getAuthHeader() {
  const { bb_username, bb_app_password } = await chrome.storage.local.get(
    ['bb_username', 'bb_app_password']
  );
  if (!bb_username || !bb_app_password) throw new Error('NOT_LOGGED_IN');
  return `Basic ${btoa(`${bb_username}:${bb_app_password}`)}`;
}

// ── API Token login ───────────────────────────────────────────────────────

async function doAppPasswordLogin(username, password) {
  const creds = btoa(`${username}:${password}`);
  const resp  = await fetch(`${BB_API}/repositories?role=member&pagelen=1`, {
    headers: { 'Authorization': `Basic ${creds}` }
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Auth failed (${resp.status})`);
  }
  await saveAppPassword(username, password);
  return { display_name: username, nickname: username };
}

// ── Bitbucket API ─────────────────────────────────────────────────────────

async function bbApi(path, options = {}) {
  const authHeader = await getAuthHeader();
  const resp = await fetch(`${BB_API}${path}`, {
    ...options,
    headers: {
      'Authorization': authHeader,
      'Content-Type':  'application/json',
      ...(options.headers || {}),
    },
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `API ${resp.status}`);
  }
  return resp.json();
}

// ── Message handler ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.action) {

        case 'bb_app_password_login': {
          const user = await doAppPasswordLogin(msg.username, msg.password);
          sendResponse({ ok: true, data: user });
          break;
        }

        case 'bb_logout': {
          await chrome.storage.local.remove([
            'bb_auth_method', 'bb_username', 'bb_app_password',
          ]);
          sendResponse({ ok: true });
          break;
        }

        case 'bb_is_logged_in': {
          const { bb_username, bb_app_password } = await chrome.storage.local.get(
            ['bb_username', 'bb_app_password']
          );
          sendResponse({ ok: true, data: { loggedIn: !!(bb_username && bb_app_password) } });
          break;
        }

        case 'bb_get_user': {
          try {
            const user = await bbApi('/user');
            sendResponse({ ok: true, data: user });
          } catch(e) {
            const { bb_username } = await chrome.storage.local.get('bb_username');
            sendResponse({ ok: true, data: { display_name: bb_username || 'Connected', nickname: bb_username || '' } });
          }
          break;
        }

        case 'bb_get_workspaces': {
          const data = await bbApi('/repositories?role=member&pagelen=100');
          const wsMap = {};
          (data.values || []).forEach(r => {
            const ws = r.workspace;
            if (ws && !wsMap[ws.slug]) wsMap[ws.slug] = ws;
          });
          sendResponse({ ok: true, data: Object.values(wsMap) });
          break;
        }

        case 'bb_get_repos': {
          const data = await bbApi(`/repositories/${msg.workspace}?pagelen=100&sort=name`);
          sendResponse({ ok: true, data: data.values || [] });
          break;
        }

        case 'bb_create_branch': {
          const { workspace, repo, branchName } = msg;

          // Auto-detect default branch
          let commitHash;
          try {
            const repoInfo     = await bbApi(`/repositories/${workspace}/${repo}`);
            const defaultBranch = repoInfo.mainbranch?.name || 'master';
            const branchInfo   = await bbApi(`/repositories/${workspace}/${repo}/refs/branches/${encodeURIComponent(defaultBranch)}`);
            commitHash = branchInfo.target?.hash;
          } catch(e) {
            const commits = await bbApi(`/repositories/${workspace}/${repo}/commits?pagelen=1`);
            commitHash = commits.values?.[0]?.hash;
          }

          if (!commitHash) throw new Error('Could not find a commit to branch from');

          const result = await bbApi(
            `/repositories/${workspace}/${repo}/refs/branches`,
            { method: 'POST', body: JSON.stringify({ name: branchName, target: { hash: commitHash } }) }
          );
          sendResponse({ ok: true, data: result });
          break;
        }

        default:
          sendResponse({ ok: false, error: 'Unknown action' });
      }
    } catch(e) {
      sendResponse({ ok: false, error: e.message });
    }
  })();
  return true;
});
