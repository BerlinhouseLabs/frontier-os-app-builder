import { useState, useCallback, useRef, useEffect } from 'react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  timestamp: number;
  exiting?: boolean;
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const exitTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const startExit = useCallback((id: string) => {
    // Mark as exiting for animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    // Clear auto-expire timer
    const autoTimer = timersRef.current.get(id);
    if (autoTimer) {
      clearTimeout(autoTimer);
      timersRef.current.delete(id);
    }
    // Remove after exit animation completes
    const exitTimer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      exitTimersRef.current.delete(id);
    }, 300);
    exitTimersRef.current.set(id, exitTimer);
  }, []);

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
      startExit(id);
      timersRef.current.delete(id);
    }, 5000);
    timersRef.current.set(id, timer);
  }, [startExit]);

  const dismissToast = useCallback((id: string) => {
    startExit(id);
  }, [startExit]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) clearTimeout(timer);
      for (const timer of exitTimersRef.current.values()) clearTimeout(timer);
    };
  }, []);

  return { toasts, addToast, dismissToast };
}
