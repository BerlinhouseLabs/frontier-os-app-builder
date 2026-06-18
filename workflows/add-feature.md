<purpose>
Add a new feature as a new phase to the current milestone. Takes a feature description, infers SDK modules, then calls `add-phases` to place the feature phase and keep the **SDK Integration** phase last (so any newly-introduced module gets wired + Tier-2 verified), updates ROADMAP.md, REQUIREMENTS.md, and STATE.md. Quick and focused — gets you back into the discuss->plan->execute cycle.
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

<step name="gather_description" priority="first">
**Get the feature description.**

**If .frontier-app/ not found:**
```
Error: No .frontier-app/ directory found.

Run `/fos:new-app` first to initialize your Frontier OS app.
```
Exit workflow.

Check if `$ARGUMENTS` contains a feature description.

**If description provided in $ARGUMENTS:** Use it directly.
```
Adding feature: "[description]"
```

**If no description:** Use AskUserQuestion (if available):
- header: "New Feature"
- question: "What feature do you want to add to [App Name]? Describe what it does."

If AskUserQuestion denied: error and exit — a description is required:
```
Error: No feature description provided. Usage: /fos:add-feature "describe the feature"
```

**Store the description** for module inference.
</step>

<step name="infer_modules">
**Infer SDK modules for the new feature.**

```bash
INFO=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" infer-modules "<feature description>")
if [[ "$INFO" == @file:* ]]; then INFO=$(cat "${INFO#@file:}"); fi
```

Parse JSON for: `modules`, `details`, `permissions`, `moduleCount`. Capture the inferred modules and permissions as comma-joined lists to hand to `add-phases` in the next step:

```bash
INFERRED_MODULES=$(printf '%s' "$INFO" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write((d.modules||[]).join(','))")
INFERRED_PERMS=$(printf '%s' "$INFO" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write((d.permissions||[]).join(','))")
```

You do NOT need to diff against the manifest by hand — `add-phases` computes which modules/permissions are genuinely new, merges them, and decides whether a fresh SDK Integration phase is required. Show the user a short analysis:

```
## Feature Analysis

**Feature:** [description]
**SDK modules inferred:** [modules]

`add-phases` (next step) will report which modules are new and whether a fresh
SDK Integration phase will be appended to wire + verify them.
```
</step>

<step name="add_phase">
**Add the feature phase, preserving the SDK-Integration-last invariant.**

`add-phases` owns all machine bookkeeping: it picks the next phase number (max existing + 1, gap-safe), merges new modules/permissions into `manifest.json`, creates the phase directory, and — crucially — keeps the **SDK Integration** phase last with `sdkPhase` pointing at it. If the feature introduces a new module, it re-appends a fresh SDK Integration phase (or, mid-build, renumbers the still-pending one) so the new module is wired into `sdk-services.tsx` and Tier-2 verified before ship.

```bash
# Build the names array safely: pipe the phase name (one per line) to Node via a QUOTED
# heredoc, so the shell never evaluates quotes/backticks/$() inside the name, then
# JSON.stringify. Replace the body line with your short feature name (e.g. Leaderboard).
NAMES_JSON=$(node -e 'const ls=require("fs").readFileSync(0,"utf8").split("\n").filter(s=>s.trim()); process.stdout.write(JSON.stringify(ls))' <<'FEATURE_NAMES'
<short feature name>
FEATURE_NAMES
)

ADD=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" add-phases \
  --names "$NAMES_JSON" \
  --modules "$INFERRED_MODULES" \
  --permissions "$INFERRED_PERMS")
if [[ "$ADD" == @file:* ]]; then ADD=$(cat "${ADD#@file:}"); fi

# Pull values for the downstream steps
NEXT_PHASE=$(printf '%s' "$ADD" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(String(d.firstFeatureNumber))")
PHASE_SLUG=$(printf '%s' "$ADD" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(d.featurePhases[0].slug)")
PADDED=$(printf "%02d" "$NEXT_PHASE")
PHASE_DIR=".frontier-app/phases/${PADDED}-${PHASE_SLUG}"
```

Parse the descriptor JSON for the rest:
- `sdkIntegration` — `{number, slug, added, renumbered, fromNumber}`: whether a fresh SDK Integration phase was appended (`added`) or an existing pending one was shifted up (`renumbered`), and its final `number`
- `sdkPhase` — the manifest's SDK Integration phase number after the change
- `newModules` / `newPermissions` — what was actually added

Do NOT hand-edit `manifest.json` (phases/modules/permissions) or create the phase directory yourself — `add-phases` already did, and is the single writer of phase structure so the manifest and filesystem can't drift.

Generate 1-3 requirement IDs for this feature (used in the next steps), following the existing `REQ-XX` pattern in REQUIREMENTS.md.
</step>

<step name="update_roadmap">
**Add the new phase to ROADMAP.md.**

Read ROADMAP.md and append:

**In the phase list:**
```markdown
- [ ] **Phase [N]: [Feature Name]** — [One-line description]
```

**In Phase Details:**
```markdown
### Phase [N]: [Feature Name]
**Goal**: [What this phase delivers — one sentence]
**Depends on**: Phase [N-1] (or whichever phase it actually depends on)
**Requirements**: [REQ-XX, REQ-YY]
**Success Criteria** (what must be TRUE):
  1. [Observable behavior from user perspective]
  2. [Observable behavior from user perspective]
  3. [Observable behavior from user perspective]
**Plans**: TBD (created during /fos:plan)

Plans:
- (created during /fos:plan [N])
```

**In Progress table:**
```markdown
| [N]. [Feature Name] | 0/TBD | Not started | - |
```

**Reconcile the SDK Integration phase in ROADMAP** so it matches the manifest `add-phases` just wrote:
- If `sdkIntegration.added` is true, add a phase line + details for **Phase [sdkIntegration.number]: SDK Integration** at the end of the list (mechanical phase — wires the real SDK adapter + Tier-2 verification; depends on the new feature phase).
- If `sdkIntegration.renumbered` is true, update the existing SDK Integration phase's number from `sdkIntegration.fromNumber` to `sdkIntegration.number` so it stays last.
- If neither, the existing modules already cover the feature — leave the SDK Integration phase as-is.

Update the "Last updated" footer.
</step>

<step name="update_requirements">
**Add new requirements to REQUIREMENTS.md.**

Add a new section for the feature:
```markdown
### [Feature Name]

- [ ] **REQ-XX**: [Requirement 1 — user-centric, testable, atomic]
- [ ] **REQ-YY**: [Requirement 2]
```

Update the traceability table:
```markdown
| REQ-XX | Phase [N] | Pending |
| REQ-YY | Phase [N] | Pending |
```

Update coverage counts.
</step>

<step name="update_state">
**Update STATE.md to point to the new feature phase.**

```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "ready-to-discuss"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update phase "$NEXT_PHASE"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update next_action "/fos:discuss $NEXT_PHASE"
```

Update STATE.md body:
- Last activity: [today] — Added feature: [feature name] as Phase [N]
- Session Continuity: next-command = /fos:discuss N

**Commit all changes:**
```bash
git add .frontier-app/
git commit -m "feat: add Phase $NEXT_PHASE — [Feature Name]

Feature: [description]
[If new modules:] New SDK modules: [list]
[If new permissions:] New permissions: [count]
Phase: ${PADDED}-${PHASE_SLUG}"
```
</step>

<step name="next_up">
**Display completion and next step.**

```
## Feature Added: [Feature Name]

Created Phase [N] in the current milestone.

[If new modules:]
  Added SDK modules: [newModules]
  New permissions: [newPermissions]
  SDK Integration re-queued as Phase [sdkIntegration.number] (last) — the new
  module(s) get wired into the real SDK adapter + Tier-2 verified there before ship.

[If no new modules:]
  No new SDK modules needed — existing modules cover this feature.

Phase directory: .frontier-app/phases/${PADDED}-${PHASE_SLUG}/
Requirements: [REQ-XX, REQ-YY]

────────────────────────────────────────
Next up: `/fos:discuss [N]`
  Discuss implementation decisions for [Feature Name] before planning.
  (After you build it, /fos:execute routes you into the SDK Integration phase
  automatically, since it is now last and sdkPhase points to it.)

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
