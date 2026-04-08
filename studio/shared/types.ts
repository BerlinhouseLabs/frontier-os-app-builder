export interface PhaseInfo {
  number: number;
  name: string;
  status: string;
}

export interface ParseError {
  file: string;
  message: string;
}

export interface PlanSummary {
  id: string;
  objective: string;
  taskCount: number;
  status: 'pending' | 'complete';
}

export interface PhaseDetail {
  decisions: string[];
  plans: PlanSummary[];
  summaries: string[];
  verification: string | null;
}

export interface ProjectState {
  name: string;
  description: string;
  devPort: number;
  modules: string[];
  permissions: string[];
  milestone: string;
  sdkPhase: number | null | string;
  phases: PhaseInfo[];
  currentPhase: number;
  currentPlan: number | string;
  status: string;
  nextAction: string;
  progressPercent: number;
  coreValue: string;
  planCounts: Record<number, { complete: number; total: number }>;
  phaseDetails: Record<number, PhaseDetail>;
  phaseCount: number;
  completedPhases: number;
}

export interface ActivityEvent {
  timestamp: number;
  type: 'file_created' | 'file_modified' | 'phase_changed' | 'status_changed' | 'git_commit' | 'vite_event';
  message: string;
  detail?: string;
}

export type ViteStatus = 'running' | 'starting' | 'stopped' | 'error';

/** Lightweight summary used by the workspace app picker. */
export interface AppSummary {
  path: string;
  name: string;
  description: string;
  milestone: string;
  sdkPhase: number | null | string;
  status: string;
  phaseCount: number;
  completedPhases: number;
  progressPercent: number;
  modules: string[];
  modifiedAt: number;
}
