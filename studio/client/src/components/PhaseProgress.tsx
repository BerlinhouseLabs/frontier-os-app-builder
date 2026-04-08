import { useState } from 'react';
import type { ProjectState, PhaseInfo, PhaseDetail } from '../hooks/useStudio';

function phaseStatusLabel(phase: PhaseInfo, isCurrent: boolean, detail?: PhaseDetail | null): { text: string; className: string } {
  if (phase.status === 'complete') {
    return { text: 'Done', className: 'text-green-400' };
  }
  if (!isCurrent) {
    return { text: '', className: 'text-gray-600' };
  }
  // Current phase — describe where we are in the workflow
  if (!detail || detail.decisions.length === 0) {
    return { text: 'Ready to discuss', className: 'text-amber-400' };
  }
  if (detail.plans.length === 0) {
    return { text: 'Ready to plan', className: 'text-amber-400' };
  }
  if (detail.plans.some(p => p.status === 'pending')) {
    return { text: 'Ready to build', className: 'text-amber-400' };
  }
  return { text: 'Verifying', className: 'text-amber-400' };
}

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
      <span className="text-xs text-gray-500 font-medium">{phase.number}</span>
    </div>
  );
}

function PhaseDetailPanel({ detail }: { detail: PhaseDetail }) {
  return (
    <div className="ml-8 mt-1 mb-2 pl-3 border-l border-gray-700/50 space-y-2 text-xs">
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
                {p.status === 'complete' ? '\u2713' : '\u25CB'}
              </span>
              <span className="truncate">{p.objective}</span>
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
      <div className="space-y-0.5">
        {state.phases.map((phase) => {
          const isCurrent = phase.status === 'in-progress' || phase.number === state.currentPhase;
          const detail = state.phaseDetails?.[phase.number];
          const isExpanded = expanded === phase.number;
          const hasDetail = detail && (detail.decisions.length > 0 || detail.plans.length > 0 || detail.verification);
          const status = phaseStatusLabel(phase, isCurrent, detail);

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
                  <p className={`text-sm truncate ${isCurrent ? 'text-white font-medium' : 'text-gray-300'}`} title={phase.name}>
                    {phase.name}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {status.text && (
                    <span className={`text-[11px] ${status.className}`}>{status.text}</span>
                  )}
                  {hasDetail && (
                    <svg
                      className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
              {hasDetail && (
                <div className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                  isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}>
                  <div className="overflow-hidden">
                    {detail && <PhaseDetailPanel detail={detail} />}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall progress bar */}
      <div className="mt-2 px-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{state.completedPhases} of {state.phaseCount} phases</span>
          <span>{state.progressPercent}%</span>
        </div>
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${state.progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
