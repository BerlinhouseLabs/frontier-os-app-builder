#!/usr/bin/env node

import { resolve, dirname, join } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { createConnection } from 'node:net';

const args = process.argv.slice(2);

let port = 4983;
let targetPath = null;
let workspaceRoot = null;
let host = '127.0.0.1';

// Parse args
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error(`Error: invalid port "${args[i + 1]}" — must be between 1 and 65535`);
      process.exit(1);
    }
    i++;
  } else if (args[i] === '--workspace' && args[i + 1]) {
    workspaceRoot = resolve(args[i + 1]);
    i++;
  } else if (args[i] === '--host' && args[i + 1]) {
    host = args[i + 1];
    i++;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
  Frontier Studio — Live preview companion for Frontier OS apps

  Usage:
    frontier-studio [path]              Open studio on a specific app directory
    frontier-studio                     Open the picker for all apps in cwd's parent
    frontier-studio --workspace <dir>   Use <dir> as workspace root for the picker

  Options:
    path                Path to a Frontier OS app (defaults to the picker mode)
    --workspace <dir>   Directory to scan for apps (default: parent of cwd)
    --port <n>          Studio port (default: 4983)
    --host <addr>       Bind address (default: 127.0.0.1, loopback only).
                        Pass e.g. 0.0.0.0 to expose Studio on your LAN —
                        only do this on a network you trust.
    -h, --help          Show this help

  Run this alongside Claude Code to see a live dashboard and preview
  of your Frontier OS app as it's being built.
`);
    process.exit(0);
  } else if (!args[i].startsWith('-')) {
    targetPath = resolve(args[i]);
  }
}

// Figure out workspace root + initial app.
//
// Three launch modes:
//   1. `frontier-studio /path/to/app`       → workspace = parent of that path, auto-select app
//   2. `frontier-studio` inside an app dir  → workspace = parent of cwd, auto-select cwd
//   3. `frontier-studio` outside an app dir → workspace = cwd, show picker
//
// `--workspace` always overrides the inferred workspace root.

let initialAppDir = null;

function isFrontierApp(dir) {
  try {
    return statSync(join(dir, '.frontier-app', 'manifest.json')).isFile();
  } catch {
    return false;
  }
}

if (targetPath) {
  if (!existsSync(targetPath)) {
    console.error(`Error: directory not found: ${targetPath}`);
    process.exit(1);
  }
  try {
    if (!statSync(targetPath).isDirectory()) {
      console.error(`Error: not a directory: ${targetPath}`);
      process.exit(1);
    }
  } catch {
    console.error(`Error: cannot access: ${targetPath}`);
    process.exit(1);
  }

  if (isFrontierApp(targetPath)) {
    initialAppDir = targetPath;
    if (!workspaceRoot) workspaceRoot = dirname(targetPath);
  } else {
    // Given a directory that isn't an app itself — treat it as a workspace root
    if (!workspaceRoot) workspaceRoot = targetPath;
  }
} else {
  const cwd = process.cwd();
  if (isFrontierApp(cwd)) {
    initialAppDir = cwd;
    if (!workspaceRoot) workspaceRoot = dirname(cwd);
  } else {
    if (!workspaceRoot) workspaceRoot = cwd;
  }
}

if (!workspaceRoot || !existsSync(workspaceRoot)) {
  console.error(`Error: workspace root does not exist: ${workspaceRoot}`);
  process.exit(1);
}

// Find available port
async function findPort(startPort) {
  for (let p = startPort; p < startPort + 10; p++) {
    const available = await new Promise((res) => {
      const socket = createConnection({ port: p, host: '127.0.0.1' }, () => {
        socket.destroy();
        res(false);
      });
      socket.on('error', () => {
        socket.destroy();
        res(true);
      });
      socket.setTimeout(500, () => {
        socket.destroy();
        res(true);
      });
    });
    if (available) return p;
  }
  console.error(`Error: no available port in range ${startPort}-${startPort + 9}`);
  process.exit(1);
}

async function main() {
  port = await findPort(port);

  if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') {
    console.warn(
      `\n  Warning: Frontier Studio will bind to ${host} (non-loopback).\n` +
        `  It exposes a terminal that can run commands on this machine — only use\n` +
        `  --host on a network you trust, and prefer an SSH tunnel for remote access.\n`,
    );
  }

  const { startStudio } = await import('../dist/server/index.js');
  const studio = await startStudio({ workspaceRoot, initialAppDir, port, host });

  // Auto-open browser. When bound to all interfaces, localhost still reaches
  // the server; for a specific bind address, open that address directly.
  try {
    const open = (await import('open')).default;
    const browserHost = host === '0.0.0.0' || host === '::' ? 'localhost' : host;
    await open(`http://${browserHost}:${port}`);
  } catch {
    // open is optional
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down Frontier Studio...');
    await studio.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start Frontier Studio:', err.message);
  process.exit(1);
});
