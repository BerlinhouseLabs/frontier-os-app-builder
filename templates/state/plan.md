# Plan Template

Template for `.frontier-app/phases/XX-name/{phase}-{plan}-PLAN.md` — executable plans for Frontier OS app phases.

**Naming:** Use `{phase}-{plan}-PLAN.md` format (e.g., `01-01-PLAN.md` for Phase 1, Plan 1)

---

## File Template

```markdown
---
phase: XX-name
plan: NN
wave: N
depends_on: []
requirements: []
files_modified: []
autonomous: true

must_haves:
  truths: []
  artifacts: []
  key_links: []
---

<objective>
[What this plan accomplishes for the Frontier OS app]

Purpose: [Why this matters — which feature/capability it delivers]
Output: [What artifacts will be created]
SDK Modules: [Which SDK modules are used in this plan, if any]
</objective>

<execution_context>
@frontier-os-app-builder/workflows/execute-plan.md
@frontier-os-app-builder/templates/state/summary.md
</execution_context>

<context>
@.frontier-app/PROJECT.md
@.frontier-app/ROADMAP.md
@.frontier-app/STATE.md

# Feature phases consume the mock service layer (useServices) — no SDK docs in <context>.
# SDK module docs are referenced ONLY in the final SDK Integration plan, via:
# @frontier-os-app-builder/references/sdk/[module].md

# Only reference prior plan SUMMARYs if genuinely needed:
# - This plan uses types/exports from prior plan
# - Prior plan made decision affecting this plan

[Relevant source files:]
@src/path/to/relevant.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: [Action-oriented name]</name>
  <files>path/to/file.ext, another/file.ext</files>
  <read_first>path/to/reference.ext, path/to/source-of-truth.ext</read_first>
  <action>[Specific implementation — what to do, how to do it, what to avoid and WHY.
  Include CONCRETE values: exact identifiers, parameters, SDK method names, file paths.
  For SDK usage: specify exact import path, method signature, expected return type.
  Never say "align X with Y" without specifying the exact target state.]</action>
  <verify>[Command or check to prove it worked]</verify>
  <acceptance_criteria>
    - [Grep-verifiable: "file.ext contains 'FrontierSDK'"]
    - [Measurable: "component renders without console errors"]
  </acceptance_criteria>
  <done>[Measurable acceptance criteria]</done>
</task>

<task type="auto">
  <name>Task 2: [Action-oriented name]</name>
  <files>path/to/file.ext</files>
  <read_first>path/to/reference.ext</read_first>
  <action>[Specific implementation with concrete values]</action>
  <verify>[Command or check]</verify>
  <acceptance_criteria>
    - [Grep-verifiable condition]
  </acceptance_criteria>
  <done>[Acceptance criteria]</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>[What Claude built] — dev server at http://localhost:{{DEV_PORT}}</what-built>
  <how-to-verify>Visit http://localhost:{{DEV_PORT}} and verify:
  - [Visual check 1]
  - [Visual check 2]
  (SDK Integration phase only) Open Frontier OS at localhost:3000 and verify the app loads in the iframe.</how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
Before declaring plan complete:
- [ ] `npm run build` succeeds with no errors
- [ ] `npm run dev` starts without errors on port {{DEV_PORT}}
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] [Plan-specific verification]
</verification>

<success_criteria>

- All tasks completed
- All verification checks pass
- No console errors in browser
- App renders correctly in dark theme
- [Plan-specific criteria]

</success_criteria>

<output>
After completion, create `.frontier-app/phases/XX-name/{phase}-{plan}-SUMMARY.md`
</output>
```

---

## Frontmatter Fields

| Field | Required | Purpose |
|-------|----------|---------|
| `phase` | Yes | Phase identifier (e.g., `01-scaffold`) |
| `plan` | Yes | Plan number within phase (e.g., `01`, `02`) |
| `wave` | Yes | Execution wave (1, 2, 3...) for parallel scheduling |
| `depends_on` | Yes | Plan IDs this plan requires (e.g., `["01-01"]`) |
| `requirements` | Yes | Requirement IDs this plan addresses (PLAT-01, REQ-03, etc.) |
| `files_modified` | Yes | Files this plan creates or modifies |
| `autonomous` | Yes | `true` if no checkpoints, `false` if has user verification |
| `must_haves` | Yes | Goal-backward verification criteria |

---

## Frontier OS Specifics

**Phase 1 (scaffold) plans always include — standalone-first:**
- Vite scaffold from `templates/app/vite.config.ts`
- `FrontierServicesProvider` + mock services from `templates/app/frontier-services.tsx` → `src/lib/frontier-services.tsx` (feature code calls `useServices()`)
- Layout from `templates/app/layout-standalone.tsx` → `src/views/Layout.tsx` (NO iframe detection, NO SdkProvider)
- Entry from `templates/app/main-router.tsx` (router entry — all apps use the router)
- Dark theme via Tailwind 4 `@theme` in `src/styles/index.css` (CSS-only — no `tailwind.config`)
- Standalone UI rendering with mock data
- Dev server on assigned port

**Phase 1 BLOCKLIST — NEVER include these in a scaffold plan:**
- ❌ `sdk-context.tsx` — this file is created during SDK Integration phase, NOT Phase 1
- ❌ `layout.tsx` template — use `layout-standalone.tsx` instead (no iframe detection, no SdkProvider)
- ❌ single-component entries — use `main-router.tsx` instead (all apps use the router; no single-component entry)
- ❌ `package.json` template — use `package-standalone.json` instead (no SDK dependency)
- ❌ `vercel.json` template — use `vercel-standalone.json` instead (no CORS headers)
- ❌ `@frontiertower/frontier-sdk` in dependencies — SDK is added during SDK Integration phase
- ❌ `isInFrontierApp()` or `createStandaloneHTML()` in Layout — these are SDK Integration concerns
- ❌ `SdkProvider` wrapping — use `FrontierServicesProvider` instead
- ❌ `useSdk()` — use `useServices()` instead
- ❌ Any import from `@frontiertower/frontier-sdk` — the SDK package does not exist in Phase 1

**Service usage in feature phases (Phase 2+):**
- Call service methods through the mock seam: `services.<module>.<method>()` (e.g. `services.wallet.getBalance()`)
- Always obtain services via `useServices()` — `import { useServices } from '../lib/frontier-services'`
- Wrap service calls in try/catch and handle loading/error states
- Never import `@frontiertower/frontier-sdk` or call `useSdk()` in feature code
- The `FrontierSDK` import + `useSdk()` pattern belongs ONLY to the final SDK Integration phase

**Verification always includes:**
- Build succeeds (`npm run build`)
- Dev server starts on correct port
- No TypeScript errors
- Dark theme renders correctly (no white backgrounds)
- Standalone renders with mock services (`useServices()` resolves)

**SDK Integration tier (final phase) additionally verifies:**
- App works in both iframe and standalone modes (in-frame `services.*` resolve via the SDK bridge)

---

## Task Types

| Type | Use For | Autonomy |
|------|---------|----------|
| `auto` | Everything Claude can do independently | Fully autonomous |
| `checkpoint:human-verify` | Visual verification in browser/iframe | Pauses for user |
| `checkpoint:decision` | Implementation choices needing user input | Pauses for user |

---

## Scope Guidance

**Plan sizing:**
- 2-3 tasks per plan
- Phase 1 (scaffold): Always 1 plan
- Feature phases: 1-3 plans depending on complexity

**Vertical slices preferred:**
```
PREFER: Plan 01 = Event listing (model + API hook + UI component)
        Plan 02 = Event creation (form + validation + SDK call)

AVOID:  Plan 01 = All data models
        Plan 02 = All API hooks
        Plan 03 = All UI components
```
