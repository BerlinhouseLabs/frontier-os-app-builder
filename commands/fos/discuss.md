---
name: fos:discuss
description: Discuss gray area decisions for a phase before planning
argument-hint: "<phase-number>"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---
<objective>
Gather implementation decisions for a phase by identifying gray areas and discussing them with the developer. Produces CONTEXT.md that downstream planning and execution agents will honor.

**Creates:**
- `.frontier-app/phases/XX-name/XX-CONTEXT.md` — decisions, discretion areas, deferred ideas

**After this command:** Run `/clear` then `/fos:plan <N>` to create execution plans.
</objective>

<execution_context>
@$HOME/.claude/frontier-os-app-builder/workflows/discuss.md
</execution_context>

<context>
Phase: $ARGUMENTS
</context>

<process>
Execute the discuss workflow from @$HOME/.claude/frontier-os-app-builder/workflows/discuss.md end-to-end.
</process>
