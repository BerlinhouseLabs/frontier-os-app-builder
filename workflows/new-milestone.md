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
MODULES=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" infer-modules "<new feature descriptions>")
```

Compare with existing modules from manifest:
- **Already have:** Modules in current manifest that are still needed
- **New modules:** Modules inferred from new features not in current manifest
- **Removed modules:** Modules in current manifest not needed by any feature (old or new) — rare

```
## New Milestone: SDK Module Changes

**Keeping:** [existing modules still in use]
**Adding:** [new modules required by new features]
[If any removed:] **No longer needed:** [removed modules]

New permissions required: [list new permissions]
```
</step>

<step name="create_new_phases">
**Create new phases in the roadmap.**

Calculate the next phase number from the highest existing phase:
```bash
# Find highest phase number in phases directory
HIGHEST=$(ls .frontier-app/phases/ 2>/dev/null | sort -r | head -1 | cut -d- -f1)
NEXT_PHASE=$((10#$HIGHEST + 1))
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
**Update ROADMAP.md, manifest.json, STATE.md, PROJECT.md.**

**1. ROADMAP.md:**
Add new phase section under `## [New Version] Phases`:
- Keep completed phases from previous milestones (marked as done)
- Add new phase details with goals, dependencies, requirements, success criteria
- Update progress table with new phases

**2. manifest.json:**
```json
{
  "milestone": "[new version]",
  "modules": [/* updated module list */],
  "permissions": [/* updated permissions list */],
  "phases": [
    /* existing completed phases */,
    {"number": N, "name": "[Feature]", "status": "not-started"},
    /* ... new phases ... */
  ]
}
```

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

**Create phase directories:**
```bash
for PHASE in $NEW_PHASES; do
  PADDED=$(printf "%02d" $PHASE_NUM)
  mkdir -p ".frontier-app/phases/${PADDED}-${PHASE_SLUG}"
done
```

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

[If new modules:] New SDK modules: [list]
[If new permissions:] New permissions: [count] added

────────────────────────────────────────
Next up: `/fos:discuss [first-new-phase]`
  Discuss Phase [N]: [Name] — capture implementation decisions.

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
