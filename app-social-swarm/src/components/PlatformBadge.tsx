import type { SocialPlatform } from '../lib/frontier-services';
import { SOCIAL_PLATFORMS } from '../lib/frontier-services';

interface PlatformBadgeProps {
  platform: SocialPlatform;
  size?: 'sm' | 'md';
}

export const PlatformBadge = ({ platform, size = 'sm' }: PlatformBadgeProps) => {
  const info = SOCIAL_PLATFORMS.find((p) => p.value === platform);

  const colorMap: Record<SocialPlatform, string> = {
    twitter: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    linkedin: 'bg-blue-600/10 text-blue-400 border-blue-600/20',
    instagram: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    farcaster: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        colorMap[platform],
      ].join(' ')}
    >
      <span>{info?.emoji}</span>
      <span>{info?.label}</span>
    </span>
  );
};
