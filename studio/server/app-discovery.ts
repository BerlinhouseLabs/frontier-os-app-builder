import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { AppSummary } from '../shared/types.js';
import { parseManifest, parseState } from './parser.js';

/**
 * Scan a workspace root directory for Frontier OS apps.
 * An app is any subdirectory containing .frontier-app/manifest.json.
 *
 * Returns lightweight summaries sorted by most recently modified first.
 * Errors for individual apps are swallowed — a broken manifest in one
 * directory shouldn't hide the whole list.
 */
export async function discoverApps(workspaceRoot: string): Promise<AppSummary[]> {
  if (!existsSync(workspaceRoot)) return [];

  let entries: string[];
  try {
    entries = await readdir(workspaceRoot);
  } catch {
    return [];
  }

  const summaries = await Promise.all(
    entries.map((entry) => loadAppSummary(join(workspaceRoot, entry)))
  );

  return summaries
    .filter((s): s is AppSummary => s !== null)
    .sort((a, b) => b.modifiedAt - a.modifiedAt);
}

async function loadAppSummary(appDir: string): Promise<AppSummary | null> {
  const stateDir = join(appDir, '.frontier-app');
  const manifestPath = join(stateDir, 'manifest.json');

  if (!existsSync(manifestPath)) return null;

  try {
    // Directory check — skip files with a coincidental name
    const dirStat = await stat(appDir);
    if (!dirStat.isDirectory()) return null;

    const manifestRaw = await readFile(manifestPath, 'utf-8');
    const manifest = parseManifest(manifestRaw);

    // State is optional — apps without STATE.md still show up as 'unknown'
    let status = 'unknown';
    try {
      const stateRaw = await readFile(join(stateDir, 'STATE.md'), 'utf-8');
      const parsed = parseState(stateRaw);
      status = parsed.status || 'unknown';
    } catch {
      /* no state file — fine */
    }

    const phases = manifest.phases || [];
    const completedPhases = phases.filter(p => p.status === 'complete').length;
    const phaseCount = phases.length;
    const progressPercent = phaseCount > 0 ? Math.round((completedPhases / phaseCount) * 100) : 0;

    // Use manifest mtime as "last worked on" signal — more accurate than dir mtime,
    // since it flips whenever the builder bumps phases or permissions.
    const manifestStat = await stat(manifestPath);
    const modifiedAt = manifestStat.mtimeMs;

    return {
      path: appDir,
      name: manifest.name || appDir.split('/').pop() || 'Untitled',
      description: manifest.description || '',
      milestone: manifest.milestone || 'v1',
      sdkPhase: manifest.sdkPhase ?? null,
      status,
      phaseCount,
      completedPhases,
      progressPercent,
      modules: manifest.modules || [],
      modifiedAt,
    };
  } catch {
    return null;
  }
}
