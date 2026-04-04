// github.js – GitHub Personal Access Token integration

const GH_API = 'https://api.github.com';

// ── Storage ───────────────────────────────────────────────────────────────

async function ghSaveToken(username, token) {
  await chrome.storage.local.set({ gh_username: username, gh_token: token });
}

async function ghClearToken() {
  await chrome.storage.local.remove(['gh_username', 'gh_token']);
}

async function ghGetAuthHeader() {
  const { gh_token } = await chrome.storage.local.get('gh_token');
  if (!gh_token) throw new Error('NOT_LOGGED_IN');
  return `Bearer ${gh_token}`;
}

async function ghIsLoggedIn() {
  const { gh_token } = await chrome.storage.local.get('gh_token');
  return !!gh_token;
}

// ── API ───────────────────────────────────────────────────────────────────

async function ghFetch(path, options = {}) {
  const auth = await ghGetAuthHeader();
  const resp = await fetch(`${GH_API}${path}`, {
    ...options,
    headers: {
      'Authorization': auth,
      'Accept':        'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type':  'application/json',
      ...(options.headers || {}),
    },
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API ${resp.status}`);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

// Verify token and get user info
async function ghLogin(username, token) {
  const resp = await fetch(`${GH_API}/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
    }
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `Auth failed (${resp.status})`);
  }
  const user = await resp.json();
  await ghSaveToken(username || user.login, token);
  return user;
}

// Get orgs (user + all organizations)
async function ghGetOrgs() {
  const [user, orgs] = await Promise.all([
    ghFetch('/user'),
    ghFetch('/user/orgs?pagelen=100'),
  ]);
  // User's own account + all orgs
  const list = [{ login: user.login, avatar_url: user.avatar_url, type: 'User' }];
  (orgs || []).forEach(o => list.push({ login: o.login, avatar_url: o.avatar_url, type: 'Organization' }));
  return list;
}

// Get repos for an org or user
async function ghGetRepos(owner) {
  try {
    // Try org repos first
    const data = await ghFetch(`/orgs/${owner}/repos?per_page=100&sort=updated&type=all`);
    return data || [];
  } catch {
    // Fall back to user repos
    const data = await ghFetch(`/users/${owner}/repos?per_page=100&sort=updated&type=all`);
    return data || [];
  }
}
async function ghCreateBranch(owner, repo, branchName, fromBranch) {
  // Use specified branch or auto-detect default
  let sha;
  if (fromBranch) {
    const ref = await ghFetch(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(fromBranch)}`);
    sha = ref.object.sha;
  } else {
    const repoInfo = await ghFetch(`/repos/${owner}/${repo}`);
    const defaultBranch = repoInfo.default_branch || 'main';
    const ref = await ghFetch(`/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(defaultBranch)}`);
    sha = ref.object.sha;
  }

  return ghFetch(`/repos/${owner}/${repo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
  });
}

// ── Favorites ─────────────────────────────────────────────────────────────

async function ghGetFavorites() {
  const { gh_favorites = [] } = await chrome.storage.local.get('gh_favorites');
  return gh_favorites;
}

async function ghSaveFavorites(favs) {
  await chrome.storage.local.set({ gh_favorites: favs });
}

async function ghAddFavorite(ownerRepo) {
  // ownerRepo format: "owner/repo"
  const [owner, repo] = ownerRepo.split('/');
  if (!owner || !repo) throw new Error('Format must be owner/repo');

  // Verify repo exists
  await ghFetch(`/repos/${owner}/${repo}`);

  const favs = await ghGetFavorites();
  if (!favs.find(f => f.key === ownerRepo)) {
    favs.push({ key: ownerRepo, owner, repo });
    await ghSaveFavorites(favs);
  }
}

async function ghRemoveFavorite(ownerRepo) {
  const favs = await ghGetFavorites();
  await ghSaveFavorites(favs.filter(f => f.key !== ownerRepo));
}
