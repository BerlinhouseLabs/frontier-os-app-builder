import type { ProjectState, ViteStatus, ParseError, ActivityEvent } from '../hooks/useStudio';
import { AppHeader } from './AppHeader';
import { PhaseProgress } from './PhaseProgress';
import { ModuleChips } from './ModuleChips';
import { NextAction } from './NextAction';
import { ViteStatus as ViteStatusIndicator } from './ViteStatus';
import { ErrorPanel } from './ErrorPanel';
import { ActivityStream } from './ActivityStream';

interface SidebarProps {
  state: ProjectState;
  viteStatus: ViteStatus;
  viteError: string | null;
  errors: ParseError[];
  activities: ActivityEvent[];
  onRestartVite: () => void;
}

export function Sidebar({ state, viteStatus, viteError, errors, activities, onRestartVite }: SidebarProps) {
  return (
    <aside className="w-80 h-full bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h1 className="text-xs font-bold uppercase tracking-widest text-gray-500">Frontier Studio</h1>
      </div>

      {/* Errors */}
      <ErrorPanel errors={errors} viteError={viteStatus === 'error' ? viteError : null} />

      {/* Dashboard content */}
      <div className="overflow-y-auto px-4 py-4 space-y-5" style={{ flex: '0 1 auto', maxHeight: '55%' }}>
        <AppHeader state={state} />
        <PhaseProgress state={state} />
        <ModuleChips state={state} />
        <NextAction state={state} />
      </div>

      {/* Activity stream */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-gray-800">
        <div className="px-4 py-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Activity</h2>
        </div>
        <ActivityStream activities={activities} />
      </div>

      {/* Footer: Vite status */}
      <div className="px-4 py-3 border-t border-gray-800">
        <ViteStatusIndicator status={viteStatus} error={viteError} onRestart={onRestartVite} />
      </div>
    </aside>
  );
}
