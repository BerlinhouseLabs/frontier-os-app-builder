<purpose>
Execute a single plan file: read the plan, parse tasks, implement each task, verify each task, commit atomically, then produce SUMMARY.md. This workflow is loaded by fos-executor subagents spawned by the execute workflow — each executor gets a fresh context window and runs this end-to-end for one plan.
</purpose>

<core_principle>
One plan, one agent, one SUMMARY.md. Execute tasks sequentially within the plan. Commit each task atomically. Never skip verification. If a task fails verification, fix it before moving on — do not accumulate broken state.
</core_principle>

<required_reading>
Read all files listed in the spawning prompt's <files_to_read> block BEFORE doing anything else. This is your primary context — the plan file, PROJECT.md, manifest.json, STATE.md, and any CONTEXT.md or RESEARCH.md for the phase.
</required_reading>

<available_agent_types>
This workflow runs inside a subagent — it does not spawn further subagents.
</available_agent_types>

<frontier_os_rules>
**CRITICAL — These rules apply to ALL code written for Frontier OS apps.**

**Read the current phase from the plan frontmatter and sdkPhase from manifest.json to determine which tier applies.**

**TIER 1 — ALL PHASES:**
1. **Dark theme:** Tailwind dark theme. Backgrounds: `bg-background`, `bg-card`, `bg-muted-background`. Text: `text-foreground`, `text-card-foreground`, `text-muted-foreground`. Borders: `border-border`. Interactive: `bg-primary text-primary-foreground`, `bg-accent text-accent-foreground`. Status: `text-success`, `text-danger`, `text-alert`. Inputs: `bg-input`, `ring-ring`, `outline-outline`. **NEVER hardcoded colors** (no bg-white, text-black, bg-gray-900).
2. **Error handling:** All service calls wrapped in try/catch. Loading states for async operations. Error states with user-friendly messages.
3. **TypeScript strict:** All code in TypeScript strict mode. No `any` types unless explicitly justified in plan.
4. **Testing:** Vitest for unit tests. Test files in `src/test/`.
5. **Service access:** Feature phases use `useServices()` from `src/lib/frontier-services.tsx`. Never import SDK directly in feature hooks or views.
6. **Mock layer:** Mock services must return realistic data matching SDK return types. Hooks must work identically whether backed by mocks or real SDK.

**TIER 2 — SDK INTEGRATION PHASE ONLY:**
7. **SDK access:** `useSdk()` hook from `src/lib/sdk-context.tsx`, used ONLY inside `sdk-services.tsx` and `Layout.tsx`. Never in feature code.
8. **Iframe detection:** `isInFrontierApp()` check in Layout.tsx. Standalone mode shows fallback banner.
9. **SdkProvider wrapping:** Entire app wrapped in SdkProvider when inside iframe. SDK initialized once via useRef, destroyed on unmount.
10. **Permissions:** Every SDK method used must have its permission declared in manifest.json.
11. **CORS:** vercel.json must include all 3 Frontier OS origins (os.frontiertower.io, sandbox.os.frontiertower.io, localhost:5173).
12. **SDK imports:** Use `@frontiertower/frontier-sdk` for SDK classes and types. Exact import paths, not barrel imports.
</frontier_os_rules>

<process>

<step name="load_plan">
**Read the plan file from <files_to_read>.**

Parse the plan:
- **Frontmatter:** phase, plan, wave, depends_on, requirements, files_modified, autonomous, must_haves
- **Objective:** What this plan accomplishes
- **Tasks:** Each `<task>` block with name, files, read_first, action, verify, acceptance_criteria, done
- **Verification:** End-of-plan verification checklist
- **Success criteria:** What "done" looks like

Also read all files from `<context>` block in the plan — these are source files, SDK docs, and project state the plan needs.
</step>

<step name="pre_execution_check">
**Verify prerequisites before executing.**

1. Check that dependencies are met (if `depends_on` is not empty):
   ```bash
   # For each dependency, check SUMMARY.md exists
   for DEP in $DEPENDS_ON; do
     test -f "$PHASE_DIR/${DEP}-SUMMARY.md" && echo "$DEP: OK" || echo "$DEP: MISSING"
   done
   ```
   If any dependency SUMMARY.md is missing: STOP and report the gap.

2. Check that `read_first` files exist for the first task.

3. If this is Phase 1 (scaffold): verify the template directory exists:
   ```bash
   ls "$HOME/.claude/frontier-os-app-builder/templates/app/" 2>/dev/null
   ```
</step>

<step name="execute_tasks">
**For each task in the plan, execute sequentially.**

**For each `<task>`:**

1. **Read referenced files:**
   Read all files listed in `<read_first>` using the Read tool. These are source-of-truth files the task needs to reference.

2. **Execute the action:**
   Follow the `<action>` specification exactly. This may involve:

   **For scaffold tasks (Phase 1):**
   - Use `fos-tools.cjs scaffold` to render templates:
     ```bash
     node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" scaffold "app/vite.config.ts" --raw --vars '{"DEV_PORT":"5180"}'
     ```
   - Write rendered content to the correct file paths
   - Install dependencies via npm

   **For feature tasks (Phase 2+):**
   - Create or modify source files as specified
   - Follow SDK usage patterns from RESEARCH.md and references
   - Apply Tailwind dark theme classes
   - Handle loading/error/empty states
   - Use TypeScript strict types

   **For all tasks:**
   - Follow the plan's action description precisely
   - Use concrete values (exact identifiers, method signatures) from the plan
   - Do NOT add features not specified in the task
   - Do NOT change files not listed in the task's `<files>` block

3. **Verify the task:**
   Run the `<verify>` command specified in the task:
   ```bash
   # Example verifications:
   npx tsc --noEmit                    # TypeScript compiles
   npm run build                        # Vite build succeeds
   grep -q "SdkProvider" src/App.tsx    # Pattern exists in file
   npm run dev -- --host &              # Dev server starts
   ```

   Check each item in `<acceptance_criteria>`:
   - Grep-verifiable: Run the grep command
   - Build-verifiable: Run the build command
   - File-verifiable: Check file exists and contains expected content

   **If verification fails:**
   - Read the error output
   - Fix the issue (TypeScript error, missing import, wrong path, etc.)
   - Re-run verification
   - Maximum 3 fix attempts per task. If still failing after 3: document the issue and continue.

4. **Commit the task atomically:**
   ```bash
   git add [files from task's <files> list]
   git commit -m "[type]: [task name]

   Phase [N], Plan [M], Task [K]
   [Brief description of what was done]"
   ```

   Commit types:
   - `feat:` — New feature or capability
   - `fix:` — Bug fix during execution
   - `scaffold:` — Project scaffolding (Phase 1)
   - `style:` — Styling changes (dark theme, layout)
   - `test:` — Test files
   - `refactor:` — Code restructuring
</step>

<step name="final_verification">
**After all tasks: run the plan's verification checklist.**

From the plan's `<verification>` block, run each check:
```bash
npm run build              # Build succeeds
npx tsc --noEmit           # No TypeScript errors
# npm run dev starts on correct port (quick check)
```

Also run FOS-specific validation:
```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" validate structure
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" validate permissions
```

Document results for SUMMARY.md.
</step>

<step name="write_summary">
**Create SUMMARY.md for this plan.**

Follow the summary template format. Write to:
`$PHASE_DIR/[phase]-[plan]-SUMMARY.md`

**Content:**
- Frontmatter: phase, plan, subsystem, tags, requires, provides, affects, tech-stack, key-files, key-decisions, patterns-established, sdk-modules-used, requirements-completed, duration, completed
- One-liner: Substantive description (NOT "plan complete")
- Performance: Duration, timestamps, task count, file count
- Accomplishments: Key outcomes
- Task Commits: Each task with git hash and type
- Files Created/Modified: Full list with descriptions
- SDK Integration Notes: How SDK modules were wired (or "N/A" for scaffold)
- Decisions Made: Choices with rationale
- Deviations from Plan: What changed and why (or "None")
- Issues Encountered: Problems and resolutions (or "None")
- Verification Results: Each check with pass/fail
- Next Phase Readiness: What's ready, any blockers
</step>

<step name="update_state">
**Update STATE.md with plan completion.**

```bash
# Update plan counter
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update plan "[next_plan_or_done]"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "executing"
```

Also update STATE.md body:
- Current Position: Plan [M] of [total] in Phase [N]
- Last activity: [today] — Completed Plan [M]: [plan name]
- Recent Decisions: Add any decisions from this plan

```bash
git add .frontier-app/
git commit -m "docs: Plan $PHASE-$PLAN summary — [one-liner from summary]"
```
</step>

<step name="next_up">
**Signal completion to the orchestrator.**

This workflow runs inside a subagent spawned by `/fos:execute`. The orchestrator reads SUMMARY.md to detect completion. No user-facing routing needed — the orchestrator handles "Next Up".

If running inline (not as a subagent), display:

```
## Plan [Phase]-[Plan] Complete

[One-liner from SUMMARY.md]

Tasks: [count] executed, [count] committed
Verification: [PASS/FAIL]

────────────────────────────────────────
Next up: `/fos:execute [N]`
  Continue executing remaining plans in this phase.

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
