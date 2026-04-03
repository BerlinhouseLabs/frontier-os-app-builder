import { useState, useCallback, useRef, useEffect } from 'react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  timestamp: number;
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = `toast-${++counterRef.current}`;
    const toast: ToastItem = { id, message, type, timestamp: Date.now() };

    setToasts(prev => {
      const next = [...prev, toast];
      // Max 3 visible
      if (next.length > 3) return next.slice(-3);
      return next;
    });

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timersRef.current.delete(id);
    }, 5000);
    timersRef.current.set(id, timer);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  return { toasts, addToast, dismissToast };
}
