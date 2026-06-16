import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '../lib/frontier-services';
import { useBalance } from '../hooks/useBalance';
import { useSwarmRun, SWARM_RUN_COST } from '../hooks/useSwarmRun';
import { SwarmProgress } from '../components/SwarmProgress';
import { PlatformBadge } from '../components/PlatformBadge';
import type { SocialPlatform, CreateCampaignParams } from '../lib/frontier-services';
import { SOCIAL_PLATFORMS } from '../lib/frontier-services';

const TONE_OPTIONS = [
  'Energetic and visionary',
  'Professional and informative',
  'Casual and community-first',
  'Technical yet accessible',
  'Inspiring and aspirational',
  'Clear and concise',
];

export const CampaignCreator = () => {
  const navigate = useNavigate();
  const services = useServices();
  const { balance } = useBalance();
  const { steps, generatedContent, isRunning, isComplete, error, txHash, startRun } = useSwarmRun();

  const [form, setForm] = useState<CreateCampaignParams>({
    title: '',
    brief: '',
    targetAudience: '',
    platforms: ['twitter', 'linkedin'],
    tone: TONE_OPTIONS[0],
  });

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const togglePlatform = (platform: SocialPlatform) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const canSubmit =
    form.title.trim().length >= 3 &&
    form.brief.trim().length >= 20 &&
    form.targetAudience.trim().length >= 5 &&
    form.platforms.length >= 1 &&
    !isCreating &&
    !isRunning;

  const handleLaunch = async () => {
    if (!canSubmit) return;

    setCreateError(null);
    setIsCreating(true);

    try {
      const campaign = await services.swarm.createCampaign(form);
      setCampaignId(campaign.id);
      await startRun(campaign, balance);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const insufficientBalance =
    balance && parseFloat(balance.total) < parseFloat(SWARM_RUN_COST);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold text-foreground">New Campaign</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Brief the swarm and generate content for Frontier Tower
        </p>
      </div>

      {/* Form */}
      {!isRunning && !isComplete && (
        <div className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Campaign Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Frontier Tower Spring Event"
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Brief */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Campaign Brief</label>
            <textarea
              value={form.brief}
              onChange={(e) => setForm((p) => ({ ...p, brief: e.target.value }))}
              placeholder="Describe your campaign goal, key messages, and what you want to achieve…"
              rows={4}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
            <p className="text-xs text-muted-foreground">{form.brief.length} / 500 chars</p>
          </div>

          {/* Target Audience */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Target Audience</label>
            <input
              type="text"
              value={form.targetAudience}
              onChange={(e) => setForm((p) => ({ ...p, targetAudience: e.target.value }))}
              placeholder="e.g. Web3 founders and developers in Berlin"
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Platforms */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-foreground">Target Platforms</label>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_PLATFORMS.map((p) => {
                const selected = form.platforms.includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePlatform(p.value)}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      selected
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-card text-muted-foreground border-border hover:border-outline hover:text-foreground',
                    ].join(' ')}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
            {form.platforms.length === 0 && (
              <p className="text-xs text-danger">Select at least one platform</p>
            )}
          </div>

          {/* Tone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-foreground">Content Tone</label>
            <select
              value={form.tone}
              onChange={(e) => setForm((p) => ({ ...p, tone: e.target.value }))}
              className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              {TONE_OPTIONS.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>

          {/* Cost summary */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-foreground">Swarm Cost</h3>
            <div className="flex flex-col gap-1">
              {[
                { agent: '🗓️ StrategyBot', price: '0.05 FND' },
                { agent: '✍️ CopyForge', price: '0.08 FND' },
                { agent: '🎨 VisualCraft', price: '0.04 FND' },
                { agent: '#️⃣ HashSwarm', price: '0.03 FND' },
                { agent: '🎙️ ToneShift', price: '0.03 FND' },
              ].map((row) => (
                <div key={row.agent} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{row.agent}</span>
                  <span className="text-muted-foreground">{row.price}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-border mt-1">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">{SWARM_RUN_COST} FND</span>
              </div>
            </div>
            {balance && (
              <div className={`flex items-center gap-1.5 text-xs ${insufficientBalance ? 'text-danger' : 'text-success'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${insufficientBalance ? 'bg-danger' : 'bg-success'}`} />
                Balance: {balance.total} FND
                {insufficientBalance && ' — insufficient'}
              </div>
            )}
          </div>

          {(createError || error) && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg px-4 py-3 text-xs text-danger">
              {createError ?? error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/campaigns')}
              className="flex-1 px-4 py-2.5 border border-border text-sm font-medium text-foreground rounded-xl hover:bg-muted-background transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={!canSubmit || !!insufficientBalance}
              className="flex-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Paying…' : `Launch Swarm · ${SWARM_RUN_COST} FND`}
            </button>
          </div>
        </div>
      )}

      {/* Swarm progress */}
      {(isRunning || isComplete) && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-sm">
              🐝
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{form.title}</h2>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {form.platforms.map((p) => (
                  <PlatformBadge key={p} platform={p} />
                ))}
              </div>
            </div>
          </div>

          <SwarmProgress
            steps={steps}
            isRunning={isRunning}
            isComplete={isComplete}
            txHash={txHash}
            contentCount={generatedContent.length}
          />

          {isComplete && campaignId && (
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/campaigns/${campaignId}`)}
                className="flex-1 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
              >
                View Campaign
              </button>
              <button
                onClick={() => navigate('/content')}
                className="flex-1 px-4 py-2.5 border border-border text-sm font-medium text-foreground rounded-xl hover:bg-muted-background transition-colors"
              >
                Browse Content
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
