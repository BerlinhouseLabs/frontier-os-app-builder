import { useEffect, useRef } from 'react';

const SHORTCUTS = [
  { key: '\u2318K', description: 'Command palette' },
  { key: 'r', description: 'Refresh preview' },
  { key: 't', description: 'Toggle terminal' },
  { key: 'l', description: 'Toggle dev server logs' },
  { key: 's', description: 'Toggle sidebar (mobile)' },
  { key: 'Esc', description: 'Close topmost overlay' },
  { key: '?', description: 'Toggle this overlay' },
];

export function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 w-72 shadow-2xl">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">Keyboard Shortcuts</h3>
        <div className="space-y-1.5">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{s.description}</span>
              <kbd className="bg-gray-800 border border-gray-600 text-gray-300 px-1.5 py-0.5 rounded font-mono text-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
