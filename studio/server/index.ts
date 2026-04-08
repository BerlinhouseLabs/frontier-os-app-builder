import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, type WebSocket } from 'ws';
import { parseProjectState, type ProjectState, type ParseError } from './parser.js';
import { StateWatcher } from './watcher.js';
import { ViteManager, type ViteStatus } from './vite-manager.js';
import { ActivityTracker } from './activity.js';
import { PtyManager } from './pty-manager.js';
import { discoverApps } from './app-discovery.js';
import type { ActivityEvent, AppSummary } from '../shared/types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

export interface StudioOptions {
  /** Directory to scan for Frontier OS apps. */
  workspaceRoot: string;
  /** Optional: auto-select this app on startup. If omitted, the picker is shown. */
  initialAppDir?: string | null;
  port: number;
}

export async function startStudio(opts: StudioOptions): Promise<{ close: () => Promise<void> }> {
  const { workspaceRoot, port } = opts;
  const clientDir = join(__dirname, '..', 'client');

  // --- Current-app state (swappable) ---
  let appDir: string | null = null;
  let currentState: ProjectState | null = null;
  let currentErrors: ParseError[] = [];
  let currentViteStatus: ViteStatus = 'stopped';
  let currentViteError: string | undefined;
  let viteManager: ViteManager | null = null;
  let watcher: StateWatcher | null = null;
  const activity = new ActivityTracker();

  const clients = new Set<WebSocket>();

  // --- Broadcast helpers ---
  function broadcast(msg: object): void {
    const data = JSON.stringify(msg);
    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    }
  }

  function broadcastState(): void {
    if (currentState) {
      broadcast({ type: 'state', data: currentState });
    } else if (appDir) {
      broadcast({ type: 'waiting' });
    } else {
      broadcast({ type: 'no-app' });
    }
    if (currentErrors.length > 0) {
      broadcast({ type: 'error', errors: currentErrors });
    }
  }

  function broadcastVite(): void {
    broadcast({ type: 'vite', status: currentViteStatus, error: currentViteError });
  }

  async function sendApps(ws?: WebSocket): Promise<void> {
    const apps = await discoverApps(workspaceRoot);
    const msg = JSON.stringify({ type: 'apps', apps, workspaceRoot });
    if (ws) {
      if (ws.readyState === ws.OPEN) ws.send(msg);
    } else {
      broadcast({ type: 'apps', apps, workspaceRoot });
    }
  }

  // --- State refresh (reads current appDir) ---
  async function refreshState(): Promise<void> {
    if (!appDir) {
      currentState = null;
      currentErrors = [];
      broadcastState();
      return;
    }

    const prevState = currentState;
    const result = await parseProjectState(appDir);
    currentState = result.state;
    currentErrors = result.errors;

    for (const err of result.errors) {
      console.warn(`  [parse] ${err.file}: ${err.message}`);
    }

    activity.diffStates(prevState, currentState);

    broadcastState();

    if (currentState && viteManager) {
      viteManager.updatePort(currentState.devPort);
    }
  }

  // --- Vite manager lifecycle ---
  async function initViteManager(devPort: number): Promise<void> {
    if (viteManager || !appDir) return;

    const capturedAppDir = appDir;
    viteManager = new ViteManager({
      appDir: capturedAppDir,
      port: devPort,
      onStatusChange: (status, error) => {
        // Guard against callbacks arriving after the app was swapped.
        if (appDir !== capturedAppDir) return;
        const prevStatus = currentViteStatus;
        currentViteStatus = status;
        currentViteError = error;
        broadcastVite();

        if (prevStatus !== status) {
          if (status === 'running') {
            activity.push({ type: 'vite_event', message: 'Dev server ready' });
          } else if (status === 'error') {
            activity.push({ type: 'vite_event', message: `Dev server error: ${error || 'unknown'}` });
          } else if (status === 'starting') {
            activity.push({ type: 'vite_event', message: 'Starting dev server...' });
          }
        }
      },
      onPortDetected: (p) => {
        if (appDir !== capturedAppDir) return;
        if (currentState && currentState.devPort !== p) {
          currentState = { ...currentState, devPort: p };
          broadcastState();
          activity.push({ type: 'vite_event', message: `Dev server on port ${p}` });
        }
      },
    });

    await viteManager.start();
  }

  // --- Activity event forwarding (batched) ---
  let activityBatch: ActivityEvent[] = [];
  let activityBatchTimer: ReturnType<typeof setTimeout> | null = null;

  activity.onEvent((events) => {
    activityBatch.push(...events);
    if (!activityBatchTimer) {
      activityBatchTimer = setTimeout(() => {
        broadcast({ type: 'activity', events: activityBatch });
        activityBatch = [];
        activityBatchTimer = null;
      }, 100);
    }
  });

  // --- Watcher lifecycle ---
  function createWatcherFor(dir: string): StateWatcher {
    return new StateWatcher({
      appDir: dir,
      onStateChange: async () => {
        if (appDir !== dir) return;
        await refreshState();

        if (currentState && !viteManager) {
          await initViteManager(currentState.devPort);
        }

        if (viteManager && currentViteStatus === 'stopped') {
          const check = viteManager.canStart();
          if (check.ok) {
            await viteManager.start();
          }
        }
      },
      onAppFound: async () => {
        if (appDir !== dir) return;
        await refreshState();
        if (currentState) {
          await initViteManager(currentState.devPort);
        }
      },
      onFileActivity: (type, path) => {
        if (appDir !== dir) return;
        activity.push({ type, message: path });
      },
      onGitCommit: (message) => {
        if (appDir !== dir) return;
        activity.push({ type: 'git_commit', message });
      },
    });
  }

  // --- App swap ---
  async function swapApp(newAppDir: string | null): Promise<void> {
    // Tear down current
    if (watcher) {
      try { await watcher.stop(); } catch { /* ignore */ }
      watcher = null;
    }
    if (viteManager) {
      try { await viteManager.stop(); } catch { /* ignore */ }
      viteManager = null;
    }

    // Reset ephemeral state
    activity.clear();
    currentState = null;
    currentErrors = [];
    currentViteStatus = 'stopped';
    currentViteError = undefined;
    appDir = newAppDir;

    // Notify clients — they'll remount terminal panes and clear their own caches.
    broadcast({ type: 'app-changed', appDir });
    broadcastVite();

    if (appDir) {
      watcher = createWatcherFor(appDir);
      watcher.start();
      await refreshState();
      if (currentState) {
        initViteManager((currentState as ProjectState).devPort).catch(() => {});
      }
    } else {
      broadcastState();
      await sendApps();
    }
  }

  // --- HTTP server ---
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url || '/';

    if (url === '/api/state') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        appDir,
        state: currentState,
        viteStatus: currentViteStatus,
        viteError: currentViteError,
        errors: currentErrors,
      }));
      return;
    }

    const filePath = url === '/' ? '/index.html' : url;
    const fullPath = join(clientDir, filePath);

    if (!fullPath.startsWith(clientDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    try {
      const content = await readFile(fullPath);
      const ext = extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(content);
    } catch {
      try {
        const index = await readFile(join(clientDir, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(index);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    }
  });

  // --- WebSocket server ---
  const wss = new WebSocketServer({ server, maxPayload: 1024 * 1024 });

  wss.on('connection', (ws) => {
    clients.add(ws);

    // One PTY per ws connection, lazily started.
    let pty: PtyManager | null = null;

    // Initial snapshot
    if (appDir && currentState) {
      ws.send(JSON.stringify({ type: 'state', data: currentState }));
    } else if (appDir) {
      ws.send(JSON.stringify({ type: 'waiting' }));
    } else {
      ws.send(JSON.stringify({ type: 'no-app' }));
    }
    if (currentErrors.length > 0) {
      ws.send(JSON.stringify({ type: 'error', errors: currentErrors }));
    }
    ws.send(JSON.stringify({ type: 'vite', status: currentViteStatus, error: currentViteError }));

    // Send current app dir so terminals know where to spawn
    ws.send(JSON.stringify({ type: 'app-changed', appDir }));

    // Activity history
    const history = activity.getRecent(20);
    if (history.length > 0) {
      ws.send(JSON.stringify({ type: 'activity-history', events: history }));
    }

    // Always send the apps list so the picker is populated
    sendApps(ws).catch(() => { /* ignore */ });

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'list-apps') {
          await sendApps(ws);
        }
        if (msg.type === 'select-app' && typeof msg.path === 'string') {
          await swapApp(msg.path);
        }
        if (msg.type === 'back-to-apps') {
          await swapApp(null);
        }
        if (msg.type === 'restart-vite' && viteManager) {
          await viteManager.restart();
        }
        if (msg.type === 'request-vite-logs' && viteManager) {
          ws.send(JSON.stringify({ type: 'vite-logs', lines: viteManager.getBuffer() }));
        }
        if (msg.type === 'write-context' && typeof msg.content === 'string') {
          try {
            await writeFile(join(workspaceRoot, '.frontier-studio-context.md'), msg.content, 'utf-8');
            ws.send(JSON.stringify({ type: 'context-written' }));
          } catch (err) {
            ws.send(JSON.stringify({ type: 'context-error', message: err instanceof Error ? err.message : String(err) }));
          }
        }
        if (msg.type === 'pty-start') {
          if (pty) return;
          const ptyDir = appDir || workspaceRoot;
          pty = new PtyManager({
            appDir: ptyDir,
            cols: typeof msg.cols === 'number' ? msg.cols : 80,
            rows: typeof msg.rows === 'number' ? msg.rows : 24,
            onData: (data) => {
              if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: 'pty-data', data }));
              }
            },
            onExit: (code, signal) => {
              if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: 'pty-exit', code, signal }));
              }
              pty = null;
            },
          });
          try {
            const info = pty.start();
            ws.send(JSON.stringify({ type: 'pty-started', command: info.command, args: info.args }));
          } catch (err) {
            ws.send(JSON.stringify({
              type: 'pty-error',
              message: err instanceof Error ? err.message : String(err),
            }));
            pty = null;
          }
        }
        if (msg.type === 'pty-input' && pty && typeof msg.data === 'string') {
          pty.write(msg.data);
        }
        if (msg.type === 'pty-resize' && pty) {
          pty.resize(Number(msg.cols) || 80, Number(msg.rows) || 24);
        }
        if (msg.type === 'pty-kill' && pty) {
          pty.kill();
          pty = null;
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      if (pty) {
        pty.kill();
        pty = null;
      }
    });
  });

  // --- Start everything ---
  if (opts.initialAppDir) {
    appDir = opts.initialAppDir;
    watcher = createWatcherFor(appDir);
    watcher.start();
    await refreshState();
  }

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`\n  Frontier Studio running at http://localhost:${port}\n`);
      console.log(`  Workspace root: ${workspaceRoot}`);
      if (appDir) {
        console.log(`  Initial app:    ${appDir}\n`);
      } else {
        console.log('  No app selected — showing picker\n');
      }

      if (appDir && currentState) {
        initViteManager((currentState as ProjectState).devPort).catch(() => {});
      }

      resolve({
        close: async () => {
          if (activityBatchTimer) clearTimeout(activityBatchTimer);
          if (watcher) await watcher.stop();
          if (viteManager) await viteManager.stop();
          wss.close();
          server.close();
        },
      });
    });
  });
}
