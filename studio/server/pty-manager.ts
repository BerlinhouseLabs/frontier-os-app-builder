import { spawn, type IPty } from 'node-pty';
import { existsSync } from 'node:fs';

export interface PtyManagerOptions {
  appDir: string;
  cols?: number;
  rows?: number;
  command?: string;
  args?: string[];
  onData: (data: string) => void;
  onExit: (code: number, signal: number) => void;
}

/**
 * Wraps a single node-pty process. One instance per WebSocket connection.
 *
 * Tries to spawn `claude` (Claude Code CLI) by default. If that's not on PATH,
 * falls back to the user's $SHELL so the pane is still useful.
 */
export class PtyManager {
  private pty: IPty | null = null;
  private opts: PtyManagerOptions;
  private exited = false;

  constructor(opts: PtyManagerOptions) {
    this.opts = opts;
  }

  start(): { command: string; args: string[] } {
    if (this.pty) throw new Error('PtyManager already started');

    const cols = this.opts.cols ?? 80;
    const rows = this.opts.rows ?? 24;

    // Resolve command
    let command = this.opts.command;
    let args = this.opts.args ?? [];
    if (!command) {
      if (this.isOnPath('claude')) {
        command = 'claude';
        args = [];
      } else {
        command = process.env.SHELL || '/bin/bash';
        args = ['-l'];
      }
    }

    this.pty = spawn(command, args, {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: this.opts.appDir,
      env: { ...process.env, TERM: 'xterm-256color' } as Record<string, string>,
    });

    this.pty.onData((data) => {
      if (!this.exited) this.opts.onData(data);
    });

    this.pty.onExit(({ exitCode, signal }) => {
      this.exited = true;
      this.opts.onExit(exitCode, signal ?? 0);
    });

    return { command, args };
  }

  write(data: string): void {
    if (this.pty && !this.exited) this.pty.write(data);
  }

  resize(cols: number, rows: number): void {
    if (this.pty && !this.exited) {
      try {
        this.pty.resize(Math.max(1, cols), Math.max(1, rows));
      } catch {
        // ignore — pty may have just exited
      }
    }
  }

  kill(): void {
    if (this.pty && !this.exited) {
      try {
        this.pty.kill();
      } catch {
        // ignore
      }
    }
    this.pty = null;
    this.exited = true;
  }

  private isOnPath(cmd: string): boolean {
    const PATH = process.env.PATH || '';
    const sep = process.platform === 'win32' ? ';' : ':';
    for (const dir of PATH.split(sep)) {
      if (!dir) continue;
      const candidate = `${dir}/${cmd}`;
      if (existsSync(candidate)) return true;
      if (process.platform === 'win32' && existsSync(`${candidate}.exe`)) return true;
    }
    return false;
  }
}
