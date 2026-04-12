import { createContext, useContext, type ReactNode } from 'react';

// ── Shared Types ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  results: T[];
}

// ── Wallet Types ─────────────────────────────────────────────────────────────

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

// ── User Types ───────────────────────────────────────────────────────────────

export interface UserDetails {
  id: string;
  email: string;
  walletAddress: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

// ── x402 Agent Market Types ──────────────────────────────────────────────────

export type AgentCategory =
  | 'ai-assistant'
  | 'data-analysis'
  | 'content-generation'
  | 'code-assistance'
  | 'image-generation'
  | 'research'
  | 'other';

export const AGENT_CATEGORIES: { value: AgentCategory; label: string }[] = [
  { value: 'ai-assistant', label: 'AI Assistant' },
  { value: 'data-analysis', label: 'Data Analysis' },
  { value: 'content-generation', label: 'Content Generation' },
  { value: 'code-assistance', label: 'Code Assistance' },
  { value: 'image-generation', label: 'Image Generation' },
  { value: 'research', label: 'Research' },
  { value: 'other', label: 'Other' },
];

export interface Agent {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  category: AgentCategory;
  endpoint: string;
  pricePerCall: string;
  paymentAddress: string;
  ownerAddress: string;
  ownerName: string;
  tags: string[];
  callCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface AgentPayment {
  id: string;
  agentId: string;
  agentName: string;
  amount: string;
  transactionHash: string;
  timestamp: string;
  status: 'success' | 'failed';
}

export interface RegisterAgentParams {
  name: string;
  description: string;
  longDescription: string;
  category: AgentCategory;
  endpoint: string;
  pricePerCall: string;
  paymentAddress: string;
  tags: string[];
}

// ── Services Interface ────────────────────────────────────────────────────────

export interface WalletService {
  getBalanceFormatted: () => Promise<WalletBalanceFormatted>;
  getAddress: () => Promise<string>;
  transferOverallFrontierDollar: (
    to: string,
    amount: string,
  ) => Promise<UserOperationReceipt>;
}

export interface UserService {
  getDetails: () => Promise<UserDetails>;
}

export interface AgentService {
  listAgents: () => Promise<Agent[]>;
  getAgent: (id: string) => Promise<Agent | null>;
  registerAgent: (params: RegisterAgentParams) => Promise<Agent>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  getMyAgents: (ownerAddress: string) => Promise<Agent[]>;
  recordPayment: (payment: Omit<AgentPayment, 'id'>) => Promise<AgentPayment>;
  getPaymentHistory: (agentId?: string) => Promise<AgentPayment[]>;
}

export interface FrontierServices {
  wallet: WalletService;
  user: UserService;
  agents: AgentService;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_AGENTS: Agent[] = [
  {
    id: 'agent-001',
    name: 'CodeReview Pro',
    description: 'AI-powered code review that catches bugs, security issues, and style violations.',
    longDescription:
      'CodeReview Pro uses advanced static analysis combined with LLM reasoning to provide comprehensive code reviews. Submit any code snippet and receive detailed feedback on bugs, security vulnerabilities, performance issues, and style improvements. Supports 20+ programming languages.',
    category: 'code-assistance',
    endpoint: 'https://api.codereview.pro/v1/review',
    pricePerCall: '0.05',
    paymentAddress: '0x1234567890abcdef1234567890abcdef12345678',
    ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
    ownerName: 'CodeReview Labs',
    tags: ['code-review', 'security', 'typescript', 'python', 'rust'],
    callCount: 14823,
    isActive: true,
    createdAt: '2025-11-15T00:00:00Z',
  },
  {
    id: 'agent-002',
    name: 'DataSense',
    description: 'Natural language queries over structured datasets — no SQL required.',
    longDescription:
      'DataSense translates plain English questions into database queries and returns results in natural language with visualisation hints. Connect your data schema, ask questions, get instant insights. Ideal for business analysts and non-technical stakeholders.',
    category: 'data-analysis',
    endpoint: 'https://api.datasense.io/v2/query',
    pricePerCall: '0.10',
    paymentAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    ownerAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    ownerName: 'DataSense Inc',
    tags: ['sql', 'analytics', 'natural-language', 'business-intelligence'],
    callCount: 8341,
    isActive: true,
    createdAt: '2025-10-01T00:00:00Z',
  },
  {
    id: 'agent-003',
    name: 'BlogCraft',
    description: 'Long-form blog post generator with SEO optimisation and brand voice matching.',
    longDescription:
      'BlogCraft generates publication-ready blog posts from a topic brief. It researches current trends, structures the content for SEO, and adapts to your brand voice from sample text you provide. Outputs include a full post, meta description, and suggested tags.',
    category: 'content-generation',
    endpoint: 'https://api.blogcraft.ai/generate',
    pricePerCall: '0.25',
    paymentAddress: '0x9876543210fedcba9876543210fedcba98765432',
    ownerAddress: '0x9876543210fedcba9876543210fedcba98765432',
    ownerName: 'BlogCraft AI',
    tags: ['writing', 'seo', 'blog', 'marketing'],
    callCount: 5102,
    isActive: true,
    createdAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'agent-004',
    name: 'ResearchBot',
    description: 'Deep research on any topic — sources, summaries, and citations in minutes.',
    longDescription:
      'ResearchBot crawls the web, academic databases, and news sources to compile comprehensive research briefs on any topic. Each report includes a summary, key findings, primary sources with links, and a confidence score. Ideal for due diligence, market research, and academic study.',
    category: 'research',
    endpoint: 'https://api.researchbot.dev/brief',
    pricePerCall: '0.50',
    paymentAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
    ownerAddress: '0xfedcba9876543210fedcba9876543210fedcba98',
    ownerName: 'ResearchBot Labs',
    tags: ['research', 'web-search', 'citations', 'due-diligence'],
    callCount: 3298,
    isActive: true,
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'agent-005',
    name: 'ImageForge',
    description: 'Photorealistic image generation from text prompts with style presets.',
    longDescription:
      'ImageForge generates high-resolution photorealistic images from text prompts. Choose from style presets (photographic, illustration, 3D render, pixel art) or describe your own. Returns a CDN-hosted image URL with metadata. Batch mode available.',
    category: 'image-generation',
    endpoint: 'https://api.imageforge.ai/v1/generate',
    pricePerCall: '0.08',
    paymentAddress: '0x2468ace02468ace02468ace02468ace024680000',
    ownerAddress: '0x2468ace02468ace02468ace02468ace024680000',
    ownerName: 'ImageForge Studio',
    tags: ['image', 'generative-ai', 'stable-diffusion', 'design'],
    callCount: 22150,
    isActive: true,
    createdAt: '2025-09-20T00:00:00Z',
  },
  {
    id: 'agent-006',
    name: 'Frontier Assistant',
    description: 'General-purpose AI assistant tuned for Frontier OS developer questions.',
    longDescription:
      'Frontier Assistant is a specialised AI assistant trained on Frontier OS SDK documentation, smart contract patterns, and Web3 developer best practices. Ask anything about building on Frontier, integrating the SDK, or designing tokenomics — and get accurate, context-aware answers.',
    category: 'ai-assistant',
    endpoint: 'https://api.frontier.ai/assistant/v1',
    pricePerCall: '0.02',
    paymentAddress: '0x13579bdf13579bdf13579bdf13579bdf13579bdf',
    ownerAddress: '0x13579bdf13579bdf13579bdf13579bdf13579bdf',
    ownerName: 'Frontier Labs',
    tags: ['frontier-os', 'sdk', 'web3', 'developer'],
    callCount: 31044,
    isActive: true,
    createdAt: '2025-08-01T00:00:00Z',
  },
];

const MOCK_PAYMENTS: AgentPayment[] = [
  {
    id: 'pay-001',
    agentId: 'agent-006',
    agentName: 'Frontier Assistant',
    amount: '0.02',
    transactionHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1',
    timestamp: '2026-03-28T14:23:00Z',
    status: 'success',
  },
  {
    id: 'pay-002',
    agentId: 'agent-001',
    agentName: 'CodeReview Pro',
    amount: '0.05',
    transactionHash: '0xdef456abc123def456abc123def456abc123def456abc123def456abc123def4',
    timestamp: '2026-03-27T09:11:00Z',
    status: 'success',
  },
];

// ── In-memory store for agents (standalone dev) ────────────────────────────────

let agentStore: Agent[] = [...MOCK_AGENTS];
let paymentStore: AgentPayment[] = [...MOCK_PAYMENTS];

// ── Mock Services ─────────────────────────────────────────────────────────────

export function createMockServices(): FrontierServices {
  const wallet: WalletService = {
    getBalanceFormatted: async () => ({
      total: '12.50',
      fnd: '10.00',
      internalFnd: '2.50',
    }),
    getAddress: async () => '0xmockuser0000000000000000000000000000000a',
    transferOverallFrontierDollar: async (to: string, amount: string) => {
      // Simulate a slight delay for realism
      await new Promise((r) => setTimeout(r, 800));
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

  const agents: AgentService = {
    listAgents: async () => [...agentStore].filter((a) => a.isActive),

    getAgent: async (id: string) => agentStore.find((a) => a.id === id) ?? null,

    registerAgent: async (params: RegisterAgentParams) => {
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        ...params,
        ownerAddress: '0xmockuser0000000000000000000000000000000a',
        ownerName: 'Frontier Dev',
        callCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      agentStore = [newAgent, ...agentStore];
      return newAgent;
    },

    updateAgent: async (id: string, updates: Partial<Agent>) => {
      agentStore = agentStore.map((a) => (a.id === id ? { ...a, ...updates } : a));
      const updated = agentStore.find((a) => a.id === id);
      if (!updated) throw new Error(`Agent ${id} not found`);
      return updated;
    },

    deleteAgent: async (id: string) => {
      agentStore = agentStore.filter((a) => a.id !== id);
    },

    getMyAgents: async (ownerAddress: string) =>
      agentStore.filter((a) => a.ownerAddress === ownerAddress),

    recordPayment: async (payment: Omit<AgentPayment, 'id'>) => {
      const newPayment: AgentPayment = { id: `pay-${Date.now()}`, ...payment };
      paymentStore = [newPayment, ...paymentStore];
      // Increment call count on agent
      agentStore = agentStore.map((a) =>
        a.id === payment.agentId ? { ...a, callCount: a.callCount + 1 } : a,
      );
      return newPayment;
    },

    getPaymentHistory: async (agentId?: string) => {
      if (agentId) return paymentStore.filter((p) => p.agentId === agentId);
      return [...paymentStore];
    },
  };

  return { wallet, user, agents };
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
