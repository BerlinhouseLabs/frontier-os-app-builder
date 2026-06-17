<purpose>
Test a generated Frontier OS app inside the real local Frontier PWA. This proves more than standalone Vite: the PWA registry can find the app, the app iframe is allowed by CSP, the host verifies the iframe origin, and SDK requests can reach the host bridge.
</purpose>

<required_reading>
Read all files referenced by the invoking prompt's execution_context before starting.
</required_reading>

<process>

<step name="initialize" priority="first">
**Load app metadata and locate the PWA repo.**

Normalize `$ARGUMENTS`:
- If empty, pass no extra args to `fos-tools.cjs`.
- If it starts with `--`, pass it through as flags.
- Otherwise treat it as a PWA repo path and pass `--pwa-dir "$ARGUMENTS"`.

```bash
INFO=$(node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" pwa-local info [normalized args])
if [[ "$INFO" == @file:* ]]; then INFO=$(cat "${INFO#@file:}"); fi
```

Parse JSON for: `appId`, `appUrl`, `pwaUrl`, `launchUrl`, `devPort`, `pwaDir`, `registryFile`, `registryFound`, `sdkPhase`, `sdkIntegrated`, `appDevCommand`, `pwaDevCommand`.

For later shell steps, write the JSON to a temporary file and export the common fields:

```bash
INFO_FILE=$(mktemp)
printf "%s" "$INFO" > "$INFO_FILE"
APP_ID=$(node -e "const i=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(i.appId)" "$INFO_FILE")
APP_URL=$(node -e "const i=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(i.appUrl)" "$INFO_FILE")
PWA_URL=$(node -e "const i=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(i.pwaUrl)" "$INFO_FILE")
PWA_DIR=$(node -e "const i=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(i.pwaDir || '')" "$INFO_FILE")
DEV_PORT=$(node -e "const i=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(i.devPort)" "$INFO_FILE")
LAUNCH_URL=$(node -e "const i=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(i.launchUrl)" "$INFO_FILE")
```

**If `.frontier-app/` is missing:**
```
Error: No .frontier-app/ directory found.

Run `/fos:new-app` first to initialize your Frontier OS app.
```
Exit workflow.

**If `registryFound` is false:**
```
Could not find the local frontier-pwa checkout.

Pass the repo path:
  /fos:test-pwa --pwa-dir /path/to/frontier-pwa

Or set:
  export FRONTIER_PWA_DIR=/path/to/frontier-pwa
```
Exit workflow.

**If `sdkIntegrated` is false:**
Warn the user:
```
This app does not appear to have SDK Integration files yet (`src/lib/sdk-context.tsx` and `src/lib/sdk-services.tsx`).

The PWA iframe load can still be tested, but SDK bridge calls will only work after the SDK Integration phase.
```

Continue unless the user explicitly cancels.
</step>

<step name="validate_app">
**Run local app checks before wiring it into the PWA.**

```bash
npm run build
BUILD_STATUS=$?

SDK_PHASE=$(node -e "const m=JSON.parse(require('fs').readFileSync('.frontier-app/manifest.json','utf8')); console.log(m.sdkPhase ?? '')")
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" validate structure ${SDK_PHASE:+--phase "$SDK_PHASE"} --skip-pwa-test
STRUCT_STATUS=$?
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" validate permissions ${SDK_PHASE:+--phase "$SDK_PHASE"}
PERMS_STATUS=$?
```

If any check fails, report the failing check and stop before editing the PWA registry. The local PWA test should not mask a broken build or known integration violation.
</step>

<step name="write_registry">
**Add or update the generated app in the PWA external registry.**

```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" pwa-local write [normalized args]
```

This edits only the builder-managed marker block in:

```
[pwaDir]/src/lib/apps/registry/apps/external.ts
```

The generated entry uses:
- `id`: derived from `manifest.appId`, `manifest.pwaAppId`, or `manifest.packageName`
- `url`: `http://localhost:<manifest.devPort>`
- `permissions`: `.frontier-app/manifest.json`
- `excludedAppStages: ['production']`

To undo later:

```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" pwa-local restore [normalized args]
```
</step>

<step name="start_servers">
**Start or verify both dev servers.**

Use the URLs from `pwa-local info`.

**App server:**
```bash
if curl -fsS "$APP_URL" >/dev/null 2>&1; then
  echo "App already running at $APP_URL"
else
  APP_LOG="/tmp/fos-local-app-$APP_ID.log"
  APP_PID="/tmp/fos-local-app-$APP_ID.pid"
  npm run dev -- --host 127.0.0.1 --port "$DEV_PORT" > "$APP_LOG" 2>&1 &
  echo $! > "$APP_PID"
fi
```

**PWA server:**
```bash
if curl -fsS "$PWA_URL" >/dev/null 2>&1; then
  echo "PWA already running at $PWA_URL"
else
  PWA_LOG="/tmp/fos-local-pwa-$APP_ID.log"
  PWA_PID="/tmp/fos-local-pwa-$APP_ID.pid"
  (cd "$PWA_DIR" && npm run dev -- --host 127.0.0.1 --port 5173) > "$PWA_LOG" 2>&1 &
  echo $! > "$PWA_PID"
fi
```

Wait up to 30 seconds for both URLs to respond:

```bash
for i in {1..30}; do
  curl -fsS "$APP_URL" >/dev/null 2>&1 && curl -fsS "$PWA_URL" >/dev/null 2>&1 && break
  sleep 1
done
```

If either server does not respond, show the relevant log path and stop.
</step>

<step name="verify_in_pwa">
**Open the local PWA app route and verify the integration.**

Test URL:

```
[launchUrl]
```

Verification checklist:
- PWA route does not 404.
- App iframe renders below the Frontier OS app toolbar.
- Standalone fallback screen is not shown while inside the iframe.
- Browser console has no `Unauthorized message from` error from `AppHostSDK`.
- At least one SDK-backed feature can run without hanging. Prefer a cheap read such as Storage, Chain, or User before testing wallet/write flows.

If browser automation is available, open `[launchUrl]`, wait for an iframe under `#frontier-app-iframes`, and check that its `src` starts with `[appUrl]`.
</step>

<step name="completion">
**Record the smoke test and report exact commands and cleanup.**

After the iframe checklist has passed, write `.frontier-app/PWA-TEST.md`:

```markdown
# Local Frontier PWA Test

Status: PASS
Date: [today]
App ID: [appId]
App URL: [appUrl]
PWA URL: [pwaUrl]
Launch URL: [launchUrl]
Registry file: [registryFile]

## Verified

- [x] PWA route did not 404
- [x] App iframe rendered under Frontier OS app toolbar
- [x] Standalone fallback was not shown in iframe
- [x] No AppHostSDK unauthorized-origin error
- [x] At least one SDK-backed read completed in-frame
```

Update project state:

```bash
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update status "ready-to-ship"
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" state update next_action "/fos:ship"
```

Update `.frontier-app/STATE.md` body:
- Last activity: [today] — Local Frontier PWA iframe smoke test passed
- Local PWA test: [launchUrl]
- Next command: `/fos:ship`

Commit the test artifact if this is a git repo:

```bash
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git add .frontier-app/PWA-TEST.md .frontier-app/STATE.md
  git commit -m "test: verify local Frontier PWA iframe integration"
fi
```

```
## Local PWA Test Ready

App registry ID: [appId]
App dev URL: [appUrl]
PWA URL: [pwaUrl]
Open: [launchUrl]

Registry file patched:
[registryFile]

When finished, restore the PWA registry entry:
node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" pwa-local restore [normalized args]
```
</step>

</process>
