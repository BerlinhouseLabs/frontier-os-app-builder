<purpose>
Execute all plans in a phase using wave-based execution. Orchestrator stays lean — delegates plan execution to subagents, each getting a fresh context window with the full execute-plan workflow. After all plans complete, spawns a verifier to confirm the phase delivers what it promised.
</purpose>

<core_principle>
Orchestrator coordinates, not executes. Each subagent loads the full execute-plan context. Orchestrator: discover plans -> analyze deps -> group waves -> spawn agents -> collect results -> verify.
</core_principle>

<required_reading>
Read STATE.md before any operation to load project context.
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
INIT=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" init execute "$PHASE")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `phase`, `phase_dir`, `plans`, `summaries`, `incomplete_plans`, `all_complete`, `manifest`, `state`, `project_path`, `roadmap_path`, `template_home`, `version`.

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

**If `phase_dir` is null:**
```
Error: Phase [N] directory not found.

Run `/fos:plan [N]` first to create execution plans.
```
Exit workflow.

**If `plans` is empty:**
```
Error: No plans found in Phase [N].

Run `/fos:plan [N]` first to create execution plans.
```
Exit workflow.

**If `all_complete` is true:**
```
Phase [N] is already fully executed — all plans have SUMMARY.md files.

Run `/fos:status` to see project state, or `/fos:next` for the next step.
```
Exit workflow.

Report status:
```
## Phase [N]: [Name]

Found [total] plan(s), [incomplete] remaining to execute.
[If some complete: "[complete] plan(s) already done — resuming from where we left off."]
```
</step>

<step name="discover_and_group_plans">
**Read all plan files and group into execution waves.**

For each plan file in `incomplete_plans`:
1. Read the plan file
2. Parse frontmatter for: `wave`, `depends_on`, `autonomous`, `files_modified`
3. Parse `<objective>` for the plan description

**Group plans by wave number:**
- Wave 1: Plans with `depends_on: []` or `wave: 1`
- Wave 2: Plans with `wave: 2` (depends on Wave 1 plans)
- Wave 3+: Subsequent waves

**If no wave field in frontmatter:** Default to Wave 1 (no dependencies).

**Report execution plan:**
```
## Execution Plan

**Phase [N]: [Name]** — [count] plans across [wave_count] wave(s)

| Wave | Plans | What It Builds |
|------|-------|----------------|
| 1 | 01-01, 01-02 | [from plan objectives, 3-8 words] |
| 2 | 01-03 | [from plan objectives, 3-8 words] |
```
</step>

<step name="execute_waves">
**Execute each wave in sequence. Plans within a wave run in parallel.**

**Mark execution started (orchestrator owns STATE.md).** Before spawning any executors,
set the status once here in the main checkout. The parallel worktree executors never write
STATE.md, so this single up-front write cannot race with them and stays observable (e.g. to
Studio) for the duration of the wave:

```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "executing"
# Commit only if the status actually changed (no-op-safe on re-run). Use --no-verify so this
# metadata commit doesn't run app pre-commit hooks; a real commit failure should stop the run.
if ! git diff --quiet -- .frontier-app/STATE.md; then
  git add .frontier-app/STATE.md
  git commit -m "docs: Phase $PHASE executing" --no-verify --quiet
fi
```

**For each wave:**

1. **Describe what's being built (BEFORE spawning):**

   ```
   ---
   ## Wave [N]

   **[Plan ID]: [Plan Name]**
   [2-3 sentences: what this builds, which SDK modules, why it matters]

   Spawning [count] agent(s)...
   ---
   ```

2. **Spawn fos-executor per plan:**

   ```
   Task(
     subagent_type="fos-executor",
     isolation="worktree",
     prompt="
       <objective>
       Execute plan [plan_number] of Phase [phase_number]-[phase_name].
       Commit each task atomically. Create SUMMARY.md when done.
       Do NOT write STATE.md — the orchestrator owns it.
       </objective>

       <parallel_execution>
       You are running as a PARALLEL executor agent. Use --no-verify on all git
       commits to avoid pre-commit hook contention with other agents. The
       orchestrator validates hooks once after all agents complete.
       </parallel_execution>

       <execution_context>
       @$HOME/.claude/frontier-os-app-builder/workflows/execute-plan.md
       @$HOME/.claude/frontier-os-app-builder/templates/state/summary.md
       @$HOME/.claude/frontier-os-app-builder/references/app-patterns.md
       @$HOME/.claude/frontier-os-app-builder/references/verification-rules.md
       </execution_context>

       <files_to_read>
       Read these files at execution start using the Read tool:
       - $SDK_REF_PATH (focused SDK reference for this app's modules)
       - $PHASE_DIR/[plan_file] (The plan to execute)
       - .frontier-app/PROJECT.md (App vision, SDK modules)
       - .frontier-app/manifest.json (Permissions)
       - .frontier-app/STATE.md (Current state)
       - $PHASE_DIR/$PADDED-CONTEXT.md (User decisions, if exists)
       - $PHASE_DIR/$PADDED-RESEARCH.md (Research findings, if exists)
       </files_to_read>

       <success_criteria>
       - [ ] All tasks executed
       - [ ] Each task committed individually
       - [ ] SUMMARY.md created in phase directory
       - [ ] Build succeeds (npm run build)
       - [ ] No TypeScript errors (npx tsc --noEmit)
       - [ ] Dark theme verified
       </success_criteria>
     "
   )
   ```

3. **Wait for all agents in wave to complete before starting next wave.**

   **Completion verification (per plan):**
   ```bash
   SUMMARY_FILE="$PHASE_DIR/[plan_prefix]-SUMMARY.md"
   if [ ! -f "$SUMMARY_FILE" ]; then
     echo "incomplete"
   elif grep -q "Self-Check: FAILED" "$SUMMARY_FILE"; then
     echo "self-check-failed"
   else
     echo "complete"
   fi
   ```

   - **complete:** SUMMARY.md exists, self-check passed, git log shows recent commits. Treat as successful.
   - **self-check-failed:** SUMMARY.md exists but executor detected issues. Read the SUMMARY.md to extract what failed, then ask:
     - "Retry this plan?" — re-spawn the executor
     - "Fix manually?" — exit with pointer to SUMMARY.md
     - "Continue anyway?" — note the gap for the verifier
   - **incomplete:** SUMMARY.md missing after agent returns. Either the agent crashed or hit a checkpoint (see handle_checkpoints step). Report as failed.

4. **Post-wave hook validation (parallel mode):**

   When agents committed with `--no-verify`, run pre-commit hooks once after the wave:
   ```bash
   git stash --quiet 2>/dev/null || true
   git hook run pre-commit 2>&1 || echo "Warning: Pre-commit hooks failed — review before continuing"
   git stash pop --quiet 2>/dev/null || true
   ```
   If hooks fail: report the failure and ask "Fix hook issues now?" or "Continue to next wave?"

5. **Report wave completion:**

   For each completed plan, read its SUMMARY.md and extract:
   - One-liner description
   - Files created/modified
   - Any deviations from plan

   ```
   ---
   ## Wave [N] Complete

   **[Plan ID]: [Plan Name]**
   [What was built — from SUMMARY.md]
   [Notable deviations, if any]

   [If more waves: what this enables for next wave]
   ---
   ```

6. **Handle failures:**

   If a plan fails:
   - Report which plan failed and why (from agent output or error)
   - Ask: "Retry this plan?" / "Skip and continue?" / "Stop execution?"
   - If retry: re-spawn the executor for that plan
   - If skip: note the gap for the verifier
   - If stop: save state and exit
</step>

<step name="handle_checkpoints">
**Handle executor agents that returned checkpoint state instead of completion.**

When an executor agent returns a structured checkpoint (output contains `## CHECKPOINT REACHED` and no SUMMARY.md was created), it means a `checkpoint:human-verify` or `checkpoint:decision` task was encountered.

**Detection:** After each executor returns in a wave, check:
- If SUMMARY.md exists for that plan: agent completed normally. Skip this step.
- If SUMMARY.md does NOT exist AND agent output contains `## CHECKPOINT REACHED`: checkpoint hit.

**For each checkpoint:**

1. **Parse the checkpoint return:**
   - Type: `human-verify` or `decision`
   - Plan ID and progress (completed/total tasks)
   - Completed tasks table (with commit hashes)
   - Checkpoint details (what to verify or decide)
   - Awaiting section (what user needs to provide)

2. **Present to user:**
   ```
   ## Checkpoint: [Type]

   **Plan:** [plan ID] — [plan name]
   **Progress:** [completed]/[total] tasks complete

   [Checkpoint details from agent return]

   [Awaiting section from agent return]
   ```

   Use AskUserQuestion (if available):
   - header: "Checkpoint: [Type]"
   - question: "[Awaiting section content]"
   - If human-verify: options: ["Approved", "Issues found — describe below"]
   - If decision: options from checkpoint details

   If AskUserQuestion denied: default to "Approved" for human-verify, or the first/recommended option for decisions.

3. **Spawn a FRESH continuation executor:**

   ```
   Task(
     subagent_type="fos-executor",
     isolation="worktree",
     prompt="
       <objective>
       Continue execution of plan [plan_number], Phase [phase_number]-[phase_name].
       Previous agent completed [N] tasks before hitting a checkpoint.
       Resume from Task [resume_task_number]: [resume_task_name].
       </objective>

       <completed_tasks>
       [Completed tasks table from checkpoint return — task names + commit hashes]
       </completed_tasks>

       <user_response>
       [User's response to checkpoint]
       </user_response>

       <resume_instructions>
       Start from Task [resume_task_number]: [resume_task_name].
       Verify previous commits exist before continuing.
       Do NOT redo completed tasks.
       </resume_instructions>

       <execution_context>
       @$HOME/.claude/frontier-os-app-builder/workflows/execute-plan.md
       @$HOME/.claude/frontier-os-app-builder/templates/state/summary.md
       @$HOME/.claude/frontier-os-app-builder/references/app-patterns.md
       @$HOME/.claude/frontier-os-app-builder/references/verification-rules.md
       </execution_context>

       <files_to_read>
       Read these files at execution start using the Read tool:
       - $SDK_REF_PATH (focused SDK reference for this app's modules)
       - $PHASE_DIR/[plan_file] (The plan to execute)
       - .frontier-app/PROJECT.md (App vision, SDK modules)
       - .frontier-app/manifest.json (Permissions)
       - .frontier-app/STATE.md (Current state)
       </files_to_read>
     "
   )
   ```

4. **Wait for continuation agent.** If it hits another checkpoint, repeat from step 1. If it completes (SUMMARY.md created), treat as normal completion.

**Why fresh agent, not resume:** Fresh agents with explicit completed-task state are more reliable than attempting to resume a paused agent context.
</step>

<step name="spawn_verifier">
**After all waves complete: verify the phase.**

```
Task(
  subagent_type="fos-verifier",
  prompt="
    <objective>
    Verify Phase [N]: [Name] delivers what the roadmap promised.
    Check all success criteria from ROADMAP.md are met.
    Check all SUMMARY.md files for issues.
    Run structural and permission validation.

    Read sdkPhase from manifest.json. If current phase matches sdkPhase, run BOTH
    Tier 1 (standalone app quality) and Tier 2 (SDK integration correctness) checks.
    Otherwise, run Tier 1 checks only.
    </objective>

    <files_to_read>
    Read these files at execution start using the Read tool:
    - .frontier-app/ROADMAP.md (Phase success criteria)
    - .frontier-app/PROJECT.md (App constraints)
    - .frontier-app/manifest.json (Permissions)
    - All SUMMARY.md files in $PHASE_DIR/
    </files_to_read>

    <verification_commands>
    Run these checks:
    - node '$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs' validate structure --phase "$PHASE"
    - node '$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs' validate permissions --phase "$PHASE"
    - npx tsc --noEmit (if app source exists)
    - npm run build (if package.json exists)
    </verification_commands>

    <output>
    Write VERIFICATION.md to $PHASE_DIR/{phase_num}-VERIFICATION.md using the Write tool,
    following the output_format structure in your agent definition (frontmatter with status,
    verified_date, checks_passed, gaps fields, then full check results by category).

    Then return structured result to the orchestrator:
    - verdict: PASSED or GAPS_FOUND
    - criteria_results: each success criterion with pass/fail
    - gaps: list of gaps found (if any)
    - suggestions: optional improvements
    </output>
  "
)
```

**Parse verifier verdict from VERIFICATION.md:**
```bash
VERIFICATION_FILE="$PHASE_DIR/${PADDED}-VERIFICATION.md"
VERDICT=$(grep -m1 "^status:" "$VERIFICATION_FILE" | awk '{print $2}')
```

**If verdict is `passed`:**
Verifier confirmed phase delivers on its promises. Continue to update_state_and_roadmap.

**If verdict is `gaps_found`:**
```
## Verification: Gaps Found

Phase [N]: [Name] — [checks_passed] checks passed, gaps remain.

| # | Check | Issue | Severity |
|---|-------|-------|----------|
| 1 | [Check ID] | [What failed] | Blocker/Warning |
| 2 | [Check ID] | [What failed] | Blocker/Warning |

[Gap details from VERIFICATION.md Gaps section]
```

Use AskUserQuestion (if available):
- header: "Verification Gaps"
- question: "How do you want to handle these gaps?"
- options:
  - "Generate gap-closure plans and re-execute" — Creates fix plans, executes them, then re-verifies
  - "Fix manually and re-verify" — You address the issues, then run `/fos:execute [N]` again
  - "Accept with gaps noted" — Mark phase as partial, gaps documented in VERIFICATION.md

**If "Generate gap-closure plans":**
1. Read the Gaps section from VERIFICATION.md
2. Spawn fos-planner with the gap list as context to create targeted fix plans
3. Execute the new plans (re-enter execute_waves for the gap-closure plans only)
4. Re-run verifier after gap-closure plans complete

**If "Fix manually":** Exit with message: "Fix the gaps listed in `$VERIFICATION_FILE`, then run `/fos:execute [N]` to re-verify."

**If "Accept with gaps":** Continue to update_state_and_roadmap. Record the phase as **partial** (instead of "complete") in ROADMAP.md and the STATE.md body — do NOT pass "partial" to `state update status`; "partial" is not a valid machine status, so the frontmatter `status` field stays `phase-complete`. Gaps remain documented in VERIFICATION.md.

**If AskUserQuestion denied:** Default to "Generate gap-closure plans and re-execute".
</step>

<step name="update_state_and_roadmap">
**Update STATE.md and ROADMAP.md.**

**Determine next phase:**
- Read ROADMAP.md for total phase count
- If current phase < total phases: next is discuss for phase N+1
- If current phase = total phases: next is ship

```bash
# Update state (orchestrator is the sole STATE.md writer)
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "phase-complete"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update phase "$PHASE"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update plan "done"

# Read sdkPhase from manifest
SDK_PHASE=$(node -e "const m=JSON.parse(require('fs').readFileSync('.frontier-app/manifest.json','utf8')); console.log(m.sdkPhase || -1)")

# Set next action based on whether more phases remain
if [ "$PHASE" -lt "$TOTAL_PHASES" ]; then
  NEXT_PHASE=$((PHASE + 1))
  if [ "$NEXT_PHASE" -eq "$SDK_PHASE" ]; then
    # SDK Integration phase is mechanical — skip discuss, go straight to plan
    node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update next_action "/fos:plan $NEXT_PHASE"
    node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "ready-to-plan"
  else
    node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update next_action "/fos:discuss $NEXT_PHASE"
    node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "ready-to-discuss"
  fi
else
  if [ "$PHASE" -eq "$SDK_PHASE" ]; then
    node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update next_action "/fos:test-pwa"
    node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "ready-to-test"
  else
    node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update next_action "/fos:ship"
    node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "milestone-complete"
  fi
fi
```

**Update ROADMAP.md:**
- Mark phase plans as complete in the progress table
- Update phase status to "Complete" (or "Partial" if gaps)
- Add completion date

**Update STATE.md body:**
- Current Position: Advance to next phase or "Ready to ship"
- Update progress bar
- Update metrics (plans completed, duration)
- Last activity: [today] — Executed Phase [N]: [Name]

```bash
git add .frontier-app/
git commit -m "docs: Phase $PHASE complete — [plan_count] plans executed

Verification: [PASS/FAIL]
Next: [/fos:discuss N+1 or /fos:ship]"
```
</step>

<step name="next_up">
**Display completion and next step.**

```
## Phase [N]: [Name] — Complete

Executed [plan_count] plan(s) across [wave_count] wave(s).
Verification: [PASS / PASS with notes / FAIL with gaps]

Plans completed:
- [Plan 01]: [one-liner from SUMMARY.md]
- [Plan 02]: [one-liner from SUMMARY.md]

[If completed phase was the SDK Integration phase (sdkPhase from manifest.json):]
────────────────────────────────────────
SDK Integration complete. App is now Frontier OS-ready.
Next up: `/fos:test-pwa` — Test in the local Frontier PWA iframe before shipping.

Run `/clear` first to free your context window.
────────────────────────────────────────

[If more phases remain AND next phase is sdkPhase:]
────────────────────────────────────────
Next up: `/fos:plan [N+1]`
  Plan Phase [N+1]: [Name] — SDK Integration is mechanical, skipping discuss.

Run `/clear` first to free your context window.
────────────────────────────────────────

[If more phases remain (default):]
────────────────────────────────────────
Next up: `/fos:discuss [N+1]`
  Discuss Phase [N+1]: [Name] — capture implementation decisions before planning.

Run `/clear` first to free your context window.
────────────────────────────────────────

[If all phases complete:]
────────────────────────────────────────
Next up: `/fos:ship`
  Deploy to Vercel and register in the Frontier app store.

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
