---
name: fos:test-pwa
description: Test the current app live inside a local Frontier PWA iframe
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---
<objective>
Run the current Frontier OS app inside a local Frontier PWA instance so iframe loading, origin verification, and SDK bridge calls can be tested before shipping.

**Flow:** validate generated app -> add/update PWA local registry entry -> start app and PWA dev servers -> open `/apps/<appId>`.

**Optional argument:** path or flags for the local `frontier-pwa` repo, for example:

```
/fos:test-pwa ../frontier-pwa
/fos:test-pwa --pwa-dir /path/to/frontier-pwa
```
</objective>

<execution_context>
@$HOME/.claude/frontier-os-app-builder/workflows/test-pwa.md
@$HOME/.claude/frontier-os-app-builder/references/deployment.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the local PWA test workflow from @$HOME/.claude/frontier-os-app-builder/workflows/test-pwa.md end-to-end.
</process>
