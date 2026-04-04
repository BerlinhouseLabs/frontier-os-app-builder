const STATUS_CONFIG: Record<string, { label: string; color: string; pulse?: boolean }> = {
  'ready-to-discuss': { label: 'Ready to Discuss', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'discussing': { label: 'Discussing', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  'ready-to-plan': { label: 'Ready to Plan', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'planning': { label: 'Planning', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  'ready-to-execute': { label: 'Ready to Execute', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'executing': { label: 'Executing', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', pulse: true },
  'phase-complete': { label: 'Phase Complete', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  'milestone-complete': { label: 'Milestone Complete', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.color}`}>
      {config.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
        </span>
      )}
      {config.label}
    </span>
  );
}
