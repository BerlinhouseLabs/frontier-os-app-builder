---
name: fos:new-app
description: Create a new Frontier OS app from a natural language description
argument-hint: '"app description"'
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
Initialize a new Frontier OS app through guided flow: gather requirements, infer SDK modules from description, create phased roadmap.

**Creates:**
- `.frontier-app/PROJECT.md` — app vision, SDK modules, constraints
- `.frontier-app/REQUIREMENTS.md` — scoped requirements
- `.frontier-app/ROADMAP.md` — phased execution plan
- `.frontier-app/STATE.md` — project memory
- `.frontier-app/manifest.json` — machine-readable metadata

**After this command:** Run `/clear` then `/fos:discuss 1` to discuss Phase 1 approach.
</objective>

<execution_context>
@$HOME/.claude/frontier-os-app-builder/workflows/new-app.md
@$HOME/.claude/frontier-os-app-builder/references/module-index.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the new-app workflow from @$HOME/.claude/frontier-os-app-builder/workflows/new-app.md end-to-end.
Preserve all workflow gates (validation, approvals, routing).
</process>
