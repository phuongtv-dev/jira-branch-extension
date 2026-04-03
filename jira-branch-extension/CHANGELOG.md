# Changelog

## [1.1.0] – 2025-04-03

### New Features
- **Bitbucket Integration** — Connect via API Token and create branches directly from the extension
- **Favorite Repos** — Save frequently used repos, create branches on multiple repos at once
- **Base Branch Auto-generation** — When a parent ticket exists, auto-generate `{sprint}/{parent}/base` alongside the ticket branch
- **Custom Template Engine** — Define your own branch format using variables: `{sprint}`, `{parent}`, `{ticket}`, `{slug}`, `{assignee}`, `{label}`, `{component}`, `{type}`, `{priority}`
- **Editable Presets** — Add and remove branch template presets
- **More Jira Fields** — Auto-detect assignee, labels, components, priority, and issue type
- **Sidebar View Support** — Detect ticket info when viewing Jira issues in sidebar/panel mode

### Improvements
- Branch segments with empty variables are now automatically dropped
- All detected fields are editable before copying or creating
- History tab shows last 15 generated branches
- Bitbucket API Token guide built into the extension with step-by-step instructions

---

## [1.0.0] – 2025-03-01

### Initial Release
- Auto-detect Jira ticket ID, title, sprint, and parent from Jira Cloud pages
- Generate git branch names with customizable format
- Copy to clipboard with one click
- Manual input support
- Branch history
