import { useState } from 'react';
import type { ProjectState } from '../hooks/useStudio';
import { StatusBadge } from './StatusBadge';

/**
 * Compact app header. Shows just name + milestone + status by default.
 * Click the name to reveal the full description and core value.
 */
export function AppHeader({ state }: { state: ProjectState }) {
  const [showDetails, setShowDetails] = useState(false);
  const hasDetails = !!(state.description || state.coreValue);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => hasDetails && setShowDetails(v => !v)}
          className={`flex items-center gap-1.5 min-w-0 ${hasDetails ? 'cursor-pointer' : ''}`}
          title={hasDetails ? 'Click for description' : undefined}
        >
          {hasDetails && (
            <svg
              className={`w-3 h-3 text-gray-500 shrink-0 transition-transform duration-200 ${showDetails ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
          <h1 className="text-base font-bold text-white leading-tight truncate">{state.name}</h1>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
            {state.milestone}
          </span>
          {state.sdkPhase != null && (
            <span
              className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded"
              title={`SDK Phase ${state.sdkPhase}`}
            >
              SDK{state.sdkPhase}
            </span>
          )}
        </div>
      </div>

      <StatusBadge status={state.status} />

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          showDetails ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden space-y-1">
          {state.description && (
            <p className="text-xs text-gray-400 leading-relaxed pt-1">{state.description}</p>
          )}
          {state.coreValue && (
            <p className="text-xs text-gray-500 italic">{state.coreValue}</p>
          )}
        </div>
      </div>
    </div>
  );
}
