import { useEffect, useRef } from 'react';

interface Props {
  lines: string[];
  onRefresh: () => void;
  onClose: () => void;
}

export function ViteLogViewer({ lines, onRefresh, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [lines]);

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
      <div className="bg-gray-950 border border-gray-700 rounded-xl w-[600px] max-w-[90vw] max-h-[70vh] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-200">Vite Dev Server Logs</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              refresh
            </button>
            <button
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              close
            </button>
          </div>
        </div>
        <pre
          ref={preRef}
          className="flex-1 overflow-auto px-4 py-3 text-xs font-mono text-gray-300 leading-relaxed"
        >
          {lines.length === 0 ? (
            <span className="text-gray-600">No log output yet</span>
          ) : (
            lines.join('\n')
          )}
        </pre>
      </div>
    </div>
  );
}
