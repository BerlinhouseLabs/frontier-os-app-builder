<purpose>
Deploy the Frontier OS app to Vercel and optionally register it in the Frontier app store. Runs preflight checks (build, typecheck, tests), deploys to Vercel, and guides through app registration via the ThirdParty SDK module.
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

<step name="initialize" priority="first">
**Load project state and verify readiness.**

```bash
INIT=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" init ship)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `manifest`, `state`, `all_verified`, `project_path`, `roadmap_path`, `version`.

**If .frontier-app/ not found:**
```
Error: No .frontier-app/ directory found.

Run `/fos:new-app` first to initialize your Frontier OS app.
```
Exit workflow.

**If `all_verified` is false:**
```
Warning: Not all phases have been verified.

Recommended: Run `/fos:status` to see which phases are incomplete.
Continue with deployment anyway? Some features may be missing.
```

Use AskUserQuestion (if available):
- header: "Incomplete Phases"
- question: "Deploy with incomplete phases?"
- options:
  - "Deploy anyway" — Ship what's built
  - "Check status first" — Run /fos:status to see what's missing
  - "Cancel" — Go back and finish phases

**If "Check status first" or "Cancel":** Exit workflow.
**If AskUserQuestion denied:** Default to "Deploy anyway".

**Display ship summary:**
```
## Ship: [App Name]

**Description:** [from manifest]
**SDK Modules:** [from manifest]
**Permissions:** [count]
**Dev Port:** [from manifest]
```
</step>

<step name="preflight_checks">
**Run all preflight checks. ALL must pass before deployment.**

```bash
echo "=== Preflight Checks ==="

# 1. TypeScript compilation
echo "--- TypeScript ---"
npx tsc --noEmit 2>&1
TSC_STATUS=$?

# 2. Vite build
echo "--- Build ---"
npm run build 2>&1
BUILD_STATUS=$?

# 3. Tests (if configured)
echo "--- Tests ---"
if grep -q '"test"' package.json 2>/dev/null; then
  npx vitest run --reporter=verbose 2>&1
  TEST_STATUS=$?
else
  echo "No test script found — skipping"
  TEST_STATUS=0
fi

# Read the SDK Integration phase from the manifest so the validators run their
# Tier-2 checks (CORS origins, SDK→services bridge, exact permissions). Empty
# when no sdkPhase is set — the validator then falls back to the STATE.md phase.
SDK_PHASE=$(node -e "const m=JSON.parse(require('fs').readFileSync('.frontier-app/manifest.json','utf8')); console.log(m.sdkPhase ?? '')")

# 4. FOS structure validation
echo "--- Structure ---"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" validate structure ${SDK_PHASE:+--phase "$SDK_PHASE"}
STRUCT_STATUS=$?

# 5. FOS permissions validation
echo "--- Permissions ---"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" validate permissions ${SDK_PHASE:+--phase "$SDK_PHASE"}
PERMS_STATUS=$?
```

**Report results:**
```
## Preflight Results

| Check | Status |
|-------|--------|
| TypeScript | [PASS/FAIL] |
| Build | [PASS/FAIL] |
| Tests | [PASS/FAIL/SKIPPED] |
| Structure | [PASS/FAIL] |
| Permissions | [PASS/FAIL] |
```

**If ANY check fails:**
```
Preflight failed. Fix the issues above before deploying.

[For TypeScript errors: show the specific errors]
[For build errors: show the Vite error output]
[For test failures: show failing test names]
[For structure issues: list missing files or patterns]
[For permission issues: list missing permissions]
```

**Do NOT proceed to deployment if preflight fails.** The user must fix issues and re-run `/fos:ship`.
</step>

<step name="check_tools">
**Check that gh and vercel CLIs are available and authenticated.**

```bash
echo "=== GitHub CLI ==="
which gh && gh auth status 2>&1 | head -3

echo "=== Vercel CLI ==="
which vercel && vercel whoami 2>&1
```

**If gh not found or not authenticated:**
```
GitHub CLI is required for automated deployment. Install and authenticate:

  brew install gh
  gh auth login

Then re-run `/fos:ship`.
```
Exit workflow.

**If vercel not found or not authenticated:**
```
Vercel CLI is required for deployment. Install and authenticate:

  npm i -g vercel
  vercel login

Then re-run `/fos:ship`.
```
Exit workflow.
</step>

<step name="create_github_repo">
**Create GitHub repo and push code.**

Read the app name from manifest.json to construct the repo name.

```bash
# Get package name from manifest (e.g., "app-tip-jar" → "frontier-os-app-tip-jar")
PACKAGE_NAME=$(node -e "const m=JSON.parse(require('fs').readFileSync('.frontier-app/manifest.json','utf8')); console.log(m.packageName)")
REPO_NAME="frontier-os-${PACKAGE_NAME}"
APP_DESC=$(node -e "const m=JSON.parse(require('fs').readFileSync('.frontier-app/manifest.json','utf8')); console.log(m.description)")
# Org is optional. Set FOS_GITHUB_ORG to create the repo under a GitHub org;
# when it's empty the repo is created under the authenticated gh user.
ORG="${FOS_GITHUB_ORG:-}"
if [ -n "$ORG" ]; then
  REPO_TARGET="$ORG/$REPO_NAME"
else
  REPO_TARGET="$REPO_NAME"
fi

echo "Repo: $REPO_TARGET"
```

**Check if remote already exists:**
```bash
git remote get-url origin 2>/dev/null
```

**If no remote:**
```bash
# Create private repo (under $FOS_GITHUB_ORG if set, else the authed gh user)
gh repo create "$REPO_TARGET" --private --description "$APP_DESC" --source . --push

# Verify
gh repo view "$REPO_TARGET" --json url -q .url
```

**If remote already exists:** Just push.
```bash
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo main)
git push -u origin "$BRANCH"
```
</step>

<step name="deploy_to_vercel">
**Deploy to Vercel production — fully automated, no interactive prompts.**

```bash
# Check if already linked to a Vercel project
if [ -d ".vercel" ]; then
  echo "Vercel project already linked."
  vercel --prod 2>&1
else
  # First deployment — link and deploy non-interactively
  # Use --yes to skip all interactive prompts
  vercel link --yes 2>&1
  vercel --prod 2>&1
fi
DEPLOY_STATUS=$?
```

**If deployment succeeds:**
Extract the deployment URL from output.

```
## Deployed

URL: [deployment URL]
Status: Live

The app is now accessible at the URL above.
```

**If `vercel link --yes` fails** (e.g., needs team selection):
Try with explicit project name:
```bash
PACKAGE_NAME=$(node -e "const m=JSON.parse(require('fs').readFileSync('.frontier-app/manifest.json','utf8')); console.log(m.packageName)")
vercel link --yes --project "$PACKAGE_NAME" 2>&1
vercel --prod 2>&1
```

**If deployment still fails:**
```
Deployment failed. Ask the user to run this interactively:

  ! vercel --prod

This will prompt for team/project selection. After first deploy, subsequent deploys are automatic.
```
</step>

<step name="app_registration">
**Optionally register the app in the Frontier app store.**

Use AskUserQuestion (if available):
- header: "App Store"
- question: "Register this app in the Frontier app store? This makes it discoverable to Frontier OS users."
- options:
  - "Register now" — Guide me through ThirdParty.createApp()
  - "Later" — Skip registration, I'll do it manually
  - "Not needed" — This is a private/internal app

If AskUserQuestion denied: default to "Later" — skip registration.

**If "Register now":**
```
## App Registration

To register your app in the Frontier app store, you'll need to call the
ThirdParty SDK module's createApp() method. Here's how:

1. Open the Frontier OS developer portal
2. Navigate to "My Apps"
3. Click "Register New App"
4. Fill in:
   - **Name:** [from manifest]
   - **Description:** [from manifest]
   - **URL:** [deployment URL from step 4]
   - **Permissions:** [from manifest — the permissions your app requests]

Or use the SDK programmatically:
```typescript
const thirdParty = sdk.getThirdParty();
await thirdParty.createApp({
  name: "[app name]",
  description: "[description]",
  url: "[deployment URL]",
  permissions: [/* from manifest */]
});
```

Note: App registration requires developer access. If you don't have it,
contact a Frontier OS admin.
```

**If "Later" or "Not needed":** Continue to update_state.
</step>

<step name="update_state">
**Update STATE.md for ship completion.**

```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "shipped"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update next_action "/fos:new-milestone"
```

Update STATE.md body:
- Status: Shipped
- Last activity: [today] — Deployed to Vercel
- Deployment URL: [URL if available]
- App store: [Registered / Not registered]
- Next command: /fos:new-milestone or /fos:add-feature

```bash
git add .frontier-app/
git commit -m "docs: v1 shipped — deployed to Vercel

URL: [deployment URL or 'manual deployment']
Preflight: all checks passed
App store: [registered/skipped]"
```
</step>

<step name="next_up">
**Display completion and next steps.**

```
## Shipped: [App Name]

[If deployed:] Live at: [URL]
[If skipped:] Preflight passed — deploy manually when ready.

Milestone v1 is complete. What's next?

────────────────────────────────────────
Next up: `/fos:new-milestone` or `/fos:add-feature`
  Start v2 with new features, or add a feature to the current milestone.

Run `/clear` first to free your context window.
────────────────────────────────────────
```
</step>

</process>
