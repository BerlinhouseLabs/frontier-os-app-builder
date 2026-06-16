import type { AgentCategory } from '../lib/frontier-services';

const CATEGORY_STYLES: Record<AgentCategory, { bg: string; text: string; label: string }> = {
  'ai-assistant': { bg: 'bg-primary/15', text: 'text-primary', label: 'AI Assistant' },
  'data-analysis': { bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Data Analysis' },
  'content-generation': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Content' },
  'code-assistance': { bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'Code' },
  'image-generation': { bg: 'bg-pink-500/15', text: 'text-pink-400', label: 'Images' },
  'research': { bg: 'bg-yellow-500/15', text: 'text-yellow-400', label: 'Research' },
  'other': { bg: 'bg-muted-background', text: 'text-muted-foreground', label: 'Other' },
};

interface CategoryBadgeProps {
  category: AgentCategory;
  size?: 'sm' | 'md';
}

export const CategoryBadge = ({ category, size = 'sm' }: CategoryBadgeProps) => {
  const { bg, text, label } = CATEGORY_STYLES[category];
  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-medium',
        bg,
        text,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      ].join(' ')}
    >
      {label}
    </span>
  );
};
