<purpose>
Extract implementation decisions for a phase before planning. Identify gray areas — places where the implementation could go multiple ways — and let the user choose. Produces CONTEXT.md that downstream research, planning, and execution agents will honor.

You are a thinking partner, not an interviewer. The user is the visionary — you are the builder. Your job is to capture decisions that guide planning and execution, not to figure out implementation yourself.
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

<downstream_awareness>
**CONTEXT.md feeds into:**

1. **fos-researcher** — Reads CONTEXT.md to know WHAT to research
   - "User wants card-based layout" -> researcher investigates card patterns in existing apps
   - "Optimistic UI for RSVP" -> researcher looks into optimistic update patterns

2. **fos-planner** — Reads CONTEXT.md to know WHAT decisions are locked
   - "P2P transfers only" -> planner scopes to transferFrontierDollar(), not transferOverallFrontierDollar()
   - "Claude's Discretion: loading skeleton" -> planner can decide approach

**Your job:** Capture decisions clearly enough that downstream agents can act on them without asking the user again.

**Not your job:** Figure out HOW to implement. That's what research and planning do with the decisions you capture.
</downstream_awareness>

<scope_guardrail>
**CRITICAL: No scope creep.**

The phase boundary comes from ROADMAP.md and is FIXED. Discussion clarifies HOW to implement what's scoped, never WHETHER to add new capabilities.

**Allowed (clarifying ambiguity):**
- "How should events be displayed?" (layout, density, info shown)
- "What happens when the wallet is empty?" (within the feature)
- "Should RSVP require confirmation or be one-tap?" (behavior choice)

**Not allowed (scope creep):**
- "Should we also add event creation?" (new capability)
- "What about search/filtering?" (new capability)
- "Maybe include social sharing?" (new capability)

**When user suggests scope creep:**
```
"[Feature X] would be a new capability — that's its own phase.
Want me to note it for the roadmap backlog?

For now, let's focus on [phase domain]."
```

Capture the idea in a "Deferred Ideas" section. Don't lose it, don't act on it.
</scope_guardrail>

<process>

<step name="initialize" priority="first">
**Phase number from argument (required).**

```bash
INIT=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" init discuss "$PHASE")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `phase`, `phase_dir`, `has_context`, `manifest`, `state`, `roadmap_path`, `project_path`, `version`.

**If .frontier-app/ not found:**
```
Error: No .frontier-app/ directory found.

Run `/fos:new-app` first to initialize your Frontier OS app.
```
Exit workflow.

**If phase_dir is null:** The phase directory doesn't exist yet. Create it:
```bash
PADDED=$(printf "%02d" $PHASE)
# Read ROADMAP.md to find the phase name
PHASE_NAME=$(... extract from roadmap ...)
mkdir -p ".frontier-app/phases/${PADDED}-${PHASE_SLUG}"
```
</step>

<step name="load_context">
**Read project context files.**

Read these files to understand the app and phase:
1. `.frontier-app/PROJECT.md` — App vision, SDK modules, constraints
2. `.frontier-app/ROADMAP.md` — Find this phase's goal, requirements, success criteria
3. `.frontier-app/manifest.json` — SDK modules and permissions declared

Extract from ROADMAP.md for this phase:
- **Phase goal** — One sentence describing what this phase delivers
- **Phase requirements** — Which REQ-XX this phase covers
- **Success criteria** — What must be TRUE when this phase is done
- **SDK modules** — Which modules this phase uses (from manifest + phase goal)
</step>

<step name="check_existing">
**Check if CONTEXT.md already exists.**

**If `has_context` is true:**

Use AskUserQuestion (if available):
- header: "Context Exists"
- question: "Phase [X] already has context decisions. What do you want to do?"
- options:
  - "Update it" — Review and revise existing context
  - "View it" — Show me what's there
  - "Skip" — Use existing context as-is, proceed to planning

**If "Update":** Load existing CONTEXT.md, continue to analyze_phase.
**If "View":** Display CONTEXT.md, then offer Update/Skip.
**If "Skip":** Exit workflow with next-up pointing to `/fos:plan N`.

**If AskUserQuestion denied:** Skip — use existing context as-is, proceed to planning.

**If `has_context` is false:** Continue to analyze_phase.
</step>

<step name="load_prior_decisions">
**Load decisions from prior phases to maintain cross-phase consistency.**

Read all CONTEXT.md files from prior phases to avoid re-asking decided questions and to maintain consistency across phases.

**Step 1: Find prior CONTEXT.md files**
```bash
ls .frontier-app/phases/*/??-CONTEXT.md 2>/dev/null | sort
```

For each CONTEXT.md where the phase number is less than the current phase:
1. Read the **Implementation Decisions** section — these are locked preferences
2. Read the **Deferred Ideas** section — ideas punted from earlier phases
3. Read the **Specific Ideas** section — user references and "I want it like X" moments
4. Note any patterns (e.g., "user consistently prefers card layouts", "user chose optimistic UI")

**Step 2: Build internal `prior_decisions` context**

Structure the extracted information:
```
<prior_decisions>
## From Prior Phases

### Phase N: [Name]
- D-XX: [Decision that may be relevant to current phase]
- D-XX: [Preference that establishes a pattern]

### Phase M: [Name]
- D-XX: [Another relevant decision]

## Deferred Ideas (from prior phases)
- [Idea deferred from Phase N that may now be relevant]
</prior_decisions>
```

**Usage in subsequent steps:**
- `analyze_phase`: Skip gray areas already decided in prior phases
- `present_areas`: Annotate options with prior decisions ("You chose X in Phase N")
- `discuss_areas`: Pre-fill answers or flag conflicts ("This contradicts Phase N decision D-XX — same here or different?")

**If no prior CONTEXT.md files exist:** Continue without — this is expected for Phase 1.
</step>

<step name="scout_codebase">
**Lightweight scan of existing code to inform gray area identification.**

Skip this step for Phase 1 (no source code exists yet).

**Step 1: Check for existing source code**
```bash
ls src/ 2>/dev/null || true
```

If no `src/` directory exists, skip to analyze_phase.

**Step 2: Targeted grep for phase-related terms**

Extract key terms from the phase goal (e.g., "wallet" phase -> "balance", "transfer", "payment"; "events" phase -> "event", "RSVP", "calendar").

```bash
# Find files related to phase goal terms
grep -rl "{term1}\|{term2}" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10 || true

# Find existing hooks, views, and utilities
ls src/hooks/ 2>/dev/null || true
ls src/views/ 2>/dev/null || true
ls src/lib/ 2>/dev/null || true
```

**Step 3: Read 3-5 relevant files**

Read the most relevant files to understand existing patterns:
- How SDK modules are currently used (hook patterns, error handling)
- Component structure and Tailwind usage
- Integration points (routes, navigation, providers)

**Step 4: Build internal codebase_context**

From the scan, identify:
- **Reusable assets** — existing hooks, components, utilities this phase can use
- **Established patterns** — how the codebase does state management, SDK calls, styling
- **Integration points** — where new code would connect (routes, nav, Layout)
- **SDK patterns** — how existing hooks call SDK methods, handle loading/error

Store as internal `<codebase_context>` for use in analyze_phase. This is NOT written to a file — it informs the current session only.
</step>

<step name="analyze_phase">
**Identify gray areas based on phase goal + SDK modules + existing codebase patterns.**

**Use `prior_decisions` and `codebase_context` (if available) to ground the analysis.** Codebase context reveals what patterns are already established — gray areas should focus on genuinely new decisions, not things the codebase already answers.

Gray areas are implementation decisions the user cares about — things that could go multiple ways and would change the result.

**If `prior_decisions` context exists:** Filter out gray areas already decided in prior phases. Only present areas that are genuinely new or where the prior decision needs revisiting for this phase's specific context.

### SDK Integration Phase Handling

If the current phase is the SDK Integration phase (matches `sdkPhase` from manifest.json):

This phase is fully mechanical — zero gray areas. Skip the normal discussion flow:

1. Inform the user: "Phase [N] is SDK Integration — a mechanical step with no design decisions. Proceeding to create minimal context."
2. Produce a minimal CONTEXT.md with:
   - **Phase Boundary:** "Wire real Frontier SDK, create adapter, upgrade Layout for iframe detection"
   - **Implementation Decisions:** "D-01: Follow standard SDK Integration template — no deviations needed"
   - **Claude's Discretion:** (empty)
   - **Deferred Ideas:** (empty)
3. Route directly to `/fos:plan N`

**For Phase 1 (Scaffold + Standalone Shell):**
Minimal gray areas — scaffold is well-defined. Only ask:
- "Router or single-component app?" (if more than 2 feature phases exist)
- That's usually it. Phase 1 is standardized.

**For feature phases:**
Generate phase-specific gray areas based on:
1. The phase goal from ROADMAP.md
2. The SDK modules involved
3. The domain being built

For feature phases, gray areas are framed in terms of standalone UX and mock behavior — not SDK-specific concerns. The SDK is not wired in during feature phases, so questions about iframe behavior, SDK error modes, or CORS are not relevant until the SDK Integration phase.

**Gray area identification by domain:**

Something users SEE (UI feature):
- Layout and density (cards vs list vs table)
- Information hierarchy (what's prominent, what's secondary)
- Empty states and loading states
- Interaction model (tap, swipe, drag)

Something users DO (action feature):
- Confirmation vs one-tap behavior
- Optimistic vs pessimistic UI updates
- Error recovery (retry, fallback, message)
- Success feedback (toast, animation, redirect)

Something involving service modules:
- Which service methods to use for the feature
- How to handle mock data vs real data transitions
- Data refresh strategy (poll, manual, real-time)
- Error handling when service calls fail

**Don't use generic labels** (UI, UX, Behavior). Generate concrete, phase-specific areas:

```
Phase: "Event Listing"
-> Card layout, RSVP flow, empty state, refresh strategy

Phase: "Wallet Integration"
-> Balance display, transfer confirmation, error handling, transaction history

Phase: "Room Booking"
-> Calendar view, time slot selection, booking confirmation, conflict handling
```
</step>

<step name="present_areas">
**Present gray areas and let user choose what to discuss.**

```
## Phase [N]: [Name] — Gray Areas

I've identified [count] areas where your input will shape the implementation:

1. **[Area 1]** — [One sentence explaining why this matters]
2. **[Area 2]** — [One sentence]
3. **[Area 3]** — [One sentence]
4. **[Area 4]** — [One sentence]
```

Use AskUserQuestion (if available):
- header: "Topics"
- question: "Which areas do you want to discuss? I'll handle the rest with sensible defaults."
- multiSelect: true
- options: [each gray area as an option, plus "All of them" and "None — use your judgment"]

**If "None":** Set all areas as "Claude's Discretion" and skip to write_context.
**If specific areas selected:** Discuss those, mark unselected as "Claude's Discretion".

**If AskUserQuestion denied (autonomous/don't-ask mode):** Present the gray areas and your recommended defaults, then mark all as "Claude's Discretion" and proceed to write_context. Briefly explain each choice so the user can review in CONTEXT.md.
</step>

<step name="discuss_areas">
**Deep-dive each selected area.**

For each selected gray area, ask ONE focused question at a time. Use AskUserQuestion (if available) with concrete options — never open-ended "what do you think?"

**If AskUserQuestion denied (autonomous/don't-ask mode):** This step is skipped — all areas were already resolved with defaults in the present_gray_areas step.

**Prior decision awareness:** If `prior_decisions` contains a relevant decision for this area, present it as context: "In Phase [N], you decided [decision]. Apply the same approach here, or different?" Offer "Same as Phase [N]" as the first option, then the other alternatives.

**Example for "Card Layout" area:**
```
AskUserQuestion:
  header: "Card Layout"
  question: "How should [items] be displayed?"
  options:
    - "Card grid (1/2/3 columns responsive)" — Visual, browsable, like a gallery
    - "Compact list" — Dense, scannable, fits more items
    - "Single column feed" — One item at a time, focused reading
```

**Example for "RSVP Flow" area:**
```
AskUserQuestion:
  header: "RSVP Flow"
  question: "How should RSVP work?"
  options:
    - "One-tap (instant)" — Tap and done, like a Like button
    - "Confirm first" — Show confirmation modal before committing
    - "With options" — Let user choose attendance type (going, maybe, not going)
```

**Service-related areas** — ask about behavior, not implementation:
```
AskUserQuestion:
  header: "Balance Display"
  question: "How should the wallet balance be shown?"
  options:
    - "Always visible" — Balance in header, updates in real-time
    - "On demand" — User taps to reveal balance
    - "Contextual" — Show balance only when relevant (e.g., before payment)
```

**Follow-up rule:** If the user's answer raises a natural follow-up (e.g., they chose "card grid" — ask about what info shows on each card), ask ONE follow-up. Then move to the next area.

**Maximum questions per area:** 3. If you need more, the area is too broad — split it.
</step>

<step name="write_context">
**Write CONTEXT.md with all decisions.**

Use the context template format. Write to:
`.frontier-app/phases/XX-name/XX-CONTEXT.md`

**Content structure:**
- **Phase Boundary:** From ROADMAP.md (copied verbatim)
- **Implementation Decisions:** Each discussed area with numbered decisions (D-01, D-02, etc.)
- **SDK Usage decisions:** Which methods, data flow pattern
- **Claude's Discretion:** Areas the user deferred or didn't select
- **Specific Ideas:** Any references or "I want it like X" from discussion
- **SDK Module Context:** Table of modules/methods used, integration pattern, constraints
- **References to Read:** SDK docs, existing app patterns relevant to this phase
- **Deferred Ideas:** Any scope creep captured during discussion

```bash
# Write the file
# [Write CONTEXT.md content to phase directory]

# Commit if git exists
git add ".frontier-app/phases/"
git commit -m "docs: Phase $PHASE context — [count] decisions captured

Decisions: [brief list of key decisions]
Claude's discretion: [count] areas
Deferred: [count] ideas for backlog"
```
</step>

<step name="update_state">
**Update STATE.md.**

```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "ready-to-plan"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update next_action "/fos:plan $PHASE"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update phase "$PHASE"
```

Also update the body of STATE.md:
- Recent Decisions: Add key decisions from this discuss session
- Last activity: [today] — Discussed Phase [N]: [Name]
- Session Continuity: Update stopped-at and next-command
</step>

<step name="next_up">
**Display completion and next step.**

```
## Phase [N]: [Name] — Context Captured

[Count] decisions locked, [count] areas at Claude's discretion.

Key decisions:
- [D-01]: [Summary]
- [D-02]: [Summary]
- [D-03]: [Summary]

────────────────────────────────────────
Next up: `/fos:plan [N]`
  Research existing Frontier OS apps and create execution plans for this phase.

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
