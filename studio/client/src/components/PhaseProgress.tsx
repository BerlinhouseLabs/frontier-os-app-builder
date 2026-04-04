import { useState } from 'react';
import type { ProjectState, PhaseInfo, PhaseDetail } from '../hooks/useStudio';

function PhaseIcon({ phase, isCurrent }: { phase: PhaseInfo; isCurrent: boolean }) {
  if (phase.status === 'complete') {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (isCurrent) {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 border border-gray-700">
      <span className="text-[10px] text-gray-500 font-medium">{phase.number}</span>
    </div>
  );
}

function PhaseDetailPanel({ detail }: { detail: PhaseDetail }) {
  return (
    <div className="ml-8 mt-1 mb-2 pl-3 border-l border-gray-700/50 space-y-2 text-[11px]">
      {detail.decisions.length > 0 && (
        <div>
          <p className="text-gray-500 font-medium mb-0.5">Decisions</p>
          {detail.decisions.map((d, i) => (
            <p key={i} className="text-gray-400 leading-relaxed">- {d}</p>
          ))}
        </div>
      )}
      {detail.plans.length > 0 && (
        <div>
          <p className="text-gray-500 font-medium mb-0.5">Plans</p>
          {detail.plans.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5 text-gray-400">
              <span className={p.status === 'complete' ? 'text-green-400' : 'text-gray-600'}>
                {p.status === 'complete' ? '✓' : '○'}
              </span>
              <span className="truncate">{p.objective}</span>
              <span className="text-gray-600 shrink-0">({p.taskCount} tasks)</span>
            </div>
          ))}
        </div>
      )}
      {detail.verification && (
        <div>
          <p className="text-gray-500 font-medium mb-0.5">Verification</p>
          <p className="text-gray-400">{detail.verification}</p>
        </div>
      )}
    </div>
  );
}

export function PhaseProgress({ state }: { state: ProjectState }) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-1">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Phases</h2>
      <div className="space-y-0.5">
        {state.phases.map((phase) => {
          const isCurrent = phase.number === state.currentPhase;
          const planCount = state.planCounts[phase.number];
          const detail = state.phaseDetails?.[phase.number];
          const isExpanded = expanded === phase.number;
          const hasDetail = detail && (detail.decisions.length > 0 || detail.plans.length > 0 || detail.verification);

          return (
            <div key={phase.number}>
              <div
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors ${
                  isCurrent ? 'bg-gray-800/80' : 'hover:bg-gray-800/40'
                } ${hasDetail ? 'cursor-pointer' : ''}`}
                onClick={() => hasDetail && setExpanded(isExpanded ? null : phase.number)}
              >
                <PhaseIcon phase={phase} isCurrent={isCurrent} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {hasDetail && (
                      <span className="text-[10px] text-gray-600">{isExpanded ? '▾' : '▸'}</span>
                    )}
                    <p className={`text-sm truncate ${isCurrent ? 'text-white font-medium' : 'text-gray-300'}`}>
                      {phase.name}
                    </p>
                  </div>
                  {planCount && (
                    <p className="text-[10px] text-gray-500">
                      {planCount.complete}/{planCount.total} plans
                    </p>
                  )}
                </div>
              </div>
              {isExpanded && detail && <PhaseDetailPanel detail={detail} />}
            </div>
          );
        })}
      </div>

      {/* Overall progress bar */}
      <div className="mt-3 px-2">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>{state.completedPhases}/{state.phaseCount} phases</span>
          <span>{state.progressPercent}%</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${state.progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
