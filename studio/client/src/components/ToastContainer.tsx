import type { ToastItem } from '../hooks/useToasts';

const TYPE_DOT: Record<ToastItem['type'], string> = {
  success: 'bg-green-400',
  info: 'bg-blue-400',
  warning: 'bg-amber-400',
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  const latest = toasts[toasts.length - 1];

  return (
    <div
      onClick={() => onDismiss(latest.id)}
      className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/90 backdrop-blur-sm cursor-pointer transition-opacity duration-300 ${
        latest.exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[latest.type]}`} />
      <span className="text-[11px] text-gray-300">{latest.message}</span>
    </div>
  );
}
