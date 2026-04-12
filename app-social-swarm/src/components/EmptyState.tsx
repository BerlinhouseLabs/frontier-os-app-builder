interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 gap-4 text-center">
    <div className="w-12 h-12 rounded-full bg-muted-background flex items-center justify-center text-xl">
      🐝
    </div>
    <div className="flex flex-col gap-1">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    </div>
    {action && (
      <button
        onClick={action.onClick}
        className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
      >
        {action.label}
      </button>
    )}
  </div>
);
