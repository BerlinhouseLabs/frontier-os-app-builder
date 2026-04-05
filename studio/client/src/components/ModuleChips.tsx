import { useState } from 'react';
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

const MODULE_TEXT_COLORS: Record<string, string> = {
  Wallet: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  User: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Storage: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  Chain: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Events: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Communities: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  Partnerships: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Offices: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  ThirdParty: 'text-red-400 bg-red-500/10 border-red-500/20',
  Navigation: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
};

export function ModuleChips({ state }: { state: ProjectState }) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  if (!state.modules.length) return null;

  // Count permissions per module
  const permCounts: Record<string, number> = {};
  const permsByModule: Record<string, string[]> = {};
  for (const perm of state.permissions) {
    const mod = perm.split(':')[0];
    const moduleName = state.modules.find(m => m.toLowerCase() === mod.toLowerCase());
    if (moduleName) {
      permCounts[moduleName] = (permCounts[moduleName] || 0) + 1;
      if (!permsByModule[moduleName]) permsByModule[moduleName] = [];
      permsByModule[moduleName].push(perm);
    }
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">SDK Modules</h2>
      <div className="flex flex-wrap gap-1.5">
        {state.modules.map((mod) => (
          <span
            key={mod}
            onClick={() => permCounts[mod] && setExpandedModule(expandedModule === mod ? null : mod)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md border ${
              MODULE_COLORS[mod] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'
            } ${permCounts[mod] ? 'cursor-pointer' : ''}`}
            title={permCounts[mod] ? `${permCounts[mod]} permission${permCounts[mod] > 1 ? 's' : ''} — click to expand` : undefined}
          >
            {mod}
            {permCounts[mod] && (
              <span className="text-xs opacity-60">{permCounts[mod]}</span>
            )}
          </span>
        ))}
      </div>
      {state.modules.map((mod) => (
        <div
          key={`detail-${mod}`}
          className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
            expandedModule === mod ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            {permsByModule[mod] && (
              <div className="flex flex-wrap gap-1 pt-1 pb-0.5">
                {permsByModule[mod].map((perm) => (
                  <span
                    key={perm}
                    className={`px-1.5 py-0.5 text-xs font-mono rounded border ${
                      MODULE_TEXT_COLORS[mod] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'
                    }`}
                  >
                    {perm}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
