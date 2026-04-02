import { watch, type FSWatcher } from 'chokidar';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFile } from 'node:child_process';

export interface WatcherOptions {
  appDir: string;
  onStateChange: () => void;
  onAppFound: () => void;
  onFileActivity?: (type: 'file_created' | 'file_modified', path: string) => void;
  onGitCommit?: (message: string) => void;
}

export class StateWatcher {
  private stateWatcher: FSWatcher | null = null;
  private srcWatcher: FSWatcher | null = null;
  private gitWatcher: FSWatcher | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private appDir: string;
  private onStateChange: () => void;
  private onAppFound: () => void;
  private onFileActivity?: WatcherOptions['onFileActivity'];
  private onGitCommit?: WatcherOptions['onGitCommit'];
  private watching = false;

  constructor(opts: WatcherOptions) {
    this.appDir = opts.appDir;
    this.onStateChange = opts.onStateChange;
    this.onAppFound = opts.onAppFound;
    this.onFileActivity = opts.onFileActivity;
    this.onGitCommit = opts.onGitCommit;
  }

  get stateDir(): string {
    return join(this.appDir, '.frontier-app');
  }

  start(): void {
    if (existsSync(this.stateDir)) {
      this.startWatching();
    } else {
      this.startPolling();
    }

    // Always try to watch src/ and .git/ for activity
    this.startSrcWatcher();
    this.startGitWatcher();
  }

  private startPolling(): void {
    this.pollTimer = setInterval(() => {
      if (existsSync(this.stateDir)) {
        this.stopPolling();
        this.onAppFound();
        this.startWatching();
      }
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private startWatching(): void {
    if (this.watching) return;
    this.watching = true;

    // Watch .frontier-app/ and .frontier-app/phases/
    this.stateWatcher = watch(this.stateDir, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
      depth: 3, // Deep enough for phases/XX-name/XX-YY-PLAN.md
    });

    this.stateWatcher.on('all', () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.onStateChange();
      }, 300);
    });
  }

  private startSrcWatcher(): void {
    const srcDir = join(this.appDir, 'src');
    if (!existsSync(srcDir) || !this.onFileActivity) return;

    this.srcWatcher = watch(srcDir, {
      ignoreInitial: true,
      ignored: /node_modules|\.git/,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
    });

    let srcDebounce: ReturnType<typeof setTimeout> | null = null;
    const pending: Map<string, 'file_created' | 'file_modified'> = new Map();

    this.srcWatcher.on('all', (event, fullPath) => {
      if (event !== 'add' && event !== 'change') return;
      const rel = relative(this.appDir, fullPath);
      if (!rel.match(/\.(tsx?|css|json)$/)) return;

      pending.set(rel, event === 'add' ? 'file_created' : 'file_modified');

      if (srcDebounce) clearTimeout(srcDebounce);
      srcDebounce = setTimeout(() => {
        for (const [path, type] of pending) {
          this.onFileActivity?.(type, path);
        }
        pending.clear();
      }, 500);
    });
  }

  private startGitWatcher(): void {
    const gitDir = join(this.appDir, '.git');
    if (!existsSync(gitDir) || !this.onGitCommit) return;

    // Watch HEAD ref for commits
    const headsDir = join(gitDir, 'refs', 'heads');
    if (!existsSync(headsDir)) return;

    this.gitWatcher = watch(headsDir, {
      ignoreInitial: true,
      depth: 0,
    });

    this.gitWatcher.on('change', () => {
      // Read latest commit message
      execFile('git', ['log', '-1', '--oneline'], { cwd: this.appDir }, (err, stdout) => {
        if (!err && stdout.trim()) {
          this.onGitCommit?.(stdout.trim());
        }
      });
    });
  }

  async stop(): Promise<void> {
    this.stopPolling();
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.stateWatcher) {
      await this.stateWatcher.close();
      this.stateWatcher = null;
    }
    if (this.srcWatcher) {
      await this.srcWatcher.close();
      this.srcWatcher = null;
    }
    if (this.gitWatcher) {
      await this.gitWatcher.close();
      this.gitWatcher = null;
    }
    this.watching = false;
  }
}
