import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { ProjectState, PhaseInfo, ParseError, PhaseDetail } from '../shared/types.js';

export type { ProjectState, ParseError };

export interface ParseResult {
  state: ProjectState | null;
  errors: ParseError[];
}

export function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  if (!content) return { frontmatter: {}, body: '' };
  try {
    const { data, content: body } = matter(content);
    return { frontmatter: data as Record<string, unknown>, body };
  } catch {
    return { frontmatter: {}, body: content };
  }
}

function normalizePhaseStatus(status: string): string {
  if (status === 'completed') return 'complete';
  return status;
}

async function readFileSafe(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

export function parseManifest(raw: string): Partial<ProjectState> {
  const m = JSON.parse(raw);
  return {
    name: m.name || '',
    description: m.description || '',
    devPort: typeof m.devPort === 'number' && m.devPort > 0 && m.devPort <= 65535 ? m.devPort : 5173,
    modules: Array.isArray(m.modules) ? m.modules : [],
    permissions: Array.isArray(m.permissions) ? m.permissions : [],
    milestone: m.milestone || 'v1',
    sdkPhase: m.sdkPhase ?? null,
    phases: (Array.isArray(m.phases) ? m.phases : []).map((p: { number: number; name: string; status: string }) => ({
      number: p.number,
      name: p.name || '',
      status: normalizePhaseStatus(p.status || 'not-started'),
    })),
  };
}

export function parseState(raw: string): Partial<ProjectState> {
  const { frontmatter: fm, body } = parseFrontmatter(raw);

  let progressPercent = 0;
  const progressMatch = body.match(/Progress:\s*\[.*?\]\s*(\d+)%/);
  if (progressMatch) {
    progressPercent = parseInt(progressMatch[1], 10);
  }

  let coreValue = '';
  const coreMatch = body.match(/\*\*Core value:\*\*\s*(.+)/);
  if (coreMatch) {
    coreValue = coreMatch[1].trim();
  }

  return {
    currentPhase: (fm.phase as number) || 1,
    currentPlan: fm.plan as number | string || 0,
    status: (fm.status as string) || 'unknown',
    nextAction: (fm.next_action as string) || '',
    progressPercent,
    coreValue,
  };
}

export function parseRoadmap(raw: string): { planCounts: Record<number, { complete: number; total: number }> } {
  const planCounts: Record<number, { complete: number; total: number }> = {};

  const tableRows = raw.match(/\|\s*\d+\.\s*.+?\|.+?\|.+?\|.+?\|/g);
  if (tableRows) {
    for (const row of tableRows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 2) {
        const phaseMatch = cells[0].match(/^(\d+)\./);
        const planMatch = cells[1].match(/(\d+)\/(\d+)/);
        if (phaseMatch && planMatch) {
          planCounts[parseInt(phaseMatch[1], 10)] = {
            complete: parseInt(planMatch[1], 10),
            total: parseInt(planMatch[2], 10),
          };
        }
      }
    }
  }

  return { planCounts };
}

// --- Phase detail reader ---

async function readPhaseDetail(stateDir: string, phase: PhaseInfo): Promise<PhaseDetail | null> {
  const phasesDir = join(stateDir, 'phases');
  let phaseDir: string | null = null;

  try {
    const dirs = await readdir(phasesDir);
    const prefix = String(phase.number).padStart(2, '0');
    const match = dirs.find(d => d.startsWith(prefix + '-'));
    if (match) phaseDir = join(phasesDir, match);
  } catch {
    return null;
  }

  if (!phaseDir) return null;

  const detail: PhaseDetail = { decisions: [], plans: [], summaries: [], verification: null };

  try {
    const files = await readdir(phaseDir);

    // Read CONTEXT.md for decisions
    const contextFile = files.find(f => f.endsWith('-CONTEXT.md'));
    if (contextFile) {
      const raw = await readFileSafe(join(phaseDir, contextFile));
      if (raw) {
        const decisionMatches = raw.match(/(?:^|\n)\s*-\s*\*\*D-\d+.*?\*\*[:\s]*(.+)/g);
        if (decisionMatches) {
          detail.decisions = decisionMatches.map(d => d.replace(/^\s*-\s*\*\*D-\d+.*?\*\*[:\s]*/, '').trim());
        }
        // Also try "### " decision headers
        if (detail.decisions.length === 0) {
          const headerMatches = raw.match(/^###\s+.+$/gm);
          if (headerMatches) {
            detail.decisions = headerMatches.map(h => h.replace(/^###\s+/, '').trim()).filter(d => d.length > 0);
          }
        }
      }
    }

    // Read PLAN.md files
    const planFiles = files.filter(f => f.match(/-\d+-PLAN\.md$/)).sort();
    for (const pf of planFiles) {
      const raw = await readFileSafe(join(phaseDir, pf));
      if (raw) {
        const { frontmatter: fm } = parseFrontmatter(raw);
        const idMatch = pf.match(/(\d+-\d+)-PLAN/);
        const taskMatches = raw.match(/^###\s+Task\s+/gm);
        detail.plans.push({
          id: idMatch ? idMatch[1] : pf,
          objective: (fm.objective as string) || raw.split('\n').find(l => l.startsWith('## '))?.replace(/^##\s+/, '') || pf,
          taskCount: taskMatches ? taskMatches.length : 0,
          status: 'pending',
        });
      }
    }

    // Read SUMMARY.md files — mark corresponding plans as complete
    const summaryFiles = files.filter(f => f.match(/-\d+-SUMMARY\.md$/)).sort();
    for (const sf of summaryFiles) {
      const raw = await readFileSafe(join(phaseDir, sf));
      if (raw) {
        const oneLiner = raw.split('\n').find(l => l.trim().length > 0 && !l.startsWith('#') && !l.startsWith('---'));
        detail.summaries.push(oneLiner?.trim() || 'Completed');

        // Mark matching plan as complete
        const idMatch = sf.match(/(\d+-\d+)-SUMMARY/);
        if (idMatch) {
          const plan = detail.plans.find(p => p.id === idMatch[1]);
          if (plan) plan.status = 'complete';
        }
      }
    }

    // Read VERIFICATION.md
    const verFile = files.find(f => f.endsWith('-VERIFICATION.md'));
    if (verFile) {
      const raw = await readFileSafe(join(phaseDir, verFile));
      if (raw) {
        const statusLine = raw.match(/(?:status|result|verdict)[:\s]+(.+)/i);
        detail.verification = statusLine ? statusLine[1].trim() : 'Completed';
      }
    }
  } catch {
    // Phase directory read failed — return what we have
  }

  return detail;
}

// --- Main parser ---

export async function parseProjectState(appDir: string): Promise<ParseResult> {
  const stateDir = join(appDir, '.frontier-app');
  const errors: ParseError[] = [];

  const manifestRaw = await readFileSafe(join(stateDir, 'manifest.json'));
  if (!manifestRaw) return { state: null, errors };

  let manifest: Partial<ProjectState>;
  try {
    manifest = parseManifest(manifestRaw);
  } catch (err) {
    errors.push({ file: 'manifest.json', message: err instanceof Error ? err.message : 'Invalid JSON' });
    return { state: null, errors };
  }

  let state: Partial<ProjectState> = {};
  const stateRaw = await readFileSafe(join(stateDir, 'STATE.md'));
  if (stateRaw) {
    try {
      state = parseState(stateRaw);
    } catch (err) {
      errors.push({ file: 'STATE.md', message: err instanceof Error ? err.message : 'Parse error' });
    }
  }

  let roadmap = { planCounts: {} as Record<number, { complete: number; total: number }> };
  const roadmapRaw = await readFileSafe(join(stateDir, 'ROADMAP.md'));
  if (roadmapRaw) {
    try {
      roadmap = parseRoadmap(roadmapRaw);
    } catch (err) {
      errors.push({ file: 'ROADMAP.md', message: err instanceof Error ? err.message : 'Parse error' });
    }
  }

  const phases = manifest.phases || [];

  // Read phase details
  const phaseDetails: Record<number, PhaseDetail> = {};
  for (const phase of phases) {
    const detail = await readPhaseDetail(stateDir, phase);
    if (detail) {
      phaseDetails[phase.number] = detail;
    }
  }

  // Enrich phase statuses from artifacts (manifest.json is often not updated)
  const currentPhase = (state.currentPhase as number) || 1;
  for (const phase of phases) {
    if (phase.status === 'complete') continue; // trust explicit complete
    const detail = phaseDetails[phase.number];
    if (detail && detail.plans.length > 0 && detail.plans.every(p => p.status === 'complete')) {
      // All plans executed — phase is complete
      phase.status = 'complete';
    } else if (detail && detail.summaries.length > 0) {
      // Has some summaries — likely complete (verification may be pending)
      phase.status = 'complete';
    } else if (phase.number < currentPhase) {
      // Earlier than current phase — must be done
      phase.status = 'complete';
    } else if (phase.number === currentPhase) {
      phase.status = 'in-progress';
    }
    // else: stays not-started
  }

  const completedPhases = phases.filter(p => p.status === 'complete').length;

  // Infer nextAction when STATE.md is missing or doesn't specify one
  let nextAction = state.nextAction || '';
  if (!nextAction && phases.length > 0) {
    const firstIncomplete = phases.find(p => p.status !== 'complete');
    if (firstIncomplete) {
      const n = firstIncomplete.number;
      const detail = phaseDetails[n];
      if (!detail || detail.decisions.length === 0) {
        nextAction = `/fos:discuss ${n}`;
      } else if (!detail.plans.length) {
        nextAction = `/fos:plan ${n}`;
      } else if (detail.plans.some(p => p.status === 'pending')) {
        nextAction = `/fos:execute ${n}`;
      }
    } else {
      nextAction = '/fos:ship';
    }
  }

  return {
    state: {
      name: manifest.name || '',
      description: manifest.description || '',
      devPort: manifest.devPort || 5173,
      modules: manifest.modules || [],
      permissions: manifest.permissions || [],
      milestone: manifest.milestone || 'v1',
      sdkPhase: manifest.sdkPhase ?? null,
      phases,
      currentPhase: state.currentPhase || 1,
      currentPlan: state.currentPlan || 0,
      status: state.status || 'unknown',
      nextAction,
      progressPercent: state.progressPercent || 0,
      coreValue: state.coreValue || '',
      planCounts: roadmap.planCounts,
      phaseDetails,
      phaseCount: phases.length,
      completedPhases,
    },
    errors,
  };
}
