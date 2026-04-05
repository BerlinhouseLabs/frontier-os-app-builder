#!/usr/bin/env node

import { resolve } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { createConnection } from 'node:net';

const args = process.argv.slice(2);

let port = 4983;
let appDir = process.cwd();

// Parse args
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error(`Error: invalid port "${args[i + 1]}" — must be between 1 and 65535`);
      process.exit(1);
    }
    i++;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
  Frontier Studio — Live preview companion for Frontier OS apps

  Usage:
    frontier-studio [path] [--port <port>]

  Options:
    path          Path to Frontier OS app directory (default: current directory)
    --port <n>    Studio port (default: 4983)
    -h, --help    Show this help

  Run this alongside Claude Code to see a live dashboard and preview
  of your Frontier OS app as it's being built.
`);
    process.exit(0);
  } else if (!args[i].startsWith('-')) {
    appDir = resolve(args[i]);
  }
}

// Validate appDir
if (!existsSync(appDir)) {
  console.error(`Error: directory not found: ${appDir}`);
  process.exit(1);
}
try {
  if (!statSync(appDir).isDirectory()) {
    console.error(`Error: not a directory: ${appDir}`);
    process.exit(1);
  }
} catch {
  console.error(`Error: cannot access: ${appDir}`);
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

  const { startStudio } = await import('../dist/server/index.js');
  const studio = await startStudio({ appDir, port });

  // Auto-open browser
  try {
    const open = (await import('open')).default;
    await open(`http://localhost:${port}`);
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
