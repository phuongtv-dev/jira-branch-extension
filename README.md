# ⎇ Jira Branch Generator

> Auto-detect Jira ticket info and generate git branch names instantly — create branches directly on Bitbucket and GitHub.

![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-7c6af7)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-1.2.0-00d4aa)

---

## ✨ Features

- **Auto-detect** sprint, parent, assignee, labels, components, priority and issue type from any Jira Cloud ticket — including sidebar/panel view
- **Customizable templates** using variables like `{sprint}`, `{parent}`, `{ticket}`, `{slug}`, `{assignee}`, `{label}`, `{component}`, `{type}`, `{priority}`
- **Smart segment dropping** — empty variables are removed automatically, no broken slashes
- **Base branch generation** — auto-generate `{sprint}/{parent}/base` alongside the ticket branch for stacked PR workflows
- **Create branches directly** on Bitbucket and GitHub without opening a terminal
- **Multi-repo support** — create the same branch on multiple repos at once
- **Editable presets** — add and remove branch template presets
- **Editable fields** — override any detected value before copying
- **Dark / Light mode** — toggle in the header, preference saved
- **Branch history** — last 15 generated branches saved locally
- **Manual input** — works without a Jira page open

---

## 📸 Example

**Template:** `{sprint}/{parent}/{ticket}-{slug}`

| Field | Value |
|-------|-------|
| Sprint | 500 |
| Parent | PV-98912 |
| Ticket | PV-98913 |
| Title | Implement Event Publisher for Portal Integration |

**Output:**
```
s500/PV-98912/PV-98913-implement-event-publisher-portal-integration
```

**Base branch:**
```
s500/PV-98912/base
```

---

## 📦 Installation

### From Chrome Web Store *(coming soon)*
Search for **Jira Branch Generator** or install directly from the store link.

### Manual / Developer install
1. Download the latest `jira-branch-extension.zip` from [Releases](https://github.com/phuongtv-dev/jira-branch-extension/releases)
2. Unzip the file
3. Open Chrome → go to `chrome://extensions/`
4. Enable **Developer mode** (top right toggle)
5. Click **Load unpacked** → select the unzipped folder

---

## 🧩 Template Variables

| Variable | Example output | Description |
|----------|---------------|-------------|
| `{sprint}` | `s500` | Sprint number, prefixed with `s` |
| `{parent}` | `PV-98912` | Parent ticket ID |
| `{ticket}` | `PV-98913` | Current ticket ID |
| `{slug}` | `implement-event-publisher` | Title slugified, stop words removed |
| `{title}` | `Implement-Event-Publisher` | Raw title, spaces → dashes |
| `{assignee}` | `nguyen-van-a` | Assignee name, slugified |
| `{label}` | `backend` | First label |
| `{component}` | `portal` | First component |
| `{type}` | `story` · `bug` · `task` | Issue type |
| `{priority}` | `high` · `low` | Priority |

Segments between `/` are **automatically dropped** when all their variables are empty.

---

## 🗂️ Preset Templates

| Preset | Template |
|--------|----------|
| Full (default) | `{sprint}/{parent}/{ticket}-{slug}` |
| No sprint | `{parent}/{ticket}-{slug}` |
| No parent | `{sprint}/{ticket}-{slug}` |
| Minimal | `{ticket}-{slug}` |
| Feature branch | `feat/{ticket}-{slug}` |
| Fix branch | `fix/{ticket}-{slug}` |
| Type + Sprint | `{type}/{sprint}/{ticket}-{slug}` |
| Assignee | `{assignee}/{sprint}/{ticket}-{slug}` |
| Component | `{component}/{ticket}-{slug}` |
| Label | `{label}/{sprint}/{ticket}-{slug}` |

---

## 🪣 Bitbucket Integration

Connect via **API Token** to create branches directly from the extension.

### Setup
1. Go to `bitbucket.org` → avatar → **Personal Bitbucket settings**
2. Get your **Atlassian email** from: Sidebar → Account settings → *"Your Atlassian account address is:"*
3. Go to Sidebar → **API tokens** → **Create API token** with these scopes:

| Scope | Permission |
|-------|-----------|
| `read:repository:bitbucket` | Repositories → Read |
| `write:repository:bitbucket` | Repositories → Write |
| `read:workspace:bitbucket` | Workspace → Read |

4. Paste email + token in the **Bitbucket** tab of the extension

### Usage
- Add favorite repos in the Bitbucket tab
- Click **⎇** on any generated branch → select repos → **Create Branch**
- Optionally specify a source branch (default: auto-detect repo's default branch)

---

## 🐙 GitHub Integration

Connect via **Personal Access Token** to create branches on GitHub.

### Setup
1. Go to `github.com/settings/tokens/new`
2. Set expiry → tick scope: **repo** (Full control of repositories)
3. Click **Generate token** → copy immediately (shown only once)
4. Paste username + token in the **GitHub** tab of the extension

### Usage
- Browse orgs and repos from the dropdown, or type `owner/repo` manually
- Add favorite repos, then click **⎇** to create branches same as Bitbucket

---

## 🔒 Privacy

This extension is **100% local**. No data is collected, transmitted, or shared.

- All preferences, tokens, and branch history are stored on your device via `chrome.storage.local`
- No analytics, no crash reporting
- Network requests are made only to `api.bitbucket.org` and `api.github.com` when you explicitly create a branch
- Uninstalling the extension removes all stored data

→ [Full Privacy Policy](https://phuongtv-dev.github.io/jira-branch-extension/privacy-policy.html)

---

## 🛠️ Development

```bash
# Clone the repo
git clone https://github.com/phuongtv-dev/jira-branch-extension.git
cd jira-branch-extension

# Load in Chrome
# chrome://extensions/ → Developer mode → Load unpacked → select jira-branch-extension/

# Build ZIP for store submission
cd jira-branch-extension
zip -r ../extension.zip .
```

### Project structure

```
jira-branch-extension/
├── manifest.json       # Extension config (Manifest V3)
├── content.js          # Injected into Jira pages — extracts all ticket fields
├── branchUtils.js      # Template engine + branch name generation
├── background.js       # Service worker — Bitbucket API calls
├── bitbucket.js        # Bitbucket proxy + favorites storage
├── github.js           # GitHub API + favorites storage
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
└── icons/              # Extension icons (16, 48, 128px)
```

---

## 📋 Permissions

| Permission | Reason |
|-----------|--------|
| `activeTab` | Read ticket info from the current Jira tab |
| `scripting` | Inject script to extract fields from Jira DOM |
| `storage` | Save preferences, tokens, and history locally |
| `clipboardWrite` | Copy branch name to clipboard |
| `*.atlassian.net` / `*.jira.com` | Run on Jira Cloud pages |
| `api.bitbucket.org` | Create branches via Bitbucket API |
| `api.github.com` | Create branches via GitHub API |

---

## 📋 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for full release history.

---

## 🤝 Contributing

Issues and PRs are welcome! If a Jira field isn't being detected correctly on your instance, please open an issue with the field name and I'll add support.

---

## 📄 License

MIT © [phuongtv-dev](https://github.com/phuongtv-dev)