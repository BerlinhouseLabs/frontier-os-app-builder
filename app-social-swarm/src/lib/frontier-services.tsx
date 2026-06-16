import { createContext, useContext, type ReactNode } from 'react';

// ── Shared Types ────────────────────────────────────────────────────────────

export interface WalletBalanceFormatted {
  total: string;
  fnd: string;
  internalFnd: string;
}

export interface UserOperationReceipt {
  userOpHash: string;
  transactionHash: string;
  blockNumber: bigint;
  success: boolean;
}

export interface UserDetails {
  id: string;
  email: string;
  walletAddress: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

// ── Social Swarm Domain Types ────────────────────────────────────────────────

export type SocialPlatform = 'twitter' | 'linkedin' | 'instagram' | 'farcaster';

export type ContentType = 'post' | 'thread' | 'story' | 'reel-script';

export type CampaignStatus = 'draft' | 'running' | 'completed' | 'failed';

export type SwarmAgentRole =
  | 'content-planner'
  | 'copywriter'
  | 'image-prompter'
  | 'hashtag-optimizer'
  | 'tone-adapter';

export const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string; emoji: string }[] = [
  { value: 'twitter', label: 'Twitter / X', emoji: '🐦' },
  { value: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { value: 'instagram', label: 'Instagram', emoji: '📸' },
  { value: 'farcaster', label: 'Farcaster', emoji: '🟣' },
];

export const SWARM_AGENT_ROLES: { value: SwarmAgentRole; label: string; emoji: string; description: string }[] = [
  {
    value: 'content-planner',
    label: 'Content Planner',
    emoji: '🗓️',
    description: 'Analyses the brief and designs the overall content strategy and posting schedule.',
  },
  {
    value: 'copywriter',
    label: 'Copywriter',
    emoji: '✍️',
    description: 'Writes platform-native copy for each selected social channel.',
  },
  {
    value: 'image-prompter',
    label: 'Image Prompter',
    emoji: '🎨',
    description: 'Generates detailed image-generation prompts tuned to each platform\'s visual style.',
  },
  {
    value: 'hashtag-optimizer',
    label: 'Hashtag Optimizer',
    emoji: '#️⃣',
    description: 'Selects trending, relevant hashtags to maximise reach and discoverability.',
  },
  {
    value: 'tone-adapter',
    label: 'Tone Adapter',
    emoji: '🎙️',
    description: 'Adapts copy tone and length to the conventions of each target platform.',
  },
];

export interface SwarmAgent {
  id: string;
  role: SwarmAgentRole;
  name: string;
  description: string;
  endpoint: string;
  pricePerRun: string;
  paymentAddress: string;
  isActive: boolean;
  runsCompleted: number;
}

export interface Campaign {
  id: string;
  title: string;
  brief: string;
  targetAudience: string;
  platforms: SocialPlatform[];
  tone: string;
  status: CampaignStatus;
  createdAt: string;
  completedAt: string | null;
  contentCount: number;
  totalCost: string;
}

export interface ContentPiece {
  id: string;
  campaignId: string;
  campaignTitle: string;
  platform: SocialPlatform;
  type: ContentType;
  copy: string;
  imagePrompt: string | null;
  hashtags: string[];
  scheduledFor: string | null;
  isPublished: boolean;
  createdAt: string;
}

export interface SwarmStep {
  agentRole: SwarmAgentRole;
  agentName: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  output: string | null;
}

export interface SwarmPayment {
  id: string;
  campaignId: string;
  campaignTitle: string;
  amount: string;
  transactionHash: string;
  timestamp: string;
  status: 'success' | 'failed';
}

export interface CreateCampaignParams {
  title: string;
  brief: string;
  targetAudience: string;
  platforms: SocialPlatform[];
  tone: string;
}

// ── Services Interface ────────────────────────────────────────────────────────

export interface WalletService {
  getBalanceFormatted: () => Promise<WalletBalanceFormatted>;
  getAddress: () => Promise<string>;
  transferOverallFrontierDollar: (to: string, amount: string) => Promise<UserOperationReceipt>;
}

export interface UserService {
  getDetails: () => Promise<UserDetails>;
}

export interface SwarmService {
  listCampaigns: () => Promise<Campaign[]>;
  getCampaign: (id: string) => Promise<Campaign | null>;
  createCampaign: (params: CreateCampaignParams) => Promise<Campaign>;
  runSwarm: (campaignId: string) => AsyncGenerator<SwarmStep, ContentPiece[], void>;
  deleteCampaign: (id: string) => Promise<void>;
  listContent: (campaignId?: string, platform?: SocialPlatform) => Promise<ContentPiece[]>;
  getContent: (id: string) => Promise<ContentPiece | null>;
  scheduleContent: (contentId: string, scheduledFor: string) => Promise<ContentPiece>;
  publishContent: (contentId: string) => Promise<ContentPiece>;
  listSwarmAgents: () => Promise<SwarmAgent[]>;
  getPaymentHistory: () => Promise<SwarmPayment[]>;
  recordPayment: (payment: Omit<SwarmPayment, 'id'>) => Promise<SwarmPayment>;
}

export interface FrontierServices {
  wallet: WalletService;
  user: UserService;
  swarm: SwarmService;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_SWARM_AGENTS: SwarmAgent[] = [
  {
    id: 'swarm-agent-001',
    role: 'content-planner',
    name: 'StrategyBot',
    description: 'Analyses your brief and designs the optimal content strategy, timing, and platform mix for maximum Frontier Tower reach.',
    endpoint: 'https://api.strategybot.ai/v1/plan',
    pricePerRun: '0.05',
    paymentAddress: '0x1111111111111111111111111111111111111111',
    isActive: true,
    runsCompleted: 4821,
  },
  {
    id: 'swarm-agent-002',
    role: 'copywriter',
    name: 'CopyForge',
    description: 'Writes compelling, platform-native copy in your brand voice. Adapts length, structure, and calls-to-action for each channel.',
    endpoint: 'https://api.copyforge.ai/v1/write',
    pricePerRun: '0.08',
    paymentAddress: '0x2222222222222222222222222222222222222222',
    isActive: true,
    runsCompleted: 9314,
  },
  {
    id: 'swarm-agent-003',
    role: 'image-prompter',
    name: 'VisualCraft',
    description: 'Generates detailed image-generation prompts optimised for each platform\'s visual style — from photorealistic to branded illustrations.',
    endpoint: 'https://api.visualcraft.io/v1/prompt',
    pricePerRun: '0.04',
    paymentAddress: '0x3333333333333333333333333333333333333333',
    isActive: true,
    runsCompleted: 7062,
  },
  {
    id: 'swarm-agent-004',
    role: 'hashtag-optimizer',
    name: 'HashSwarm',
    description: 'Selects the highest-performing hashtags using real-time trend analysis. Balances reach, relevance, and niche targeting.',
    endpoint: 'https://api.hashswarm.dev/v1/optimize',
    pricePerRun: '0.03',
    paymentAddress: '0x4444444444444444444444444444444444444444',
    isActive: true,
    runsCompleted: 12503,
  },
  {
    id: 'swarm-agent-005',
    role: 'tone-adapter',
    name: 'ToneShift',
    description: 'Rewrites copy with the exact tone, formality, and length conventions expected on each platform — casual for Twitter, professional for LinkedIn.',
    endpoint: 'https://api.toneshift.ai/v1/adapt',
    pricePerRun: '0.03',
    paymentAddress: '0x5555555555555555555555555555555555555555',
    isActive: true,
    runsCompleted: 8190,
  },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'campaign-001',
    title: 'Frontier Tower Grand Opening',
    brief: 'Announce the opening of Frontier Tower\'s new innovation hub to the Web3 community. Focus on community, collaboration, and the future of decentralised work.',
    targetAudience: 'Web3 founders, developers, and crypto enthusiasts in Berlin and online',
    platforms: ['twitter', 'linkedin', 'farcaster'],
    tone: 'Energetic and visionary',
    status: 'completed',
    createdAt: '2026-03-20T10:00:00Z',
    completedAt: '2026-03-20T10:02:30Z',
    contentCount: 9,
    totalCost: '0.23',
  },
  {
    id: 'campaign-002',
    title: 'FND Token Community Update',
    brief: 'Share the latest FND tokenomics update with the community. Highlight the new staking rewards and governance voting mechanism.',
    targetAudience: 'Existing FND holders and DeFi community',
    platforms: ['twitter', 'farcaster'],
    tone: 'Clear and informative',
    status: 'completed',
    createdAt: '2026-03-25T14:30:00Z',
    completedAt: '2026-03-25T14:32:10Z',
    contentCount: 6,
    totalCost: '0.23',
  },
  {
    id: 'campaign-003',
    title: 'AI Agent Marketplace Launch',
    brief: 'Launch announcement for the x402 Agent Market on Frontier OS. Educate the audience on x402 micropayments and what the marketplace offers.',
    targetAudience: 'AI developers, Frontier OS members, Web3 builders',
    platforms: ['twitter', 'linkedin', 'instagram', 'farcaster'],
    tone: 'Innovative and technical yet accessible',
    status: 'completed',
    createdAt: '2026-03-29T09:00:00Z',
    completedAt: '2026-03-29T09:03:05Z',
    contentCount: 12,
    totalCost: '0.23',
  },
];

const MOCK_CONTENT: ContentPiece[] = [
  {
    id: 'content-001',
    campaignId: 'campaign-001',
    campaignTitle: 'Frontier Tower Grand Opening',
    platform: 'twitter',
    type: 'post',
    copy: '🚀 Frontier Tower is open. The future of decentralised work isn\'t coming — it\'s here.\n\nJoin us in Berlin\'s newest Web3 innovation hub. Builders, founders, and dreamers welcome.\n\n→ frontier.town',
    imagePrompt: 'Futuristic glass tower at golden hour, Web3 aesthetic with subtle holographic grid overlay, Berlin skyline in background, vibrant purple and gold colour palette, cinematic wide shot',
    hashtags: ['#FrontierTower', '#Web3Berlin', '#DecentralisedWork', '#BuildOnFrontier', '#CryptoHub'],
    scheduledFor: '2026-04-01T09:00:00Z',
    isPublished: false,
    createdAt: '2026-03-20T10:02:30Z',
  },
  {
    id: 'content-002',
    campaignId: 'campaign-001',
    campaignTitle: 'Frontier Tower Grand Opening',
    platform: 'linkedin',
    type: 'post',
    copy: 'We\'re thrilled to announce the opening of Frontier Tower — Berlin\'s premier innovation hub for Web3 founders and decentralised technology teams.\n\nFrontier Tower offers:\n✅ Co-working and private offices\n✅ Frontier OS integration for seamless collaboration\n✅ Regular community events and hackathons\n✅ On-site legal and technical support\n\nWhether you\'re building the next DeFi protocol or the next great Web3 consumer app, Frontier Tower is where your journey continues.\n\nConnect with us to learn more about membership.',
    imagePrompt: 'Professional interior photography of a modern co-working space with high ceilings, exposed concrete, plants, and subtle purple LED accents, people collaborating at workstations, warm inviting atmosphere',
    hashtags: ['#FrontierTower', '#Web3', '#Innovation', '#Blockchain', '#StartupHub', '#Berlin'],
    scheduledFor: '2026-04-01T10:00:00Z',
    isPublished: false,
    createdAt: '2026-03-20T10:02:30Z',
  },
  {
    id: 'content-003',
    campaignId: 'campaign-001',
    campaignTitle: 'Frontier Tower Grand Opening',
    platform: 'farcaster',
    type: 'post',
    copy: 'gm builders 🏗️\n\nFrontier Tower is live. A physical home for the Frontier OS community in Berlin.\n\nIf you\'re building on Frontier, this is your space. Come hack, ship, and connect.\n\n/frontiertower',
    imagePrompt: 'Minimalist digital art showing a purple tower with Farcaster purple branding, pixel art style with blockchain grid pattern, vibrant and fun aesthetic',
    hashtags: ['#Farcaster', '#FrontierTower', '#Web3IRL', '#BuildersWelcome'],
    scheduledFor: '2026-04-01T09:30:00Z',
    isPublished: false,
    createdAt: '2026-03-20T10:02:30Z',
  },
  {
    id: 'content-004',
    campaignId: 'campaign-002',
    campaignTitle: 'FND Token Community Update',
    platform: 'twitter',
    type: 'thread',
    copy: '🧵 Big FND update — here\'s what changed:\n\n1/ New staking rewards are live. Lock your FND for 30, 90, or 365 days and earn up to 12% APY.\n\n2/ Governance is now on-chain. Every FND holder can vote on protocol decisions starting next week.\n\n3/ iFND (internal FND) holders get priority in all platform fee distributions.\n\nThread below 👇',
    imagePrompt: 'Data visualization graphic showing staking rewards chart with upward trend, purple and gold colour scheme, clean minimalist financial design, floating token coins',
    hashtags: ['#FND', '#FrontierDollars', '#DeFi', '#Staking', '#Governance', '#Web3'],
    scheduledFor: null,
    isPublished: true,
    createdAt: '2026-03-25T14:32:10Z',
  },
  {
    id: 'content-005',
    campaignId: 'campaign-002',
    campaignTitle: 'FND Token Community Update',
    platform: 'farcaster',
    type: 'post',
    copy: 'FND staking is live 🎉\n\nLock your FND, earn yield, vote on protocol. This is what community ownership looks like.\n\nDetails in the announcement ↓',
    imagePrompt: 'Abstract art showing purple coins in a circular flow pattern, staking vault aesthetic, dark background with glowing elements',
    hashtags: ['#FND', '#Staking', '#FrontierOS', '#OnChain'],
    scheduledFor: null,
    isPublished: true,
    createdAt: '2026-03-25T14:32:10Z',
  },
  {
    id: 'content-006',
    campaignId: 'campaign-003',
    campaignTitle: 'AI Agent Marketplace Launch',
    platform: 'twitter',
    type: 'post',
    copy: 'We just launched the x402 Agent Market on Frontier OS 🤖⚡\n\nBrowse 6 AI agent services. Pay per call with FND. No subscriptions, no API keys.\n\nThis is what autonomous agent payments look like.\n\nTry it: frontier.town/apps/agent-market',
    imagePrompt: 'Futuristic marketplace interface showing AI agent cards with payment buttons, dark UI with purple accents, holographic displays, cyberpunk aesthetic',
    hashtags: ['#x402', '#AIAgents', '#FrontierOS', '#Web3AI', '#Micropayments', '#FND'],
    scheduledFor: '2026-04-02T09:00:00Z',
    isPublished: false,
    createdAt: '2026-03-29T09:03:05Z',
  },
  {
    id: 'content-007',
    campaignId: 'campaign-003',
    campaignTitle: 'AI Agent Marketplace Launch',
    platform: 'linkedin',
    type: 'post',
    copy: 'Introducing the x402 Agent Market — a marketplace for AI agent services built on Frontier OS, powered by the x402 HTTP payment protocol.\n\nWhat is x402?\nThe x402 protocol revives HTTP status code 402 "Payment Required" to enable autonomous, per-request micropayments. Instead of monthly subscriptions or API keys, you pay exactly for what you use — one call at a time, with FND.\n\nWhat\'s in the marketplace?\n🤖 AI Assistants — For developer questions and research\n💻 Code Review — Security analysis and bug detection\n📊 Data Analysis — Natural language queries over structured data\n✍️ Content Generation — Blog posts and marketing copy\n🎨 Image Generation — Photorealistic visuals from prompts\n🔬 Research — Deep web and academic research briefs\n\nThe future of AI services is pay-per-use, on-chain, and permissionless.',
    imagePrompt: 'Professional product screenshot montage showing the agent marketplace interface, clean dark UI with agent cards, pricing tags, and payment confirmations, brand purple colour scheme',
    hashtags: ['#x402', '#AI', '#Web3', '#FrontierOS', '#Micropayments', '#AIMarketplace', '#Blockchain'],
    scheduledFor: '2026-04-02T10:00:00Z',
    isPublished: false,
    createdAt: '2026-03-29T09:03:05Z',
  },
  {
    id: 'content-008',
    campaignId: 'campaign-003',
    campaignTitle: 'AI Agent Marketplace Launch',
    platform: 'farcaster',
    type: 'post',
    copy: 'x402 Agent Market is live on Frontier OS 🟣\n\nPay AI agents with FND. Per call. No subscriptions.\n\nThis is the internet computer for AI services.\n\n/frontieros /agentmarket',
    imagePrompt: 'Minimal purple illustration showing an AI robot accepting a coin payment, Farcaster style with rounded shapes and vibrant purple palette',
    hashtags: ['#x402', '#FrontierOS', '#AIAgents', '#Farcaster'],
    scheduledFor: '2026-04-02T09:30:00Z',
    isPublished: false,
    createdAt: '2026-03-29T09:03:05Z',
  },
  {
    id: 'content-009',
    campaignId: 'campaign-003',
    campaignTitle: 'AI Agent Marketplace Launch',
    platform: 'instagram',
    type: 'story',
    copy: '🤖 Meet the AI Agent Market\n\nDiscover AI services. Pay with FND. One tap.\n\nNow live on Frontier OS 🚀\n\n→ Link in bio',
    imagePrompt: 'Instagram story format (9:16), vibrant gradient background transitioning from deep purple to electric blue, centered text overlay with AI robot emoji, modern sans-serif typography, Frontier Tower branding in corner',
    hashtags: ['#AI', '#Web3', '#FrontierOS', '#AIMarket', '#Crypto', '#FND', '#Innovation'],
    scheduledFor: '2026-04-02T11:00:00Z',
    isPublished: false,
    createdAt: '2026-03-29T09:03:05Z',
  },
];

const MOCK_PAYMENTS: SwarmPayment[] = [
  {
    id: 'swarm-pay-001',
    campaignId: 'campaign-001',
    campaignTitle: 'Frontier Tower Grand Opening',
    amount: '0.23',
    transactionHash: '0xaaa111bbb222ccc333ddd444eee555fff666aaa111bbb222ccc333ddd444eee5',
    timestamp: '2026-03-20T10:00:05Z',
    status: 'success',
  },
  {
    id: 'swarm-pay-002',
    campaignId: 'campaign-002',
    campaignTitle: 'FND Token Community Update',
    amount: '0.23',
    transactionHash: '0xbbb222ccc333ddd444eee555fff666aaa111bbb222ccc333ddd444eee555fff6',
    timestamp: '2026-03-25T14:30:08Z',
    status: 'success',
  },
  {
    id: 'swarm-pay-003',
    campaignId: 'campaign-003',
    campaignTitle: 'AI Agent Marketplace Launch',
    amount: '0.23',
    transactionHash: '0xccc333ddd444eee555fff666aaa111bbb222ccc333ddd444eee555fff666aaa1',
    timestamp: '2026-03-29T09:00:04Z',
    status: 'success',
  },
];

// ── In-memory stores (standalone dev) ────────────────────────────────────────

let campaignStore: Campaign[] = [...MOCK_CAMPAIGNS];
let contentStore: ContentPiece[] = [...MOCK_CONTENT];
let paymentStore: SwarmPayment[] = [...MOCK_PAYMENTS];

// ── Swarm content templates per platform ─────────────────────────────────────

function generateContent(campaign: Campaign): ContentPiece[] {
  const now = new Date().toISOString();
  const pieces: ContentPiece[] = [];

  const platformTemplates: Record<SocialPlatform, { type: ContentType; copy: string; imagePrompt: string; hashtags: string[] }> = {
    twitter: {
      type: 'post',
      copy: `🚀 ${campaign.title}\n\n${campaign.brief.slice(0, 120)}...\n\nJoin us on the frontier. → frontier.town`,
      imagePrompt: `Dynamic social media graphic for Twitter, dark background, purple accents, bold typography announcing "${campaign.title}", modern Web3 aesthetic, 16:9 format`,
      hashtags: ['#FrontierTower', '#Web3', '#BuildOnFrontier', '#FND'],
    },
    linkedin: {
      type: 'post',
      copy: `We're excited to share: ${campaign.title}\n\n${campaign.brief}\n\nThis initiative reflects our commitment to building an inclusive and innovative Web3 ecosystem at Frontier Tower.\n\nLearn more: frontier.town`,
      imagePrompt: `Professional banner image for LinkedIn, corporate-yet-innovative aesthetic, Frontier Tower branding, purple and white colour scheme, wide format, text overlay "${campaign.title}"`,
      hashtags: ['#FrontierTower', '#Web3', '#Innovation', '#Blockchain', '#Community'],
    },
    instagram: {
      type: 'story',
      copy: `✨ ${campaign.title}\n\n${campaign.brief.slice(0, 100)}\n\n→ Link in bio`,
      imagePrompt: `Instagram story (9:16), vibrant purple gradient background, bold centered text "${campaign.title}", Frontier Tower logo, eye-catching and shareable, modern design`,
      hashtags: ['#FrontierTower', '#Web3', '#Crypto', '#Innovation', '#Community', '#FND', '#BuildOnFrontier'],
    },
    farcaster: {
      type: 'post',
      copy: `gm farcaster 🟣\n\n${campaign.title} is here.\n\n${campaign.brief.slice(0, 100)}\n\n/frontiertower`,
      imagePrompt: `Farcaster-style illustration, purple rounded shapes, minimal and clean, showcasing "${campaign.title}" with subtle blockchain grid, friendly and community-oriented`,
      hashtags: ['#Farcaster', '#FrontierOS', '#Web3IRL', '#BuildersWelcome'],
    },
  };

  let idx = 0;
  for (const platform of campaign.platforms) {
    const tmpl = platformTemplates[platform];
    pieces.push({
      id: `content-${Date.now()}-${idx}`,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      platform,
      type: tmpl.type,
      copy: tmpl.copy,
      imagePrompt: tmpl.imagePrompt,
      hashtags: tmpl.hashtags,
      scheduledFor: null,
      isPublished: false,
      createdAt: now,
    });
    idx++;
  }

  return pieces;
}

// ── Swarm step simulation ────────────────────────────────────────────────────

async function* simulateSwarm(campaign: Campaign): AsyncGenerator<SwarmStep, ContentPiece[], void> {
  const steps: SwarmStep[] = MOCK_SWARM_AGENTS.map((agent) => ({
    agentRole: agent.role,
    agentName: agent.name,
    status: 'pending' as const,
    output: null,
  }));

  const stepOutputs: Record<SwarmAgentRole, string> = {
    'content-planner': `Content strategy designed: ${campaign.platforms.length} platforms × 1 post each. Optimal posting window: 9–11 AM UTC. Tone: ${campaign.tone}.`,
    copywriter: `Platform copy drafted for: ${campaign.platforms.join(', ')}. Character limits respected. Calls-to-action included.`,
    'image-prompter': `Image generation prompts created for each platform. Style adapted to platform conventions.`,
    'hashtag-optimizer': `Hashtag sets selected. Mix of high-volume and niche tags. Estimated reach: +34% vs baseline.`,
    'tone-adapter': `Tone calibrated per platform. LinkedIn: professional. Twitter: punchy. Instagram: visual. Farcaster: community-first.`,
  };

  for (let i = 0; i < steps.length; i++) {
    steps[i] = { ...steps[i], status: 'running' };
    yield [...steps][i];
    await new Promise((r) => setTimeout(r, 100));
    steps[i] = { ...steps[i], status: 'done', output: stepOutputs[steps[i].agentRole] };
    yield [...steps][i];
  }

  const newContent = generateContent(campaign);
  contentStore = [...newContent, ...contentStore];
  return newContent;
}

// ── Mock Services ─────────────────────────────────────────────────────────────

export function createMockServices(): FrontierServices {
  const wallet: WalletService = {
    getBalanceFormatted: async () => ({
      total: '18.75',
      fnd: '15.00',
      internalFnd: '3.75',
    }),
    getAddress: async () => '0xmockuser0000000000000000000000000000000a',
    transferOverallFrontierDollar: async (to: string, amount: string) => {
      await new Promise((r) => setTimeout(r, 700));
      const hash =
        '0x' +
        Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      console.log(`[mock] Transferred ${amount} FND to ${to}`);
      return {
        userOpHash: hash,
        transactionHash: hash,
        blockNumber: BigInt(12345678),
        success: true,
      };
    },
  };

  const user: UserService = {
    getDetails: async () => ({
      id: 'user-mock-001',
      email: 'dev@frontier.io',
      walletAddress: '0xmockuser0000000000000000000000000000000a',
      username: 'frontier_dev',
      displayName: 'Frontier Dev',
      avatarUrl: null,
    }),
  };

  const swarm: SwarmService = {
    listCampaigns: async () => [...campaignStore],

    getCampaign: async (id: string) => campaignStore.find((c) => c.id === id) ?? null,

    createCampaign: async (params: CreateCampaignParams) => {
      const newCampaign: Campaign = {
        id: `campaign-${Date.now()}`,
        ...params,
        status: 'draft',
        createdAt: new Date().toISOString(),
        completedAt: null,
        contentCount: 0,
        totalCost: '0.00',
      };
      campaignStore = [newCampaign, ...campaignStore];
      return newCampaign;
    },

    runSwarm: (campaignId: string) => {
      const campaign = campaignStore.find((c) => c.id === campaignId);
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }
      campaignStore = campaignStore.map((c) =>
        c.id === campaignId ? { ...c, status: 'running' } : c,
      );

      const gen = simulateSwarm(campaign);

      // After simulation completes, mark campaign as completed
      const originalReturn = gen.return.bind(gen);
      return {
        [Symbol.asyncIterator]() {
          return this;
        },
        async next() {
          const result = await gen.next();
          if (result.done) {
            const contentPieces = result.value as ContentPiece[];
            campaignStore = campaignStore.map((c) =>
              c.id === campaignId
                ? {
                    ...c,
                    status: 'completed',
                    completedAt: new Date().toISOString(),
                    contentCount: contentPieces.length,
                    totalCost: '0.23',
                  }
                : c,
            );
            return result;
          }
          return result;
        },
        return: originalReturn,
        throw: gen.throw.bind(gen),
      } as AsyncGenerator<SwarmStep, ContentPiece[], void>;
    },

    deleteCampaign: async (id: string) => {
      campaignStore = campaignStore.filter((c) => c.id !== id);
      contentStore = contentStore.filter((c) => c.campaignId !== id);
    },

    listContent: async (campaignId?: string, platform?: SocialPlatform) => {
      let result = [...contentStore];
      if (campaignId) result = result.filter((c) => c.campaignId === campaignId);
      if (platform) result = result.filter((c) => c.platform === platform);
      return result;
    },

    getContent: async (id: string) => contentStore.find((c) => c.id === id) ?? null,

    scheduleContent: async (contentId: string, scheduledFor: string) => {
      contentStore = contentStore.map((c) =>
        c.id === contentId ? { ...c, scheduledFor } : c,
      );
      const updated = contentStore.find((c) => c.id === contentId);
      if (!updated) throw new Error(`Content ${contentId} not found`);
      return updated;
    },

    publishContent: async (contentId: string) => {
      contentStore = contentStore.map((c) =>
        c.id === contentId ? { ...c, isPublished: true, scheduledFor: null } : c,
      );
      const updated = contentStore.find((c) => c.id === contentId);
      if (!updated) throw new Error(`Content ${contentId} not found`);
      return updated;
    },

    listSwarmAgents: async () => [...MOCK_SWARM_AGENTS],

    getPaymentHistory: async () => [...paymentStore],

    recordPayment: async (payment: Omit<SwarmPayment, 'id'>) => {
      const newPayment: SwarmPayment = { id: `swarm-pay-${Date.now()}`, ...payment };
      paymentStore = [newPayment, ...paymentStore];
      return newPayment;
    },
  };

  return { wallet, user, swarm };
}

// ── Context ───────────────────────────────────────────────────────────────────

const FrontierServicesContext = createContext<FrontierServices | null>(null);

export const useServices = (): FrontierServices => {
  const services = useContext(FrontierServicesContext);
  if (!services) throw new Error('useServices must be used within FrontierServicesProvider');
  return services;
};

export const FrontierServicesProvider = ({ children }: { children: ReactNode }) => {
  const services = createMockServices();
  return (
    <FrontierServicesContext.Provider value={services}>
      {children}
    </FrontierServicesContext.Provider>
  );
};
