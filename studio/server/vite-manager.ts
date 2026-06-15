import { spawn, type ChildProcess } from 'node:child_process';
import { createConnection } from 'node:net';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type ViteStatus = 'running' | 'starting' | 'stopped' | 'error';

export interface ViteManagerOptions {
  appDir: string;
  port: number;
  onStatusChange: (status: ViteStatus, error?: string) => void;
  onPortDetected?: (port: number) => void;
}

export class ViteManager {
  private process: ChildProcess | null = null;
  private startedByUs = false;
  private healthTimer: ReturnType<typeof setInterval> | null = null;
  private appDir: string;
  private port: number;
  private onStatusChange: ViteManagerOptions['onStatusChange'];
  private onPortDetected?: ViteManagerOptions['onPortDetected'];
  private _status: ViteStatus = 'stopped';
  private _lastError: string | null = null;
  private stderrBuffer: string[] = [];
  private readonly MAX_STDERR_LINES = 200;

  constructor(opts: ViteManagerOptions) {
    this.appDir = opts.appDir;
    this.port = opts.port;
    this.onStatusChange = opts.onStatusChange;
    this.onPortDetected = opts.onPortDetected;
  }

  get status(): ViteStatus {
    return this._status;
  }

  get lastError(): string | null {
    return this._lastError;
  }

  private setStatus(status: ViteStatus, error?: string): void {
    if (error) this._lastError = error;
    if (this._status !== status || error) {
      this._status = status;
      this.onStatusChange(status, error || this._lastError || undefined);
    }
  }

  getBuffer(): string[] {
    return [...this.stderrBuffer];
  }

  canStart(): { ok: boolean; reason?: string } {
    if (!existsSync(join(this.appDir, 'package.json'))) {
      return { ok: false, reason: 'No package.json yet — waiting for scaffold' };
    }
    if (!existsSync(join(this.appDir, 'node_modules'))) {
      return { ok: false, reason: 'Waiting for npm install...' };
    }
    return { ok: true };
  }

  async start(): Promise<void> {
    const check = this.canStart();
    if (!check.ok) {
      this.setStatus('stopped', check.reason);
      return;
    }

    // Only adopt an already-listening port if Studio itself started Vite on it
    // (e.g. a redundant start() while our own dev server is already up). A
    // FOREIGN process holding the configured port must NOT be adopted —
    // otherwise the preview iframe would render someone else's app. When we did
    // not start it, spawn our own Vite anyway: it auto-increments off the
    // occupied port and we parse the real port from its stdout (onPortDetected).
    if (this.startedByUs) {
      const alive = await this.probePort();
      if (alive) {
        this._lastError = null;
        this.setStatus('running');
        this.startHealthCheck();
        return;
      }
    }

    this.setStatus('starting');
    this.stderrBuffer = [];

    this.process = spawn('npx', ['vite'], {
      cwd: this.appDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    // Studio now owns this Vite instance; a later start() may adopt its port.
    this.startedByUs = true;

    // Capture stderr for error display
    this.process.stderr?.on('data', (chunk: Buffer) => {
      const lines = chunk.toString().split('\n').filter(l => l.trim());
      for (const line of lines) {
        this.stderrBuffer.push(line);
        if (this.stderrBuffer.length > this.MAX_STDERR_LINES) {
          this.stderrBuffer.shift();
        }
      }
    });

    // Capture stdout — detect the actual port Vite reports
    this.process.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      const lines = text.split('\n').filter(l => l.trim());
      for (const line of lines) {
        this.stderrBuffer.push(line);
        if (this.stderrBuffer.length > this.MAX_STDERR_LINES) {
          this.stderrBuffer.shift();
        }
        // Strip ANSI escape codes before matching (Vite embeds them even with FORCE_COLOR=0)
        const clean = line.replace(/\x1b\[[0-9;]*m/g, '');
        const portMatch = clean.match(/localhost:(\d+)/);
        if (portMatch) {
          const detectedPort = parseInt(portMatch[1], 10);
          if (detectedPort > 0 && detectedPort <= 65535 && detectedPort !== this.port) {
            this.port = detectedPort;
            this.onPortDetected?.(detectedPort);
          }
        }
      }
    });

    this.process.on('exit', (code) => {
      this.process = null;
      if (code !== 0 && code !== null) {
        const stderr = this.stderrBuffer.join('\n');
        let errorMsg = `Dev server exited with code ${code}`;
        if (stderr.includes('ENOENT') || stderr.includes('not found')) {
          errorMsg = 'node_modules not installed — run npm install first';
        } else if (stderr.length > 0) {
          // Show last 5 lines of output
          errorMsg = this.stderrBuffer.slice(-5).join('\n');
        }
        this.setStatus('error', errorMsg);
      } else {
        this.setStatus('stopped');
      }
    });

    this.process.on('error', (err) => {
      this.process = null;
      if (err.message.includes('ENOENT')) {
        this.setStatus('error', 'npm is not installed');
      } else {
        this.setStatus('error', err.message);
      }
    });

    await this.waitForPort(30_000);
    this.startHealthCheck();
  }

  private async waitForPort(timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await this.probePort()) {
        this._lastError = null;
        this.setStatus('running');
        return;
      }
      // If process already exited, stop waiting
      if (!this.process) return;
      await new Promise(r => setTimeout(r, 500));
    }
    if (this._status === 'starting') {
      this.setStatus('error', 'Dev server timed out after 30 seconds');
    }
  }

  private probePort(): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = createConnection({ port: this.port, host: 'localhost' }, () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.setTimeout(1000, () => {
        socket.destroy();
        resolve(false);
      });
    });
  }

  private startHealthCheck(): void {
    this.stopHealthCheck();
    this.healthTimer = setInterval(async () => {
      const alive = await this.probePort();
      if (alive) {
        this.setStatus('running');
      } else if (this._status === 'running') {
        this.setStatus('error', 'Dev server stopped unexpectedly');
      }
    }, 5000);
  }

  private stopHealthCheck(): void {
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  async stop(): Promise<void> {
    this.stopHealthCheck();
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.startedByUs = false;
    this.setStatus('stopped');
  }

  updatePort(port: number): void {
    if (port !== this.port) {
      this.port = port;
    }
  }
}
