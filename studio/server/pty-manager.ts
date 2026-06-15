import type { IPty } from 'node-pty';
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

  async start(): Promise<{ command: string; args: string[] }> {
    if (this.pty) throw new Error('PtyManager already started');

    // Lazy, optional load of the node-pty native addon. A static top-level
    // import would crash the entire Studio server (dashboard + preview
    // included) when the prebuilt binary does not match the user's Node ABI.
    // Loading it here contains that failure to the terminal feature: the call
    // site wraps start() in a try/catch that emits a `pty-error` to the client,
    // so a failed load degrades to "terminal unavailable" while the dashboard
    // and preview keep working.
    let nodePty: typeof import('node-pty');
    try {
      nodePty = await import('node-pty');
    } catch (err) {
      throw new Error(
        `Terminal unavailable: failed to load the node-pty native addon (${
          err instanceof Error ? err.message : String(err)
        }).`,
      );
    }
    const { spawn } = nodePty;

    const cols = this.opts.cols ?? 80;
    const rows = this.opts.rows ?? 24;

    // Resolve command
    let command = this.opts.command;
    let args = this.opts.args ?? [];
    if (!command) {
      if (this.isOnPath('claude')) {
        command = 'claude';
        args = ['--dangerously-skip-permissions'];
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
