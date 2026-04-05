# Frontier OS App Builder

[![npm version](https://img.shields.io/npm/v/frontier-os-app-builder.svg)](https://www.npmjs.com/package/frontier-os-app-builder)

A meta-prompting framework for building [Frontier OS](https://os.frontiertower.io) apps with [Claude Code](https://claude.ai/code). Provides a guided workflow from idea to deployed app, with built-in knowledge of the Frontier SDK, app patterns, and deployment requirements.

## Prerequisites

- [Claude Code](https://claude.ai/code) installed
- Node.js 18+

## Install

```bash
npx frontier-os-app-builder
```

That's it. This installs `/fos:*` commands into your Claude Code environment.

To uninstall:

```bash
npx frontier-os-app-builder --uninstall
```

## Quick Start

1. Create a directory for your new app
2. Open Claude Code in that directory
3. Run:

```
/fos:new-app "A tip jar app where members can tip baristas and staff with FND"
```

4. Follow the guided workflow — the framework tells you what to do next after each step:

```
/fos:new-app "description"     → gather requirements, infer SDK modules, create roadmap
  /clear
/fos:discuss 1                  → discuss gray areas for phase 1
  /clear
/fos:plan 1                     → research existing apps + create execution plans
  /clear
/fos:execute 1                  → build the app + auto-verify
  /clear
  ... repeat for each phase ...
/fos:ship                       → deploy to Vercel + register in app store
```

5. Keep building — add features or start a new version:

```
/fos:add-feature "leaderboard"  → adds a new phase to the current milestone
  /clear
/fos:discuss N → /fos:plan N → /fos:execute N   → same loop

/fos:new-milestone "v2 features" → archives v1, creates new phases for v2
```

## Commands

| Command | Purpose |
|---|---|
| `/fos:new-app` | Create a new Frontier OS app from a natural language description |
| `/fos:discuss N` | Discuss gray area decisions for phase N |
| `/fos:plan N` | Research patterns + create execution plans for phase N |
| `/fos:execute N` | Build phase N with auto-verification |
| `/fos:ship` | Deploy to Vercel and register in Frontier app store |
| `/fos:new-milestone` | Start a new version (v2, v3...) with additional features |
| `/fos:add-feature` | Add a feature as a new phase to the current milestone |
| `/fos:next` | Auto-route to the next step in the workflow |
| `/fos:status` | Show current project state |

## How it works

The framework is a multi-layered meta-prompting system:

- **Commands** — thin entry points that reference workflows
- **Workflows** — orchestration logic that spawns specialized agents
- **Agents** — fresh-context workers (researcher, planner, executor, verifier)
- **References** — built-in Frontier SDK and app pattern knowledge
- **Templates** — production-tested boilerplate from existing Frontier OS apps

Each command reads state from `.frontier-app/` on disk, does its work, writes updated state, and tells you what to do next. Running `/clear` between steps keeps your context window fresh — the file-based state bridges the gap.

## Key features

- **Module inference** — describe your app in plain English and the framework maps it to the right SDK modules ("room booking" → Events + Wallet + User)
- **Smart questions** — asks domain questions ("Should bookings require FND payment?"), not technical ones ("Which SDK modules?")
- **Production templates** — boilerplate extracted from real Frontier OS apps, not generated from scratch
- **Frontier-specific verification** — checks CORS origins, iframe detection, standalone fallback, SDK permissions, dark theme
- **Milestones** — iterative development with `/fos:new-milestone` for v2, v3, and beyond

## Frontier Studio

Frontier Studio is a live companion dashboard that runs alongside Claude Code. It watches your `.frontier-app/` state files and shows a visual dashboard with a live app preview in your browser.

```bash
cd your-app-directory
npx frontier-studio
```

Opens `http://localhost:4983` with:

- **Project dashboard** — phases, status, SDK modules, progress, next action
- **Live preview** — your app rendered via Vite HMR in an iframe (desktop/tablet/mobile)
- **Activity stream** — file changes, git commits, phase transitions in real time

See [studio/README.md](./studio/README.md) for development details.

## SDK Coverage

The framework has built-in knowledge of all 10 Frontier SDK modules:

| Module | What it does |
|---|---|
| Wallet | Balances, FND transfers, token swaps, fiat on/off-ramp |
| User | Profiles, referrals, KYC, access controls |
| Events | Event management, room listings, bookings |
| Communities | Community management, internship passes |
| Partnerships | Sponsor passes |
| Offices | Building access passes |
| Storage | Persistent key-value storage |
| Chain | Network config, contract addresses |
| ThirdParty | App registration, webhooks, developer accounts |
| Navigation | App-to-app deep linking |

## Project State

All state lives in `.frontier-app/` as human-readable Markdown and JSON — no database, no server:

```
.frontier-app/
├── PROJECT.md          — app vision, modules, constraints
├── REQUIREMENTS.md     — features with IDs
├── ROADMAP.md          — phases with status
├── STATE.md            — current position (bridges /clear)
├── manifest.json       — machine-readable app metadata
└── phases/
    ├── 01-scaffold/    — plans, summaries, verification
    ├── 02-feature/
    └── ...
```

## Example Apps

Ideas to get started:

| App | Description | SDK Modules |
|---|---|---|
| Tip Jar | Members tip baristas with FND | Wallet, User |
| Visitor Check-in | Kiosk for building access passes | Offices, User |
| Room Booking | Book coworking rooms with payment | Events, Wallet, User |
| Event Organizer | Create and manage community events | Events, Communities, User |
| Sponsor Dashboard | Manage partnership passes | Partnerships, User |

## License

MIT
