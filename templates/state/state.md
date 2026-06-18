# State Template

Template for `.frontier-app/STATE.md` — the app's living memory that bridges `/clear` boundaries.

<template>

```markdown
---
milestone: {{MILESTONE_VERSION}}
phase: {{CURRENT_PHASE}}
plan: {{CURRENT_PLAN}}
status: {{STATUS}}
next_action: {{NEXT_ACTION}}
---

# App State

## Current Position

Phase: [X] of [Y] ([Phase name])
Plan: [A] of [B] in current phase
Status: [Ready to discuss / Discussing / Ready to plan / Planning / Ready to execute / Executing / Phase complete]
Last activity: [YYYY-MM-DD] — [What happened]

Progress: [░░░░░░░░░░] 0%

## App Reference

See: .frontier-app/PROJECT.md (updated [date])

**App:** [App name]
**Core value:** [One-liner from PROJECT.md]
**SDK Modules:** [Comma-separated list of active modules]
**Dev port:** [Port number]

## Recent Decisions

Decisions affecting current work (full log in PROJECT.md):

- [Phase X]: [Decision summary]

## Blockers

[Issues that affect current or future work]

None yet.

## Metrics

**Velocity:**
- Plans completed: [N]
- Average duration: [X] min

**By Phase:**

| Phase | Plans | Avg/Plan |
|-------|-------|----------|
| - | - | - |

## Session Continuity

Last session: [YYYY-MM-DD HH:MM]
Stopped at: [Description of last completed action]
Next command: [/fos:discuss N, /fos:plan N, /fos:execute N, /fos:ship]
```

</template>

<purpose>

STATE.md is the app's short-term memory spanning all phases and sessions.

**Problem it solves:** After `/clear`, Claude has no memory. STATE.md is read first by every /fos: command to know where the project stands.

**Solution:** A single, small file (under 100 lines) that:
- Is read first in every workflow
- Is updated after every significant action
- Contains digest of accumulated context
- Tells Claude exactly what command to run next

</purpose>

<frontmatter>

The YAML frontmatter enables machine parsing by workflows:

| Field | Values | Purpose |
|-------|--------|---------|
| `milestone` | v1, v2, ... | Current milestone version |
| `phase` | 1, 2, 3, ... | Current phase number |
| `plan` | 01, 02, ... | Current plan within phase |
| `status` | ready-to-discuss, ready-to-plan, ready-to-execute, executing, ready-to-test, ready-to-ship, phase-complete, milestone-complete, shipped | Machine-readable state |
| `next_action` | /fos:discuss N, /fos:plan N, /fos:execute N, /fos:ship | Exact command to run next |

</frontmatter>

<lifecycle>

**Creation:** After ROADMAP.md is created during /fos:new-app
- Reference PROJECT.md for app context
- Initialize empty sections
- Set position to "Phase 1 ready to discuss"
- Set next_action to "/fos:discuss 1"

**Reading:** First step of EVERY /fos: command
- /fos:discuss — know which phase to discuss
- /fos:plan — know which phase to plan, read recent decisions
- /fos:execute — know current position, which plan to run
- /fos:status — present full state to user
- /fos:next — read next_action and route

**Writing:** After every significant action
- After discuss: Update status, log decisions, set next_action to /fos:plan
- After plan: Update status, set next_action to /fos:execute
- After execute: Update position, metrics, set next_action
- After phase complete: Advance phase, update progress bar

</lifecycle>

<size_constraint>

Keep STATE.md under 100 lines.

It's a DIGEST, not an archive. If accumulated context grows too large:
- Keep only 3-5 recent decisions (full log in PROJECT.md)
- Keep only active blockers, remove resolved ones
- Metrics are summary only — details in SUMMARY.md files

The goal is "read once, know where we are" — if it's too long, that fails.

</size_constraint>
