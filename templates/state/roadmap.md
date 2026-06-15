# Roadmap Template

Template for `.frontier-app/ROADMAP.md` — the phased build plan.

<template>

```markdown
# Roadmap: {{APP_NAME}}

## Overview

[One paragraph describing the journey from scaffold to shipped app.
What makes this app worth building and what does the finished product look like?]

## {{MILESTONE_VERSION}} Phases

- [ ] **Phase 1: Scaffold + Standalone Shell** — Project setup, services layer, mock data, dark theme
- [ ] **Phase 2: [Feature Name]** — [One-line description]
- [ ] **Phase 3: [Feature Name]** — [One-line description]
- [ ] **Phase N-1: [Feature Name]** — [One-line description]
- [ ] **Phase N: SDK Integration** — Wire SDK, create adapter, upgrade Layout for iframe

## Phase Details

### Phase 1: Scaffold + Standalone Shell
**Goal**: Working app shell running standalone in browser with mock data
**Depends on**: Nothing (always first)
**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05
**Success Criteria** (what must be TRUE):
  1. App renders standalone in browser with mock data
  2. Dark theme applied — no white backgrounds, no light-mode artifacts
  3. useServices() returns mock wallet balance, user data, storage
  4. Dev server runs on assigned port with HMR working
  5. npm run build succeeds
**Plans**: 1 plan

Plans:
- [ ] 01-01: Vite + React scaffold, services layer, mock data, dark theme, dev config

### Phase 2: [Feature Name]
**Goal**: [What this phase delivers — one sentence]
**Depends on**: Phase 1
**Requirements**: [REQ-01, REQ-02, REQ-03]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
  2. [Observable behavior from user perspective]
  3. [Observable behavior from user perspective]
**Plans**: [Number of plans or TBD]

Plans:
- [ ] 02-01: [Brief description of first plan]
- [ ] 02-02: [Brief description of second plan]

### Phase N-1: [Feature Name]
**Goal**: [What this phase delivers]
**Depends on**: Phase [N-2]
**Requirements**: [REQ-XX, REQ-YY]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
  2. [Observable behavior from user perspective]
**Plans**: [Number of plans or TBD]

Plans:
- [ ] NN-01: [Brief description]

### Phase N: SDK Integration
**Goal**: Wire real Frontier SDK into the standalone app shell
**Depends on**: All feature phases
**Requirements**: PLAT-SDK-01
**Success Criteria** (what must be TRUE):
  1. sdk-context.tsx exists and exports useSdk + SdkProvider
  2. sdk-services.tsx maps all service methods to real SDK calls
  3. Layout.tsx has isInFrontierApp() detection and SdkProvider wrapping
  4. vercel.json has all 3 CORS origin blocks
  5. App works both standalone (mocks) and in iframe (real SDK)
  6. npm run build succeeds
**Plans**: 1 plan (mechanical)

Plans:
- [ ] NN-01: SDK dependency, adapter, Layout upgrade, CORS

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold + Standalone Shell | 0/1 | Not started | - |
| 2. [Name] | 0/N | Not started | - |
| N-1. [Name] | 0/N | Not started | - |
| N. SDK Integration | 0/1 | Not started | - |

---
*Roadmap created: {{DATE}}*
*Last updated: {{DATE}} after {{TRIGGER}}*
```

</template>

<guidelines>

**Phase 1 is always the same:**
- "Scaffold + Standalone Shell" — never skip, never rename
- Covers all PLAT-* requirements
- Always 1 plan (the scaffold is well-defined)
- Success criteria are standardized (see template)
- Uses standalone templates from `templates/app/` directory (frontier-services.tsx, layout-standalone.tsx, package-standalone.json, vercel-standalone.json)

**Final phase is always SDK Integration:**
- Auto-added as the last phase — never skip, never rename
- Always 1 plan (mechanical, no user decisions)
- Wires real SDK: adds dependency, creates adapter, upgrades Layout, adds CORS
- Fixed success criteria (see template)

**Phase structure:**
- Phase 1: Scaffold + Standalone Shell (always)
- Phases 2 to N-1: Feature phases (from requirements)
- Phase N: SDK Integration (always last)
- Keep to 3-6 total phases for v1 — ship fast
- Each phase delivers something coherent and testable

**Success criteria:**
- 2-5 observable behaviors per phase
- Written from user perspective ("User can..." or "[Thing] works")
- Cross-checked against requirements during creation
- Flow downstream to `must_haves` in PLAN.md
- Verified after execution

**Plans within phases:**
- Phase 1 always has 1 plan
- Feature phases have 1-3 plans depending on complexity
- Plans use naming: {phase}-{plan}-PLAN.md (e.g., 02-01-PLAN.md)
- Plan count can be "TBD" initially, refined during /fos:plan

**Progress tracking:**
- Updated after each plan completes
- Status values: Not started, In progress, Complete, Deferred

</guidelines>

<frontier_specifics>

**Phase 1 always generates from standalone templates:**
- `templates/app/vite.config.ts` → configured with app's dev port
- `templates/app/frontier-services.tsx` → useServices() provider + mock services
- `templates/app/layout-standalone.tsx` → dark theme shell with FrontierServicesProvider
- `templates/app/main-simple-standalone.tsx` or `main-router.tsx` → entry point
- `templates/app/package-standalone.json` → dependencies without SDK
- `templates/app/vercel-standalone.json` → SPA rewrite only (no CORS)
- `templates/app/tsconfig.json` → TypeScript config
- `templates/app/postcss.config.js` → Tailwind setup

**Feature phases should reference service modules:**
- If a phase uses Events module, note it in the goal
- If a phase uses Wallet module, note it in the goal
- This helps the planner know which service methods to use via useServices()

**SDK Integration phase generates from SDK templates:**
- `templates/app/sdk-context.tsx` → SdkProvider + useSdk hook
- `templates/app/sdk-services.tsx` → adapter mapping services to real SDK
- `templates/app/layout.tsx` → Layout upgrade with iframe detection
- `templates/app/vercel.json` → full CORS origins

</frontier_specifics>
