import { useState, useEffect, type ReactNode } from 'react';

interface SectionProps {
  title: string;
  /** Stable key for localStorage persistence of collapsed state */
  storageKey: string;
  defaultOpen?: boolean;
  /** Optional adornment shown right of the title (e.g., a count or filter button) */
  trailing?: ReactNode;
  children: ReactNode;
}

const STORAGE_PREFIX = 'studio-section:';

function loadOpen(key: string, fallback: boolean): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (stored === '1') return true;
    if (stored === '0') return false;
  } catch { /* ignore */ }
  return fallback;
}

/**
 * Collapsible sidebar section with persisted open/closed state.
 * Default state is set per-section so we can keep "essentials" open
 * and tuck away "details".
 */
export function Section({ title, storageKey, defaultOpen = true, trailing, children }: SectionProps) {
  const [open, setOpen] = useState(() => loadOpen(storageKey, defaultOpen));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PREFIX + storageKey, open ? '1' : '0');
    } catch { /* ignore */ }
  }, [open, storageKey]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="group flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {title}
        </button>
        {trailing}
      </div>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
