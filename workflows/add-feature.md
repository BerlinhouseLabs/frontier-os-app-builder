<purpose>
Add a new feature as a new phase to the current milestone. Takes a feature description, infers SDK modules, calculates the next phase number, creates the phase directory, updates ROADMAP.md, manifest.json, and STATE.md. Quick and focused — gets you back into the discuss->plan->execute cycle.
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
MODULES=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" infer-modules "<feature description>")
```

Parse JSON for: `modules`, `details`, `permissions`, `moduleCount`.

**Compare with existing manifest modules:**
```bash
MANIFEST=$(cat .frontier-app/manifest.json)
```

Identify:
- **Already declared:** Modules in manifest that this feature also needs (no change)
- **New modules:** Modules inferred that aren't in the manifest (need to add)

```
## Feature Analysis

**Feature:** [description]

**SDK Modules needed:**
[If all modules already declared:]
  All required modules already in manifest. No new permissions needed.

[If new modules needed:]
  New modules required:
  | Module | Why | New Permissions |
  |--------|-----|-----------------|
  | [Module] | [matched keywords] | [permissions to add] |
```
</step>

<step name="calculate_phase_number">
**Find the next available phase number.**

Read ROADMAP.md to find the highest phase number:
```bash
# Count existing phases from phases directory
EXISTING_PHASES=$(ls -d .frontier-app/phases/*/ 2>/dev/null | wc -l)
NEXT_PHASE=$((EXISTING_PHASES + 1))
```

Also check ROADMAP.md for any planned-but-not-yet-created phases to avoid conflicts.

Generate the phase slug from the feature description:
```bash
# Example: "Event Creation Form" -> "event-creation-form"
PHASE_SLUG=$(echo "$FEATURE_NAME" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-' | head -c 50)
PADDED=$(printf "%02d" $NEXT_PHASE)
PHASE_DIR=".frontier-app/phases/${PADDED}-${PHASE_SLUG}"
```
</step>

<step name="create_phase">
**Create the phase directory.**

```bash
mkdir -p "$PHASE_DIR"
```

Generate 1-3 requirement IDs for this feature:
- Use existing requirement prefix pattern from REQUIREMENTS.md
- Or generate new REQ-XX IDs
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

Update the "Last updated" footer.
</step>

<step name="update_manifest">
**Update manifest.json with new modules and permissions if needed.**

**If new modules were identified:**
```bash
# Read current manifest, add new modules and permissions, write back
```

Add to `modules` array: any new module names
Add to `permissions` array: any new permissions
Add to `phases` array: `{"number": N, "name": "[Feature Name]", "status": "not-started"}`

**If no new modules:** Only add the phase entry.
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
  Added SDK modules: [list]
  New permissions: [list]

[If no new modules:]
  No new SDK modules needed — existing modules cover this feature.

Phase directory: .frontier-app/phases/${PADDED}-${PHASE_SLUG}/
Requirements: [REQ-XX, REQ-YY]

────────────────────────────────────────
Next up: `/fos:discuss [N]`
  Discuss implementation decisions for [Feature Name] before planning.

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
