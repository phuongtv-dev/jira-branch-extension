# ⎇ Jira Branch Generator

> Auto-detect Jira ticket info and generate git branch names instantly with fully customizable templates.

![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-7c6af7)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- **Auto-detect** sprint, parent, assignee, labels, components, priority and issue type from any Jira Cloud ticket
- **Customizable templates** using variables like `{sprint}`, `{parent}`, `{ticket}`, `{slug}`, `{assignee}`, `{label}`, `{component}`, `{type}`, `{priority}`
- **Smart segment dropping** — empty variables are removed automatically, no broken slashes
- **Base branch generation** — auto-generate `{sprint}/{parent}/base` alongside the ticket branch for stacked PR workflows
- **10 built-in presets** to get started fast
- **Editable fields** — override any detected value before copying
- **Branch history** — last 15 generated branches saved locally
- **Manual input** — works without a Jira page open

---

## 📸 Example

**Template:** `{sprint}/{parent}/{ticket}-{slug}`

| Field | Value |
|-------|-------|
| Sprint | 200 |
| Parent | LH-48141 |
| Ticket | LH-48913 |
| Title | Planning System: Implement Event Publisher for Portal Integration |

**Output:**
```
s200/LH-48141/LH-48913-planning-system-implement-event-publisher-portal-integration
```

**Base branch:**
```
s200/LH-48141/base
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
| `{sprint}` | `s200` | Sprint number, prefixed with `s` |
| `{parent}` | `LH-48141` | Parent ticket ID |
| `{ticket}` | `LH-48913` | Current ticket ID |
| `{slug}` | `planning-system-implement` | Title slugified, stop words removed |
| `{title}` | `Planning-System-Implement` | Raw title, spaces → dashes |
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

## 🔒 Privacy

This extension is **100% local**. No data is collected, transmitted, or shared.

- All preferences and branch history are stored on your device via `chrome.storage.local`
- No analytics, no crash reporting, no network requests
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
| `storage` | Save preferences and history locally |
| `clipboardWrite` | Copy branch name to clipboard |
| `*.atlassian.net` / `*.jira.com` | Run on Jira Cloud pages |

---

## 🤝 Contributing

Issues and PRs are welcome! If a Jira field isn't being detected correctly on your instance, please open an issue with the field name and I'll add support.

---

## 📄 License

MIT © [phuongtv-dev](https://github.com/phuongtv-dev)
