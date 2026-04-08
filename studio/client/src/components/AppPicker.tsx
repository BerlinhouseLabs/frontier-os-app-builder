import { useMemo, useState } from 'react';
import type { AppSummary } from '@studio/shared/types';

interface AppPickerProps {
  apps: AppSummary[];
  workspaceRoot: string | null;
  loading: boolean;
  onSelect: (path: string) => void;
  onRefresh: () => void;
  onCreateApp: () => void;
}

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function statusColor(status: string): string {
  if (status.includes('complete')) return 'text-green-400 bg-green-500/10 border-green-500/20';
  if (status.includes('error')) return 'text-red-400 bg-red-500/10 border-red-500/20';
  if (status.includes('executing') || status.includes('starting')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
}

function formatStatus(status: string): string {
  return status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function AppPicker({ apps, workspaceRoot, loading, onSelect, onRefresh, onCreateApp }: AppPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return apps;
    const q = query.toLowerCase();
    return apps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.path.toLowerCase().includes(q),
    );
  }, [apps, query]);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-6 shrink-0">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
              Frontier Studio
            </p>
            <h1 className="text-2xl font-bold text-white">Your Apps</h1>
            {workspaceRoot && (
              <p className="text-xs text-gray-500 font-mono mt-1 truncate">{workspaceRoot}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search apps..."
                className="bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 px-3 py-1.5 w-64 focus:outline-none focus:border-gray-700"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
                >
                  x
                </button>
              )}
            </div>
            <button
              onClick={onCreateApp}
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg transition-colors"
            >
              + New App
            </button>
            <button
              onClick={onRefresh}
              className="text-gray-400 hover:text-gray-200 p-1.5 rounded border border-gray-800 hover:border-gray-700 transition-colors"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-6 h-6 border-2 border-gray-700 border-t-blue-400 rounded-full animate-spin" />
            </div>
          ) : apps.length === 0 ? (
            <EmptyState workspaceRoot={workspaceRoot} onCreateApp={onCreateApp} />
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-gray-500">No apps match "{query}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((app) => (
                <AppCard key={app.path} app={app} onSelect={() => onSelect(app.path)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppCard({ app, onSelect }: { app: AppSummary; onSelect: () => void }) {
  const isDone = app.progressPercent === 100;

  return (
    <button
      onClick={onSelect}
      className="group text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 hover:bg-gray-900/80 transition-all hover:-translate-y-0.5 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
            {app.name}
          </h2>
          <p className="text-xs text-gray-500 font-mono truncate mt-0.5">
            {app.path.split('/').pop()}
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
          {app.milestone}
        </span>
      </div>

      {app.description && (
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{app.description}</p>
      )}

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${statusColor(app.status)}`}>
            {formatStatus(app.status)}
          </span>
          <span className="text-gray-500">
            {app.completedPhases}/{app.phaseCount} phases
          </span>
        </div>
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isDone ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-green-500'
            }`}
            style={{ width: `${app.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-800/60">
        <div className="flex gap-1 overflow-hidden">
          {app.modules.slice(0, 4).map((m) => (
            <span key={m} className="text-[10px] bg-gray-800/60 px-1 py-0.5 rounded text-gray-400">
              {m}
            </span>
          ))}
          {app.modules.length > 4 && (
            <span className="text-[10px] text-gray-600">+{app.modules.length - 4}</span>
          )}
        </div>
        <span className="shrink-0">{formatRelativeTime(app.modifiedAt)}</span>
      </div>
    </button>
  );
}

function EmptyState({ workspaceRoot, onCreateApp }: { workspaceRoot: string | null; onCreateApp: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <p className="text-sm text-gray-400">No Frontier OS apps found</p>
      {workspaceRoot && (
        <p className="text-xs text-gray-600 font-mono mt-1">in {workspaceRoot}</p>
      )}
      <button
        onClick={onCreateApp}
        className="mt-4 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition-colors"
      >
        + Create Your First App
      </button>
    </div>
  );
}
