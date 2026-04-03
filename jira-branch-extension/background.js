// background.js – OAuth implicit + App Password support

const BB_CLIENT_ID     = 'dNpvVVbcCL5k69YUuA';
const BB_CLIENT_SECRET = 'ATATT3xFfGF0gpTVW9Z6mEr4fhgtSUIEtbveY199vKVLWR94I3CaFqmx2pU-OtbTOUz9caqCPWaUkq6oMPNUAMt810H_5u_3iYMt4KAJ-OOjOnRFNxBENCXhW-aaUpGCO9or24FMPGQADXGmqO7fJM_4y8jRgGbo5WcKAEFc8OxQjn-I0SwgV2A=2B59D020';
const BB_AUTH_URL      = 'https://bitbucket.org/site/oauth2/authorize';
const BB_TOKEN_URL     = 'https://bitbucket.org/site/oauth2/access_token';
const BB_API       = 'https://api.bitbucket.org/2.0';

function getRedirectUri() {
  return `https://${chrome.runtime.id}.chromiumapp.org/`;
}

// ── Token helpers ─────────────────────────────────────────────────────────
async function saveOAuthTokens(tokens) {
  await chrome.storage.local.set({
    bb_auth_method:   'oauth',
    bb_access_token:  tokens.access_token,
    bb_refresh_token: tokens.refresh_token || null,
    bb_expires_at:    Date.now() + (parseInt(tokens.expires_in) || 7200) * 1000,
  });
}

async function saveAppPassword(username, password) {
  await chrome.storage.local.set({
    bb_auth_method:   'app_password',
    bb_username:      username,
    bb_app_password:  password,
  });
}

async function getAuthHeader() {
  const data = await chrome.storage.local.get([
    'bb_auth_method', 'bb_access_token', 'bb_expires_at',
    'bb_refresh_token', 'bb_username', 'bb_app_password'
  ]);

  if (data.bb_auth_method === 'app_password') {
    if (!data.bb_username || !data.bb_app_password) throw new Error('NOT_LOGGED_IN');
    // Bitbucket API Token: Basic auth with email:token (base64 encoded)
    const creds = btoa(`${data.bb_username}:${data.bb_app_password}`);
    return `Basic ${creds}`;
  }

  if (data.bb_auth_method === 'oauth') {
    if (!data.bb_access_token) throw new Error('NOT_LOGGED_IN');
    // Refresh if expiring soon
    if (Date.now() > (data.bb_expires_at || 0) - 60000) {
      if (!data.bb_refresh_token) throw new Error('NOT_LOGGED_IN');
      const resp = await fetch(BB_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type:    'refresh_token',
          refresh_token: data.bb_refresh_token,
          client_id:     BB_CLIENT_ID,
          client_secret: BB_CLIENT_SECRET,
        }),
      });
      if (!resp.ok) throw new Error('NOT_LOGGED_IN');
      const tokens = await resp.json();
      await saveOAuthTokens(tokens);
      return `Bearer ${tokens.access_token}`;
    }
    return `Bearer ${data.bb_access_token}`;
  }

  throw new Error('NOT_LOGGED_IN');
}

// ── OAuth authorization code flow (no PKCE - Bitbucket doesn't support it) ──
async function doOAuthLogin() {
  const redirect = getRedirectUri();

  const params = new URLSearchParams({
    client_id:     BB_CLIENT_ID,
    response_type: 'code',
  });

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: `${BB_AUTH_URL}?${params}`, interactive: true },
      async (redirectUrl) => {
        if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
        if (!redirectUrl) { reject(new Error('Auth cancelled')); return; }
        try {
          const code = new URL(redirectUrl).searchParams.get('code');
          if (!code) throw new Error('No auth code returned');

          console.log('Exchanging code for token...');
          const resp = await fetch(BB_TOKEN_URL, {
            method:  'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type:    'authorization_code',
              code,
              client_id:     BB_CLIENT_ID,
              client_secret: BB_CLIENT_SECRET,
            }),
          });

          const text = await resp.text();
          console.log('Token response status:', resp.status);
          console.log('Token response:', text.substring(0, 200));

          if (!resp.ok) throw new Error(`Token exchange failed (${resp.status}): ${text}`);
          const tokens = JSON.parse(text);
          await saveOAuthTokens(tokens);
          resolve({ success: true });
        } catch(e) { reject(e); }
      }
    );
  });
}

// ── App Password login ─────────────────────────────────────────────────────
async function doAppPasswordLogin(username, password) {
  const creds = btoa(`${username}:${password}`);
  // Verify using repositories endpoint - only needs repository:read scope
  const resp = await fetch(`${BB_API}/repositories?role=member&pagelen=1`, {
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

// ── Message handler ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.action) {

        case 'bb_oauth_login': {
          await doOAuthLogin();
          sendResponse({ ok: true });
          break;
        }

        case 'bb_app_password_login': {
          const user = await doAppPasswordLogin(msg.username, msg.password);
          sendResponse({ ok: true, data: user });
          break;
        }

        case 'bb_logout': {
          await chrome.storage.local.remove([
            'bb_auth_method','bb_access_token','bb_refresh_token',
            'bb_expires_at','bb_username','bb_app_password',
          ]);
          sendResponse({ ok: true });
          break;
        }

        case 'bb_is_logged_in': {
          const { bb_auth_method, bb_access_token, bb_username, bb_app_password }
            = await chrome.storage.local.get([
              'bb_auth_method','bb_access_token','bb_username','bb_app_password'
            ]);
          const loggedIn = bb_auth_method === 'oauth'
            ? !!bb_access_token
            : !!(bb_username && bb_app_password);
          sendResponse({ ok: true, data: { loggedIn, method: bb_auth_method || null } });
          break;
        }

        case 'bb_get_user': {
          // Try /user first, fall back to stored username if scope missing
          try {
            const user = await bbApi('/user');
            sendResponse({ ok: true, data: user });
          } catch(e) {
            // API token may not have account scope - return stored info
            const { bb_username } = await chrome.storage.local.get('bb_username');
            sendResponse({ ok: true, data: { display_name: bb_username || 'Connected', nickname: bb_username || '' } });
          }
          break;
        }

        case 'bb_get_workspaces': {
          // Use repositories endpoint to discover workspaces - only needs repository scope
          const data = await bbApi('/repositories?role=member&pagelen=100');
          // Extract unique workspaces from repos
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

          // Auto-detect default branch from repo info
          let commitHash;
          try {
            const repoInfo = await bbApi(`/repositories/${workspace}/${repo}`);
            const defaultBranch = repoInfo.mainbranch?.name || 'master';
            console.log(`Repo ${workspace}/${repo} default branch: ${defaultBranch}`);

            // Get commit hash of default branch
            const branchInfo = await bbApi(`/repositories/${workspace}/${repo}/refs/branches/${encodeURIComponent(defaultBranch)}`);
            commitHash = branchInfo.target?.hash;
            console.log(`Commit hash: ${commitHash}`);
          } catch(e) {
            console.error('Failed to get default branch:', e.message);
            // Last resort: get latest commit
            const commits = await bbApi(`/repositories/${workspace}/${repo}/commits?pagelen=1`);
            commitHash = commits.values?.[0]?.hash;
          }

          if (!commitHash) throw new Error('Could not find a commit to branch from');

          const result = await bbApi(
            `/repositories/${workspace}/${repo}/refs/branches`,
            {
              method: 'POST',
              body: JSON.stringify({ name: branchName, target: { hash: commitHash } }),
            }
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
