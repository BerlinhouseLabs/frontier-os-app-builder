<purpose>
Initialize a new Frontier OS app through guided flow: gather a natural language description, infer SDK modules, ask domain-specific questions, create phased roadmap and all project state files. This is the most leveraged moment in any app — deep questioning here means the right SDK modules, the right phases, the right architecture from day one.
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

<step name="setup" priority="first">
**MANDATORY FIRST STEP — Execute before any user interaction:**

```bash
INIT=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" init new-app)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `project_exists`, `has_git`, `cwd`, `template_home`, `version`.

**If `project_exists` is true:**
```
Error: This directory already has a .frontier-app/ directory.

If you want to see your project status: /fos:status
If you want to continue building: /fos:next
If you want to start fresh: delete .frontier-app/ and run /fos:new-app again
```
Exit workflow.

**If `has_git` is false:** Will initialize git after scaffolding (step 9).

**Check for Studio context file:**
Read `.frontier-studio-context.md` if it exists in the current directory or `../.frontier-studio-context.md` in the parent. This file contains Frontier Tower domain knowledge (floors, membership, events, governance, existing apps) selected by the developer in Frontier Studio. It complements the SDK technical references you already have — use it to inform module inference, domain questions, and requirements throughout the workflow. Skip if the file doesn't exist.
</step>

<step name="gather_description">
**Get the app description.**

Check if `$ARGUMENTS` contains a description (any text that isn't just flags).

**If description provided in $ARGUMENTS:** Use it directly. Display it back:
```
Building: "[description from arguments]"
```

**If no description:** Use AskUserQuestion:
- header: "App Idea"
- question: "What Frontier OS app do you want to build? Describe it in plain language — what it does, who uses it, and what Frontier features it needs."

**Store the description** for use in subsequent steps.
</step>

<step name="infer_modules">
**Infer SDK modules from the description.**

```bash
MODULES=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" infer-modules "<description>")
```

Parse JSON for: `modules`, `details`, `permissions`, `moduleCount`.

**Present the inferred modules to the user:**

```
## SDK Modules Detected

Based on your description, your app will use these Frontier SDK modules:

| Module | Why | Key Methods |
|--------|-----|-------------|
| [Module] | [Matched keywords from description] | [suggestedMethods from details] |

**Always included:**
- Storage — App state persistence (preferences, drafts, etc.)
- Chain — Network configuration and contract addresses

**Permissions requested:** [count] permissions across [moduleCount] modules
```

This is informational — the user will confirm or adjust in step 5.
</step>

<step name="smart_questions">
**Ask domain-specific questions based on inferred modules.**

Generate 2-5 questions based on WHICH modules were inferred. These are DOMAIN questions about the user's app, NOT SDK implementation questions.

**Question bank by module:**

**Wallet module detected:**
- "Should transactions use FND (Frontier Dollar) only, or also support fiat on/off-ramp?"
- "Will users send money to each other (P2P), or only pay for services?"
- "Do you need transaction history displayed in the app?"

**Events module detected:**
- "Do you need real-time availability updates, or is periodic refresh fine?"
- "Should users be able to create events, or only browse and RSVP?"
- "Are events tied to physical locations (rooms/venues) or virtual?"

**Communities module detected:**
- "Is this for a specific community, or should users browse/join multiple communities?"
- "Do you need member lists visible, or just community-level info?"

**Partnerships module detected:**
- "Are sponsors displayed publicly, or is this for internal partner management?"
- "Do sponsors get special access passes or visibility?"

**Offices module detected:**
- "Is this for visitor access passes, member day passes, or both?"
- "Do users need to see available rooms/spaces?"

**User module detected (implied):**
- "Do you need to show user profiles beyond basic name/avatar?"
- "Are there different user roles (member vs admin vs operator)?"

**ThirdParty module detected:**
- "Is this a developer-facing tool, or does it use ThirdParty APIs behind the scenes?"

**Ask questions one batch at a time** using AskUserQuestion with appropriate options for each. Keep it to ONE round of questions — do not over-interrogate.

**For modules with no specific questions** (Storage, Chain): skip — these are utility modules with standard patterns.
</step>

<step name="confirm">
**Present final module list and permissions for approval.**

Incorporate answers from smart questions to refine the module list. If the user's answers suggest additional modules or removal of inferred modules, adjust.

```
## App Summary

**Name:** [Inferred from description, or ask]
**Description:** [From step 2, refined by step 4 answers]
**Dev Port:** [Pick from 5180-5199 range, avoid common ports]

### SDK Modules (Final)

| Module | Key Methods | Permissions |
|--------|-------------|-------------|
| [Module] | [methods] | [permissions count] |

### Phases Preview

1. **Phase 1: Scaffold + Standalone Shell** — Project setup, services layer, mock data, dark theme
2. **Phase 2: [Feature]** — [From description + smart question answers]
...
N. **Phase N: SDK Integration** — Wire SDK, create adapter, upgrade Layout for iframe

Total permissions: [N]
```

Use AskUserQuestion:
- header: "Confirm"
- question: "Does this look right?"
- options:
  - "Looks good — create the app" — Proceed to scaffolding
  - "Change something" — Let user modify modules, name, or phases
  - "Start over" — Go back to description

**If "Change something":** Ask what to change, adjust, and re-confirm.
**If "Start over":** Return to step 2.
</step>

<step name="create_app_directory">
**Create the app directory and project state structure.**

Generate the app directory name from the confirmed app name:
- Kebab-case the name: "Tip Jar" → "tip-jar"
- Prefix with `frontier-os-app-`: "tip-jar" → "frontier-os-app-tip-jar"

If the current directory already IS the app directory (user pre-created it and cd'd in), skip directory creation — just create `.frontier-app/` in place.

Otherwise, create the directory and move into it:

```bash
APP_SLUG="frontier-os-app-[kebab-name]"
mkdir -p "$APP_SLUG"
cd "$APP_SLUG"
```

Then create the project state directory:

```bash
APP_DIR=$(pwd)
mkdir -p .frontier-app/phases/01-scaffold
```

This creates:
- `frontier-os-app-[name]/` — The app project directory (auto-created)
- `.frontier-app/` — Project state directory
- `.frontier-app/phases/01-scaffold/` — Phase 1 directory (always created)

**How to detect if already in an app directory:**
If the user already created and cd'd into a directory named `frontier-os-app-*` that is empty (no files except maybe `.git`), treat it as the app directory and skip creation. Otherwise, create the subdirectory.
</step>

<step name="create_roadmap">
**Build the phased roadmap.**

Phase 1 is ALWAYS "Scaffold + Standalone Shell" — this is non-negotiable for every Frontier OS app.
The LAST phase is ALWAYS "SDK Integration" — a mechanical phase that wires the real Frontier SDK. This phase is auto-added and has fixed success criteria (no user decisions needed). It is non-negotiable.

Additional phases come from the features identified in steps 3-5:
- Group related features into coherent phases
- Each phase should deliver something testable
- Keep to 3-6 total phases for v1 — ship fast
- Order phases by dependency (features that build on each other)
- The final phase is always "SDK Integration" — auto-added after all feature phases

**Phase sizing heuristics:**
- Simple feature (one SDK module, one view): 1 phase, 1-2 plans
- Medium feature (SDK module + UI + state): 1 phase, 2-3 plans
- Complex feature (multiple modules, multiple views): 1-2 phases, 2-3 plans each
</step>

<step name="write_state_files">
**Write all project state files using templates.**

**1. PROJECT.md:**
```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" scaffold "state/project.md" --raw --vars '{"APP_NAME":"[name]","APP_DESCRIPTION":"[description]","DATE":"[today]","TRIGGER":"initial creation"}'
```
Then fill in the template sections:
- SDK Modules table with actual module data from step 3
- Target Users from description and smart question answers
- Core Value from the description
- Constraints (standard 6 + any app-specific from answers)

Write to `.frontier-app/PROJECT.md`.

**2. REQUIREMENTS.md:**
```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" scaffold "state/requirements.md" --raw --vars '{"APP_NAME":"[name]","MILESTONE_VERSION":"v1","DATE":"[today]","TRIGGER":"initial creation"}'
```
Then fill in:
- Standard PLAT-01 through PLAT-05 (always)
- Feature requirements REQ-01+ (from phases)
- Traceability table mapping requirements to phases
- Out of scope (standard 2 + app-specific)

Write to `.frontier-app/REQUIREMENTS.md`.

**3. ROADMAP.md:**
```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" scaffold "state/roadmap.md" --raw --vars '{"APP_NAME":"[name]","MILESTONE_VERSION":"v1","DATE":"[today]","TRIGGER":"initial creation"}'
```
Then fill in:
- Phase list with all phases from step 7
- Phase details with goals, dependencies, requirements, success criteria
- Progress table initialized to "Not started"

Write to `.frontier-app/ROADMAP.md`.

**4. STATE.md:**
```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" scaffold "state/state.md" --raw --vars '{"MILESTONE_VERSION":"v1","CURRENT_PHASE":"1","CURRENT_PLAN":"01","STATUS":"ready-to-discuss","NEXT_ACTION":"/fos:discuss 1"}'
```
Then fill in:
- Current Position: Phase 1 of [N], ready to discuss
- App Reference: Name, core value, SDK modules, dev port
- Empty Recent Decisions, Blockers, Metrics
- Next command: /fos:discuss 1

Write to `.frontier-app/STATE.md`.

**5. manifest.json:**
Construct the manifest object:
```json
{
  "name": "[App Name]",
  "packageName": "[package-name]",
  "description": "[Description]",
  "sdkVersion": "latest",
  "devPort": [port],
  "modules": ["Storage", "Chain", ...other modules...],
  "permissions": ["storage:get", "storage:set", ...all permissions...],
  "milestone": "v1",
  "phases": [
    {"number": 1, "name": "Scaffold + Standalone Shell", "status": "not-started"},
    {"number": 2, "name": "[Feature]", "status": "not-started"},
    ...
    {"number": N, "name": "SDK Integration", "status": "not-started"}
  ],
  "sdkPhase": N
}
```

Write to `.frontier-app/manifest.json`.
</step>

<step name="git_init_and_commit">
**Initialize git and create initial commit.**

**If `has_git` is false:**
```bash
git init
```

**Create .gitignore if it doesn't exist:**
```bash
cat > .gitignore << 'GITIGNORE'
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
GITIGNORE
```

**Commit all state files:**
```bash
git add .frontier-app/ .gitignore
git commit -m "feat: initialize [App Name] — Frontier OS app

SDK Modules: [comma-separated modules]
Phases: [count] phases planned for v1
Created by: /fos:new-app"
```
</step>

<step name="next_up">
**Display completion and next step.**

```
## App Initialized

**[App Name]** is ready to build.

Created:
  .frontier-app/PROJECT.md      — App vision and SDK modules
  .frontier-app/REQUIREMENTS.md — Scoped requirements
  .frontier-app/ROADMAP.md      — [N]-phase build plan
  .frontier-app/STATE.md        — Project memory
  .frontier-app/manifest.json   — Machine-readable metadata

SDK Modules: [list]
Phases: [list of phase names]

────────────────────────────────────────
Next up: `/fos:discuss 1`
  Discuss Phase 1 approach — minimal decisions for scaffold, but establishes patterns.

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
