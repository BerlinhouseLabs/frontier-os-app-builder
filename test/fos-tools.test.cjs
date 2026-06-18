'use strict';

// Tests for the phase-numbering / SDK-Integration-invariant CLI commands
// (next-phase, add-phases). Run with `npm test` (Node's built-in runner).
//
// These are the first tests for bin/fos-tools.cjs. They exercise the command
// as a real subprocess against throwaway .frontier-app fixtures.

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const BIN = path.join(__dirname, '..', 'bin', 'fos-tools.cjs');

// Build a temp app dir with a .frontier-app/manifest.json and optional phase dirs.
//   phaseDirs: [{ name: '03-sdk-integration', files: ['03-01-SUMMARY.md'] }]
function setup(manifest, phaseDirs = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fos-test-'));
  const phases = path.join(dir, '.frontier-app', 'phases');
  fs.mkdirSync(phases, { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.frontier-app', 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  for (const d of phaseDirs) {
    const pdir = path.join(phases, d.name);
    fs.mkdirSync(pdir, { recursive: true });
    for (const f of d.files || []) fs.writeFileSync(path.join(pdir, f), '# fixture\n');
  }
  return dir;
}

function run(cwd, args) {
  return execFileSync('node', [BIN, ...args], { cwd, encoding: 'utf8' });
}
function runJson(cwd, args) {
  return JSON.parse(run(cwd, args));
}
function readManifest(cwd) {
  return JSON.parse(fs.readFileSync(path.join(cwd, '.frontier-app', 'manifest.json'), 'utf8'));
}
function phaseDirNames(cwd) {
  return fs.readdirSync(path.join(cwd, '.frontier-app', 'phases')).sort();
}
function phaseByName(manifest, name) {
  return manifest.phases.find(p => p.name === name);
}

test('next-phase = max(manifest phases ∪ dirs) + 1', () => {
  const cwd = setup({
    phases: [{ number: 1, name: 'Scaffold', status: 'not-started' },
             { number: 2, name: 'Feature', status: 'not-started' },
             { number: 3, name: 'SDK Integration', status: 'not-started' }],
    sdkPhase: 3,
  });
  assert.strictEqual(runJson(cwd, ['next-phase']).next, 4);
  assert.strictEqual(run(cwd, ['next-phase', '--raw']).trim(), '4');
});

test('next-phase respects gaps and dir-only phases', () => {
  const cwd = setup(
    { phases: [{ number: 1, name: 'Scaffold', status: 'not-started' }], sdkPhase: null },
    [{ name: '05-orphan' }] // dir higher than any manifest phase
  );
  assert.strictEqual(runJson(cwd, ['next-phase']).next, 6);
});

test('CASE 1 mid-build: feature inserted before pending SDK phase, SDK renumbered + files renamed', () => {
  const cwd = setup(
    {
      modules: ['Storage', 'Chain'],
      permissions: ['storage:get'],
      phases: [{ number: 1, name: 'Scaffold', status: 'not-started' },
               { number: 2, name: 'Feature', status: 'not-started' },
               { number: 3, name: 'SDK Integration', status: 'not-started' }],
      sdkPhase: 3,
    },
    // SDK phase planned/discussed but NOT executed (no *-SUMMARY.md), with an inner file
    [{ name: '03-sdk-integration', files: ['03-CONTEXT.md'] }]
  );

  const out = runJson(cwd, ['add-phases', '--names', '["Payments"]', '--modules', 'Wallet', '--permissions', 'wallet:getBalance']);
  const m = readManifest(cwd);

  assert.strictEqual(out.featurePhases[0].number, 3, 'feature takes the old SDK slot');
  assert.strictEqual(out.sdkIntegration.number, 4, 'SDK shifted up');
  assert.strictEqual(out.sdkIntegration.renumbered, true);
  assert.strictEqual(out.sdkIntegration.added, false);
  assert.strictEqual(out.sdkPhase, 4);
  assert.strictEqual(m.sdkPhase, 4);
  assert.strictEqual(phaseByName(m, 'SDK Integration').number, 4);
  assert.strictEqual(phaseByName(m, 'Payments').number, 3);
  assert.deepStrictEqual(m.modules, ['Storage', 'Chain', 'Wallet']);
  assert.deepStrictEqual(out.newModules, ['Wallet']);

  const dirs = phaseDirNames(cwd);
  assert.ok(dirs.includes('03-payments'), `expected 03-payments, got ${dirs}`);
  assert.ok(dirs.includes('04-sdk-integration'), `expected 04-sdk-integration, got ${dirs}`);
  assert.ok(!dirs.includes('03-sdk-integration'), 'old SDK dir should be gone');
  // inner artifact file renamed to match new number
  assert.ok(fs.existsSync(path.join(cwd, '.frontier-app', 'phases', '04-sdk-integration', '04-CONTEXT.md')));
});

test('CASE 2 executed + new module: feature appended, fresh SDK Integration appended', () => {
  const cwd = setup(
    {
      modules: ['Storage', 'Chain'],
      permissions: ['storage:get'],
      phases: [{ number: 1, name: 'Scaffold', status: 'not-started' },
               { number: 2, name: 'Feature', status: 'not-started' },
               { number: 3, name: 'SDK Integration', status: 'not-started' }],
      sdkPhase: 3,
    },
    [{ name: '03-sdk-integration', files: ['03-01-SUMMARY.md'] }] // executed
  );

  const out = runJson(cwd, ['add-phases', '--names', '["Leaderboard"]', '--modules', 'Events']);
  const m = readManifest(cwd);

  assert.strictEqual(out.featurePhases[0].number, 4);
  assert.strictEqual(out.sdkIntegration.added, true);
  assert.strictEqual(out.sdkIntegration.number, 5);
  assert.strictEqual(out.sdkPhase, 5);
  assert.strictEqual(m.sdkPhase, 5);
  assert.strictEqual(m.phases.filter(p => p.name === 'SDK Integration').length, 2,
    'a fresh SDK Integration phase exists alongside the old executed one');
  const dirs = phaseDirNames(cwd);
  assert.ok(dirs.includes('04-leaderboard') && dirs.includes('05-sdk-integration'), dirs.join(','));
  assert.ok(dirs.includes('03-sdk-integration'), 'executed SDK phase left intact');
});

test('CASE 2 executed + NO new module: feature appended, no SDK phase, sdkPhase unchanged', () => {
  const cwd = setup(
    {
      modules: ['Storage', 'Chain'],
      permissions: ['storage:get'],
      phases: [{ number: 1, name: 'Scaffold', status: 'not-started' },
               { number: 2, name: 'SDK Integration', status: 'not-started' }],
      sdkPhase: 2,
    },
    [{ name: '02-sdk-integration', files: ['02-01-SUMMARY.md'] }]
  );

  const out = runJson(cwd, ['add-phases', '--names', '["Tweak"]', '--modules', 'Storage']); // Storage already present
  const m = readManifest(cwd);

  assert.deepStrictEqual(out.newModules, []);
  assert.strictEqual(out.sdkIntegration.added, false);
  assert.strictEqual(out.sdkPhase, 2, 'sdkPhase stays on the executed SDK phase');
  assert.strictEqual(m.sdkPhase, 2);
  assert.strictEqual(m.phases.filter(p => p.name === 'SDK Integration').length, 1);
  assert.strictEqual(phaseByName(m, 'Tweak').number, 3);
});

test('module/permission unions dedupe', () => {
  const cwd = setup({
    modules: ['Storage', 'Chain', 'Wallet'],
    permissions: ['wallet:getBalance'],
    phases: [{ number: 1, name: 'Scaffold', status: 'not-started' },
             { number: 2, name: 'SDK Integration', status: 'not-started' }],
    sdkPhase: 2,
  }, [{ name: '02-sdk-integration', files: ['02-01-SUMMARY.md'] }]);

  const out = runJson(cwd, ['add-phases', '--names', '["X"]', '--modules', 'Wallet,Events', '--permissions', 'wallet:getBalance,events:listEvents']);
  const m = readManifest(cwd);

  assert.deepStrictEqual(out.newModules, ['Events'], 'only genuinely-new module reported');
  assert.deepStrictEqual(m.modules, ['Storage', 'Chain', 'Wallet', 'Events']);
  assert.deepStrictEqual(out.newPermissions, ['events:listEvents']);
  assert.deepStrictEqual(m.permissions, ['wallet:getBalance', 'events:listEvents']);
});

test('legacy manifest (no sdkPhase) + new module appends SDK Integration', () => {
  const cwd = setup({
    modules: ['Storage'],
    permissions: [],
    phases: [{ number: 1, name: 'Scaffold', status: 'not-started' }],
    // no sdkPhase
  });

  const out = runJson(cwd, ['add-phases', '--names', '["Pay"]', '--modules', 'Wallet']);
  const m = readManifest(cwd);

  assert.strictEqual(out.featurePhases[0].number, 2);
  assert.strictEqual(out.sdkIntegration.added, true);
  assert.strictEqual(out.sdkPhase, 3);
  assert.strictEqual(m.sdkPhase, 3);
});

test('new-milestone shape: multiple feature phases then one trailing SDK Integration', () => {
  const cwd = setup({
    modules: ['Storage', 'Chain'],
    permissions: [],
    phases: [{ number: 1, name: 'Scaffold', status: 'not-started' },
             { number: 2, name: 'SDK Integration', status: 'not-started' }],
    sdkPhase: 2,
  }, [{ name: '02-sdk-integration', files: ['02-01-SUMMARY.md'] }]);

  const out = runJson(cwd, ['add-phases', '--names', '["Profiles","Messaging"]', '--modules', 'User']);
  const m = readManifest(cwd);

  assert.deepStrictEqual(out.featurePhases.map(p => p.number), [3, 4]);
  assert.strictEqual(out.firstFeatureNumber, 3);
  assert.strictEqual(out.sdkIntegration.number, 5);
  assert.strictEqual(m.sdkPhase, 5);
  // ordering preserved
  assert.deepStrictEqual(m.phases.map(p => p.number), [1, 2, 3, 4, 5]);
});

test('two SDK Integration entries: selection respects sdkPhase, not first-by-name (regression)', () => {
  // Simulates a SECOND add-feature: a prior add already appended a fresh *pending*
  // SDK Integration (#5) after the executed v1 one (#3); sdkPhase points to #5.
  const cwd = setup(
    {
      modules: ['Storage', 'Chain', 'Events'],
      permissions: [],
      phases: [
        { number: 1, name: 'Scaffold + Standalone Shell', status: 'not-started' },
        { number: 2, name: 'Tip Flow', status: 'not-started' },
        { number: 3, name: 'SDK Integration', status: 'not-started' }, // executed (v1)
        { number: 4, name: 'Leaderboard', status: 'not-started' },
        { number: 5, name: 'SDK Integration', status: 'not-started' }, // pending (prior add)
      ],
      sdkPhase: 5,
    },
    [
      { name: '03-sdk-integration', files: ['03-01-SUMMARY.md'] }, // executed
      { name: '05-sdk-integration' },                              // pending (no summary)
    ]
  );

  const out = runJson(cwd, ['add-phases', '--names', '["Profiles"]', '--modules', 'User']);
  const m = readManifest(cwd);

  // Must pick the PENDING #5 (per sdkPhase) and insert before it — NOT pick the
  // executed #3 by name and append a THIRD SDK Integration.
  assert.strictEqual(out.featurePhases[0].number, 5, 'feature inserted at the pending SDK slot');
  assert.strictEqual(out.sdkIntegration.renumbered, true);
  assert.strictEqual(out.sdkIntegration.added, false);
  assert.strictEqual(out.sdkIntegration.number, 6);
  assert.strictEqual(out.sdkPhase, 6);
  assert.strictEqual(m.sdkPhase, 6);
  assert.strictEqual(m.phases.filter(p => p.name === 'SDK Integration').length, 2,
    'no third SDK Integration phase created');
  assert.deepStrictEqual(m.phases.map(p => p.number), [1, 2, 3, 4, 5, 6]);
});

test('listSummaries/executed-detection works for phase numbers >= 100', () => {
  const cwd = setup(
    {
      modules: ['Storage'],
      permissions: [],
      phases: [
        { number: 99, name: 'Feature', status: 'not-started' },
        { number: 100, name: 'SDK Integration', status: 'not-started' },
      ],
      sdkPhase: 100,
    },
    [{ name: '100-sdk-integration', files: ['100-01-SUMMARY.md'] }] // executed, 3-digit prefix
  );

  // 100 is executed -> new module must APPEND a fresh SDK Integration (Case 2), not renumber.
  const out = runJson(cwd, ['add-phases', '--names', '["More"]', '--modules', 'Wallet']);
  assert.strictEqual(out.sdkIntegration.added, true);
  assert.strictEqual(out.featurePhases[0].number, 101);
  assert.strictEqual(out.sdkIntegration.number, 102);
  assert.strictEqual(out.sdkPhase, 102);
});
