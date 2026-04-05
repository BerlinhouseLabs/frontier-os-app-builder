import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViteManager } from '../vite-manager.js';

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

import { existsSync, readFileSync } from 'node:fs';
const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);

function createManager(port = 5173) {
  return new ViteManager({
    appDir: '/test/app',
    port,
    onStatusChange: vi.fn(),
  });
}

describe('ViteManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe('detectPort()', () => {
    it('extracts port from vite.config.ts', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(`
        export default defineConfig({
          server: { port: 3000 },
        });
      `);
      // detectPort is private, test via reflection
      const manager = createManager(5173);
      const detected = (manager as unknown as { detectPort: () => number }).detectPort();
      expect(detected).toBe(3000);
    });

    it('falls back to configured port when no vite.config.ts', () => {
      mockExistsSync.mockReturnValue(false);
      const manager = createManager(4000);
      const detected = (manager as unknown as { detectPort: () => number }).detectPort();
      expect(detected).toBe(4000);
    });

    it('falls back for out-of-range port', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('port: 99999');
      const manager = createManager(5173);
      const detected = (manager as unknown as { detectPort: () => number }).detectPort();
      expect(detected).toBe(5173);
    });

    it('falls back on read error', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
      const manager = createManager(5173);
      const detected = (manager as unknown as { detectPort: () => number }).detectPort();
      expect(detected).toBe(5173);
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
