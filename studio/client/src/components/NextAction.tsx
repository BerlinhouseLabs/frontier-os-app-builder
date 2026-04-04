import type { ProjectState } from '../hooks/useStudio';

export function NextAction({ state }: { state: ProjectState }) {
  if (!state.nextAction || state.status === 'milestone-complete') return null;

  return (
    <div className="space-y-1.5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Next Step</h2>
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
        <code className="text-sm text-blue-400 font-mono">{state.nextAction}</code>
        <p className="text-[10px] text-gray-500 mt-1">Run this in Claude Code</p>
      </div>
    </div>
  );
}
