import { createContext, useContext, type ReactNode } from 'react';

// ── Token amounts (bigint base units) ────────────────────────────────────────
//
// Since Frontier SDK v0.23, all FND amounts are bigint base units (FND_DECIMALS = 6).
// WalletBalance fields and every transfer*/swap amount are bigint, NOT display strings.
//   - Display a balance:  formatAmount(b.fnd)   → symbol-free decimal string (100_500000n → '100.5')
//   - Parse user input:   parseAmount('10.5')   → bigint (throws InvalidAmountError on bad input)
//   - Write:              wallet.transferFrontierDollar(to, parseAmount('10.5'))
// Import formatAmount / parseAmount / FND_DECIMALS / InvalidAmountError from the package
// ROOT '@frontiertower/frontier-sdk' (NOT the /ui-utils subpath). The SDK never adds '$'.

// ── Shared Types ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  results: T[];
}

// ── Wallet Types ────────────────────────────────────────────────────────────

export interface WalletBalance {
  total: bigint;
  fnd: bigint;
  internalFnd: bigint;
}

export interface SmartAccount {
  id: number;
  ownerAddress: string;
  contractAddress: string | null;
  network: string;
  status: string;
  deploymentTransactionHash: string;
  createdAt: string;
}

export interface UserOperationReceipt {
  userOpHash: string;
  transactionHash: string;
  blockNumber: bigint;
  success: boolean;
}

export interface GasOverrides {
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasLimit?: bigint;
}

export interface ExecuteCall {
  target: string;
  value?: bigint;
  data: string;
}

export interface SwapResult {
  sourceChain: object;
  targetChain: object;
  sourceToken: object;
  targetToken: object;
  status: 'COMPLETED' | 'SUBMITTED';
}

export interface SwapQuote {
  sourceChain: object;
  targetChain: object;
  sourceToken: object;
  targetToken: object;
  expectedAmountOut: bigint;
  minAmountOut: bigint;
}

export interface OnRampResponse<T> {
  currency: 'usd' | 'eur';
  depositInstructions: T;
  destinationAddress: string;
  destinationNetwork: string;
}

export interface UsdDepositInstructions {
  currency: 'usd';
  bankName: string;
  bankAddress: string;
  bankRoutingNumber: string;
  bankAccountNumber: string;
  bankBeneficiaryName: string;
  paymentRail: string;
}

export interface EurDepositInstructions {
  currency: 'eur';
  iban: string;
  bic: string;
  accountHolderName: string;
}

export interface LinkedBank {
  id: string;
  bankName: string;
  last4: string;
  withdrawalAddress: string;
  network: string;
}

export interface LinkedBanksResponse {
  banks: LinkedBank[];
}

export interface LinkBankResponse {
  externalAccountId: string;
  bankName: string;
  withdrawalAddress: string;
  network: string;
}

export interface BillingAddress {
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type AccountOwnerType = 'individual' | 'business';

export interface DeprecatedSmartAccount {
  id: number;
  ownerAddress: string;
  contractAddress: string;
  network: string;
  deprecatedAt: string;
  version: number;
}

// ── Chain Types ─────────────────────────────────────────────────────────────

export interface ChainConfig {
  id: number;
  name: string;
  network: string;
  bridgeSwapRouterFactoryAddress: string;
  uniswapV3FactoryAddress: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorer: { name: string; url: string };
  stableCoins: Array<{ name: string; symbol: string; decimals: number; address: string; underlying: string }>;
  supportedTokens: Array<{ name: string; symbol: string; decimals: number; address: string }>;
  testnet: boolean;
}

// ── User Types ──────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  dateJoined: string;
  isSuperuser: boolean;
}

export interface UserProfile {
  id: number;
  user: number;
  firstName: string;
  lastName: string;
  nickname: string;
  profilePicture: string;
  phoneNumber: string;
  community: string;
  communityName: string;
  organization: string;
  organizationRole: string;
  socialSite: string;
  socialHandle: string;
  githubHandle: string;
  currentWork: string;
  notableWork: string;
  receiveUpdates: boolean;
  notificationCommunityEvent: boolean;
  notificationTowerEvent: boolean;
  notificationUpcomingEvent: boolean;
  notificationTweetPicked: boolean;
  notifyEventInvites: boolean;
  optInSms: boolean;
  howDidYouHearAboutUs: string;
  braggingStatement: string;
  contributionStatement: string;
  hasUsablePassword: string;
}

export interface ReferralOverview {
  referralCount: number;
  ranking: number;
  referralLink: string;
  referralCode: string;
  referredBy: string | null;
}

export interface ReferralDetails {
  name: string;
  email: string;
  referralDate: string;
  reward: string;
  status: string;
}

export interface UserContactPayload {
  contacts: Array<{ email: string; phone: string; name: string }>;
}

export interface KycStatusResponse {
  status: 'not_started' | 'pending' | 'in_review' | 'approved' | 'rejected';
  isApproved: boolean;
  rejectionReason: string | null;
  kycLinkId: string | null;
  kycLink: string | null;
  tosStatus: 'pending' | 'approved' | null;
  tosLink: string | null;
}

export interface CreateSignupRequestPayload {
  subscriptionPlan: string;
  subscriptionInterval: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  socialSite: string;
  socialHandle: string;
  currentWork: string;
  howDidYouHearAboutUs: string;
  braggingStatement: string;
  contributionStatement: string;
  billingFirstName: string;
  billingLastName: string;
  billingEmail: string;
  billingPhoneNumber: string;
  paymentProvider: 'crypto';
  smartAccount: number;
  community: string;
  githubHandle?: string;
  notableWork?: string;
  referralCode?: string;
  receiveUpdates?: boolean;
  optInSms?: boolean;
  organization?: string;
  organizationRole?: string;
}

export interface CreateSignupRequestResponse {
  subscriptionUuid: string;
  paymentProvider: string;
}

export interface AccessControlsPayload {
  smartAccountAddress: string | null;
  email: string;
  isSuperuser: boolean;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  subscriptionInterval: string | null;
  subscriptionType: string | null;
  addOns: string[];
  communities: string[];
  managedCommunities: string[];
  timestamp: string;
  kid: string;
}

// ── Partnerships Types ──────────────────────────────────────────────────────

export interface Sponsor {
  id: number;
  name: string;
  dailyRate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SponsorPass {
  id: number;
  sponsor: number;
  sponsorName: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'revoked';
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}

export interface CreateSponsorPassRequest {
  sponsor: number;
  firstName: string;
  lastName: string;
  email: string;
  expiresAt?: string;
}

// ── ThirdParty Types ────────────────────────────────────────────────────────

export interface Developer {
  id: number;
  name: string;
  description: string;
  email: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThirdPartyApp {
  id: number;
  developer: number;
  icon: string | null;
  name: string;
  readableId: string;
  description: string;
  url: string;
  cnameEntry: string;
  txtEntry: string | null;
  permissions: string[];
  permissionDisclaimer: string;
  status: string;
  reviewNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Webhook {
  id: number;
  developer: number;
  name: string;
  description: string;
  targetUrl: string;
  config: { events: string[]; scope: Record<string, number[] | '*'> };
  signingPublicKey: string;
  status: string;
  reviewNotes: string;
  createdAt: string;
  updatedAt: string;
}

// ── Communities Types ────────────────────────────────────────────────────────

export interface Community {
  id: number;
  name: string;
  description: string;
  slug: string;
  iconName: string;
  splashVideo: string | null;
}

export interface InternshipPass {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  community: number;
  communityName: string;
  status: 'active' | 'revoked';
  createdAt: string;
  revokedAt: string | null;
  updatedAt: string;
}

export interface ReassignRequest {
  id: number;
  requester: number;
  requesterEmail: string;
  member: number;
  memberEmail: string;
  targetCommunity: number;
  targetCommunityName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: number | null;
  resolvedByEmail: string | null;
}

// ── Events Types ────────────────────────────────────────────────────────────

export type EventType = 'public' | 'members_plus_one' | 'members_only' | 'community_only';
export type LocationType = 'event_space' | 'room';

export interface FrontierEvent {
  id: number;
  name: string;
  description: string;
  eventType: EventType;
  eventService: string;
  host: string;
  community: number | null;
  startsAt: string;
  endsAt: string;
  coverImage: string | null;
  eventId: string;
  location: string;
  locationName: string;
  displayLocation: string;
  url: string;
  additionalHosts: string[];
  color: string;
  reviewStatus: string;
  status: string;
  isHost?: boolean;
  deposit?: EventDeposit | null;
}

// ── Events Deposit Types ──────────────────────────────────────────────────────

export type DepositStatus =
  | 'not_required'
  | 'required'
  | 'pending'
  | 'secured'
  | 'released'
  | 'withheld'
  | 'failed';

export type CryptoDepositStatus =
  | 'secured'
  | 'awaiting_payment'
  | 'grant'
  | 'released'
  | 'withheld'
  | 'failed';

export interface EventDeposit {
  status: DepositStatus;
  amount: number;
  currency: string;
}

export interface DepositPreflightToken {
  key: string;
  address: string;
  decimals: number;
  baseUnits: string;
}

export interface DepositPreflight {
  spender: string;
  network: string;
  amount: string;
  currency: string;
  tokens: DepositPreflightToken[];
}

export interface DepositResult {
  provider: 'crypto';
  status: CryptoDepositStatus;
  amount: string;
  currency: string;
  reference: string;
  statusReason: string;
}

export interface EventLocation {
  id: number;
  owner: number | null;
  readableId: string;
  name: string;
  maxCapacity: number;
  description: string;
  directions: string;
  locationType: LocationType;
  warmupBuffer: string;
  cooldownBuffer: string;
  openBooking: boolean;
  floorLocation: string;
}

export interface RoomBooking {
  id: number;
  startsAt: string;
  endsAt: string;
  location: string;
}

export interface CreateEventRequest {
  name: string;
  eventType: EventType;
  startsAt: string;
  endsAt: string;
  location: string;
  description?: string;
  coverImage?: string;
  additionalHosts?: string[];
  color?: string;
}

// ── Offices Types ───────────────────────────────────────────────────────────

export interface AccessPass {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'revoked';
  membershipContract: number;
  contractReference: string;
  createdAt: string;
  revokedAt: string | null;
  updatedAt: string;
}

export interface CreateAccessPassRequest {
  email: string;
  firstName: string;
  lastName: string;
  membershipContract: number;
}

// ── Navigation Types ────────────────────────────────────────────────────────

export interface NavigationOpenAppOptions {
  path?: string;
  params?: Record<string, string>;
}

export interface DeepLinkData {
  path?: string;
  params?: Record<string, string>;
}

// ── Service Interfaces ──────────────────────────────────────────────────────

export interface WalletService {
  getBalance(): Promise<WalletBalance>;
  getAddress(): Promise<string>;
  getSmartAccount(): Promise<SmartAccount>;
  transferERC20(tokenAddress: string, to: string, amount: bigint, overrides?: GasOverrides): Promise<UserOperationReceipt>;
  approveERC20(tokenAddress: string, spender: string, amount: bigint, overrides?: GasOverrides): Promise<UserOperationReceipt>;
  transferNative(to: string, amount: bigint, overrides?: GasOverrides): Promise<UserOperationReceipt>;
  executeCall(call: ExecuteCall, overrides?: GasOverrides): Promise<UserOperationReceipt>;
  executeBatchCall(calls: ExecuteCall[], overrides?: GasOverrides): Promise<UserOperationReceipt>;
  transferFrontierDollar(to: string, amount: bigint, overrides?: GasOverrides): Promise<UserOperationReceipt>;
  transferInternalFrontierDollar(to: string, amount: bigint, overrides?: GasOverrides): Promise<UserOperationReceipt>;
  transferOverallFrontierDollar(to: string, amount: bigint, overrides?: GasOverrides): Promise<UserOperationReceipt>;
  getSupportedTokens(): Promise<string[]>;
  swap(sourceToken: string, targetToken: string, sourceNetwork: string, targetNetwork: string, amount: bigint): Promise<SwapResult>;
  quoteSwap(sourceToken: string, targetToken: string, sourceNetwork: string, targetNetwork: string, amount: bigint): Promise<SwapQuote>;
  getUsdDepositInstructions(): Promise<OnRampResponse<UsdDepositInstructions>>;
  getEurDepositInstructions(): Promise<OnRampResponse<EurDepositInstructions>>;
  getLinkedBanks(): Promise<LinkedBanksResponse>;
  linkUsBankAccount(accountOwnerName: string, bankName: string, routingNumber: string, accountNumber: string, checkingOrSavings: 'checking' | 'savings', address: BillingAddress): Promise<LinkBankResponse>;
  linkEuroAccount(accountOwnerName: string, accountOwnerType: AccountOwnerType, firstName: string, lastName: string, ibanAccountNumber: string, bic?: string): Promise<LinkBankResponse>;
  deleteLinkedBank(bankId: string): Promise<void>;
  getDeprecatedSmartAccounts(): Promise<DeprecatedSmartAccount[]>;
}

export interface StorageService {
  get<T = any>(key: string): Promise<T | null>;
  set(key: string, value: any): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface ChainService {
  getCurrentNetwork(): Promise<string>;
  getAvailableNetworks(): Promise<string[]>;
  switchNetwork(network: string): Promise<void>;
  getCurrentChainConfig(): Promise<ChainConfig>;
  getContractAddresses(): Promise<{ fnd: string; iFnd: string | null; paymentRouter: string; subscriptionManager: string }>;
}

export interface UserService {
  getDetails(): Promise<User>;
  getProfile(): Promise<UserProfile>;
  getReferralOverview(): Promise<ReferralOverview>;
  getReferralDetails(page?: number): Promise<PaginatedResponse<ReferralDetails>>;
  addUserContact(data: UserContactPayload): Promise<void>;
  getOrCreateKyc(redirectUri?: string): Promise<KycStatusResponse>;
  createSignupRequest(payload: CreateSignupRequestPayload): Promise<CreateSignupRequestResponse>;
  getVerifiedAccessControls(): Promise<AccessControlsPayload>;
}

export interface PartnershipsService {
  createSponsorPass(payload: CreateSponsorPassRequest): Promise<SponsorPass>;
  listActiveSponsorPasses(payload?: { limit?: number; offset?: number }): Promise<PaginatedResponse<SponsorPass>>;
  listAllSponsorPasses(payload?: { limit?: number; offset?: number; includeRevoked?: boolean }): Promise<PaginatedResponse<SponsorPass>>;
  listSponsors(payload?: { limit?: number; offset?: number }): Promise<PaginatedResponse<Sponsor>>;
  getSponsor(payload: { id: number }): Promise<Sponsor>;
  getSponsorPass(payload: { id: number }): Promise<SponsorPass>;
  revokeSponsorPass(payload: { id: number }): Promise<void>;
}

export interface ThirdPartyService {
  listDevelopers(payload?: { limit?: number; offset?: number }): Promise<PaginatedResponse<Developer>>;
  getDeveloper(payload: { id: number }): Promise<Developer>;
  updateDeveloper(payload: { id: number; data: { name?: string; description?: string; email?: string } }): Promise<Developer>;
  rotateDeveloperApiKey(payload: { id: number }): Promise<{ message: string; developer: Developer }>;
  listApps(payload?: { limit?: number; offset?: number; developerId?: number }): Promise<PaginatedResponse<ThirdPartyApp>>;
  createApp(payload: { developer: number; url: string; cnameEntry: string; txtEntry?: string; permissions: string[]; permissionDisclaimer: string }): Promise<ThirdPartyApp>;
  getApp(payload: { id: number }): Promise<ThirdPartyApp>;
  updateApp(payload: { id: number; data: { developer?: number; url?: string; cnameEntry?: string; txtEntry?: string; permissions?: string[]; permissionDisclaimer?: string } }): Promise<ThirdPartyApp>;
  deleteApp(payload: { id: number }): Promise<void>;
  listWebhooks(payload?: { limit?: number; offset?: number; developerId?: number }): Promise<PaginatedResponse<Webhook>>;
  createWebhook(payload: { developer: number; name: string; description: string; targetUrl: string; config: { events: string[]; scope: Record<string, number[] | '*'> } }): Promise<Webhook>;
  getWebhook(payload: { id: number }): Promise<Webhook>;
  updateWebhook(payload: { id: number; data: { developer?: number; name?: string; description?: string; targetUrl?: string; config?: { events: string[]; scope: Record<string, number[] | '*'> } } }): Promise<Webhook>;
  deleteWebhook(payload: { id: number }): Promise<void>;
  rotateWebhookSigningKey(payload: { id: number }): Promise<{ message: string; webhook: Webhook }>;
}

export interface CommunitiesService {
  listCommunities(payload?: { limit?: number; offset?: number }): Promise<PaginatedResponse<Community>>;
  getCommunity(payload: { idOrSlug: string | number }): Promise<Community>;
  createInternshipPass(payload: { email: string; firstName: string; lastName: string; community: number }): Promise<InternshipPass>;
  listInternshipPasses(payload?: { limit?: number; offset?: number; includeRevoked?: boolean }): Promise<PaginatedResponse<InternshipPass>>;
  getInternshipPass(payload: { id: number }): Promise<InternshipPass>;
  revokeInternshipPass(payload: { id: number }): Promise<void>;
  createReassignRequest(payload: { memberEmail: string; targetCommunity: number }): Promise<ReassignRequest>;
  listReassignRequests(payload?: { limit?: number; offset?: number }): Promise<PaginatedResponse<ReassignRequest>>;
  getReassignRequest(payload: { id: number }): Promise<ReassignRequest>;
  acceptReassignRequest(payload: { id: number }): Promise<ReassignRequest>;
  rejectReassignRequest(payload: { id: number }): Promise<void>;
}

export interface EventsService {
  listEvents(payload?: { search?: string; eventType?: EventType; locationType?: LocationType; locationId?: string; date?: string; startDate?: string; endDate?: string; page?: number }): Promise<PaginatedResponse<FrontierEvent>>;
  createEvent(payload: CreateEventRequest): Promise<FrontierEvent>;
  addEventHost(payload: { eventId: number; email: string }): Promise<FrontierEvent>;
  listLocations(payload?: { locationType?: LocationType }): Promise<EventLocation[]>;
  listRoomBookings(payload?: { locationId?: string; date?: string; startDate?: string; endDate?: string; page?: number }): Promise<PaginatedResponse<RoomBooking>>;
  createRoomBooking(payload: { startsAt: string; endsAt: string; location: string }): Promise<RoomBooking>;
  getCryptoDepositPreflight(payload: { eventId: number }): Promise<DepositPreflight>;
  placeCryptoDeposit(payload: { eventId: number }): Promise<DepositResult>;
}

export interface OfficesService {
  createAccessPass(payload: CreateAccessPassRequest): Promise<AccessPass>;
  listAccessPasses(payload?: { limit?: number; offset?: number; includeRevoked?: boolean }): Promise<PaginatedResponse<AccessPass>>;
  getAccessPass(payload: { id: number }): Promise<AccessPass>;
  revokeAccessPass(payload: { id: number }): Promise<void>;
}

export interface NavigationService {
  openApp(appId: string, options?: NavigationOpenAppOptions): Promise<void>;
  close(): Promise<void>;
  onDeepLink(callback: (data: DeepLinkData) => void): () => void;
}

// ── FrontierServices ────────────────────────────────────────────────────────

export interface FrontierServices {
  wallet: WalletService;
  storage: StorageService;
  chain: ChainService;
  user: UserService;
  partnerships: PartnershipsService;
  thirdParty: ThirdPartyService;
  communities: CommunitiesService;
  events: EventsService;
  offices: OfficesService;
  navigation: NavigationService;
}

// ── Mock Helpers ────────────────────────────────────────────────────────────

const MOCK_PREFIX = 'frontier:mock:';

function mockLog(module: string, method: string) {
  console.info(`[Mock] ${module}.${method} called`);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

const MOCK_RECEIPT: UserOperationReceipt = {
  userOpHash: '0xmock0000000000000000000000000000000000000000000000000000000001',
  transactionHash: '0xmock0000000000000000000000000000000000000000000000000000000002',
  blockNumber: BigInt(1000000),
  success: true,
};

async function mockWriteOp(module: string, method: string): Promise<UserOperationReceipt> {
  mockLog(module, method);
  await delay(1000);
  return { ...MOCK_RECEIPT };
}

// ── createMockServices ──────────────────────────────────────────────────────

export function createMockServices(): FrontierServices {
  const wallet: WalletService = {
    async getBalance() { mockLog('wallet', 'getBalance'); return { total: BigInt(10_500000), fnd: BigInt(7_500000), internalFnd: BigInt(3_000000) }; },
    async getAddress() { mockLog('wallet', 'getAddress'); return '0x1234567890abcdef1234567890abcdef12345678'; },
    async getSmartAccount() { mockLog('wallet', 'getSmartAccount'); return { id: 1, ownerAddress: '0xowner', contractAddress: '0xcontract', network: 'base-sepolia', status: 'deployed', deploymentTransactionHash: '0xdeploy', createdAt: new Date().toISOString() }; },
    async transferERC20() { return mockWriteOp('wallet', 'transferERC20'); },
    async approveERC20() { return mockWriteOp('wallet', 'approveERC20'); },
    async transferNative() { return mockWriteOp('wallet', 'transferNative'); },
    async executeCall() { return mockWriteOp('wallet', 'executeCall'); },
    async executeBatchCall() { return mockWriteOp('wallet', 'executeBatchCall'); },
    async transferFrontierDollar() { return mockWriteOp('wallet', 'transferFrontierDollar'); },
    async transferInternalFrontierDollar() { return mockWriteOp('wallet', 'transferInternalFrontierDollar'); },
    async transferOverallFrontierDollar() { return mockWriteOp('wallet', 'transferOverallFrontierDollar'); },
    async getSupportedTokens() { mockLog('wallet', 'getSupportedTokens'); return ['FND', 'USDC', 'WETH']; },
    async swap() { mockLog('wallet', 'swap'); await delay(1000); return { sourceChain: {}, targetChain: {}, sourceToken: {}, targetToken: {}, status: 'COMPLETED' as const }; },
    async quoteSwap() { mockLog('wallet', 'quoteSwap'); return { sourceChain: {}, targetChain: {}, sourceToken: {}, targetToken: {}, expectedAmountOut: BigInt(10_000000), minAmountOut: BigInt(9_950000) }; },
    async getUsdDepositInstructions() { mockLog('wallet', 'getUsdDepositInstructions'); return { currency: 'usd', depositInstructions: { currency: 'usd', bankName: 'Mock Bank', bankAddress: '123 Mock St', bankRoutingNumber: '000000000', bankAccountNumber: '1234567890', bankBeneficiaryName: 'Frontier Mock', paymentRail: 'ach' }, destinationAddress: '0xdest', destinationNetwork: 'base' }; },
    async getEurDepositInstructions() { mockLog('wallet', 'getEurDepositInstructions'); return { currency: 'eur', depositInstructions: { currency: 'eur', iban: 'DE00000000000000000000', bic: 'MOCKDEFF', accountHolderName: 'Frontier Mock' }, destinationAddress: '0xdest', destinationNetwork: 'base' }; },
    async getLinkedBanks() { mockLog('wallet', 'getLinkedBanks'); return { banks: [] }; },
    async linkUsBankAccount() { mockLog('wallet', 'linkUsBankAccount'); await delay(1000); return { externalAccountId: 'mock-bank-1', bankName: 'Mock Bank', withdrawalAddress: '0xwithdraw', network: 'base' }; },
    async linkEuroAccount() { mockLog('wallet', 'linkEuroAccount'); await delay(1000); return { externalAccountId: 'mock-euro-1', bankName: 'Mock Euro Bank', withdrawalAddress: '0xwithdraw', network: 'base' }; },
    async deleteLinkedBank() { mockLog('wallet', 'deleteLinkedBank'); },
    async getDeprecatedSmartAccounts() { mockLog('wallet', 'getDeprecatedSmartAccounts'); return []; },
  };

  const storage: StorageService = {
    async get<T = any>(key: string): Promise<T | null> {
      mockLog('storage', 'get');
      const raw = localStorage.getItem(MOCK_PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    },
    async set(key: string, value: any) {
      mockLog('storage', 'set');
      localStorage.setItem(MOCK_PREFIX + key, JSON.stringify(value));
    },
    async remove(key: string) {
      mockLog('storage', 'remove');
      localStorage.removeItem(MOCK_PREFIX + key);
    },
    async clear() {
      mockLog('storage', 'clear');
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(MOCK_PREFIX));
      keys.forEach((k) => localStorage.removeItem(k));
    },
  };

  const chain: ChainService = {
    async getCurrentNetwork() { mockLog('chain', 'getCurrentNetwork'); return 'base-sepolia'; },
    async getAvailableNetworks() { mockLog('chain', 'getAvailableNetworks'); return ['base', 'base-sepolia']; },
    async switchNetwork() { mockLog('chain', 'switchNetwork'); },
    async getCurrentChainConfig() {
      mockLog('chain', 'getCurrentChainConfig');
      return { id: 84532, name: 'Base Sepolia', network: 'base-sepolia', bridgeSwapRouterFactoryAddress: '0x0', uniswapV3FactoryAddress: '0x0', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, blockExplorer: { name: 'BaseScan', url: 'https://sepolia.basescan.org' }, stableCoins: [], supportedTokens: [], testnet: true };
    },
    async getContractAddresses() { mockLog('chain', 'getContractAddresses'); return { fnd: '0xfnd', iFnd: '0xifnd', paymentRouter: '0xrouter', subscriptionManager: '0xsubmgr' }; },
  };

  const user: UserService = {
    async getDetails() {
      mockLog('user', 'getDetails');
      return { id: 1, email: 'dev@frontier.local', firstName: 'Dev', lastName: 'User', isActive: true, dateJoined: '2024-01-01T00:00:00Z', isSuperuser: false };
    },
    async getProfile() {
      mockLog('user', 'getProfile');
      return { id: 1, user: 1, firstName: 'Dev', lastName: 'User', nickname: 'dev', profilePicture: '', phoneNumber: '', community: '', communityName: '', organization: '', organizationRole: '', socialSite: '', socialHandle: '', githubHandle: '', currentWork: '', notableWork: '', receiveUpdates: false, notificationCommunityEvent: false, notificationTowerEvent: false, notificationUpcomingEvent: false, notificationTweetPicked: false, notifyEventInvites: false, optInSms: false, howDidYouHearAboutUs: '', braggingStatement: '', contributionStatement: '', hasUsablePassword: 'false' };
    },
    async getReferralOverview() { mockLog('user', 'getReferralOverview'); return { referralCount: 0, ranking: 0, referralLink: 'https://frontier.local/ref/mock', referralCode: 'MOCK', referredBy: null }; },
    async getReferralDetails() { mockLog('user', 'getReferralDetails'); return { count: 0, results: [] }; },
    async addUserContact() { mockLog('user', 'addUserContact'); },
    async getOrCreateKyc() { mockLog('user', 'getOrCreateKyc'); return { status: 'approved', isApproved: true, rejectionReason: null, kycLinkId: null, kycLink: null, tosStatus: 'approved', tosLink: null }; },
    async createSignupRequest() { mockLog('user', 'createSignupRequest'); return { subscriptionUuid: 'mock-uuid', paymentProvider: 'crypto' }; },
    async getVerifiedAccessControls() {
      mockLog('user', 'getVerifiedAccessControls');
      return { smartAccountAddress: '0xmock', email: 'dev@frontier.local', isSuperuser: false, subscriptionStatus: 'active', subscriptionPlan: 'pro', subscriptionInterval: 'monthly', subscriptionType: 'crypto', addOns: [], communities: [], managedCommunities: [], timestamp: new Date().toISOString(), kid: 'mock-kid' };
    },
  };

  const emptyPage = <T,>(): PaginatedResponse<T> => ({ count: 0, results: [] });

  const partnerships: PartnershipsService = {
    async createSponsorPass() { mockLog('partnerships', 'createSponsorPass'); await delay(1000); return { id: 1, sponsor: 1, sponsorName: 'Mock Sponsor', firstName: 'Test', lastName: 'User', email: 'test@mock.local', status: 'active', expiresAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revokedAt: null }; },
    async listActiveSponsorPasses() { mockLog('partnerships', 'listActiveSponsorPasses'); return emptyPage(); },
    async listAllSponsorPasses() { mockLog('partnerships', 'listAllSponsorPasses'); return emptyPage(); },
    async listSponsors() { mockLog('partnerships', 'listSponsors'); return emptyPage(); },
    async getSponsor() { mockLog('partnerships', 'getSponsor'); return { id: 1, name: 'Mock Sponsor', dailyRate: '100.00', notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; },
    async getSponsorPass() { mockLog('partnerships', 'getSponsorPass'); return { id: 1, sponsor: 1, sponsorName: 'Mock Sponsor', firstName: 'Test', lastName: 'User', email: 'test@mock.local', status: 'active', expiresAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), revokedAt: null }; },
    async revokeSponsorPass() { mockLog('partnerships', 'revokeSponsorPass'); },
  };

  const thirdParty: ThirdPartyService = {
    async listDevelopers() { mockLog('thirdParty', 'listDevelopers'); return emptyPage(); },
    async getDeveloper() { mockLog('thirdParty', 'getDeveloper'); return { id: 1, name: 'Mock Dev', description: '', email: 'dev@mock.local', apiKey: 'mock-key', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; },
    async updateDeveloper(p) { mockLog('thirdParty', 'updateDeveloper'); return { id: p.id, name: 'Mock Dev', description: '', email: 'dev@mock.local', apiKey: 'mock-key', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; },
    async rotateDeveloperApiKey(p) { mockLog('thirdParty', 'rotateDeveloperApiKey'); return { message: 'Key rotated', developer: { id: p.id, name: 'Mock Dev', description: '', email: 'dev@mock.local', apiKey: 'new-mock-key', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }; },
    async listApps() { mockLog('thirdParty', 'listApps'); return emptyPage(); },
    async createApp() { mockLog('thirdParty', 'createApp'); await delay(1000); return { id: 1, developer: 1, icon: null, name: 'Mock App', readableId: 'mock-app', description: '', url: '', cnameEntry: '', txtEntry: null, permissions: [], permissionDisclaimer: '', status: 'in_review', reviewNotes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; },
    async getApp() { mockLog('thirdParty', 'getApp'); return { id: 1, developer: 1, icon: null, name: 'Mock App', readableId: 'mock-app', description: '', url: '', cnameEntry: '', txtEntry: null, permissions: [], permissionDisclaimer: '', status: 'in_review', reviewNotes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; },
    async updateApp() { mockLog('thirdParty', 'updateApp'); return { id: 1, developer: 1, icon: null, name: 'Mock App', readableId: 'mock-app', description: '', url: '', cnameEntry: '', txtEntry: null, permissions: [], permissionDisclaimer: '', status: 'in_review', reviewNotes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; },
    async deleteApp() { mockLog('thirdParty', 'deleteApp'); },
    async listWebhooks() { mockLog('thirdParty', 'listWebhooks'); return emptyPage(); },
    async createWebhook() { mockLog('thirdParty', 'createWebhook'); await delay(1000); return { id: 1, developer: 1, name: 'Mock Webhook', description: '', targetUrl: '', config: { events: [], scope: {} }, signingPublicKey: '', status: 'IN_REVIEW', reviewNotes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; },
    async getWebhook() { mockLog('thirdParty', 'getWebhook'); return { id: 1, developer: 1, name: 'Mock Webhook', description: '', targetUrl: '', config: { events: [], scope: {} }, signingPublicKey: '', status: 'IN_REVIEW', reviewNotes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; },
    async updateWebhook() { mockLog('thirdParty', 'updateWebhook'); return { id: 1, developer: 1, name: 'Mock Webhook', description: '', targetUrl: '', config: { events: [], scope: {} }, signingPublicKey: '', status: 'IN_REVIEW', reviewNotes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; },
    async deleteWebhook() { mockLog('thirdParty', 'deleteWebhook'); },
    async rotateWebhookSigningKey() { mockLog('thirdParty', 'rotateWebhookSigningKey'); return { message: 'Key rotated', webhook: { id: 1, developer: 1, name: 'Mock Webhook', description: '', targetUrl: '', config: { events: [], scope: {} }, signingPublicKey: 'new-key', status: 'IN_REVIEW', reviewNotes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }; },
  };

  const communities: CommunitiesService = {
    async listCommunities() { mockLog('communities', 'listCommunities'); return emptyPage(); },
    async getCommunity() { mockLog('communities', 'getCommunity'); return { id: 1, name: 'Mock Community', description: '', slug: 'mock', iconName: '', splashVideo: null }; },
    async createInternshipPass() { mockLog('communities', 'createInternshipPass'); await delay(1000); return { id: 1, email: 'intern@mock.local', firstName: 'Test', lastName: 'Intern', community: 1, communityName: 'Mock Community', status: 'active', createdAt: new Date().toISOString(), revokedAt: null, updatedAt: new Date().toISOString() }; },
    async listInternshipPasses() { mockLog('communities', 'listInternshipPasses'); return emptyPage(); },
    async getInternshipPass() { mockLog('communities', 'getInternshipPass'); return { id: 1, email: 'intern@mock.local', firstName: 'Test', lastName: 'Intern', community: 1, communityName: 'Mock Community', status: 'active', createdAt: new Date().toISOString(), revokedAt: null, updatedAt: new Date().toISOString() }; },
    async revokeInternshipPass() { mockLog('communities', 'revokeInternshipPass'); },
    async createReassignRequest() { mockLog('communities', 'createReassignRequest'); await delay(1000); return { id: 1, requester: 1, requesterEmail: 'dev@frontier.local', member: 2, memberEmail: 'member@mock.local', targetCommunity: 2, targetCommunityName: 'Target Community', status: 'pending', createdAt: new Date().toISOString(), resolvedAt: null, resolvedBy: null, resolvedByEmail: null }; },
    async listReassignRequests() { mockLog('communities', 'listReassignRequests'); return emptyPage(); },
    async getReassignRequest() { mockLog('communities', 'getReassignRequest'); return { id: 1, requester: 1, requesterEmail: 'dev@frontier.local', member: 2, memberEmail: 'member@mock.local', targetCommunity: 2, targetCommunityName: 'Target Community', status: 'pending', createdAt: new Date().toISOString(), resolvedAt: null, resolvedBy: null, resolvedByEmail: null }; },
    async acceptReassignRequest() { mockLog('communities', 'acceptReassignRequest'); return { id: 1, requester: 1, requesterEmail: 'dev@frontier.local', member: 2, memberEmail: 'member@mock.local', targetCommunity: 2, targetCommunityName: 'Target Community', status: 'accepted', createdAt: new Date().toISOString(), resolvedAt: new Date().toISOString(), resolvedBy: 1, resolvedByEmail: 'dev@frontier.local' }; },
    async rejectReassignRequest() { mockLog('communities', 'rejectReassignRequest'); },
  };

  const events: EventsService = {
    async listEvents() { mockLog('events', 'listEvents'); return emptyPage(); },
    async createEvent() { mockLog('events', 'createEvent'); await delay(1000); return { id: 1, name: 'Mock Event', description: '', eventType: 'public', eventService: 'private', host: 'dev@frontier.local', community: null, startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 3600000).toISOString(), coverImage: null, eventId: 'mock-event-1', location: 'mock-loc', locationName: 'Mock Location', displayLocation: 'Mock Location', url: '', additionalHosts: [], color: '#764AE2', reviewStatus: 'not_required', status: 'active' }; },
    async addEventHost() { mockLog('events', 'addEventHost'); return { id: 1, name: 'Mock Event', description: '', eventType: 'public', eventService: 'private', host: 'dev@frontier.local', community: null, startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 3600000).toISOString(), coverImage: null, eventId: 'mock-event-1', location: 'mock-loc', locationName: 'Mock Location', displayLocation: 'Mock Location', url: '', additionalHosts: ['cohost@mock.local'], color: '#764AE2', reviewStatus: 'not_required', status: 'active' }; },
    async listLocations() { mockLog('events', 'listLocations'); return []; },
    async listRoomBookings() { mockLog('events', 'listRoomBookings'); return emptyPage(); },
    async createRoomBooking() { mockLog('events', 'createRoomBooking'); await delay(1000); return { id: 1, startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 3600000).toISOString(), location: 'mock-room' }; },
    async getCryptoDepositPreflight() { mockLog('events', 'getCryptoDepositPreflight'); return { spender: '0xspender', network: 'base-sepolia', amount: '400.00', currency: 'usd', tokens: [{ key: 'ifnd_token', address: '0xifnd', decimals: 6, baseUnits: '400000000' }, { key: 'fnd_token', address: '0xfnd', decimals: 6, baseUnits: '400000000' }] }; },
    async placeCryptoDeposit() { mockLog('events', 'placeCryptoDeposit'); await delay(1000); return { provider: 'crypto', status: 'secured', amount: '400.00', currency: 'usd', reference: '0xmocktxhash', statusReason: '' }; },
  };

  const offices: OfficesService = {
    async createAccessPass() { mockLog('offices', 'createAccessPass'); await delay(1000); return { id: 1, email: 'visitor@mock.local', firstName: 'Test', lastName: 'Visitor', status: 'active', membershipContract: 1, contractReference: 'MOCK-001', createdAt: new Date().toISOString(), revokedAt: null, updatedAt: new Date().toISOString() }; },
    async listAccessPasses() { mockLog('offices', 'listAccessPasses'); return emptyPage(); },
    async getAccessPass() { mockLog('offices', 'getAccessPass'); return { id: 1, email: 'visitor@mock.local', firstName: 'Test', lastName: 'Visitor', status: 'active', membershipContract: 1, contractReference: 'MOCK-001', createdAt: new Date().toISOString(), revokedAt: null, updatedAt: new Date().toISOString() }; },
    async revokeAccessPass() { mockLog('offices', 'revokeAccessPass'); },
  };

  const navigation: NavigationService = {
    async openApp(appId) { mockLog('navigation', `openApp(${appId})`); },
    async close() { mockLog('navigation', 'close'); },
    onDeepLink(callback) {
      mockLog('navigation', 'onDeepLink');
      // In standalone mode, simulate a deep link after 1s for development
      const timer = setTimeout(() => callback({ path: '/', params: {} }), 1000);
      return () => clearTimeout(timer);
    },
  };

  return { wallet, storage, chain, user, partnerships, thirdParty, communities, events, offices, navigation };
}

// ── React Context ───────────────────────────────────────────────────────────

const ServicesContext = createContext<FrontierServices | null>(null);

export const useServices = (): FrontierServices => {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used within FrontierServicesProvider');
  return services;
};

export const FrontierServicesProvider = ({
  services,
  children,
}: {
  services?: FrontierServices;
  children: ReactNode;
}) => {
  const value = services ?? createMockServices();
  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};
