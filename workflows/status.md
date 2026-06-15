<purpose>
Display a comprehensive, formatted status of the current Frontier OS app project. Shows app identity, milestone, SDK modules, phase progress, permissions, and the next recommended action. Read-only — does not modify any state.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<available_agent_types>
This workflow does not spawn subagents — it reads state and displays.
</available_agent_types>

<process>

<step name="check_project_exists" priority="first">
**Verify .frontier-app/ exists.**

```bash
test -d .frontier-app && echo "exists" || echo "missing"
```

**If missing:**
```
No Frontier OS app found in this directory.

Run `/fos:new-app` to create one.
```
Exit workflow.
</step>

<step name="load_all_state">
**Read all state files.**

```bash
STATE_JSON=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state json)
MANIFEST=$(cat .frontier-app/manifest.json)
```

Read these files:
1. `.frontier-app/STATE.md` — Full state with frontmatter and body
2. `.frontier-app/ROADMAP.md` — Phase list, details, progress table
3. `.frontier-app/manifest.json` — Modules, permissions, phase definitions
4. `.frontier-app/PROJECT.md` — App name, description, core value, SDK modules

Parse from STATE.md frontmatter: `milestone`, `phase`, `plan`, `status`, `next_action`.
Parse from manifest: `name`, `description`, `devPort`, `modules`, `permissions`, `phases`.
</step>

<step name="scan_phase_artifacts">
**Scan each phase directory for artifacts.**

For each phase defined in the manifest or ROADMAP.md:

```bash
PHASES_DIR=".frontier-app/phases"
for PHASE_DIR in "$PHASES_DIR"/*/; do
  PHASE_NUM=$(basename "$PHASE_DIR" | cut -d- -f1)
  PHASE_NAME=$(basename "$PHASE_DIR" | cut -d- -f2-)

  # Count artifacts
  CONTEXT=$(test -f "$PHASE_DIR/${PHASE_NUM}-CONTEXT.md" && echo "yes" || echo "no")
  RESEARCH=$(test -f "$PHASE_DIR/${PHASE_NUM}-RESEARCH.md" && echo "yes" || echo "no")
  PLANS=$(ls "$PHASE_DIR/"*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
  SUMMARIES=$(ls "$PHASE_DIR/"*-SUMMARY.md 2>/dev/null | wc -l | tr -d ' ')

  echo "$PHASE_NUM|$PHASE_NAME|$CONTEXT|$RESEARCH|$PLANS|$SUMMARIES"
done
```

**Determine phase status from artifacts:**
- No context, no plans: "Not started"
- Context exists, no plans: "Discussed"
- Plans exist, no summaries: "Planned"
- Some summaries: "In progress ([done]/[total])"
- All summaries: "Complete"
</step>

<step name="display_status">
**Display the formatted status report.**

```
## [App Name] — Project Status

**Description:** [from manifest or PROJECT.md]
**Milestone:** [version] | **Status:** [from STATE.md]
**Dev Port:** [from manifest]

### SDK Modules

| Module | Key Methods | Status |
|--------|-------------|--------|
| Storage | get, set, remove | Active |
| Chain | getCurrentNetwork | Active |
| [Module] | [methods] | Active |

### Phase Progress

| # | Phase | Context | Plans | Done | Status |
|---|-------|---------|-------|------|--------|
| 1 | Scaffold + Standalone Shell | [yes/no] | [count] | [count]/[total] | [status] |
| 2 | [Feature Name] | [yes/no] | [count] | [count]/[total] | [status] |
| 3 | [Feature Name] | [yes/no] | [count] | [count]/[total] | [status] |

**Overall Progress:** [completed phases]/[total phases] phases | [completed plans]/[total plans] plans

[Progress bar visualization:]
[##########..........] 50%

### Current Position

**Phase [N]:** [Phase Name]
**Status:** [Human-readable: "Discussed, ready to plan" / "2 of 3 plans executed" / etc.]
**Last Activity:** [from STATE.md]

### Permissions ([count])

```
[List all permissions from manifest, grouped by module:]

wallet:
  - wallet:getBalance
  - wallet:transferFrontierDollar

events:
  - events:listEvents
  - events:createEvent

[etc.]
```

### Next Action

[From STATE.md next_action, with explanation:]

────────────────────────────────────────
Next up: `/fos:[command] [args]`
  [One-line description]

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
