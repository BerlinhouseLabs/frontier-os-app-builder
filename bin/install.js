#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// Frontier OS App Builder — Installer
// Copies commands, agents, workflows, references,
// and templates into ~/.claude/
// ─────────────────────────────────────────────

const VERSION = '1.2.0';
const PRODUCT = 'frontier-os-app-builder';

// Source: this repo
const SRC_ROOT = path.resolve(__dirname, '..');

// Target: ~/.claude/
const CLAUDE_HOME = path.join(require('os').homedir(), '.claude');
const FOS_HOME = path.join(CLAUDE_HOME, PRODUCT);

// Manifest tracking file
const MANIFEST_PATH = path.join(FOS_HOME, 'fos-file-manifest.json');

// ── Helpers ──────────────────────────────────

function log(msg) { console.log(`  ${msg}`); }
function success(msg) { console.log(`\x1b[32m  ✓\x1b[0m ${msg}`); }
function warn(msg) { console.log(`\x1b[33m  !\x1b[0m ${msg}`); }
function err(msg) { console.error(`\x1b[31m  ✗\x1b[0m ${msg}`); }

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  return dest;
}

function copyDir(srcDir, destDir) {
  const copied = [];
  if (!fs.existsSync(srcDir)) return copied;

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copied.push(...copyDir(srcPath, destPath));
    } else if (entry.isFile()) {
      copyFile(srcPath, destPath);
      copied.push(destPath);
    }
  }
  return copied;
}

function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

function removeDirIfEmpty(dir) {
  if (fs.existsSync(dir)) {
    const entries = fs.readdirSync(dir);
    if (entries.length === 0) {
      fs.rmdirSync(dir);
      return true;
    }
  }
  return false;
}

// ── Install ──────────────────────────────────

function install() {
  console.log(`\n\x1b[1mFrontier OS App Builder v${VERSION}\x1b[0m\n`);

  // Check ~/.claude/ exists
  if (!fs.existsSync(CLAUDE_HOME)) {
    err(`~/.claude/ not found. Is Claude Code installed?`);
    process.exit(1);
  }

  const installedFiles = [];

  // 1. Commands → ~/.claude/commands/fos/
  log('Installing commands...');
  const cmdSrc = path.join(SRC_ROOT, 'commands', 'fos');
  const cmdDest = path.join(CLAUDE_HOME, 'commands', 'fos');
  const cmdFiles = copyDir(cmdSrc, cmdDest);
  installedFiles.push(...cmdFiles);
  success(`${cmdFiles.length} commands → ~/.claude/commands/fos/`);

  // 2. Agents → ~/.claude/agents/
  log('Installing agents...');
  const agentSrc = path.join(SRC_ROOT, 'agents');
  const agentDest = path.join(CLAUDE_HOME, 'agents');
  let agentCount = 0;
  if (fs.existsSync(agentSrc)) {
    for (const file of fs.readdirSync(agentSrc)) {
      if (file.startsWith('fos-') && file.endsWith('.md')) {
        const dest = copyFile(path.join(agentSrc, file), path.join(agentDest, file));
        installedFiles.push(dest);
        agentCount++;
      }
    }
  }
  success(`${agentCount} agents → ~/.claude/agents/`);

  // 3. Workflows → ~/.claude/frontier-os-app-builder/workflows/
  log('Installing workflows...');
  const wfSrc = path.join(SRC_ROOT, 'workflows');
  const wfDest = path.join(FOS_HOME, 'workflows');
  const wfFiles = copyDir(wfSrc, wfDest);
  installedFiles.push(...wfFiles);
  success(`${wfFiles.length} workflows → ~/.claude/${PRODUCT}/workflows/`);

  // 4. References → ~/.claude/frontier-os-app-builder/references/
  log('Installing references...');
  const refSrc = path.join(SRC_ROOT, 'references');
  const refDest = path.join(FOS_HOME, 'references');
  const refFiles = copyDir(refSrc, refDest);
  installedFiles.push(...refFiles);
  success(`${refFiles.length} references → ~/.claude/${PRODUCT}/references/`);

  // 5. Templates → ~/.claude/frontier-os-app-builder/templates/
  log('Installing templates...');
  const tplSrc = path.join(SRC_ROOT, 'templates');
  const tplDest = path.join(FOS_HOME, 'templates');
  const tplFiles = copyDir(tplSrc, tplDest);
  installedFiles.push(...tplFiles);
  success(`${tplFiles.length} templates → ~/.claude/${PRODUCT}/templates/`);

  // 6. CLI tool → ~/.claude/frontier-os-app-builder/bin/
  log('Installing CLI tool...');
  const binSrc = path.join(SRC_ROOT, 'bin', 'fos-tools.cjs');
  const binDest = path.join(FOS_HOME, 'bin', 'fos-tools.cjs');
  if (fs.existsSync(binSrc)) {
    copyFile(binSrc, binDest);
    installedFiles.push(binDest);
    success(`CLI tool → ~/.claude/${PRODUCT}/bin/fos-tools.cjs`);
  }

  // 7. Write manifest (record its own path first so uninstall removes it)
  installedFiles.push(MANIFEST_PATH);
  const manifest = {
    version: VERSION,
    installed_at: new Date().toISOString(),
    files: installedFiles
  };
  ensureDir(path.dirname(MANIFEST_PATH));
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  // Summary
  console.log(`\n\x1b[32m  ✓ Installed ${installedFiles.length} files\x1b[0m\n`);
  console.log(`  Usage:\n`);
  console.log(`    1. Create a directory for your new app`);
  console.log(`    2. Run: /fos:new-app "your app description"`);
  console.log(`    3. Follow the guided workflow\n`);
  console.log(`  Commands: /fos:new-app, /fos:discuss, /fos:plan, /fos:execute,`);
  console.log(`            /fos:test-pwa, /fos:ship, /fos:new-milestone,`);
  console.log(`            /fos:add-feature,`);
  console.log(`            /fos:next, /fos:status\n`);
}

// ── Uninstall ────────────────────────────────

function uninstall() {
  console.log(`\n\x1b[1mUninstalling Frontier OS App Builder\x1b[0m\n`);

  let removed = 0;

  // Load manifest
  if (fs.existsSync(MANIFEST_PATH)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    for (const file of manifest.files) {
      if (removeFile(file)) removed++;
    }
  }

  // Clean up directories (deepest-first: prune child dirs before their parents)
  const dirsToClean = [
    path.join(CLAUDE_HOME, 'commands', 'fos'),
    path.join(FOS_HOME, 'workflows'),
    path.join(FOS_HOME, 'references', 'sdk'),
    path.join(FOS_HOME, 'references'),
    path.join(FOS_HOME, 'templates', 'app', 'public'),
    path.join(FOS_HOME, 'templates', 'app'),
    path.join(FOS_HOME, 'templates', 'state'),
    path.join(FOS_HOME, 'templates'),
    path.join(FOS_HOME, 'bin'),
    FOS_HOME
  ];

  for (const dir of dirsToClean) {
    removeDirIfEmpty(dir);
  }

  // Remove agent files
  const agentDir = path.join(CLAUDE_HOME, 'agents');
  if (fs.existsSync(agentDir)) {
    for (const file of fs.readdirSync(agentDir)) {
      if (file.startsWith('fos-') && file.endsWith('.md')) {
        if (removeFile(path.join(agentDir, file))) removed++;
      }
    }
  }

  console.log(`\x1b[32m  ✓ Removed ${removed} files\x1b[0m\n`);
}

// ── Main ─────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes('--uninstall')) {
  uninstall();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Frontier OS App Builder Installer

Usage:
  node install.js              Install to ~/.claude/
  node install.js --uninstall  Remove from ~/.claude/
  node install.js --help       Show this help
`);
} else {
  install();
}
