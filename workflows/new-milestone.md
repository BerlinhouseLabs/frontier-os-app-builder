<purpose>
Archive the current milestone and start a new one. Gathers new feature descriptions, infers SDK modules, creates new phases in the roadmap, and updates all state files. Transitions from v1 to v2 (or vN to vN+1).
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<available_agent_types>
Valid FOS subagent types (use exact names):
- fos-researcher — Researches existing Frontier OS apps for patterns
- fos-planner — Creates detailed execution plans from research + context
- fos-plan-checker — Reviews plan quality before execution
- fos-executor — Executes plan tasks, commits, creates SUMMARY.md
- fos-verifier — Verifies phase completion, checks quality gates
</available_agent_types>

<process>

<step name="load_current_state" priority="first">
**Read current project state.**

```bash
# Load all relevant state
STATE_JSON=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state json)
MANIFEST=$(cat .frontier-app/manifest.json)
```

Read these files:
1. `.frontier-app/ROADMAP.md` — Current phases, progress, completion status
2. `.frontier-app/STATE.md` — Current milestone, position
3. `.frontier-app/manifest.json` — Current modules and permissions
4. `.frontier-app/PROJECT.md` — App vision, SDK modules, decisions

**If .frontier-app/ not found:**
```
Error: No .frontier-app/ directory found.

Run `/fos:new-app` first to initialize your Frontier OS app.
```
Exit workflow.

Extract:
- Current milestone version (e.g., "v1")
- Total phases and their completion status
- Current SDK modules and permissions
- App name and description
</step>

<step name="archive_milestone">
**Archive the completed milestone.**

Create or append to `.frontier-app/MILESTONES.md`:

```markdown
# Milestone History

## [Current Version] — Completed [date]

**Phases:** [count] phases, [count] plans
**Duration:** [first commit to last commit]
**SDK Modules:** [list]

### Phase Summary

| Phase | Name | Plans | Status |
|-------|------|-------|--------|
| 1 | Scaffold + Standalone Shell | 1/1 | Complete |
| 2 | [Name] | N/N | Complete |
| ... | ... | ... | ... |

### Key Decisions
[Aggregated from SUMMARY.md files and PROJECT.md Key Decisions table]

### What Shipped
[One paragraph summary of what was built in this milestone]

---
```

```bash
git add .frontier-app/MILESTONES.md
git commit -m "docs: archive milestone [version] — [phase_count] phases complete"
```
</step>

<step name="gather_new_features">
**Get feature descriptions for the new milestone.**

Check if `$ARGUMENTS` contains feature descriptions.

**If description provided in $ARGUMENTS:** Use it directly.

**If no description:** Use AskUserQuestion (if available):
- header: "New Milestone"
- question: "What features should [App Name] [next version] include? Describe the new capabilities you want to add."

If AskUserQuestion denied: error and exit — a description is required:
```
Error: No feature descriptions provided. Usage: /fos:new-milestone "describe new features"
```

Parse the response into individual features. Each feature becomes a candidate for a phase.
</step>

<step name="infer_new_modules">
**Infer SDK modules for the new features.**

```bash
INFO=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" infer-modules "<new feature descriptions>")
if [[ "$INFO" == @file:* ]]; then INFO=$(cat "${INFO#@file:}"); fi
INFERRED_MODULES=$(printf '%s' "$INFO" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write((d.modules||[]).join(','))")
INFERRED_PERMS=$(printf '%s' "$INFO" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write((d.permissions||[]).join(','))")
```

`add-phases` (called in `update_all_state_files`) computes which modules/permissions are genuinely new and merges them — you don't need to diff by hand. Show the user a short summary:

```
## New Milestone: SDK Module Changes

**Keeping:** [existing modules still in use]
**Adding (inferred):** [inferred modules]

New permissions will be merged by `add-phases`. Because a new milestone adds
features, if any new module is introduced a fresh **SDK Integration** phase is
appended last so the new module is wired + Tier-2 verified.
```
</step>

<step name="create_new_phases">
**Create new phases in the roadmap.**

Get the starting phase number for the preview (the actual placement is done by `add-phases` in `update_all_state_files`):
```bash
NEXT_PHASE=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" next-phase --raw)
```

Generate new phases from the features:
- Group related features into coherent phases
- Each phase delivers something testable
- Keep to 2-5 new phases per milestone
- Order by dependency

**New version number:**
```
CURRENT_VERSION="v1"  # from manifest
NEW_VERSION="v2"      # increment
```

Present the plan:
```
## [New Version] Roadmap

Starting from Phase [N]:

- [ ] **Phase [N]: [Feature Name]** — [Description]
- [ ] **Phase [N+1]: [Feature Name]** — [Description]
- [ ] **Phase [N+2]: [Feature Name]** — [Description]
```

Use AskUserQuestion (if available):
- header: "Confirm"
- question: "Does this milestone plan look right?"
- options:
  - "Looks good" — Create the phases
  - "Change something" — Adjust phases
  - "Cancel" — Don't start new milestone yet

If AskUserQuestion denied: display the plan and proceed with "Looks good".
</step>

<step name="update_all_state_files">
**Update manifest.json (via add-phases), ROADMAP.md, REQUIREMENTS.md, STATE.md, PROJECT.md.**

**1. Place phases + merge modules — `add-phases`:**
Pass every new phase name (in order) plus the inferred modules/permissions. `add-phases` merges the new modules/permissions into `manifest.json`, appends the feature phases at the end, and — when any new module is introduced — appends a fresh **SDK Integration** phase last with `sdkPhase` pointing at it. It also creates the phase directories. (The prior milestone's SDK Integration phase is already executed, so this is always the append case.)

```bash
# JSON array of the new phase names, in order — e.g. ["Profiles","Messaging"]
NAMES_JSON='["[Feature 1]","[Feature 2]"]'
ADD=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" add-phases \
  --names "$NAMES_JSON" \
  --modules "$INFERRED_MODULES" \
  --permissions "$INFERRED_PERMS")
if [[ "$ADD" == @file:* ]]; then ADD=$(cat "${ADD#@file:}"); fi

# First new phase number (to discuss next)
NEXT_PHASE=$(printf '%s' "$ADD" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(String(d.firstFeatureNumber))")
```

Parse the descriptor for `featurePhases[]` (numbers/slugs), `sdkIntegration` (`{number, added}`), `sdkPhase`, `newModules`, `newPermissions`. Do NOT hand-edit `manifest.json` phases/modules/permissions or `mkdir` phase dirs — `add-phases` is the single writer of phase structure.

Then bump the milestone in `manifest.json` (a one-field edit; `add-phases` does not touch it): set `"milestone": "[new version]"`.

**2. ROADMAP.md:**
Add new phase section under `## [New Version] Phases`:
- Keep completed phases from previous milestones (marked as done)
- Add a phase line + details for each `featurePhases[]` entry (goals, dependencies, requirements, success criteria)
- If `sdkIntegration.added`, also add **Phase [sdkIntegration.number]: SDK Integration** at the end (mechanical: wire the real SDK adapter + Tier-2 verification)
- Update the progress table with the new phases

**3. REQUIREMENTS.md:**
Add new requirements for the new milestone:
- Keep completed requirements from previous milestone (marked as done)
- Add new REQ-XX entries for new features
- Update traceability table

**4. STATE.md:**
```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update milestone "[new version]"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update phase "$NEXT_PHASE"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "ready-to-discuss"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update next_action "/fos:discuss $NEXT_PHASE"
```

Update body:
- Current Position: Phase [N] of [total], [new version]
- App Reference: Update SDK modules list
- Clear Blockers (fresh milestone)
- Last activity: [today] — Started [new version] milestone

**5. PROJECT.md:**
- Update SDK Modules table with new modules
- Update "What This Is" if the app's scope has grown
- Log milestone transition in Key Decisions table

Phase directories were already created by `add-phases` in step 1 — no `mkdir` needed.

**Commit everything:**
```bash
git add .frontier-app/
git commit -m "feat: start [new version] milestone — [phase_count] new phases

New features: [brief list]
New modules: [if any]
Phases: [N] through [M]"
```
</step>

<step name="next_up">
**Display completion and next step.**

```
## Milestone [New Version] Started

**[App Name]** is entering [new version] with [count] new phases.

New phases:
- Phase [N]: [Name]
- Phase [N+1]: [Name]
- Phase [N+2]: [Name]

[If new modules:] New SDK modules: [newModules]
[If new permissions:] New permissions: [newPermissions]
[If sdkIntegration.added:] SDK Integration appended as Phase [sdkIntegration.number] (last) — wires + Tier-2 verifies the new modules before ship.

────────────────────────────────────────
Next up: `/fos:discuss [first-new-phase]`
  Discuss Phase [N]: [Name] — capture implementation decisions.

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
