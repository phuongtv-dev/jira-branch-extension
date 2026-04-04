// bitbucket.js – proxy to background service worker

async function bbSend(action, extra = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, ...extra }, (resp) => {
      if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
      if (!resp?.ok) reject(new Error(resp?.error || 'Unknown error'));
      else resolve(resp.data);
    });
  });
}

const bbAppPasswordLogin = (u, p) => bbSend('bb_app_password_login', { username:u, password:p });
const clearTokens        = ()      => bbSend('bb_logout');
const bbGetUser          = ()      => bbSend('bb_get_user');
const bbGetWorkspaces    = ()      => bbSend('bb_get_workspaces');
const bbGetRepos         = ws      => bbSend('bb_get_repos', { workspace:ws });
const bbIsLoggedIn       = ()      => bbSend('bb_is_logged_in');
const bbCreateBranch     = (ws,r,b,from)=> bbSend('bb_create_branch', { workspace:ws, repo:r, branchName:b, fromBranch:from||null });

// ── Favorites ──────────────────────────────────────────────────────────────
async function getFavorites() {
  const { bb_favorites=[] } = await chrome.storage.local.get('bb_favorites');
  return bb_favorites;
}
async function saveFavorites(favs) {
  await chrome.storage.local.set({ bb_favorites: favs });
}
async function addFavorite(workspace, repo) {
  const favs = await getFavorites();
  const key  = `${workspace}/${repo}`;
  if (!favs.find(f => f.key === key)) {
    favs.push({ key, workspace, repo });
    await saveFavorites(favs);
  }
}
async function removeFavorite(workspace, repo) {
  const favs = await getFavorites();
  await saveFavorites(favs.filter(f => f.key !== `${workspace}/${repo}`));
}
