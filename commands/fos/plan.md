---
name: fos:plan
description: Research existing apps and create execution plans for a phase
argument-hint: "<phase-number>"
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
Create execution plans for a phase by researching existing Frontier OS apps, then planning with verification.

**Flow:** Spawn researcher → planner → plan-checker (max 3 revision loops)

**Creates:**
- `.frontier-app/phases/XX-name/XX-RESEARCH.md` — patterns from existing apps
- `.frontier-app/phases/XX-name/XX-YY-PLAN.md` — executable plans with tasks

**After this command:** Run `/clear` then `/fos:execute <N>` to build the phase.
</objective>

<execution_context>
@$HOME/.claude/frontier-os-app-builder/workflows/plan.md
</execution_context>

<context>
Phase: $ARGUMENTS
</context>

<process>
Execute the plan workflow from @$HOME/.claude/frontier-os-app-builder/workflows/plan.md end-to-end.
Preserve the plan-checker verification loop (max 3 iterations).
</process>
