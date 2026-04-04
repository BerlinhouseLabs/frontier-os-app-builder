import type { ProjectState } from '../hooks/useStudio';

const MODULE_COLORS: Record<string, string> = {
  Wallet: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  User: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  Storage: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
  Chain: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  Events: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  Communities: 'bg-pink-500/15 text-pink-400 border-pink-500/25',
  Partnerships: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  Offices: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  ThirdParty: 'bg-red-500/15 text-red-400 border-red-500/25',
  Navigation: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
};

export function ModuleChips({ state }: { state: ProjectState }) {
  if (!state.modules.length) return null;

  // Count permissions per module
  const permCounts: Record<string, number> = {};
  for (const perm of state.permissions) {
    const mod = perm.split(':')[0];
    const moduleName = state.modules.find(m => m.toLowerCase() === mod.toLowerCase());
    if (moduleName) {
      permCounts[moduleName] = (permCounts[moduleName] || 0) + 1;
    }
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">SDK Modules</h2>
      <div className="flex flex-wrap gap-1.5">
        {state.modules.map((mod) => (
          <span
            key={mod}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md border ${
              MODULE_COLORS[mod] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'
            }`}
            title={permCounts[mod] ? `${permCounts[mod]} permission${permCounts[mod] > 1 ? 's' : ''}` : undefined}
          >
            {mod}
            {permCounts[mod] && (
              <span className="text-[9px] opacity-60">{permCounts[mod]}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
