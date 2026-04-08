---
name: fos:add-feature
description: Add a feature as a new phase to the current milestone
argument-hint: '"feature description"'
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---
<objective>
Add a new feature to the current milestone. Infers required SDK modules, creates a new phase in the roadmap, updates manifest with new permissions.

**After this command:** Run `/clear` then `/fos:discuss <N>` for the new phase.
</objective>

<execution_context>
@$HOME/.claude/frontier-os-app-builder/workflows/add-feature.md
@$HOME/.claude/frontier-os-app-builder/references/module-index.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the add-feature workflow from @$HOME/.claude/frontier-os-app-builder/workflows/add-feature.md end-to-end.
</process>
