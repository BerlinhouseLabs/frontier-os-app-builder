import { useState } from 'react';
import type { ProjectState, ViteStatus, ParseError, ActivityEvent } from '../hooks/useStudio';
import { AppHeader } from './AppHeader';
import { PhaseProgress } from './PhaseProgress';
import { ModuleChips } from './ModuleChips';

import { Section } from './Section';
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
  onShowLogs?: () => void;
  onBackToApps?: () => void;
}

export function Sidebar({ state, viteStatus, viteError, errors, activities, onRestartVite, onShowLogs, onBackToApps }: SidebarProps) {
  const [showActivityFilters, setShowActivityFilters] = useState(false);

  return (
    <aside className="w-80 h-full bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo + back to apps */}
      <div className="px-4 py-3 border-b border-gray-800 shrink-0 flex items-center justify-between gap-2">
        <h1 className="text-xs font-bold uppercase tracking-widest text-gray-500">Frontier Studio</h1>
        {onBackToApps && (
          <button
            onClick={onBackToApps}
            className="group flex items-center gap-1 text-xs text-gray-500 hover:text-gray-200 transition-colors"
            title="Back to all apps"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Apps</span>
          </button>
        )}
      </div>

      {/* Errors (only renders when present) */}
      <ErrorPanel errors={errors} viteError={viteStatus === 'error' ? viteError : null} />

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        <AppHeader state={state} />

        <Section title="Phases" storageKey="phases" defaultOpen>
          <PhaseProgress state={state} />
        </Section>

        {state.modules.length > 0 && (
          <Section title="SDK Modules" storageKey="modules" defaultOpen={false}>
            <ModuleChips state={state} />
          </Section>
        )}

        <Section
          title="Activity"
          storageKey="activity"
          defaultOpen
          trailing={
            <button
              type="button"
              onClick={() => setShowActivityFilters(v => !v)}
              className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
                showActivityFilters
                  ? 'text-gray-200 bg-gray-800'
                  : 'text-gray-600 hover:text-gray-400'
              }`}
              title="Toggle filters"
            >
              filter
            </button>
          }
        >
          <ActivityStream activities={activities} showFilters={showActivityFilters} />
        </Section>
      </div>

      {/* Footer: Vite status */}
      <div className="px-4 py-3 border-t border-gray-800 shrink-0">
        <ViteStatusIndicator status={viteStatus} error={viteError} onRestart={onRestartVite} onShowLogs={onShowLogs} />
      </div>
    </aside>
  );
}
