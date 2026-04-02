# Jira Branch Generator – Store Listing Copy

---

## Extension Name
Jira Branch Generator

---

## Short Description (≤132 characters)
Auto-detect Jira ticket info and generate git branch names instantly with fully customizable templates.

---

## Full Description

**Never manually type a branch name again.**

Jira Branch Generator automatically reads your Jira ticket — ticket ID, sprint, parent, assignee, labels, components, priority, and issue type — and turns it into a clean, copy-ready git branch name in one click.

---

### ✨ Key Features

**Auto-detect from any Jira Cloud page**
Open a ticket, click the extension — sprint, parent, ticket ID and title are read automatically. No copy-pasting required.

**Fully customizable templates**
Define your own branch format using variables:
- `{sprint}` → s200
- `{parent}` → LH-48141
- `{ticket}` → LH-48913
- `{slug}` → planning-system-implement-event-publisher
- `{assignee}` → john-doe
- `{label}`, `{component}`, `{type}`, `{priority}`

**Smart segment dropping**
Segments with empty variables are dropped automatically.
`{sprint}/{parent}/{ticket}-{slug}` with no sprint → `LH-48141/LH-48913-planning-system-...`

**Base branch generation**
When a parent ticket exists, optionally generate a base branch (`s200/LH-48141/base`) alongside the ticket branch — perfect for stacked PR workflows.

**10 built-in presets**
Including `feat/{ticket}-{slug}`, `fix/{ticket}-{slug}`, `{type}/{sprint}/{ticket}-{slug}`, and more.

**All fields are editable**
Every detected field is shown in an editable card. Override anything before copying.

**Branch history**
Your last 15 generated branches are saved locally so you can copy them again anytime.

**Manual input**
Not on a Jira page? Paste a ticket reference like `[LH-48913] Fix login timeout` and generate instantly.

---

### 🔒 Privacy

This extension is 100% local. It does not collect, transmit, or share any data. All preferences and history are stored on your device only.

---

### 💡 Example Output

Template: `{sprint}/{parent}/{ticket}-{slug}`

Input:
- Sprint: 200
- Parent: LH-48141
- Ticket: LH-48913
- Title: Planning System: Implement Event Publisher for Portal Integration

Output:
```
s200/LH-48141/LH-48913-planning-system-implement-event-publisher-portal-integration
```

Base branch:
```
s200/LH-48141/base
```

---

### 📋 Permissions

- **activeTab** – Read ticket info from the current Jira tab
- **scripting** – Inject script to extract fields from the Jira page
- **storage** – Save preferences and history locally on your device
- **clipboardWrite** – Copy branch name to clipboard
- **atlassian.net / jira.com** – Required to run on Jira Cloud pages

---

## Category
Developer Tools

## Tags / Keywords
jira, git, branch, developer tools, productivity, atlassian, github, gitlab, workflow

---

## Chrome Web Store – Additional Fields

**Single purpose description:**
This extension reads Jira ticket fields from the active tab and generates a formatted git branch name based on a user-defined template.

**Homepage URL:**
https://github.com/YOUR_USERNAME/jira-branch-extension

**Privacy policy URL:**
https://YOUR_USERNAME.github.io/jira-branch-extension/privacy-policy.html

---

## Firefox AMO – Additional Fields

**Summary (≤250 characters):**
Reads Jira ticket fields (sprint, parent, assignee, labels, components) and generates a git branch name using a fully customizable template. One click to copy. 100% local, no data collection.

**Support URL:**
https://github.com/YOUR_USERNAME/jira-branch-extension/issues

---

## Edge Add-ons – Additional Fields

**Short description (≤150 characters):**
Generate git branch names from Jira tickets automatically. Customize the format with templates using sprint, parent, assignee, label and more.

---

## Screenshots – Suggested Captions

1. `screenshot-01-detect.png` — "Auto-detects sprint, parent, assignee and more from any Jira Cloud ticket"
2. `screenshot-02-branch.png` — "One-click copy of the generated branch name"
3. `screenshot-03-template.png` — "Fully customizable templates with 10 built-in presets"
4. `screenshot-04-base.png` — "Auto-generate a base branch for parent ticket workflows"
5. `screenshot-05-history.png` — "Branch history — copy recent branches instantly"
