<purpose>
Research existing Frontier OS apps for relevant patterns, then create detailed execution plans for a phase. Uses a three-agent pipeline: researcher -> planner -> plan-checker, with a revision loop if the checker finds issues. Produces RESEARCH.md and one or more PLAN.md files that the execute workflow will consume.
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

<step name="initialize" priority="first">
**Phase number from argument (required).**

```bash
INIT=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" init plan "$PHASE")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `phase`, `phase_dir`, `has_context`, `has_research`, `existing_plans`, `manifest`, `state`, `project_path`, `roadmap_path`, `template_home`, `version`.

**Generate focused SDK reference for this app's modules:**
```bash
MODULES=$(node -e "const m=JSON.parse(require('fs').readFileSync('.frontier-app/manifest.json','utf8')); console.log(m.modules.join(','))")
SDK_REF=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" sdk-ref --modules "$MODULES")
SDK_REF_PATH="${SDK_REF#@file:}"
```

**If .frontier-app/ not found:**
```
Error: No .frontier-app/ directory found.

Run `/fos:new-app` first to initialize your Frontier OS app.
```
Exit workflow.

**If `phase_dir` is null:** Create the phase directory:
```bash
PADDED=$(printf "%02d" $PHASE)
# Extract phase name from ROADMAP.md
mkdir -p ".frontier-app/phases/${PADDED}-${PHASE_SLUG}"
```

**If `has_context` is false and PHASE > 1:**
```
Warning: No CONTEXT.md for Phase [N]. Planning without user context may
produce plans that miss important decisions.

Recommended: Run `/fos:discuss [N]` first to capture implementation decisions.
Continue anyway? (y/n)
```

**If `existing_plans` is not empty:**
Use AskUserQuestion (if available):
- header: "Existing Plans"
- question: "Phase [N] already has [count] plan(s). What do you want to do?"
- options:
  - "Replan" — Delete existing plans and create new ones
  - "View plans" — Show existing plans before deciding
  - "Keep them" — Skip planning, proceed to execution

If AskUserQuestion denied: default to "Replan" — delete existing plans and create new ones.

**If "Keep them":** Exit with next-up `/fos:execute N`.
**If "Replan":** Continue (plans will be overwritten).
</step>

<step name="spawn_researcher">
**Spawn fos-researcher to study existing Frontier OS apps.**

The researcher examines production apps at `~/frontieros/frontier-os-app-*` to find patterns relevant to this phase.

```
Task(
  subagent_type="fos-researcher",
  prompt="
    <objective>
    Research existing Frontier OS apps for patterns relevant to Phase $PHASE: $PHASE_NAME.
    Produce RESEARCH.md with concrete, copy-ready findings for the planner.
    </objective>

    <execution_context>
    @$HOME/.claude/frontier-os-app-builder/agents/fos-researcher.md
    @$HOME/.claude/frontier-os-app-builder/references/app-patterns.md
    </execution_context>

    <files_to_read>
    Read these files at execution start using the Read tool:
    - $SDK_REF_PATH (focused SDK reference for this app's modules)
    - .frontier-app/PROJECT.md (App vision, SDK modules, constraints)
    - .frontier-app/manifest.json (Declared permissions and metadata)
    - .frontier-app/ROADMAP.md (Phase goal and requirements)
    - $PHASE_DIR/$PADDED-CONTEXT.md (User decisions, if exists)
    </files_to_read>

    <output>
    Write RESEARCH.md to: $PHASE_DIR/$PADDED-RESEARCH.md
    </output>
  "
)
```

**After researcher completes:** Verify RESEARCH.md was created:
```bash
test -f "$PHASE_DIR/$PADDED-RESEARCH.md" && echo "RESEARCH.md created" || echo "RESEARCH.md missing"
```

**If Phase 1 (Scaffold):** Research is minimal — the scaffold pattern is standardized. The researcher should focus on confirming the latest SDK initialization pattern and any recent changes to production app structure. Keep research lightweight.
</step>

<step name="spawn_planner">
**Spawn fos-planner to create execution plans.**

The planner reads RESEARCH.md + CONTEXT.md + PROJECT.md and creates one or more PLAN.md files.

```
Task(
  subagent_type="fos-planner",
  prompt="
    <objective>
    Create execution plans for Phase $PHASE: $PHASE_NAME.
    Each plan is a vertical slice — model + logic + UI for one coherent piece of functionality.
    Plans must be specific enough for an executor agent to implement without asking questions.
    </objective>

    <execution_context>
    @$HOME/.claude/frontier-os-app-builder/templates/state/plan.md
    @$HOME/.claude/frontier-os-app-builder/references/app-patterns.md
    @$HOME/.claude/frontier-os-app-builder/references/verification-rules.md
    </execution_context>

    <files_to_read>
    Read these files at execution start using the Read tool:
    - $SDK_REF_PATH (focused SDK reference for this app's modules)
    - .frontier-app/PROJECT.md (App vision, SDK modules, constraints)
    - .frontier-app/manifest.json (Declared permissions and metadata)
    - .frontier-app/ROADMAP.md (Phase goal, success criteria, requirements)
    - $PHASE_DIR/$PADDED-RESEARCH.md (Research findings from production apps)
    - $PHASE_DIR/$PADDED-CONTEXT.md (User decisions, if exists)
    </files_to_read>

    <planning_rules>
    - Phase 1 (Scaffold + Standalone Shell): ALWAYS exactly 1 plan. Uses standalone templates: `frontier-services.tsx`, `layout-standalone.tsx`, `package-standalone.json`, `main-router.tsx`, `vercel-standalone.json`.
    - SDK Integration phase: ALWAYS exactly 1 plan. Mechanical — adds SDK dependency, creates adapter, upgrades Layout. Minimal research needed.
    - Feature phases: 1-3 plans. Prefer fewer, larger plans over many small ones.
    - Feature phase tasks reference `useServices()` from `../lib/frontier-services` for all service access. Method names are validated against the focused SDK reference for correctness.
    - Each plan gets 2-3 tasks. Tasks are atomic — one clear action each.
    - Wave 1 = no dependencies. Wave 2 = depends on Wave 1. Usually 1 wave is enough.
    - Vertical slices: Plan 01 = Event listing (hook + component + route), NOT Plan 01 = All hooks.
    - SDK methods: Specify exact import, method signature, expected return type.
    - Every plan MUST include verification tasks (build, typecheck, dev server).
    - Every plan MUST reference the execute-plan workflow in execution_context.
    - Use the plan template frontmatter format exactly.
    </planning_rules>

    <output>
    Write plan files to: $PHASE_DIR/${PADDED}-01-PLAN.md, ${PADDED}-02-PLAN.md, etc.
    </output>
  "
)
```

**After planner completes:** Verify plans were created:
```bash
ls "$PHASE_DIR/"*-PLAN.md 2>/dev/null | wc -l
```
</step>

<step name="spawn_plan_checker">
**Spawn fos-plan-checker to verify plan quality.**

```
Task(
  subagent_type="fos-plan-checker",
  prompt="
    <objective>
    Review the plans for Phase $PHASE: $PHASE_NAME.
    Check for completeness, correctness, and executability.
    Return PASS or FAIL with specific feedback.
    </objective>

    <files_to_read>
    Read these files at execution start using the Read tool:
    - .frontier-app/PROJECT.md (App vision — verify plans align)
    - .frontier-app/ROADMAP.md (Phase requirements — verify all covered)
    - $PHASE_DIR/$PADDED-CONTEXT.md (User decisions — verify plans honor them)
    - All PLAN.md files in $PHASE_DIR/
    </files_to_read>

    <check_criteria>
    1. **Coverage:** Do plans address all phase requirements from ROADMAP.md?
    2. **Context honor:** Do plans respect all decisions in CONTEXT.md? No locked decisions overridden?
    3. **SDK correctness:** Are SDK methods referenced with correct signatures and permissions?
    4. **Task specificity:** Is every task concrete enough to implement without ambiguity?
    5. **Verification:** Does every plan include build + typecheck verification?
    6. **Dependencies:** Are wave assignments correct? No circular deps?
    7. **File conflicts:** Do any plans modify the same files in the same wave?
    8. **Tier compliance:** Dark theme, services layer, mock data — all covered? (Tier 1 for feature phases; full SDK check for SDK Integration phase only)
    </check_criteria>

    <output>
    Return a structured result:
    - verdict: PASS or FAIL
    - issues: list of specific issues found (if FAIL)
    - suggestions: optional improvements (even if PASS)
    </output>
  "
)
```
</step>

<step name="revision_loop">
**If plan-checker returns FAIL: revise plans.**

Maximum 3 revision loops. Each loop:

1. Parse the checker's feedback — extract specific issues
2. Re-spawn the planner with the feedback:

```
Task(
  subagent_type="fos-planner",
  prompt="
    <objective>
    REVISE execution plans for Phase $PHASE: $PHASE_NAME.
    The plan-checker found issues that must be fixed.
    </objective>

    <feedback>
    [Paste specific issues from plan-checker]
    </feedback>

    <files_to_read>
    - All existing PLAN.md files in $PHASE_DIR/ (read and revise in place)
    - .frontier-app/PROJECT.md
    - .frontier-app/ROADMAP.md
    - $PHASE_DIR/$PADDED-CONTEXT.md
    - $PHASE_DIR/$PADDED-RESEARCH.md
    </files_to_read>

    <output>
    Overwrite the existing PLAN.md files with corrected versions.
    </output>
  "
)
```

3. Re-spawn plan-checker on revised plans
4. If PASS: break loop. If FAIL again: loop (up to 3 times)

**If still FAIL after 3 loops:**
```
Warning: Plan-checker found issues after 3 revision attempts.
Remaining issues:
- [issue 1]
- [issue 2]

You can:
- Proceed to execution with known issues
- Manually review and fix plans in $PHASE_DIR/
- Re-run /fos:plan $PHASE to start fresh
```
</step>

<step name="commit_and_update_state">
**Commit planning artifacts and update state.**

```bash
git add ".frontier-app/phases/"
git commit -m "docs: Phase $PHASE plans — [plan_count] plan(s) created

Phase: $PHASE_NAME
Plans: [list of plan names/objectives]
Checker: [PASS/FAIL with loop count]"
```

**Update STATE.md:**
```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "ready-to-execute"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update next_action "/fos:execute $PHASE"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update phase "$PHASE"
```

Also update STATE.md body:
- Last activity: [today] — Planned Phase [N]: [count] plans
- Session Continuity: next-command = /fos:execute N
</step>

<step name="next_up">
**Display completion and next step.**

```
## Phase [N]: [Name] — Plans Created

Created [count] plan(s):

| Plan | Wave | Objective | Tasks |
|------|------|-----------|-------|
| $PADDED-01 | 1 | [objective] | [count] |
| $PADDED-02 | 1 | [objective] | [count] |

Plan checker: [PASS / PASS after N revisions]

────────────────────────────────────────
Next up: `/fos:execute [N]`
  Execute the plans — build the code, commit atomically, verify results.

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
