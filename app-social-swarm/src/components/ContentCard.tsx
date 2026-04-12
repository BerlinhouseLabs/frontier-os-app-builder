import type { ContentPiece } from '../lib/frontier-services';
import { PlatformBadge } from './PlatformBadge';

interface ContentCardProps {
  piece: ContentPiece;
  onClick?: () => void;
}

export const ContentCard = ({ piece, onClick }: ContentCardProps) => {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-card border border-border rounded-xl p-4 flex flex-col gap-3',
        onClick ? 'cursor-pointer hover:border-outline transition-colors' : '',
      ].join(' ')}
    >
      {/* Platform + type */}
      <div className="flex items-center justify-between gap-2">
        <PlatformBadge platform={piece.platform} />
        <div className="flex items-center gap-2">
          {piece.isPublished && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
              Published
            </span>
          )}
          {piece.scheduledFor && !piece.isPublished && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              Scheduled
            </span>
          )}
          <span className="text-xs text-muted-foreground capitalize">{piece.type}</span>
        </div>
      </div>

      {/* Copy preview */}
      <p className="text-xs text-foreground leading-relaxed line-clamp-3 whitespace-pre-line">
        {piece.copy}
      </p>

      {/* Hashtags */}
      {piece.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {piece.hashtags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-primary/70">
              {tag}
            </span>
          ))}
          {piece.hashtags.length > 3 && (
            <span className="text-xs text-muted-foreground">+{piece.hashtags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground line-clamp-1">{piece.campaignTitle}</span>
        {piece.imagePrompt && (
          <span className="text-xs text-muted-foreground">🎨 Prompt</span>
        )}
      </div>
    </div>
  );
};
