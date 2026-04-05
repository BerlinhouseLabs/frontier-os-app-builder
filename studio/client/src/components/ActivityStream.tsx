import { useEffect, useRef } from 'react';
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

function formatTime(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 5) return 'now';
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

export function ActivityStream({ activities }: { activities: ActivityEvent[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

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

  if (activities.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-xs text-gray-600 text-center">
          Activity will appear here as Claude Code works...
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
      {activities.slice(-50).map((event, i) => (
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
  );
}
