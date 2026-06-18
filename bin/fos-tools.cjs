#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

// ─────────────────────────────────────────────
// FOS Tools — CLI utility for Frontier OS App Builder
// Usage: node fos-tools.cjs <command> [args] [--raw] [--pick <field>]
// ─────────────────────────────────────────────

const VERSION = '1.2.0';

// ── Helpers ──────────────────────────────────

function fosDir(cwd) {
  return path.join(cwd || process.cwd(), '.frontier-app');
}

function fosExists(cwd) {
  return fs.existsSync(fosDir(cwd));
}

function readFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

function output(data, flags) {
  if (flags.pick && typeof data === 'object') {
    const val = data[flags.pick];
    process.stdout.write(typeof val === 'string' ? val : JSON.stringify(val));
  } else if (flags.raw && typeof data === 'string') {
    process.stdout.write(data);
  } else {
    const json = JSON.stringify(data, null, 2);
    // If output is too large for stdout, write to temp file
    if (json.length > 50000) {
      const tmp = path.join(require('os').tmpdir(), `fos-${Date.now()}.json`);
      fs.writeFileSync(tmp, json);
      process.stdout.write(`@file:${tmp}`);
    } else {
      process.stdout.write(json);
    }
  }
}

function error(msg) {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(1);
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shellQuote(text) {
  return `'${String(text).replace(/'/g, `'\\''`)}'`;
}

function gitOutput(cwd, args) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return null;
  }
}

function currentGitSha(cwd) {
  return gitOutput(cwd, ['rev-parse', 'HEAD']);
}

// ── YAML Frontmatter Parsing ─────────────────

function parseFrontmatter(content) {
  if (!content) return { frontmatter: {}, body: '' };
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const fm = {};
  let currentKey = null;
  let currentIndent = 0;

  for (const line of match[1].split('\n')) {
    const kvMatch = line.match(/^(\w[\w_-]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      const [, key, val] = kvMatch;
      const trimmed = val.trim();
      if (trimmed === '' || trimmed === '|') {
        fm[key] = '';
        currentKey = key;
      } else if (trimmed === '[]') {
        fm[key] = [];
        currentKey = key;
      } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        fm[key] = trimmed.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
        currentKey = null;
      } else if (trimmed === 'true') {
        fm[key] = true; currentKey = null;
      } else if (trimmed === 'false') {
        fm[key] = false; currentKey = null;
      } else if (/^\d+$/.test(trimmed)) {
        fm[key] = parseInt(trimmed, 10); currentKey = null;
      } else {
        fm[key] = trimmed.replace(/^["']|["']$/g, '');
        currentKey = null;
      }
    } else if (currentKey && line.match(/^\s+-\s+/)) {
      const item = line.replace(/^\s+-\s+/, '').trim().replace(/^["']|["']$/g, '');
      if (!Array.isArray(fm[currentKey])) fm[currentKey] = [];
      fm[currentKey].push(item);
    } else if (currentKey && line.match(/^\s+\S/)) {
      fm[currentKey] += (fm[currentKey] ? '\n' : '') + line.trimStart();
    }
  }

  return { frontmatter: fm, body: match[2] };
}

function serializeFrontmatter(fm, body) {
  const lines = ['---'];
  for (const [key, val] of Object.entries(fm)) {
    if (Array.isArray(val)) {
      if (val.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        val.forEach(v => lines.push(`  - ${v}`));
      }
    } else if (typeof val === 'boolean') {
      lines.push(`${key}: ${val}`);
    } else if (typeof val === 'number') {
      lines.push(`${key}: ${val}`);
    } else {
      lines.push(`${key}: ${val}`);
    }
  }
  lines.push('---');
  return lines.join('\n') + '\n' + (body || '');
}

// ── Manifest ─────────────────────────────────

function loadManifest(cwd) {
  const p = path.join(fosDir(cwd), 'manifest.json');
  const raw = readFile(p);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveManifest(cwd, manifest) {
  writeFile(path.join(fosDir(cwd), 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
}

// ── Local PWA Testing ────────────────────────

const PWA_EXTERNAL_APPS_PATH = path.join('src', 'lib', 'apps', 'registry', 'apps', 'external.ts');
const PWA_LOCAL_MARKER_START = '/* frontier-os-app-builder:local-app:start */';
const PWA_LOCAL_MARKER_END = '/* frontier-os-app-builder:local-app:end */';

function getPwaAppId(manifest) {
  if (manifest.appId) return String(manifest.appId);
  if (manifest.pwaAppId) return String(manifest.pwaAppId);
  if (manifest.packageName) {
    const pkg = String(manifest.packageName);
    if (pkg.startsWith('frontier-os-app-')) return pkg.replace(/^frontier-os-app-/, '');
    if (pkg.startsWith('app-')) return pkg.replace(/^app-/, '');
    return pkg;
  }
  return generateSlug(manifest.name || 'frontier-app');
}

function getLocalPwaMetadata(cwd, opts = {}) {
  const manifest = loadManifest(cwd);
  if (!manifest) error('.frontier-app/manifest.json not found');

  const devPort = Number(opts.devPort || manifest.devPort);
  if (!Number.isInteger(devPort) || devPort <= 0) {
    error('manifest.devPort must be a positive integer for local PWA testing');
  }

  const appId = opts.appId || getPwaAppId(manifest);
  const appUrl = opts.appUrl || `http://localhost:${devPort}`;
  const pwaUrl = 'http://localhost:5173';
  const sdkIntegrated =
    fs.existsSync(path.join(cwd, 'src', 'lib', 'sdk-context.tsx')) &&
    fs.existsSync(path.join(cwd, 'src', 'lib', 'sdk-services.tsx'));

  return {
    appId,
    name: manifest.name || appId,
    description: manifest.description || 'Local Frontier OS app',
    appUrl,
    pwaUrl,
    launchUrl: `${pwaUrl}/apps/${appId}`,
    devPort,
    permissions: Array.isArray(manifest.permissions) ? manifest.permissions : [],
    modules: Array.isArray(manifest.modules) ? manifest.modules : [],
    packageName: manifest.packageName || null,
    sdkPhase: manifest.sdkPhase ?? null,
    sdkIntegrated,
  };
}

function renderPwaAppEntry(metadata) {
  if (metadata.permissions.length === 0) {
    error('.frontier-app/manifest.json permissions must list exact SDK permissions before writing a local PWA registry entry');
  }

  const permissions = metadata.permissions;

  return `{
  id: ${JSON.stringify(metadata.appId)},
  name: ${JSON.stringify(metadata.name)},
  description: ${JSON.stringify(metadata.description)},
  url: ${JSON.stringify(metadata.appUrl)},
  icon: '/icons/app-fallback.svg',
  developer: {
    name: 'Local Frontier OS App Builder',
    url: ${JSON.stringify(metadata.pwaUrl)},
    description: 'Local app loaded through Frontier OS App Builder.',
  },
  excludedAppStages: ['production'],
  permissions: ${JSON.stringify(permissions, null, 2).replace(/\n/g, '\n  ')},
  permissionDisclaimer:
    'Local development entry generated from .frontier-app/manifest.json for Frontier OS iframe and SDK testing.',
} as AppMetadata,`;
}

function readPwaTestField(content, field) {
  const match = content.match(new RegExp(`^${escapeRegExp(field)}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

function isPwaRuntimePath(file) {
  return file.startsWith('src/') ||
    file.startsWith('public/') ||
    file === '.frontier-app/manifest.json' ||
    file === 'index.html' ||
    file === 'package.json' ||
    file === 'package-lock.json' ||
    file === 'pnpm-lock.yaml' ||
    file === 'yarn.lock' ||
    file === 'vite.config.ts' ||
    file === 'vite.config.js' ||
    file === 'vercel.json' ||
    file === 'tsconfig.json' ||
    file === 'postcss.config.js' ||
    file === 'tailwind.config.js' ||
    file === 'tailwind.config.ts';
}

function validatePwaTestGitSha(cwd, testedSha) {
  const currentSha = currentGitSha(cwd);
  if (!currentSha) return { pass: true };
  if (!testedSha) {
    return { pass: false, issue: 'missing Git SHA' };
  }
  if (!/^[0-9a-f]{7,40}$/i.test(testedSha)) {
    return { pass: false, issue: `has invalid Git SHA: ${testedSha}` };
  }

  const testedCommit = gitOutput(cwd, ['rev-parse', `${testedSha}^{commit}`]);
  if (!testedCommit) {
    return { pass: false, issue: `Git SHA is not in this repository: ${testedSha}` };
  }
  if (testedCommit === currentSha) {
    const dirtyRuntimeFiles = getDirtyRuntimeFiles(cwd);
    if (dirtyRuntimeFiles.length > 0) {
      return {
        pass: false,
        issue: `is stale; uncommitted runtime files changed after the PWA test: ${dirtyRuntimeFiles.join(', ')}`
      };
    }
    return { pass: true };
  }

  const diff = gitOutput(cwd, ['diff', '--relative', '--name-only', `${testedCommit}..HEAD`]);
  if (diff == null) {
    return { pass: false, issue: `could not compare tested Git SHA to HEAD: ${testedSha}` };
  }
  const changedRuntimeFiles = diff.split('\n').filter(Boolean).filter(isPwaRuntimePath);
  if (changedRuntimeFiles.length === 0) {
    const dirtyRuntimeFiles = getDirtyRuntimeFiles(cwd);
    if (dirtyRuntimeFiles.length > 0) {
      return {
        pass: false,
        issue: `is stale; uncommitted runtime files changed after the PWA test: ${dirtyRuntimeFiles.join(', ')}`
      };
    }
    return { pass: true };
  }

  return {
    pass: false,
    issue: `is stale; runtime files changed since tested Git SHA ${testedSha}: ${changedRuntimeFiles.join(', ')}`
  };
}

function getDirtyRuntimeFiles(cwd) {
  const changed = new Set();
  for (const args of [
    ['diff', '--relative', '--name-only'],
    ['diff', '--relative', '--cached', '--name-only'],
    ['ls-files', '--others', '--exclude-standard']
  ]) {
    const diff = gitOutput(cwd, args);
    if (diff) {
      diff.split('\n').filter(Boolean).forEach(file => changed.add(file));
    }
  }
  return Array.from(changed).filter(isPwaRuntimePath);
}

function findPwaDir(cwd, explicitDir) {
  if (explicitDir) {
    const explicitPath = path.resolve(cwd, explicitDir);
    return fs.existsSync(path.join(explicitPath, PWA_EXTERNAL_APPS_PATH)) ? explicitPath : null;
  }

  if (process.env.FRONTIER_PWA_DIR) {
    const envPath = path.resolve(process.env.FRONTIER_PWA_DIR);
    return fs.existsSync(path.join(envPath, PWA_EXTERNAL_APPS_PATH)) ? envPath : null;
  }

  const candidates = [];

  const parent = path.dirname(cwd);
  candidates.push(
    path.join(parent, 'frontier-pwa'),
    path.join(path.dirname(parent), 'frontier-pwa'),
    path.join(require('os').homedir(), 'work', 'frontieros', 'frontier-pwa'),
    path.join(require('os').homedir(), 'frontieros', 'frontier-pwa')
  );

  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    if (fs.existsSync(path.join(candidate, PWA_EXTERNAL_APPS_PATH))) {
      return candidate;
    }
  }

  return null;
}

function pwaExternalAppsFile(pwaDir) {
  return path.join(pwaDir, PWA_EXTERNAL_APPS_PATH);
}

function indentBlock(block, spaces) {
  const pad = ' '.repeat(spaces);
  return block.split('\n').map(line => (line ? pad + line : line)).join('\n');
}

function upsertLocalPwaEntry(filePath, entry) {
  const current = readFile(filePath);
  if (current == null) error(`PWA external registry file not found: ${filePath}`);

  const managedBlock = indentBlock(`${PWA_LOCAL_MARKER_START}\n${entry}\n${PWA_LOCAL_MARKER_END}`, 4);
  const markerPattern = new RegExp(`\\n?\\s*${escapeRegExp(PWA_LOCAL_MARKER_START)}[\\s\\S]*?${escapeRegExp(PWA_LOCAL_MARKER_END)}\\n?`, 'm');

  let next;
  if (markerPattern.test(current)) {
    next = current.replace(markerPattern, `\n${managedBlock}\n`);
  } else if (/return\s*\[\s*\];/.test(current)) {
    next = current.replace(/return\s*\[\s*\];/, `return [\n${managedBlock}\n  ];`);
  } else if (/return\s*\[/.test(current)) {
    next = current.replace(/return\s*\[/, `return [\n${managedBlock}\n`);
  } else {
    error(`Could not patch ${filePath}: expected a getApps() return array`);
  }

  writeFile(filePath, next);
  return current !== next;
}

function removeLocalPwaEntry(filePath) {
  const current = readFile(filePath);
  if (current == null) error(`PWA external registry file not found: ${filePath}`);

  const markerPattern = new RegExp(`\\n?\\s*${escapeRegExp(PWA_LOCAL_MARKER_START)}[\\s\\S]*?${escapeRegExp(PWA_LOCAL_MARKER_END)}\\n?`, 'm');
  if (!markerPattern.test(current)) return false;

  const next = current
    .replace(markerPattern, '\n')
    .replace(/return\s*\[\s*\];/g, 'return [];');
  writeFile(filePath, next);
  return current !== next;
}

function parsePwaLocalOptions(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--pwa-dir' && args[i + 1]) opts.pwaDir = args[++i];
    else if (arg === '--app-id' && args[i + 1]) opts.appId = args[++i];
    else if (arg === '--app-url' && args[i + 1]) opts.appUrl = args[++i];
    else if (arg === '--dev-port' && args[i + 1]) opts.devPort = args[++i];
    else if (arg === '--pwa-port') error('pwa-local does not support --pwa-port; Frontier PWA local testing must use http://localhost:5173.');
  }
  return opts;
}

function cmdPwaLocal(cwd, action, args, flags) {
  const opts = parsePwaLocalOptions(args);
  const subcommand = action || 'info';
  const pwaDir = findPwaDir(cwd, opts.pwaDir);
  const registryFile = pwaDir ? pwaExternalAppsFile(pwaDir) : null;

  if (subcommand === 'restore') {
    if (!registryFile) {
      error('Could not find frontier-pwa. Pass --pwa-dir <path> or set FRONTIER_PWA_DIR.');
    }
    const changed = removeLocalPwaEntry(registryFile);
    output({ changed, registryFile }, flags);
    return;
  }

  const metadata = getLocalPwaMetadata(cwd, opts);

  switch (subcommand) {
    case 'info':
      output({
        ...metadata,
        pwaDir,
        registryFile,
        registryFound: Boolean(registryFile),
        registryCommand: `node "$HOME/.claude/frontier-os-app-builder/bin/fos-tools.cjs" pwa-local write${pwaDir ? ` --pwa-dir ${shellQuote(pwaDir)}` : ' --pwa-dir <frontier-pwa-path>'}`,
        appDevCommand: `npm run dev -- --host localhost --port ${metadata.devPort}`,
        pwaDevCommand: pwaDir ? `cd ${shellQuote(pwaDir)} && npm run dev -- --host localhost --port 5173` : 'cd <frontier-pwa-path> && npm run dev -- --host localhost --port 5173',
      }, flags);
      break;

    case 'snippet':
      output(flags.raw ? renderPwaAppEntry(metadata) : { entry: renderPwaAppEntry(metadata) }, flags);
      break;

    case 'write': {
      const entry = renderPwaAppEntry(metadata);
      if (!registryFile) {
        error('Could not find frontier-pwa. Pass --pwa-dir <path> or set FRONTIER_PWA_DIR.');
      }
      const changed = upsertLocalPwaEntry(registryFile, entry);
      output({
        changed,
        appId: metadata.appId,
        appUrl: metadata.appUrl,
        launchUrl: metadata.launchUrl,
        registryFile,
      }, flags);
      break;
    }

    default:
      error('Unknown pwa-local subcommand. Valid: info, snippet, write, restore');
  }
}
// ── State ────────────────────────────────────

function loadState(cwd) {
  const p = path.join(fosDir(cwd), 'STATE.md');
  const raw = readFile(p);
  if (!raw) return null;
  return parseFrontmatter(raw);
}

function saveState(cwd, fm, body) {
  writeFile(path.join(fosDir(cwd), 'STATE.md'), serializeFrontmatter(fm, body));
}

function cmdStateLoad(cwd, flags) {
  const state = loadState(cwd);
  if (!state) error('.frontier-app/STATE.md not found');
  output(flags.raw ? state.body : state, flags);
}

function cmdStateJson(cwd, flags) {
  const state = loadState(cwd);
  if (!state) error('.frontier-app/STATE.md not found');
  output(state.frontmatter, flags);
}

function cmdStateUpdate(cwd, field, value, flags) {
  const state = loadState(cwd);
  if (!state) error('.frontier-app/STATE.md not found');
  // Parse value
  let parsed = value;
  if (value === 'true') parsed = true;
  else if (value === 'false') parsed = false;
  else if (/^\d+$/.test(value)) parsed = parseInt(value, 10);

  state.frontmatter[field] = parsed;
  saveState(cwd, state.frontmatter, state.body);
  output({ updated: field, value: parsed }, flags);
}

function cmdStateGet(cwd, field, flags) {
  const state = loadState(cwd);
  if (!state) error('.frontier-app/STATE.md not found');
  const val = state.frontmatter[field];
  if (val === undefined) error(`Field '${field}' not found in STATE.md`);
  output(flags.raw ? String(val) : { [field]: val }, flags);
}

// ── Phase Operations ─────────────────────────

function findPhaseDir(cwd, phaseNum) {
  const phasesDir = path.join(fosDir(cwd), 'phases');
  if (!fs.existsSync(phasesDir)) return null;

  const prefix = String(phaseNum).padStart(2, '0');
  const entries = fs.readdirSync(phasesDir);
  const match = entries.find(e => e.startsWith(prefix + '-'));
  return match ? path.join(phasesDir, match) : null;
}

function cmdFindPhase(cwd, phaseNum, flags) {
  if (!phaseNum) error('Phase number required');
  const dir = findPhaseDir(cwd, phaseNum);
  if (!dir) error(`Phase ${phaseNum} directory not found`);
  output(flags.raw ? dir : { phase: phaseNum, directory: dir }, flags);
}

function listPlans(phaseDir) {
  if (!phaseDir || !fs.existsSync(phaseDir)) return [];
  return fs.readdirSync(phaseDir)
    .filter(f => f.match(/^\d{2,}-\d{2,}-PLAN\.md$/))
    .sort();
}

function listSummaries(phaseDir) {
  if (!phaseDir || !fs.existsSync(phaseDir)) return [];
  return fs.readdirSync(phaseDir)
    .filter(f => f.match(/^\d{2,}-\d{2,}-SUMMARY\.md$/))
    .sort();
}

// ── Phase Numbering & SDK-Integration Invariant ──
//
// Invariant maintained here: the "SDK Integration" phase is always the LAST
// phase and `manifest.sdkPhase` always points to it. add-feature/new-milestone
// delegate phase placement to `add-phases` so this can never drift (see the
// consumers in execute.md, validate tiering, fos-verifier, discuss skip).

function listPhaseNumbers(cwd) {
  const nums = new Set();
  const phasesDir = path.join(fosDir(cwd), 'phases');
  if (fs.existsSync(phasesDir)) {
    for (const e of fs.readdirSync(phasesDir)) {
      const m = e.match(/^(\d+)-/);
      if (m) nums.add(parseInt(m[1], 10));
    }
  }
  const manifest = loadManifest(cwd);
  if (manifest && Array.isArray(manifest.phases)) {
    for (const p of manifest.phases) {
      if (Number.isInteger(p.number)) nums.add(p.number);
    }
  }
  return Array.from(nums).sort((a, b) => a - b);
}

function computeNextPhase(cwd) {
  const nums = listPhaseNumbers(cwd);
  return nums.length ? Math.max(...nums) + 1 : 1;
}

function cmdNextPhase(cwd, flags) {
  const next = computeNextPhase(cwd);
  output(flags.raw ? String(next) : { next }, flags);
}

function phaseDirName(number, slug) {
  return `${String(number).padStart(2, '0')}-${slug}`;
}

function slugForPhase(cwd, entry) {
  const dir = findPhaseDir(cwd, entry.number);
  if (dir) {
    const m = path.basename(dir).match(/^\d+-(.+)$/);
    if (m) return m[1];
  }
  return generateSlug(entry.name);
}

function ensurePhaseDir(cwd, number, slug) {
  const dir = path.join(fosDir(cwd), 'phases', phaseDirName(number, slug));
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Renumber a phase directory from `fromNum` to `toNum`, including the leading
// `NN-` prefix on its inner artifact files (CONTEXT/RESEARCH/PLAN/SUMMARY/...).
function renumberPhaseDir(cwd, fromNum, toNum) {
  const dir = findPhaseDir(cwd, fromNum);
  if (!dir) return;
  // Refuse to renumber onto a number already occupied on disk (manifest/filesystem
  // drift) — renaming would clobber or produce ambiguous ordering. Normal shifts run
  // highest-first so the destination is always vacant; a hit here means real drift.
  const occupied = findPhaseDir(cwd, toNum);
  if (occupied) {
    error(`Cannot renumber phase ${fromNum} -> ${toNum}: phases/${path.basename(occupied)} already occupies number ${toNum} (manifest/filesystem drift). Reconcile phase dirs before adding phases.`);
  }
  const m = path.basename(dir).match(/^\d+-(.+)$/);
  const slug = m ? m[1] : '';
  const oldPrefix = String(fromNum).padStart(2, '0');
  const newPrefix = String(toNum).padStart(2, '0');
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith(oldPrefix + '-')) {
      fs.renameSync(path.join(dir, f), path.join(dir, newPrefix + f.slice(oldPrefix.length)));
    }
  }
  fs.renameSync(dir, path.join(path.dirname(dir), phaseDirName(toNum, slug)));
}

function parseListArg(val) {
  if (!val) return [];
  const trimmed = String(val).trim();
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed);
      return Array.isArray(arr) ? arr.map(String).map(s => s.trim()).filter(Boolean) : [];
    } catch { error(`Invalid JSON list: ${val}`); }
  }
  return trimmed.split(',').map(s => s.trim()).filter(Boolean);
}

// Add feature phase(s) while preserving the SDK-Integration-last invariant.
//   add-phases --names '["Feature A","Feature B"]' [--modules M1,M2] [--permissions p1,p2]
function cmdAddPhases(cwd, args, flags) {
  let namesRaw = null, modulesRaw = null, permsRaw = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--names' && args[i + 1]) namesRaw = args[++i];
    else if (args[i] === '--modules' && args[i + 1]) modulesRaw = args[++i];
    else if (args[i] === '--permissions' && args[i + 1]) permsRaw = args[++i];
  }
  if (!namesRaw) error('add-phases requires --names \'["Phase Name", ...]\'');

  let names;
  try { names = JSON.parse(namesRaw); } catch { error(`--names must be a JSON array of strings: ${namesRaw}`); }
  if (!Array.isArray(names) || names.length === 0 || !names.every(n => typeof n === 'string' && n.trim())) {
    error('--names must be a non-empty JSON array of non-empty strings');
  }
  names = names.map(n => n.trim());

  const manifest = loadManifest(cwd);
  if (!manifest) error('.frontier-app/manifest.json not found');
  if (!Array.isArray(manifest.phases)) manifest.phases = [];

  // Merge modules/permissions as deduped unions (existing first, then new).
  const existingModules = Array.isArray(manifest.modules) ? manifest.modules : [];
  const newModules = parseListArg(modulesRaw).filter(m => !existingModules.includes(m));
  manifest.modules = [...existingModules, ...newModules];

  const existingPerms = Array.isArray(manifest.permissions) ? manifest.permissions : [];
  const newPermissions = parseListArg(permsRaw).filter(p => !existingPerms.includes(p));
  manifest.permissions = [...existingPerms, ...newPermissions];

  // Locate the SDK Integration phase and decide whether it has already executed.
  // Resolve by sdkPhase FIRST — there can be more than one phase named "SDK
  // Integration" (an executed historical one + a fresh pending one), and sdkPhase
  // is the source of truth for which is operative. Fall back to the highest-
  // numbered "SDK Integration" only when sdkPhase is absent.
  const sdkPhaseNum = Number.isInteger(manifest.sdkPhase) ? manifest.sdkPhase : null;
  let sdkEntry = sdkPhaseNum != null
    ? (manifest.phases.find(p => p.number === sdkPhaseNum) || null)
    : null;
  if (!sdkEntry) {
    sdkEntry = manifest.phases
      .filter(p => p.name === 'SDK Integration')
      .sort((a, b) => b.number - a.number)[0] || null;
  }
  let sdkExecuted = false;
  if (sdkEntry) {
    const dir = findPhaseDir(cwd, sdkEntry.number);
    sdkExecuted = dir ? listSummaries(dir).length > 0 : false;
  }

  const featurePhases = [];
  let sdkIntegration = {
    number: sdkEntry ? sdkEntry.number : null,
    slug: sdkEntry ? slugForPhase(cwd, sdkEntry) : 'sdk-integration',
    added: false,
    renumbered: false,
    fromNumber: null,
  };

  if (sdkEntry && !sdkExecuted) {
    // CASE 1 (mid-build): insert features before the still-pending SDK phase,
    // shift it (and anything after it) up, repoint sdkPhase. New modules will be
    // wired when the pending SDK phase finally runs.
    const insertAt = sdkEntry.number;
    const shift = names.length;
    const toShift = manifest.phases
      .filter(p => p.number >= insertAt)
      .sort((a, b) => b.number - a.number); // highest first to avoid dir collisions
    for (const p of toShift) {
      renumberPhaseDir(cwd, p.number, p.number + shift);
      p.number += shift;
    }
    names.forEach((name, idx) => {
      const number = insertAt + idx;
      const slug = generateSlug(name);
      manifest.phases.push({ number, name, status: 'not-started' });
      ensurePhaseDir(cwd, number, slug);
      featurePhases.push({ number, name, slug });
    });
    manifest.sdkPhase = sdkEntry.number; // already shifted in the loop above
    sdkIntegration = {
      number: sdkEntry.number,
      slug: slugForPhase(cwd, sdkEntry),
      added: false,
      renumbered: true,
      fromNumber: insertAt,
    };
  } else {
    // CASE 2 (iterating / legacy): append features at the end; if any new module
    // was introduced, append a fresh SDK Integration phase so it gets wired + Tier-2 verified.
    let next = computeNextPhase(cwd);
    names.forEach((name) => {
      const number = next++;
      const slug = generateSlug(name);
      manifest.phases.push({ number, name, status: 'not-started' });
      ensurePhaseDir(cwd, number, slug);
      featurePhases.push({ number, name, slug });
    });
    if (newModules.length > 0) {
      const number = next++;
      const slug = 'sdk-integration';
      manifest.phases.push({ number, name: 'SDK Integration', status: 'not-started' });
      ensurePhaseDir(cwd, number, slug);
      manifest.sdkPhase = number;
      sdkIntegration = { number, slug, added: true, renumbered: false, fromNumber: sdkPhaseNum };
    }
  }

  manifest.phases.sort((a, b) => a.number - b.number);
  saveManifest(cwd, manifest);

  output({
    featurePhases,
    sdkIntegration,
    sdkPhase: manifest.sdkPhase ?? null,
    newModules,
    allModules: manifest.modules,
    newPermissions,
    firstFeatureNumber: featurePhases[0] ? featurePhases[0].number : null,
  }, flags);
}

// ── Scaffold ─────────────────────────────────

function cmdScaffold(templateName, varsJson, flags) {
  const fosHome = process.env.FOS_HOME || path.join(require('os').homedir(), '.claude', 'frontier-os-app-builder');
  const templatePath = path.join(fosHome, 'templates', templateName);

  if (!fs.existsSync(templatePath)) {
    error(`Template not found: ${templateName} (looked at ${templatePath})`);
  }

  let content = fs.readFileSync(templatePath, 'utf-8');

  // Parse vars
  let vars = {};
  if (varsJson) {
    try { vars = JSON.parse(varsJson); } catch { error(`Invalid JSON vars: ${varsJson}`); }
  }

  // Substitute {{VAR}} patterns
  for (const [key, val] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    content = content.replace(pattern, val);
  }

  if (flags.raw) {
    process.stdout.write(content);
  } else {
    output({ template: templateName, vars: Object.keys(vars), content }, flags);
  }
}

// ── Module Inference ─────────────────────────

const MODULE_KEYWORDS = {
  Wallet: {
    keywords: ['payment', 'pay', 'charge', 'pos', 'checkout', 'purchase', 'buy', 'sell',
               'transfer', 'send money', 'balance', 'funds', 'money', 'wallet', 'fnd',
               'swap', 'exchange', 'convert', 'token', 'deposit', 'on-ramp', 'fund',
               'withdraw', 'off-ramp', 'bank', 'fiat', 'subscription', 'billing', 'price',
               'cost', 'fee', 'tip', 'donate', 'donation'],
    getter: 'sdk.getWallet()',
    commonMethods: ['getBalance', 'transferFrontierDollar', 'transferOverallFrontierDollar'],
    permissions: ['wallet:getBalance', 'wallet:getAddress',
                  'wallet:transferFrontierDollar', 'wallet:transferOverallFrontierDollar']
  },
  User: {
    keywords: ['user', 'profile', 'account', 'member', 'membership', 'auth', 'login',
               'referral', 'invite', 'refer', 'signup', 'register', 'kyc', 'verify',
               'identity', 'access control', 'gate', 'permission', 'name', 'person'],
    getter: 'sdk.getUser()',
    commonMethods: ['getDetails', 'getProfile', 'getVerifiedAccessControls'],
    permissions: ['user:getDetails', 'user:getProfile', 'user:getVerifiedAccessControls']
  },
  Events: {
    keywords: ['event', 'meetup', 'gathering', 'calendar', 'schedule', 'room', 'booking',
               'reserve', 'reservation', 'space', 'venue', 'location', 'conference',
               'meeting', 'coworking'],
    getter: 'sdk.getEvents()',
    commonMethods: ['listEvents', 'createEvent', 'listLocations', 'createRoomBooking',
                    'getCryptoDepositPreflight', 'placeCryptoDeposit'],
    permissions: ['events:listEvents', 'events:createEvent', 'events:listLocations',
                  'events:listRoomBookings', 'events:createRoomBooking',
                  'events:getCryptoDepositPreflight', 'events:placeCryptoDeposit']
  },
  Communities: {
    keywords: ['community', 'group', 'team', 'club', 'internship', 'intern', 'cohort',
               'reassign', 'transfer member', 'collective', 'society'],
    getter: 'sdk.getCommunities()',
    commonMethods: ['listCommunities', 'getCommunity'],
    permissions: ['communities:listCommunities', 'communities:getCommunity']
  },
  Partnerships: {
    keywords: ['sponsor', 'partnership', 'partner', 'sponsorship', 'benefactor',
               'supporter', 'patron'],
    getter: 'sdk.getPartnerships()',
    commonMethods: ['listSponsors', 'getSponsor', 'createSponsorPass'],
    permissions: ['partnerships:listSponsors', 'partnerships:getSponsor',
                  'partnerships:createSponsorPass']
  },
  Offices: {
    keywords: ['office', 'access pass', 'building', 'door', 'entry', 'visitor',
               'check-in', 'checkin', 'physical access', 'facility'],
    getter: 'sdk.getOffices()',
    commonMethods: ['createAccessPass', 'listAccessPasses'],
    permissions: ['offices:createAccessPass', 'offices:listAccessPasses']
  },
  ThirdParty: {
    keywords: ['developer', 'api key', 'webhook', 'app registration', 'app store',
               'third party', 'integration', 'external', 'developer portal'],
    getter: 'sdk.getThirdParty()',
    commonMethods: ['listDevelopers', 'createApp', 'createWebhook'],
    permissions: ['thirdParty:listDevelopers', 'thirdParty:createApp']
  },
  Storage: {
    keywords: ['storage', 'persist', 'save', 'preferences', 'settings', 'cache',
               'remember', 'state', 'draft', 'favorites', 'bookmarks'],
    getter: 'sdk.getStorage()',
    commonMethods: ['get', 'set', 'remove', 'clear'],
    permissions: ['storage:get', 'storage:set', 'storage:remove']
  },
  Chain: {
    keywords: ['network', 'chain', 'blockchain', 'contract', 'smart contract',
               'on-chain', 'token address', 'stablecoin'],
    getter: 'sdk.getChain()',
    commonMethods: ['getCurrentNetwork', 'getContractAddresses', 'getCurrentChainConfig'],
    permissions: ['chain:getCurrentNetwork', 'chain:getContractAddresses']
  },
  Navigation: {
    keywords: ['navigate', 'deep link', 'deeplink', 'open app', 'app link',
               'cross-app', 'redirect', 'launch app', 'inter-app'],
    getter: 'sdk.getNavigation()',
    commonMethods: ['openApp', 'close', 'onDeepLink'],
    permissions: ['navigation:openApp', 'navigation:close']
  }
};

// Modules that are always included
const BASE_MODULES = ['Storage', 'Chain'];
// User is included if any user-facing feature is detected
const USER_TRIGGER_MODULES = ['Wallet', 'Events', 'Communities', 'Partnerships', 'Offices'];

function cmdInferModules(description, flags) {
  if (!description) error('Description required');

  const desc = description.toLowerCase();
  const matched = new Set(BASE_MODULES);
  const matchDetails = {};

  for (const [moduleName, config] of Object.entries(MODULE_KEYWORDS)) {
    const hits = config.keywords.filter(kw => desc.includes(kw));
    if (hits.length > 0) {
      matched.add(moduleName);
      matchDetails[moduleName] = {
        matchedKeywords: hits,
        getter: config.getter,
        suggestedMethods: config.commonMethods,
        permissions: config.permissions
      };
    }
  }

  // Add User if any user-facing module was matched
  if (USER_TRIGGER_MODULES.some(m => matched.has(m))) {
    matched.add('User');
    if (!matchDetails.User) {
      matchDetails.User = {
        matchedKeywords: ['(implied by user-facing features)'],
        getter: MODULE_KEYWORDS.User.getter,
        suggestedMethods: MODULE_KEYWORDS.User.commonMethods,
        permissions: MODULE_KEYWORDS.User.permissions
      };
    }
  }

  // Add base module details
  for (const base of BASE_MODULES) {
    if (!matchDetails[base]) {
      matchDetails[base] = {
        matchedKeywords: ['(always included)'],
        getter: MODULE_KEYWORDS[base].getter,
        suggestedMethods: MODULE_KEYWORDS[base].commonMethods,
        permissions: MODULE_KEYWORDS[base].permissions
      };
    }
  }

  // Collect all permissions
  const allPermissions = [];
  for (const mod of matched) {
    const perms = MODULE_KEYWORDS[mod]?.permissions || [];
    allPermissions.push(...perms);
  }

  output({
    description,
    modules: Array.from(matched).sort(),
    details: matchDetails,
    permissions: allPermissions,
    moduleCount: matched.size
  }, flags);
}

// ── Validation ───────────────────────────────

function cmdValidateStructure(cwd, flags) {
  const issues = [];
  const checks = [];

  // Determine verification tier from manifest sdkPhase
  const manifest = loadManifest(cwd);
  const sdkPhase = manifest && manifest.sdkPhase != null ? manifest.sdkPhase : null;
  const currentPhase = flags.phase != null && Number.isInteger(+flags.phase) ? +flags.phase : null;
  // Fallback to STATE.md phase when --phase not passed, so the Tier-2 gate works even if a caller forgets the flag
  const fallbackPhase = flags.phase == null ? (loadState(cwd)?.frontmatter?.phase ?? null) : null;
  const effectivePhase = currentPhase ?? fallbackPhase;
  // Tier 2 only when sdkPhase is set AND current phase matches sdkPhase
  const isTier2 = sdkPhase != null && effectivePhase != null && effectivePhase === sdkPhase;
  // Backward compat: if no sdkPhase in manifest, run all checks (legacy SDK-first apps)
  const isLegacy = sdkPhase == null;

  // Tier 1 required files (always checked)
  const tier1Files = [
    'src/lib/frontier-services.tsx',
    'src/views/Layout.tsx',
    'src/main.tsx',
    'src/styles/index.css',
    'vite.config.ts',
    'tsconfig.json',
    'postcss.config.js',
    'vercel.json',
    'index.html',
    'package.json'
  ];

  // Tier 2 / legacy additional required files
  const tier2Files = [
    'src/lib/sdk-context.tsx',
    'src/lib/sdk-services.tsx'
  ];

  // Legacy apps use sdk-context.tsx instead of frontier-services.tsx
  const requiredFiles = isLegacy
    ? ['src/lib/sdk-context.tsx', 'src/views/Layout.tsx', 'src/main.tsx', 'src/styles/index.css', 'vite.config.ts', 'tsconfig.json', 'postcss.config.js', 'vercel.json', 'index.html', 'package.json']
    : isTier2
      ? [...tier1Files, ...tier2Files]
      : tier1Files;

  for (const file of requiredFiles) {
    const exists = fs.existsSync(path.join(cwd, file));
    checks.push({ file, exists });
    if (!exists) issues.push(`Missing required file: ${file}`);
  }

  // CORS origin checks — Tier 2 or legacy only
  if (isLegacy || isTier2) {
    const vercelPath = path.join(cwd, 'vercel.json');
    if (fs.existsSync(vercelPath)) {
      const vercel = readFile(vercelPath);
      const origins = [
        'http://localhost:5173',
        'https://sandbox.os.frontiertower.io',
        'https://os.frontiertower.io'
      ];
      for (const origin of origins) {
        if (!vercel.includes(origin)) {
          issues.push(`vercel.json missing CORS origin: ${origin}`);
        }
      }
    }
  }

  // Layout SDK checks — Tier 2 or legacy only
  if (isLegacy || isTier2) {
    const layoutPath = path.join(cwd, 'src/views/Layout.tsx');
    if (fs.existsSync(layoutPath)) {
      const layout = readFile(layoutPath);
      if (!layout.includes('isInFrontierApp')) {
        issues.push('Layout.tsx missing isInFrontierApp() check');
      }
      if (!layout.includes('createStandaloneHTML') && !layout.includes('renderStandaloneMessage')) {
        issues.push('Layout.tsx missing standalone fallback');
      }
      if (!layout.includes('SdkProvider')) {
        issues.push('Layout.tsx missing SdkProvider wrapping');
      }
      if (!layout.includes('FrontierServicesProvider')) {
        issues.push('Layout.tsx missing FrontierServicesProvider bridge (useServices() will crash at runtime)');
      }
    }

    if ((isTier2 || isLegacy) && flags.requirePwaTest && !flags.skipPwaTest) {
      const pwaTestPath = path.join(cwd, '.frontier-app', 'PWA-TEST.md');
      if (!fs.existsSync(pwaTestPath)) {
        issues.push('Missing local PWA smoke test report: .frontier-app/PWA-TEST.md (run /fos:test-pwa)');
      } else {
        const pwaTest = readFile(pwaTestPath);
        const expectedAppId = manifest ? getPwaAppId(manifest) : null;
        const expectedAppUrl = manifest?.devPort ? `http://localhost:${manifest.devPort}` : null;
        const expectedLaunchUrl = expectedAppId ? `http://localhost:5173/apps/${expectedAppId}` : null;
        const reportedStatus = readPwaTestField(pwaTest, 'Status');
        const reportedAppId = readPwaTestField(pwaTest, 'App ID');
        const reportedAppUrl = readPwaTestField(pwaTest, 'App URL');
        const reportedLaunchUrl = readPwaTestField(pwaTest, 'Launch URL');
        const testedGitSha = readPwaTestField(pwaTest, 'Git SHA');
        const gitFreshness = validatePwaTestGitSha(cwd, testedGitSha);
        if (reportedStatus !== 'PASS') {
          issues.push('.frontier-app/PWA-TEST.md missing Status: PASS');
        }
        if (expectedAppId && reportedAppId !== expectedAppId) {
          issues.push(`.frontier-app/PWA-TEST.md App ID does not match manifest app ID: ${expectedAppId}`);
        }
        if (expectedAppUrl && reportedAppUrl !== expectedAppUrl) {
          issues.push(`.frontier-app/PWA-TEST.md App URL does not match manifest dev port: ${expectedAppUrl}`);
        }
        if (expectedLaunchUrl && reportedLaunchUrl !== expectedLaunchUrl) {
          issues.push(`.frontier-app/PWA-TEST.md Launch URL does not match manifest app ID: ${expectedLaunchUrl}`);
        }
        if (!gitFreshness.pass) {
          issues.push(`.frontier-app/PWA-TEST.md ${gitFreshness.issue}`);
        }
        const requiredPwaChecks = [
          'PWA route did not 404',
          'App iframe rendered under Frontier OS app toolbar',
          'Standalone fallback was not shown in iframe',
          'No AppHostSDK unauthorized-origin error',
          'At least one SDK-backed read completed in-frame',
        ];
        for (const check of requiredPwaChecks) {
          if (!pwaTest.includes(`- [x] ${check}`)) {
            issues.push(`.frontier-app/PWA-TEST.md missing checked checklist item: ${check}`);
          }
        }
      }
    }
  }

  // Mock layer checks — Tier 1 only (non-legacy apps)
  if (!isLegacy) {
    const servicesPath = path.join(cwd, 'src/lib/frontier-services.tsx');
    if (fs.existsSync(servicesPath)) {
      const services = readFile(servicesPath);
      if (!services.includes('useServices')) {
        issues.push('frontier-services.tsx missing useServices export');
      }
      if (!services.includes('createMockServices')) {
        issues.push('frontier-services.tsx missing createMockServices export');
      }
    }
  }

  // Check index.html has dark class
  const htmlPath = path.join(cwd, 'index.html');
  if (fs.existsSync(htmlPath)) {
    const html = readFile(htmlPath);
    if (!html.includes('class="dark"')) {
      issues.push('index.html missing class="dark" on body');
    }
  }

  // Check test setup exists
  const testSetup = path.join(cwd, 'src/test/setup.ts');
  if (!fs.existsSync(testSetup)) {
    issues.push('Missing test setup: src/test/setup.ts');
  }

  output({
    pass: issues.length === 0,
    checks,
    issues,
    checkedFiles: requiredFiles.length,
    tier: isLegacy ? 'legacy' : isTier2 ? 2 : 1
  }, flags);
  if (issues.length > 0) process.exitCode = 1;
}

function cmdValidatePermissions(cwd, flags) {
  const manifest = loadManifest(cwd);
  if (!manifest) error('.frontier-app/manifest.json not found');

  const issues = [];
  const warnings = [];
  const srcDir = path.join(cwd, 'src');

  // Determine tier
  const sdkPhase = manifest.sdkPhase != null ? manifest.sdkPhase : null;
  const currentPhase = flags.phase != null && Number.isInteger(+flags.phase) ? +flags.phase : null;
  // Fallback to STATE.md phase when --phase not passed, so the Tier-2 gate works even if a caller forgets the flag
  const fallbackPhase = flags.phase == null ? (loadState(cwd)?.frontmatter?.phase ?? null) : null;
  const effectivePhase = currentPhase ?? fallbackPhase;
  const isTier2 = sdkPhase != null && effectivePhase != null && effectivePhase === sdkPhase;
  const isLegacy = sdkPhase == null;

  // Find all SDK method calls in source (both patterns)
  const usedMethods = new Set();
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'test') {
        scanDir(path.join(dir, entry.name));
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = readFile(path.join(dir, entry.name));
        // Match sdk.getX().methodName() or getX().methodName() patterns (legacy/SDK phase)
        const sdkCalls = content.match(/\.(getWallet|getUser|getStorage|getChain|getEvents|getCommunities|getPartnerships|getOffices|getThirdParty|getNavigation)\(\)\.\w+/g);
        if (sdkCalls) sdkCalls.forEach(c => usedMethods.add(c.slice(1)));
        // Match services.module.methodName() patterns (standalone-first)
        const svcCalls = content.match(/services\.(wallet|user|storage|chain|events|communities|partnerships|offices|thirdParty|navigation)\.\w+/g);
        if (svcCalls) {
          svcCalls.forEach(c => {
            // Convert services.wallet.getBalance to getWallet().getBalance
            const parts = c.replace('services.', '').split('.');
            const moduleMap = { wallet: 'getWallet', user: 'getUser', storage: 'getStorage', chain: 'getChain', events: 'getEvents', communities: 'getCommunities', partnerships: 'getPartnerships', offices: 'getOffices', thirdParty: 'getThirdParty', navigation: 'getNavigation' };
            if (moduleMap[parts[0]] && parts[1]) {
              usedMethods.add(`${moduleMap[parts[0]]}().${parts[1]}`);
            }
          });
        }
      }
    }
  }
  scanDir(srcDir);

  // Map method calls to required permissions
  const methodToPermission = {};
  for (const [mod, config] of Object.entries(MODULE_KEYWORDS)) {
    for (const perm of config.permissions) {
      const parts = perm.split(':');
      methodToPermission[`${config.getter.replace('sdk.', '')}.${parts[1]}`] = perm;
    }
  }

  // Check each used method has a corresponding permission
  const declaredPerms = new Set(manifest.permissions || []);
  const missingPerms = [];
  for (const method of usedMethods) {
    // Try to find matching permission
    for (const [pattern, perm] of Object.entries(methodToPermission)) {
      if (method === pattern && !declaredPerms.has(perm)) {
        missingPerms.push({ method, permission: perm });
      }
    }
  }

  if (missingPerms.length > 0) {
    if (isLegacy || isTier2) {
      // Legacy or SDK Integration phase: missing permissions are errors
      issues.push(...missingPerms.map(m => `SDK method ${m.method} used but permission ${m.permission} not in manifest`));
    } else {
      // Feature phases: missing permissions are warnings only
      warnings.push(...missingPerms.map(m => `Service method ${m.method} used — permission ${m.permission} should be in manifest for SDK Integration`));
    }
  }

  output({
    pass: issues.length === 0,
    declaredPermissions: manifest.permissions,
    usedMethods: Array.from(usedMethods),
    issues,
    warnings,
    missingPermissions: missingPerms,
    tier: isLegacy ? 'legacy' : isTier2 ? 2 : 1
  }, flags);
  if (issues.length > 0) process.exitCode = 1;
}

// ── Init (Compound Context Loaders) ──────────

function cmdInit(workflow, phaseArg, flags) {
  const cwd = process.cwd();

  switch (workflow) {
    case 'new-app': {
      const exists = fosExists(cwd);
      const hasGit = fs.existsSync(path.join(cwd, '.git'));
      const templateHome = process.env.FOS_HOME || path.join(require('os').homedir(), '.claude', 'frontier-os-app-builder');
      output({
        project_exists: exists,
        has_git: hasGit,
        cwd,
        template_home: templateHome,
        version: VERSION
      }, flags);
      break;
    }

    case 'discuss': {
      if (!phaseArg) error('Phase number required for discuss init');
      if (!fosExists(cwd)) error('.frontier-app/ not found. Run /fos:new-app first.');
      const manifest = loadManifest(cwd);
      const state = loadState(cwd);
      const phaseDir = findPhaseDir(cwd, phaseArg);
      const hasContext = phaseDir && fs.existsSync(path.join(phaseDir, `${String(phaseArg).padStart(2, '0')}-CONTEXT.md`));
      const roadmap = readFile(path.join(fosDir(cwd), 'ROADMAP.md'));

      output({
        phase: parseInt(phaseArg),
        phase_dir: phaseDir,
        has_context: hasContext,
        manifest,
        state: state?.frontmatter || {},
        roadmap_path: path.join(fosDir(cwd), 'ROADMAP.md'),
        project_path: path.join(fosDir(cwd), 'PROJECT.md'),
        version: VERSION
      }, flags);
      break;
    }

    case 'plan': {
      if (!phaseArg) error('Phase number required for plan init');
      if (!fosExists(cwd)) error('.frontier-app/ not found. Run /fos:new-app first.');
      const manifest = loadManifest(cwd);
      const state = loadState(cwd);
      const phaseDir = findPhaseDir(cwd, phaseArg);
      const prefix = String(phaseArg).padStart(2, '0');
      const hasContext = phaseDir && fs.existsSync(path.join(phaseDir, `${prefix}-CONTEXT.md`));
      const hasResearch = phaseDir && fs.existsSync(path.join(phaseDir, `${prefix}-RESEARCH.md`));
      const existingPlans = phaseDir ? listPlans(phaseDir) : [];

      output({
        phase: parseInt(phaseArg),
        phase_dir: phaseDir,
        has_context: hasContext,
        has_research: hasResearch,
        existing_plans: existingPlans,
        manifest,
        state: state?.frontmatter || {},
        project_path: path.join(fosDir(cwd), 'PROJECT.md'),
        roadmap_path: path.join(fosDir(cwd), 'ROADMAP.md'),
        template_home: process.env.FOS_HOME || path.join(require('os').homedir(), '.claude', 'frontier-os-app-builder'),
        version: VERSION
      }, flags);
      break;
    }

    case 'execute': {
      if (!phaseArg) error('Phase number required for execute init');
      if (!fosExists(cwd)) error('.frontier-app/ not found. Run /fos:new-app first.');
      const manifest = loadManifest(cwd);
      const state = loadState(cwd);
      const phaseDir = findPhaseDir(cwd, phaseArg);
      const plans = phaseDir ? listPlans(phaseDir) : [];
      const summaries = phaseDir ? listSummaries(phaseDir) : [];
      const completedPlanIds = summaries.map(s => s.replace('-SUMMARY.md', ''));
      const incompletePlans = plans.filter(p => !completedPlanIds.includes(p.replace('-PLAN.md', '')));

      output({
        phase: parseInt(phaseArg),
        phase_dir: phaseDir,
        plans,
        summaries,
        incomplete_plans: incompletePlans,
        all_complete: incompletePlans.length === 0,
        manifest,
        state: state?.frontmatter || {},
        project_path: path.join(fosDir(cwd), 'PROJECT.md'),
        roadmap_path: path.join(fosDir(cwd), 'ROADMAP.md'),
        template_home: process.env.FOS_HOME || path.join(require('os').homedir(), '.claude', 'frontier-os-app-builder'),
        version: VERSION
      }, flags);
      break;
    }

    case 'ship': {
      if (!fosExists(cwd)) error('.frontier-app/ not found. Run /fos:new-app first.');
      const manifest = loadManifest(cwd);
      const state = loadState(cwd);
      const roadmap = readFile(path.join(fosDir(cwd), 'ROADMAP.md'));

      // Check if all phases have verifications
      const phasesDir = path.join(fosDir(cwd), 'phases');
      let allVerified = true;
      if (fs.existsSync(phasesDir)) {
        for (const entry of fs.readdirSync(phasesDir)) {
          const phaseNum = entry.split('-')[0];
          const verifPath = path.join(phasesDir, entry, `${phaseNum}-VERIFICATION.md`);
          if (!fs.existsSync(verifPath)) {
            allVerified = false;
            break;
          }
        }
      }

      output({
        manifest,
        state: state?.frontmatter || {},
        all_verified: allVerified,
        project_path: path.join(fosDir(cwd), 'PROJECT.md'),
        roadmap_path: path.join(fosDir(cwd), 'ROADMAP.md'),
        version: VERSION
      }, flags);
      break;
    }

    default:
      error(`Unknown init workflow: ${workflow}. Valid: new-app, discuss, plan, execute, ship`);
  }
}

// ── Commit Helper ────────────────────────────

function cmdCommit(message, files, flags) {
  if (!message) error('Commit message required');
  try {
    if (files && files.length > 0) {
      execSync(`git add ${files.map(f => `"${f}"`).join(' ')}`, { stdio: 'pipe' });
    }
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    output({ committed: true, hash, message }, flags);
  } catch (e) {
    error(`Git commit failed: ${e.message}`);
  }
}

// ── Main Router ──────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const flags = { raw: false, pick: null, phase: null, skipPwaTest: false, requirePwaTest: false };

  // Extract flags
  const cleanArgs = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--raw') { flags.raw = true; }
    else if (args[i] === '--pick' && args[i + 1]) { flags.pick = args[++i]; }
    else if (args[i] === '--phase' && args[i + 1]) { flags.phase = args[++i]; }
    else if (args[i] === '--skip-pwa-test') { flags.skipPwaTest = true; }
    else if (args[i] === '--require-pwa-test') { flags.requirePwaTest = true; }
    else { cleanArgs.push(args[i]); }
  }

  const [command, ...rest] = cleanArgs;

  if (!command || command === 'help') {
  console.log(`FOS Tools v${VERSION} — Frontier OS App Builder CLI

Usage: node fos-tools.cjs <command> [args] [--raw] [--pick <field>]

Commands:
  init <workflow> [phase]          Compound context loader
  state load                       Load STATE.md
  state json                       STATE.md frontmatter as JSON
  state update <field> <value>     Update STATE.md field
  state get <field>                Get STATE.md field
  find-phase <N>                   Find phase directory by number
  next-phase                       Print the next phase number (max existing + 1)
  add-phases --names '[..]'        Add feature phase(s), keep SDK Integration last
  scaffold <template> [--vars '{}'] Render template with variable substitution
  infer-modules "<description>"    Map description to SDK modules
  validate structure               Check app structure matches spec
  validate permissions             Check permissions match SDK usage
  pwa-local info                   Show local Frontier PWA test metadata
  pwa-local snippet                Print AppMetadata registry entry
  pwa-local write                  Add/update current app in PWA external registry
  pwa-local restore                Remove builder-managed PWA registry entry
  commit "<message>" [--files ...] Git add + commit helper
  version                          Show version
`);
    return;
  }

  const cwd = process.cwd();

  switch (command) {
    case 'version':
      output(flags.raw ? VERSION : { version: VERSION }, flags);
      break;

    case 'init':
      cmdInit(rest[0], rest[1], flags);
      break;

    case 'state':
      switch (rest[0]) {
        case 'load': cmdStateLoad(cwd, flags); break;
        case 'json': cmdStateJson(cwd, flags); break;
        case 'update': cmdStateUpdate(cwd, rest[1], rest[2], flags); break;
        case 'get': cmdStateGet(cwd, rest[1], flags); break;
        default: error('Unknown state subcommand. Valid: load, json, update, get');
      }
      break;

    case 'find-phase':
      cmdFindPhase(cwd, rest[0], flags);
      break;

    case 'next-phase':
      cmdNextPhase(cwd, flags);
      break;

    case 'add-phases':
      cmdAddPhases(cwd, rest, flags);
      break;

    case 'scaffold': {
      const varsIdx = rest.indexOf('--vars');
      const varsJson = varsIdx >= 0 ? rest[varsIdx + 1] : null;
      cmdScaffold(rest[0], varsJson, flags);
      break;
    }

    case 'infer-modules':
      cmdInferModules(rest.join(' '), flags);
      break;

    case 'validate':
      switch (rest[0]) {
        case 'structure': cmdValidateStructure(cwd, flags); break;
        case 'permissions': cmdValidatePermissions(cwd, flags); break;
        default: error('Unknown validate subcommand. Valid: structure, permissions');
      }
      break;

    case 'pwa-local':
      cmdPwaLocal(cwd, rest[0], rest.slice(1), flags);
      break;

    case 'commit': {
      const filesIdx = rest.indexOf('--files');
      const files = filesIdx >= 0 ? rest.slice(filesIdx + 1) : [];
      cmdCommit(rest[0], files, flags);
      break;
    }

    case 'sdk-ref': {
      const modulesIdx = rest.indexOf('--modules');
      if (modulesIdx < 0 || !rest[modulesIdx + 1]) {
        error('sdk-ref requires --modules <Module1,Module2,...>');
      }
      const modules = rest[modulesIdx + 1].split(',').map(m => m.trim().toLowerCase());
      const fosHome = process.env.FOS_HOME || path.join(require('os').homedir(), '.claude', 'frontier-os-app-builder');
      const sdkDir = path.join(fosHome, 'references', 'sdk');
      const always = ['init', 'types'];
      const allFiles = [...always, ...modules];
      const parts = [];
      for (const f of allFiles) {
        const fp = path.join(sdkDir, `${f}.md`);
        if (!fs.existsSync(fp)) {
          error(`SDK reference file not found: ${fp}`);
        }
        parts.push(fs.readFileSync(fp, 'utf-8'));
      }
      const content = parts.join('\n\n---\n\n');
      const tmpPath = path.join(require('os').tmpdir(), `fos-sdk-ref-${Date.now()}.md`);
      fs.writeFileSync(tmpPath, content);
      console.log(`@file:${tmpPath}`);
      break;
    }

    default:
      error(`Unknown command: ${command}. Run 'node fos-tools.cjs help' for usage.`);
  }
}

main();
