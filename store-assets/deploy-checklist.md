# Deploy Checklist – Jira Branch Generator

## Before Submitting

- [ ] Version bumped in `manifest.json` (current: `1.2.0`)
- [ ] At least 1 screenshot at 1280×800 of the popup in action
- [ ] `privacy-policy.html` hosted on GitHub Pages (see below)
- [ ] ZIP built correctly: `cd jira-branch-extension && zip -r ../extension.zip .`
- [ ] Reload extension locally and test all features before submitting

---

## Host Privacy Policy on GitHub Pages

```bash
# 1. Create repo on GitHub: jira-branch-extension
git init
git add .
git commit -m "feat: initial release v1.0.0"
git remote add origin https://github.com/phuongtv-dev/jira-branch-extension.git
git push -u origin main

# 2. Copy privacy policy into /docs
cp store-assets/privacy-policy.html docs/privacy-policy.html
git add docs/
git commit -m "docs: add privacy policy"
git push

# 3. Enable GitHub Pages
# GitHub repo → Settings → Pages → Source: Deploy from branch → main → /docs
# URL: https://phuongtv-dev.github.io/jira-branch-extension/privacy-policy.html
```

---

## Chrome Web Store

1. Go to https://chrome.google.com/webstore/devconsole
2. Register developer account → pay **$5 one-time fee**
3. Click **New Item** → upload `extension.zip`
4. Fill in store listing:
   - **Name:** `Jira Branch Generator`
   - **Short description:** `Auto-detect Jira ticket info and generate git branch names. Create branches on Bitbucket and GitHub in one click.`
   - **Full description:** copy from `store-description.md`
   - **Category:** Developer Tools
   - **Language:** English
5. Upload at least **1 screenshot** (1280×800 or 640×400)
6. Fill in **Privacy Policy URL:**
   `https://phuongtv-dev.github.io/jira-branch-extension/privacy-policy.html`
7. **Data usage:** check *"This extension does not collect or use any user data"*
8. **Permissions justification:**

| Permission | Justification |
|-----------|--------------|
| `activeTab` | Read Jira ticket fields from the currently active tab |
| `scripting` | Inject a content script to extract ticket fields from Jira DOM |
| `storage` | Save branch templates, API tokens, and history locally on device |
| `clipboardWrite` | Copy the generated branch name to clipboard |
| `api.bitbucket.org` | Create branches via Bitbucket REST API when user clicks Create |
| `api.github.com` | Create branches via GitHub REST API when user clicks Create |

9. **No remote code:** select **No**
10. Submit → review takes **1–3 business days**

---

## Microsoft Edge Add-ons (free, do after Chrome)

1. Go to https://microsoftedge.microsoft.com/addons/signin
2. Sign in with Microsoft account
3. Click **Submit a new extension** → upload same `extension.zip` (no changes needed)
4. Fill in:
   - **Category:** Developer tools
   - **Privacy policy URL:** same as Chrome
   - **Short description:** copy from `store-description.md` → Edge section
5. Upload screenshots
6. Fill in **Notes for certification:**

```
This extension works on Jira Cloud (atlassian.net) pages.

To test:
1. Install the extension
2. Open any Jira Cloud ticket
3. Click the extension icon — ticket fields auto-detected
4. Click ⎇ to create a branch on Bitbucket or GitHub
   (requires API token setup in Bitbucket/GitHub tabs)

No account or login required to test core branch generation.
For Bitbucket: use the Bitbucket tab with an API token
  (scopes: read:repository, write:repository, read:workspace)
For GitHub: use the GitHub tab with a Personal Access Token
  (scope: repo)
```

7. Submit → review takes **1–7 business days**

---

## Firefox AMO

### Code changes required before submitting

Add to the top of `content.js`, `popup.js`, and `background.js`:
```js
const _browser = typeof browser !== 'undefined' ? browser : chrome;
```

Replace all `chrome.` → `_browser.` across all files.

Or use the polyfill (recommended):
```bash
npm install webextension-polyfill
# Copy to extension folder:
cp node_modules/webextension-polyfill/dist/browser-polyfill.min.js jira-branch-extension/
# Add to manifest.json content_scripts:
# "js": ["browser-polyfill.min.js", "content.js"]
```

### Submit
1. Go to https://addons.mozilla.org/developers
2. **Submit a New Add-on** → upload the modified ZIP
3. Fill in listing from `store-description.md` → Firefox AMO section
4. Submit → review may take a few days to several weeks

---

## Releasing an Update

```bash
# 1. Make your changes

# 2. Bump version in manifest.json
#    e.g. "version": "1.2.1"

# 3. Update CHANGELOG.md

# 4. Build ZIP
cd jira-branch-extension && zip -r ../extension-v1.2.1.zip .

# 5. Commit and tag
git add .
git commit -m "feat: v1.2.1 - description of changes"
git tag v1.2.1
git push origin main --tags
# GitHub Actions will auto-build the release ZIP

# 6. Upload new ZIP to each store dashboard
#    Chrome: Package tab → Upload new package
#    Edge: Update → upload new ZIP
```

---

## GitHub Actions Auto-build (optional)

Create `.github/workflows/release.yml`:

```yaml
name: Build & Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Zip extension
        run: |
          cd jira-branch-extension
          zip -r ../jira-branch-extension.zip .

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: jira-branch-extension.zip
```

Every `git tag v1.x.x && git push origin main --tags` auto-creates a GitHub Release with the ZIP attached.

---

## Store URLs

| Store | URL |
|-------|-----|
| Chrome Web Store | https://chrome.google.com/webstore/detail/jira-branch-generator |
| Edge Add-ons | https://microsoftedge.microsoft.com/addons/detail/jira-branch-generator |
| GitHub Releases | https://github.com/phuongtv-dev/jira-branch-extension/releases |
| Privacy Policy | https://phuongtv-dev.github.io/jira-branch-extension/privacy-policy.html |