<purpose>
Auto-route to the next logical step in the FOS workflow. Reads project state and existing artifacts to determine what's needed: discuss, plan, execute, or ship. Tells the user exactly which command to run next and why.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<available_agent_types>
This workflow does not spawn subagents — it reads state and routes.
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

To get started, run:

────────────────────────────────────────
Next up: `/fos:new-app`
  Initialize a new Frontier OS app from a natural language description.

Run `/clear` first to free your context window.
────────────────────────────────────────
```
Exit workflow.
</step>

<step name="read_state">
**Load project state.**

```bash
STATE_JSON=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state json)
```

Parse for: `milestone`, `phase`, `plan`, `status`, `next_action`.

Also read:
- `.frontier-app/STATE.md` — Full state body for additional context
- `.frontier-app/ROADMAP.md` — Phase list and completion status
- `.frontier-app/manifest.json` — Phase definitions

**If STATE.md has a `next_action` field:** This is the fastest path — it was set by the previous workflow.
</step>

<step name="determine_position">
**Analyze artifacts to determine exactly where the project stands.**

For the current phase (from STATE.md `phase` field):

```bash
PADDED=$(printf "%02d" $CURRENT_PHASE)
PHASE_DIR=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" find-phase "$CURRENT_PHASE" --raw 2>/dev/null)

# Check what artifacts exist
HAS_CONTEXT="false"
HAS_RESEARCH="false"
HAS_PLANS="false"
PLAN_COUNT=0
SUMMARY_COUNT=0
ALL_PLANS_DONE="false"

if [ -n "$PHASE_DIR" ]; then
  # Context file
  test -f "$PHASE_DIR/${PADDED}-CONTEXT.md" && HAS_CONTEXT="true"

  # Research file
  test -f "$PHASE_DIR/${PADDED}-RESEARCH.md" && HAS_RESEARCH="true"

  # Plan files
  PLAN_COUNT=$(ls "$PHASE_DIR/"*-PLAN.md 2>/dev/null | wc -l | tr -d ' ')
  test "$PLAN_COUNT" -gt 0 && HAS_PLANS="true"

  # Summary files (completed plans)
  SUMMARY_COUNT=$(ls "$PHASE_DIR/"*-SUMMARY.md 2>/dev/null | wc -l | tr -d ' ')

  # Check if all plans are done
  if [ "$PLAN_COUNT" -gt 0 ] && [ "$SUMMARY_COUNT" -ge "$PLAN_COUNT" ]; then
    ALL_PLANS_DONE="true"
  fi
fi
```

**Decision tree:**

1. **Status is "shipped" or "milestone-complete":**
   -> Suggest `/fos:new-milestone` or `/fos:add-feature`

2. **Status is "ready-to-test" OR next_action is `/fos:test-pwa`:**
   -> Suggest `/fos:test-pwa`

3. **Phase directory doesn't exist:**
   -> Suggest `/fos:discuss $CURRENT_PHASE` (need to start from scratch)

4. **No CONTEXT.md (and phase > 1):**
   -> Suggest `/fos:discuss $CURRENT_PHASE`

5. **No PLAN.md files:**
   -> Suggest `/fos:plan $CURRENT_PHASE`

6. **Plans exist but not all have SUMMARY.md (incomplete execution):**
   -> Suggest `/fos:execute $CURRENT_PHASE`

7. **All plans have SUMMARY.md (phase complete):**
   -> Check if more phases exist in ROADMAP.md
   -> If yes: Advance to next phase, suggest `/fos:discuss $NEXT_PHASE`
   -> If no: Suggest `/fos:ship`

8. **Fallback — use STATE.md next_action field:**
   -> Trust the last workflow's suggestion
</step>

<step name="display_suggestion">
**Show the suggestion with explanation.**

```
## Current Position

**App:** [App Name]
**Milestone:** [version]
**Phase [N]:** [Phase Name]
**Status:** [human-readable status]

[Explanation of why this is the next step:]

[Example for no context:]
Phase [N] has no context decisions yet. The discuss step captures your
implementation preferences before planning begins — what layout you want,
how interactions should work, which SDK methods to use.

[Example for no plans:]
Phase [N] has context but no execution plans. The plan step researches
existing Frontier OS apps for patterns and creates detailed task plans.

[Example for incomplete execution:]
Phase [N] has [plan_count] plans, but [remaining] haven't been executed yet.
Continuing execution will build the remaining features.

[Example for all phases done:]
All [count] phases are complete! Your app is ready to deploy.

────────────────────────────────────────
Next up: `/fos:[command] [args]`
  [One-line description of what it does]

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
