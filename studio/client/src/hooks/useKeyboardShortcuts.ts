import { useEffect } from 'react';

type ShortcutEntry = (() => void) | { handler: () => void; meta?: boolean };
type ShortcutMap = Record<string, ShortcutEntry>;

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in inputs
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag && INPUT_TAGS.has(tag)) return;
      if ((document.activeElement as HTMLElement)?.isContentEditable) return;

      const entry = shortcuts[e.key];
      if (!entry) return;

      if (typeof entry === 'function') {
        // Plain shortcut — skip if any modifier is held
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        entry();
      } else {
        // Object with optional meta requirement
        if (entry.meta && !(e.metaKey || e.ctrlKey)) return;
        if (!entry.meta && (e.metaKey || e.ctrlKey)) return;
        e.preventDefault();
        entry.handler();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
