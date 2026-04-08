---
name: fos:new-milestone
description: Start a new version milestone (v2, v3...) with additional features
argument-hint: '"feature descriptions"'
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---
<objective>
Archive the current milestone and start a new one. Gathers new feature descriptions, infers SDK modules, creates new phases in the roadmap.

**After this command:** Run `/clear` then `/fos:discuss <N>` for the first phase of the new milestone.
</objective>

<execution_context>
@$HOME/.claude/frontier-os-app-builder/workflows/new-milestone.md
@$HOME/.claude/frontier-os-app-builder/references/module-index.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the new-milestone workflow from @$HOME/.claude/frontier-os-app-builder/workflows/new-milestone.md end-to-end.
</process>
