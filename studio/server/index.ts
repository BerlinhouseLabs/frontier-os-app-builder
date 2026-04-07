import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, type WebSocket } from 'ws';
import { parseProjectState, type ProjectState, type ParseError } from './parser.js';
import { StateWatcher } from './watcher.js';
import { ViteManager, type ViteStatus } from './vite-manager.js';
import { ActivityTracker } from './activity.js';
import { PtyManager } from './pty-manager.js';
import type { ActivityEvent } from '../shared/types.js';

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
  appDir: string;
  port: number;
}

export async function startStudio(opts: StudioOptions): Promise<{ close: () => Promise<void> }> {
  const { appDir, port } = opts;
  const clientDir = join(__dirname, '..', 'client');

  let currentState: ProjectState | null = null;
  let currentErrors: ParseError[] = [];
  let currentViteStatus: ViteStatus = 'stopped';
  let currentViteError: string | undefined;
  let viteManager: ViteManager | null = null;
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
    } else {
      broadcast({ type: 'waiting' });
    }
    if (currentErrors.length > 0) {
      broadcast({ type: 'error', errors: currentErrors });
    }
  }

  function broadcastVite(): void {
    broadcast({ type: 'vite', status: currentViteStatus, error: currentViteError });
  }

  // --- State refresh ---
  async function refreshState(): Promise<void> {
    const prevState = currentState;
    const result = await parseProjectState(appDir);
    currentState = result.state;
    currentErrors = result.errors;

    // Log errors to server console
    for (const err of result.errors) {
      console.warn(`  [parse] ${err.file}: ${err.message}`);
    }

    // Track state changes as activity
    activity.diffStates(prevState, currentState);

    broadcastState();

    if (currentState && viteManager) {
      viteManager.updatePort(currentState.devPort);
    }
  }

  // --- Vite manager setup ---
  async function initViteManager(devPort: number): Promise<void> {
    if (viteManager) return;

    viteManager = new ViteManager({
      appDir,
      port: devPort,
      onStatusChange: (status, error) => {
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
      onPortDetected: (port) => {
        // Vite is running on a different port than manifest says — update state
        if (currentState && currentState.devPort !== port) {
          currentState = { ...currentState, devPort: port };
          broadcastState();
          activity.push({ type: 'vite_event', message: `Dev server on port ${port}` });
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

  // --- File watcher ---
  const watcher = new StateWatcher({
    appDir,
    onStateChange: async () => {
      await refreshState();

      if (currentState && !viteManager) {
        await initViteManager(currentState.devPort);
      }

      // Retry Vite if it was stopped and deps are now installed
      if (viteManager && currentViteStatus === 'stopped') {
        const check = viteManager.canStart();
        if (check.ok) {
          await viteManager.start();
        }
      }
    },
    onAppFound: async () => {
      await refreshState();
      if (currentState) {
        await initViteManager(currentState.devPort);
      }
    },
    onFileActivity: (type, path) => {
      activity.push({ type, message: path });
    },
    onGitCommit: (message) => {
      activity.push({ type: 'git_commit', message });
    },
  });

  // --- HTTP server ---
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url || '/';

    if (url === '/api/state') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
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
  // 1MB max payload — large enough for terminal paste / output bursts.
  const wss = new WebSocketServer({ server, maxPayload: 1024 * 1024 });

  wss.on('connection', (ws) => {
    clients.add(ws);

    // One PTY per ws connection, lazily started on first 'pty-start' message.
    let pty: PtyManager | null = null;

    // Send current state
    if (currentState) {
      ws.send(JSON.stringify({ type: 'state', data: currentState }));
    } else {
      ws.send(JSON.stringify({ type: 'waiting' }));
    }
    if (currentErrors.length > 0) {
      ws.send(JSON.stringify({ type: 'error', errors: currentErrors }));
    }
    ws.send(JSON.stringify({ type: 'vite', status: currentViteStatus, error: currentViteError }));

    // Send activity history
    const history = activity.getRecent(20);
    if (history.length > 0) {
      ws.send(JSON.stringify({ type: 'activity-history', events: history }));
    }

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'restart-vite' && viteManager) {
          await viteManager.restart();
        }
        if (msg.type === 'request-vite-logs' && viteManager) {
          ws.send(JSON.stringify({ type: 'vite-logs', lines: viteManager.getBuffer() }));
        }
        if (msg.type === 'pty-start') {
          if (pty) return;
          pty = new PtyManager({
            appDir,
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
  await refreshState();
  watcher.start();

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`\n  Frontier Studio running at http://localhost:${port}\n`);

      // Start Vite manager async
      if (currentState !== null) {
        initViteManager((currentState as ProjectState).devPort).catch(() => {});
      }

      resolve({
        close: async () => {
          if (activityBatchTimer) clearTimeout(activityBatchTimer);
          await watcher.stop();
          if (viteManager) await viteManager.stop();
          wss.close();
          server.close();
        },
      });
    });
  });
}
