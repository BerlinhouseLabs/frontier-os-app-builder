import type { ToastItem } from '../hooks/useToasts';

const TYPE_STYLES: Record<ToastItem['type'], { bg: string; icon: string }> = {
  success: { bg: 'bg-green-500/15 border-green-500/30 text-green-400', icon: 'M5 13l4 4L19 7' },
  info: { bg: 'bg-blue-500/15 border-blue-500/30 text-blue-400', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  warning: { bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => {
        const style = TYPE_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${style.bg} shadow-lg transition-all duration-300 ${
              toast.exiting ? 'opacity-0 translate-x-full' : 'animate-in slide-in-from-right'
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
            </svg>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="opacity-50 hover:opacity-100 transition-opacity ml-1"
            >
              x
            </button>
          </div>
        );
      })}
    </div>
  );
}
