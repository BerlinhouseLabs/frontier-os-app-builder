# frontier-os-app-builder

`npx frontier-os-app-builder` installs `/fos:*` Claude Code commands that guide building a Frontier OS app (meta-prompting framework). Public, MIT, published to npm. Org-wide rules: [repo standards](https://github.com/BerlinhouseLabs/berlinhouse-labs/blob/staging/index/guidelines/repo-standards.md). Open PRs against `staging`; `main` only takes release PRs. This repo is public: never commit secrets, internal hostnames or internal process detail.

## Hard rules

1. **The installer writes into the user's `~/.claude`.** Keep `bin/install.js` conservative: track every file in the manifest so `--uninstall` removes exactly what was installed.
2. **Version lives in two places** (`package.json` and `VERSION` in `bin/install.js`); change both together.
3. **Prompts are the product.** Commands call workflows, workflows spawn agents; keep references (`references/sdk/*`, `module-index.md`) in line with the current `frontier-sdk` API.
4. **Orchestrator owns `.frontier-app/STATE.md`**, not sub-agents (see the fix in #13).
5. **No publishing from a PR.** `npm publish` is manual; don't run it unless asked.

## Commands

```bash
npm test                                   # node --test test/*.test.cjs (Node 22, .nvmrc; no deps to install)
cd studio && npm ci && npm run build && npm test
```

`studio/` (Frontier Studio) is a separate package with its own lockfile. `npm run lint` in `studio/` currently fails, so CI skips it.

## Map

- `bin/install.js`, `bin/fos-tools.cjs`: installer and state helper CLI
- `commands/fos/`: slash commands; `workflows/`: orchestration; `agents/`: researcher, planner, plan-checker, executor, verifier
- `references/`: SDK, patterns, deployment and verification knowledge; `templates/app/`: app boilerplate
- `test/`: tests for `fos-tools`

## Deploys and rollback

Merging deploys nothing. Release = manual `npm publish`; roll back by publishing a fixed patch and `npm deprecate`-ing the bad version.

## Exceptions to the org repo standards

- npm publishing is manual, not on merge.
- No lint/format, coverage floor or dependency audit in CI yet.
