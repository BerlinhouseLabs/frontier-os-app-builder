import type { ProjectState } from '../hooks/useStudio';
import { StatusBadge } from './StatusBadge';

export function AppHeader({ state }: { state: ProjectState }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-lg font-bold text-white leading-tight">{state.name}</h1>
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
          {state.milestone}
        </span>
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">{state.description}</p>
      {state.coreValue && (
        <p className="text-xs text-gray-500 italic">{state.coreValue}</p>
      )}
      <StatusBadge status={state.status} />
    </div>
  );
}
