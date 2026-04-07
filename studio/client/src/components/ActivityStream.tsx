import { useState, useEffect, useRef, useCallback } from 'react';
import type { ActivityEvent } from '../hooks/useStudio';

const TYPE_ICONS: Record<ActivityEvent['type'], string> = {
  file_created: '+',
  file_modified: '~',
  phase_changed: '#',
  status_changed: '*',
  git_commit: '>',
  vite_event: '^',
};

const TYPE_COLORS: Record<ActivityEvent['type'], string> = {
  file_created: 'text-green-400',
  file_modified: 'text-blue-400',
  phase_changed: 'text-purple-400',
  status_changed: 'text-amber-400',
  git_commit: 'text-cyan-400',
  vite_event: 'text-orange-400',
};

type FilterGroup = 'files' | 'phase' | 'status' | 'git' | 'vite';

const FILTER_GROUPS: { key: FilterGroup; label: string; icon: string; activeClass: string; types: ActivityEvent['type'][] }[] = [
  { key: 'files', label: 'Files', icon: '+', activeClass: 'bg-green-500/20 text-green-400', types: ['file_created', 'file_modified'] },
  { key: 'phase', label: 'Phase', icon: '#', activeClass: 'bg-purple-500/20 text-purple-400', types: ['phase_changed'] },
  { key: 'status', label: 'Status', icon: '*', activeClass: 'bg-amber-500/20 text-amber-400', types: ['status_changed'] },
  { key: 'git', label: 'Git', icon: '>', activeClass: 'bg-cyan-500/20 text-cyan-400', types: ['git_commit'] },
  { key: 'vite', label: 'Vite', icon: '^', activeClass: 'bg-orange-500/20 text-orange-400', types: ['vite_event'] },
];

const FILTER_STORAGE_KEY = 'studio-activity-filters';

function loadHiddenFilters(): Set<FilterGroup> {
  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored));
  } catch { /* ignore */ }
  return new Set();
}

function formatTime(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 5) return 'now';
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

interface ActivityStreamProps {
  activities: ActivityEvent[];
  showFilters?: boolean;
}

export function ActivityStream({ activities, showFilters = false }: ActivityStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);
  const [hiddenGroups, setHiddenGroups] = useState<Set<FilterGroup>>(loadHiddenFilters);
  const [searchQuery, setSearchQuery] = useState('');

  // Re-render every 15s so formatTime() stays fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const toggleFilter = useCallback((group: FilterGroup) => {
    setHiddenGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Build set of hidden event types from hidden groups
  const hiddenTypes = new Set<ActivityEvent['type']>();
  for (const group of FILTER_GROUPS) {
    if (hiddenGroups.has(group.key)) {
      for (const t of group.types) hiddenTypes.add(t);
    }
  }

  // Auto-scroll unless user has scrolled up
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      autoScrollRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (autoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activities.length]);

  const filtered = activities.slice(-50)
    .filter(e => !hiddenTypes.has(e.type))
    .filter(e => !searchQuery || e.message.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col min-h-0">
      {/* Filter pills + search — hidden by default; reveal via parent */}
      {showFilters && (
        <div className="flex gap-1 pb-1.5 flex-wrap items-center shrink-0">
          {FILTER_GROUPS.map((group) => {
            const active = !hiddenGroups.has(group.key);
            return (
              <button
                key={group.key}
                onClick={() => toggleFilter(group.key)}
                className={`text-xs px-1.5 py-0.5 rounded font-mono transition-colors ${
                  active ? group.activeClass : 'bg-gray-800 text-gray-600'
                }`}
              >
                {group.icon} {group.label}
              </button>
            );
          })}
          <div className="relative ml-auto flex items-center">
            <input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-b border-gray-700 text-xs text-gray-300 px-1 py-0.5 w-24 focus:w-40 transition-all outline-none placeholder-gray-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-0 text-gray-500 hover:text-gray-300 text-xs px-1"
              >
                x
              </button>
            )}
          </div>
        </div>
      )}

      {activities.length === 0 ? (
        <p className="text-xs text-gray-600 italic px-1 py-2">
          Waiting for Claude Code to work...
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-600 italic px-1 py-2">No matches</p>
      ) : (
        <div ref={containerRef} className="max-h-64 overflow-y-auto space-y-0.5">
          {filtered.map((event, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs leading-relaxed animate-in fade-in">
              <span className="text-gray-600 w-6 text-right shrink-0 font-mono">
                {formatTime(event.timestamp)}
              </span>
              <span className={`shrink-0 font-mono ${TYPE_COLORS[event.type]}`}>
                {TYPE_ICONS[event.type]}
              </span>
              <span className="text-gray-400 break-all">{event.message}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
