import { useState, useEffect, useRef, type ReactNode } from 'react';
import type { ViteStatus, ParseError } from '../hooks/useStudio';

export interface PhoneSize {
  id: string;
  label: string;
  width: number;
  height: number;
  kind: 'iphone' | 'android';
  /** Camera/notch treatment. */
  notch: 'island' | 'notch' | 'punch';
}

export const PHONE_SIZES: PhoneSize[] = [
  { id: 'iphone-se',         label: 'iPhone SE',         width: 375, height: 667, kind: 'iphone', notch: 'notch' },
  { id: 'iphone-13-mini',    label: 'iPhone 13 mini',    width: 375, height: 812, kind: 'iphone', notch: 'notch' },
  { id: 'iphone-14',         label: 'iPhone 14',         width: 390, height: 844, kind: 'iphone', notch: 'notch' },
  { id: 'iphone-15-pro',     label: 'iPhone 15 Pro',     width: 393, height: 852, kind: 'iphone', notch: 'island' },
  { id: 'iphone-15-pro-max', label: 'iPhone 15 Pro Max', width: 430, height: 932, kind: 'iphone', notch: 'island' },
  { id: 'pixel-7',           label: 'Pixel 7',           width: 412, height: 915, kind: 'android', notch: 'punch' },
  { id: 'galaxy-s23',        label: 'Galaxy S23',        width: 360, height: 780, kind: 'android', notch: 'punch' },
];

export const DEFAULT_PHONE_ID = 'iphone-15-pro';

export function findPhoneSize(id: string): PhoneSize {
  return PHONE_SIZES.find(p => p.id === id) ?? PHONE_SIZES[3];
}

interface PreviewFrameProps {
  devPort: number;
  viteStatus: ViteStatus;
  viteError: string | null;
  phone: PhoneSize;
  refreshKey: number;
  errors?: ParseError[];
}

/**
 * iPhone bezel — heavily rounded body, ringer + volume on the left,
 * power on the right. Notch or Dynamic Island at the top, gesture pill
 * at the bottom.
 */
function IphoneFrame({ phone, children }: { phone: PhoneSize; children: ReactNode }) {
  const isLarge = phone.width >= 410;
  const padding = isLarge ? 12 : 10;
  const outerRadius = isLarge ? '3rem' : '2.75rem';
  const innerRadius = isLarge ? '2.5rem' : '2.25rem';

  return (
    <div
      className="relative bg-gray-950 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-gray-700/60"
      style={{ padding: `${padding}px`, borderRadius: outerRadius }}
    >
      {/* Left side: ringer switch + 2 volume buttons */}
      <div className="absolute -left-[3px] top-24 w-[3px] h-7 bg-gray-700 rounded-l-sm" />
      <div className="absolute -left-[3px] top-36 w-[3px] h-12 bg-gray-700 rounded-l-sm" />
      <div className="absolute -left-[3px] top-52 w-[3px] h-12 bg-gray-700 rounded-l-sm" />
      {/* Right side: power button */}
      <div className="absolute -right-[3px] top-32 w-[3px] h-16 bg-gray-700 rounded-r-sm" />

      {/* Screen */}
      <div
        className="relative overflow-hidden bg-black ring-1 ring-gray-800"
        style={{ borderRadius: innerRadius }}
      >
        {children}

        {phone.notch === 'island' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-full z-10 pointer-events-none ring-1 ring-gray-900" />
        )}
        {phone.notch === 'notch' && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[24px] bg-black rounded-b-2xl z-10 pointer-events-none ring-1 ring-gray-900" />
        )}

        {/* iPhone home indicator — wide white pill */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[110px] h-1 bg-white/40 rounded-full z-10 pointer-events-none" />
      </div>
    </div>
  );
}

/**
 * Android bezel — squarer body, slimmer rounding, power + volume rocker
 * stacked on the right side. Top-center hole-punch camera. Slim gesture
 * pill at the bottom.
 */
function AndroidFrame({ phone, children }: { phone: PhoneSize; children: ReactNode }) {
  const padding = 8;
  const outerRadius = '1.75rem';
  const innerRadius = '1.5rem';

  return (
    <div
      className="relative bg-gray-900 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-gray-800"
      style={{ padding: `${padding}px`, borderRadius: outerRadius }}
    >
      {/* Right side: power button (top), volume rocker (below) */}
      <div className="absolute -right-[3px] top-24 w-[3px] h-8 bg-gray-700 rounded-r-sm" />
      <div className="absolute -right-[3px] top-40 w-[3px] h-14 bg-gray-700 rounded-r-sm" />

      {/* Screen */}
      <div
        className="relative overflow-hidden bg-black ring-1 ring-gray-800"
        style={{ borderRadius: innerRadius }}
      >
        {children}

        {/* Hole-punch camera — top center */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[10px] h-[10px] bg-black rounded-full z-10 pointer-events-none ring-1 ring-gray-700/40" />

        {/* Android gesture pill — thinner than iPhone, lower contrast */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[80px] h-[3px] bg-white/30 rounded-full z-10 pointer-events-none" />
      </div>
    </div>
  );
}

function PhoneFrame({ phone, children }: { phone: PhoneSize; children: ReactNode }) {
  if (phone.kind === 'android') {
    return <AndroidFrame phone={phone}>{children}</AndroidFrame>;
  }
  return <IphoneFrame phone={phone}>{children}</IphoneFrame>;
}

export function PreviewFrame({ devPort, viteStatus, viteError, phone, refreshKey, errors = [] }: PreviewFrameProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Auto-scale the phone to fit the available preview area so the user
  // never has to scroll the outer container.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Bezel padding (iPhone 10–12px, Android 8px) + ring/shadow → assume ~28px overhead
    const bezelOverhead = 28;
    const breathingRoom = 32; // padding around the phone
    const phoneRenderedWidth = phone.width + bezelOverhead;
    const phoneRenderedHeight = phone.height + bezelOverhead;

    const recompute = () => {
      const availableWidth = el.clientWidth - breathingRoom;
      const availableHeight = el.clientHeight - breathingRoom;
      if (availableWidth <= 0 || availableHeight <= 0) return;
      const sx = availableWidth / phoneRenderedWidth;
      const sy = availableHeight / phoneRenderedHeight;
      const next = Math.min(1, sx, sy);
      setScale(next);
    };

    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [phone.width, phone.height]);

  // Reset dismissed state when errors change
  useEffect(() => {
    setDismissed(false);
    setExpanded(false);
  }, [errors]);
  if (viteStatus === 'starting') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-amber-400 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Starting dev server...</p>
        </div>
      </div>
    );
  }

  if (viteStatus === 'stopped' || viteStatus === 'error') {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900">
        <div className="text-center space-y-2 max-w-sm px-4">
          <p className="text-sm text-gray-400">
            {viteStatus === 'error' ? 'Dev server encountered an error' : 'Dev server is not running'}
          </p>
          {viteError && (
            <pre className="text-xs text-amber-400/80 bg-gray-800 rounded-lg p-3 text-left overflow-x-auto whitespace-pre-wrap">
              {viteError}
            </pre>
          )}
          {!viteError && (
            <p className="text-xs text-gray-500">
              Waiting for scaffold to complete or run <code className="text-gray-400 font-mono">npm run dev</code> manually
            </p>
          )}
        </div>
      </div>
    );
  }

  const showOverlay = viteStatus === 'running' && errors.length > 0 && !dismissed;

  const iframe = (
    <iframe
      key={refreshKey}
      src={`http://localhost:${devPort}`}
      className="block bg-white border-0"
      style={{ width: `${phone.width}px`, height: `${phone.height}px` }}
      title="App Preview"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
    />
  );

  return (
    <div ref={containerRef} className="h-full relative flex items-center justify-center bg-gray-950 p-4 overflow-hidden">
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          // Reserve scaled-down footprint so flexbox centering uses real size
          willChange: 'transform',
        }}
      >
        <PhoneFrame phone={phone}>{iframe}</PhoneFrame>
      </div>
      {showOverlay && (
        <div className="absolute bottom-0 inset-x-0 z-10 bg-red-950/90 backdrop-blur-sm border-t border-red-500/30">
          <div
            className="flex items-center justify-between px-3 py-2 cursor-pointer"
            onClick={() => setExpanded(v => !v)}
          >
            <span className="text-xs text-red-300">
              {errors.length} issue{errors.length > 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <svg
                className={`w-3 h-3 text-red-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              <button
                onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
                className="text-xs text-red-400 hover:text-red-200"
              >
                dismiss
              </button>
            </div>
          </div>
          {expanded && (
            <div className="px-3 pb-2 space-y-1 max-h-40 overflow-y-auto">
              {errors.map((err, i) => (
                <div key={i} className="text-xs">
                  <span className="text-red-400 font-mono">{err.file}</span>
                  <span className="text-red-300/70 ml-1.5">{err.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
