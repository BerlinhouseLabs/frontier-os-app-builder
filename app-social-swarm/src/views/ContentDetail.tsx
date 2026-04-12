import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useServices } from '../lib/frontier-services';
import { PlatformBadge } from '../components/PlatformBadge';
import type { ContentPiece } from '../lib/frontier-services';

export const ContentDetail = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const services = useServices();

  const [piece, setPiece] = useState<ContentPiece | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduledFor, setScheduledFor] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!contentId) return;
    const load = async () => {
      try {
        const c = await services.swarm.getContent(contentId);
        setPiece(c);
        if (c?.scheduledFor) {
          setScheduledFor(c.scheduledFor.slice(0, 16));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [services, contentId]);

  const handleCopy = async () => {
    if (!piece) return;
    const text = [piece.copy, '', piece.hashtags.join(' ')].join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSchedule = async () => {
    if (!piece || !scheduledFor) return;
    setScheduling(true);
    try {
      const updated = await services.swarm.scheduleContent(piece.id, new Date(scheduledFor).toISOString());
      setPiece(updated);
      setSuccessMsg('Scheduled!');
      setTimeout(() => setSuccessMsg(null), 2000);
    } finally {
      setScheduling(false);
    }
  };

  const handlePublish = async () => {
    if (!piece) return;
    setPublishing(true);
    try {
      const updated = await services.swarm.publishContent(piece.id);
      setPiece(updated);
      setSuccessMsg('Marked as published!');
      setTimeout(() => setSuccessMsg(null), 2000);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="h-48 bg-card border border-border rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!piece) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-sm text-muted-foreground">Content not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => navigate('/content')}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
        >
          ← Content Feed
        </button>
        <div className="flex items-center gap-2">
          <PlatformBadge platform={piece.platform} size="md" />
          <span className="text-xs text-muted-foreground capitalize">{piece.type}</span>
          {piece.isPublished && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
              Published
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{piece.campaignTitle}</p>
      </div>

      {/* Copy */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-foreground">Post Copy</h3>
          <button
            onClick={handleCopy}
            className="text-xs text-primary hover:underline"
          >
            {copied ? '✅ Copied!' : 'Copy to clipboard'}
          </button>
        </div>
        <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
          {piece.copy}
        </pre>
        {piece.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
            {piece.hashtags.map((tag) => (
              <span key={tag} className="text-xs text-primary">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Image prompt */}
      {piece.imagePrompt && (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-foreground">🎨 Image Generation Prompt</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{piece.imagePrompt}</p>
        </div>
      )}

      {/* Schedule */}
      {!piece.isPublished && (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-xs font-semibold text-foreground">Schedule</h3>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="flex-1 bg-muted-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleSchedule}
              disabled={!scheduledFor || scheduling}
              className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {scheduling ? 'Saving…' : piece.scheduledFor ? 'Update' : 'Schedule'}
            </button>
          </div>
          {piece.scheduledFor && (
            <p className="text-xs text-muted-foreground">
              Scheduled for: {new Date(piece.scheduledFor).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Publish */}
      {!piece.isPublished && (
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="w-full py-2.5 border border-success/30 text-success text-sm font-semibold rounded-xl hover:bg-success/10 transition-colors disabled:opacity-50"
        >
          {publishing ? 'Marking…' : '✓ Mark as Published'}
        </button>
      )}

      {successMsg && (
        <div className="bg-success/10 border border-success/20 rounded-lg px-4 py-3 text-xs text-success text-center">
          {successMsg}
        </div>
      )}
    </div>
  );
};
