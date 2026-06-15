import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViteManager } from '../vite-manager.js';
import { spawn, type ChildProcess } from 'node:child_process';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    existsSync: vi.fn(),
  };
});

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

import { existsSync } from 'node:fs';
const mockExistsSync = vi.mocked(existsSync);
const mockSpawn = vi.mocked(spawn);

// Minimal ChildProcess stub: ViteManager only attaches listeners and kills it.
function fakeChild(): ChildProcess {
  return {
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn(),
    kill: vi.fn(),
  } as unknown as ChildProcess;
}

function createManager(port = 5173) {
  return new ViteManager({
    appDir: '/test/app',
    port,
    onStatusChange: vi.fn(),
  });
}

// Override the private probePort so tests never open real sockets.
function stubProbe(manager: ViteManager, ...results: boolean[]) {
  const probe = vi.fn();
  for (const r of results) probe.mockResolvedValueOnce(r);
  probe.mockResolvedValue(results[results.length - 1] ?? false);
  (manager as unknown as { probePort: () => Promise<boolean> }).probePort = probe;
  return probe;
}

function getStartedByUs(manager: ViteManager): boolean {
  return (manager as unknown as { startedByUs: boolean }).startedByUs;
}

function setStartedByUs(manager: ViteManager, value: boolean): void {
  (manager as unknown as { startedByUs: boolean }).startedByUs = value;
}

describe('ViteManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSpawn.mockReturnValue(fakeChild());
  });

  describe('canStart()', () => {
    it('returns ok:false when no package.json', () => {
      mockExistsSync.mockImplementation((p) => {
        if (String(p).endsWith('package.json')) return false;
        return true;
      });
      const manager = createManager();
      expect(manager.canStart()).toEqual({ ok: false, reason: expect.stringContaining('package.json') });
    });

    it('returns ok:false when no node_modules', () => {
      mockExistsSync.mockImplementation((p) => {
        if (String(p).endsWith('node_modules')) return false;
        return true;
      });
      const manager = createManager();
      expect(manager.canStart()).toEqual({ ok: false, reason: expect.stringContaining('npm install') });
    });

    it('returns ok:true when both exist', () => {
      mockExistsSync.mockReturnValue(true);
      const manager = createManager();
      expect(manager.canStart()).toEqual({ ok: true });
    });
  });

  describe('start() — port ownership', () => {
    it('does NOT adopt a foreign listener; spawns its own Vite instead', async () => {
      mockExistsSync.mockReturnValue(true); // canStart passes
      const manager = createManager(5173);
      // The configured port is alive, but Studio did not start it
      // (startedByUs defaults to false) — it must be treated as foreign.
      stubProbe(manager, true);

      await manager.start();

      // A foreign listener must not be short-circuited to "running": we spawn
      // our own Vite (which auto-increments off the occupied port).
      expect(mockSpawn).toHaveBeenCalledWith('npx', ['vite'], expect.anything());
      expect(getStartedByUs(manager)).toBe(true);

      await manager.stop();
    });

    it('adopts the alive port without re-spawning when Studio already started Vite', async () => {
      mockExistsSync.mockReturnValue(true);
      const manager = createManager(5173);
      // Simulate that we previously spawned Vite on this port (e.g. a redundant
      // start() while the dev server is already up).
      setStartedByUs(manager, true);
      stubProbe(manager, true);

      await manager.start();

      // No duplicate spawn; the running instance is adopted.
      expect(mockSpawn).not.toHaveBeenCalled();
      expect(manager.status).toBe('running');

      await manager.stop();
    });

    it('spawns when the port is free even if Studio owned it before', async () => {
      mockExistsSync.mockReturnValue(true);
      const manager = createManager(5173);
      setStartedByUs(manager, true);
      // Adoption probe says the port is free (Vite died); then it comes up.
      stubProbe(manager, false, true);

      await manager.start();

      expect(mockSpawn).toHaveBeenCalledWith('npx', ['vite'], expect.anything());

      await manager.stop();
    });

    it('stop() clears startedByUs so the next start re-spawns', async () => {
      const manager = createManager();
      setStartedByUs(manager, true);

      await manager.stop();

      expect(getStartedByUs(manager)).toBe(false);
      expect(manager.status).toBe('stopped');
    });
  });

  describe('status', () => {
    it('starts as stopped', () => {
      const manager = createManager();
      expect(manager.status).toBe('stopped');
    });

    it('lastError starts as null', () => {
      const manager = createManager();
      expect(manager.lastError).toBeNull();
    });
  });
});
