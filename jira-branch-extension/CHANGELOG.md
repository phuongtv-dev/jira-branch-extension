# Changelog

## [1.2.0] – 2026-04-04

### New Features
- **GitHub Integration** — Connect via Personal Access Token and create branches directly on GitHub
- **GitHub Org/Repo Browser** — Browse all your orgs and repos from dropdown, no need to type manually
- **Dark/Light Mode** — Toggle theme via header button, preference saved
- **Branch from selector** — Choose which branch to create from in the Create modal (default: auto-detect)
- **UI Redesign** — New "Developer Terminal" aesthetic with Geist + JetBrains Mono fonts, teal accents

### Fixes
- Fixed Bitbucket 410 Gone error — migrated from deprecated `/repositories?role=member` to `/user/workspaces`
- Fixed Bitbucket workspace pagination — now loads all workspaces correctly
- Fixed field card colours — background was incorrectly coloured, now only text/dot are coloured
- Updated Bitbucket scope guide — now shows exact scope names needed (`read:workspace:bitbucket` etc.)

---

## [1.1.0] – 2025-04-03

### New Features
- **Bitbucket Integration** — Connect via API Token and create branches directly from the extension
- **Favorite Repos** — Save frequently used repos, create branches on multiple repos at once
- **Base Branch Auto-generation** — When a parent ticket exists, auto-generate `{sprint}/{parent}/base` alongside the ticket branch
- **Custom Template Engine** — Define your own branch format using variables: `{sprint}`, `{parent}`, `{ticket}`, `{slug}`, `{assignee}`, `{label}`, `{component}`, `{type}`, `{priority}`
- **Editable Presets** — Add and remove branch template presets
- **More Jira Fields** — Auto-detect assignee, labels, components, priority, and issue type
- **Sidebar View Support** — Detect ticket info when viewing Jira issues in sidebar/panel mode

### Fixes
- Branch segments with empty variables are now automatically dropped
- All detected fields are editable before copying or creating
- Bitbucket API Token guide built into the extension with step-by-step instructions

---

## [1.0.0] – 2025-03-01

### Initial Release
- Auto-detect Jira ticket ID, title, sprint, and parent from Jira Cloud pages
- Generate git branch names with customizable format
- Copy to clipboard with one click
- Manual input support
- Branch history
