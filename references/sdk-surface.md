# Frontier SDK Surface Reference (v0.20.0)

Complete API reference for `@frontiertower/frontier-sdk`. Every method, type, and permission extracted from source.

Package: `@frontiertower/frontier-sdk`
Import paths:
- `@frontiertower/frontier-sdk` -- main SDK class and access modules
- `@frontiertower/frontier-sdk/ui-utils` -- detection and standalone helpers

---

## 1. SDK Initialization

### Class: `FrontierSDK`

```typescript
import { FrontierSDK } from '@frontiertower/frontier-sdk';
```

#### Constructor

```typescript
const sdk = new FrontierSDK();
```

On construction the SDK:
1. Instantiates all ten access modules (wallet, storage, chain, user, partnerships, thirdParty, communities, events, offices, navigation).
2. Registers a `window.addEventListener('message', ...)` listener that routes `SDKResponse` messages from `window.parent`.
3. Sends an `{ type: 'app:ready', payload: null }` postMessage to `window.parent` to notify the host that the app iframe is ready.

#### `destroy(): void`

Call when the app is being torn down. Removes the message event listener, calls `this.navigation.destroy()` to clean up deep-link listeners, and clears all pending request promises.

#### Internal: `request(type: string, payload?: any): Promise<any>`

Used by all access classes. Sends an `SDKRequest` via `window.parent.postMessage` and returns a promise that resolves/rejects when the host responds. Requests time out after **30 000 ms**.

### PostMessage Protocol Types

```typescript
interface SDKRequest {
  type: string;        // e.g. 'wallet:getBalance'
  requestId: string;   // `${Date.now()}-${incrementingId}`
  payload?: any;
}

interface SDKResponse {
  type: 'response' | 'error';
  requestId: string;
  result?: any;
  error?: string;
}
```

### Module Getters

| Getter | Returns | Module |
|---|---|---|
| `sdk.getWallet()` | `WalletAccess` | Wallet |
| `sdk.getStorage()` | `StorageAccess` | Storage |
| `sdk.getChain()` | `ChainAccess` | Chain |
| `sdk.getUser()` | `UserAccess` | User |
| `sdk.getPartnerships()` | `PartnershipsAccess` | Partnerships |
| `sdk.getThirdParty()` | `ThirdPartyAccess` | Third-Party |
| `sdk.getCommunities()` | `CommunitiesAccess` | Communities |
| `sdk.getEvents()` | `EventsAccess` | Events |
| `sdk.getOffices()` | `OfficesAccess` | Offices |
| `sdk.getNavigation()` | `NavigationAccess` | Navigation |

---

## 2. Wallet Module

Access via `sdk.getWallet()`. All methods use the current chain from the chain manager. Write operations require biometric authentication.

### Methods

```typescript
getBalance(): Promise<WalletBalance>
```
Returns raw balance breakdown (bigint values). Permission: `wallet:getBalance`

```typescript
getBalanceFormatted(): Promise<WalletBalanceFormatted>
```
Returns display-formatted balance strings (e.g. `'$10.50'`). Permission: `wallet:getBalanceFormatted`

```typescript
getAddress(): Promise<string>
```
Returns the smart account contract address for the current chain. Permission: `wallet:getAddress`

```typescript
getSmartAccount(): Promise<SmartAccount>
```
Returns detailed smart account info including deployment status. Permission: `wallet:getSmartAccount`

```typescript
transferERC20(
  tokenAddress: string,
  to: string,
  amount: bigint,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Transfer ERC20 tokens. Amount in token's smallest unit. Permission: `wallet:transferERC20`

```typescript
approveERC20(
  tokenAddress: string,
  spender: string,
  amount: bigint,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Approve a spender for ERC20 tokens. Permission: `wallet:approveERC20`

```typescript
transferNative(
  to: string,
  amount: bigint,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Transfer native currency (ETH). Amount in wei. Permission: `wallet:transferNative`

```typescript
executeCall(
  call: ExecuteCall,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Execute an arbitrary contract call. Permission: `wallet:executeCall`

```typescript
executeBatchCall(
  calls: ExecuteCall[],
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Execute multiple calls atomically in a single transaction. Permission: `wallet:executeBatchCall`

```typescript
transferFrontierDollar(
  to: string,
  amount: string,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Transfer FND (Frontier Network Dollar). Amount is human-readable string (e.g. `'10.5'`). Permission: `wallet:transferFrontierDollar`

```typescript
transferInternalFrontierDollar(
  to: string,
  amount: string,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Transfer iFND (Internal Frontier Network Dollar). Amount is human-readable string. Permission: `wallet:transferInternalFrontierDollar`

```typescript
transferOverallFrontierDollar(
  to: string,
  amount: string,
  overrides?: GasOverrides
): Promise<UserOperationReceipt>
```
Transfer using iFND first, falling back to FND for the remainder. Permission: `wallet:transferOverallFrontierDollar`

```typescript
getSupportedTokens(): Promise<string[]>
```
Returns token symbols supported for swaps on the current chain (e.g. `['FND', 'USDC', 'WETH']`). Permission: `wallet:getSupportedTokens`

```typescript
swap(
  sourceToken: string,
  targetToken: string,
  sourceNetwork: string,
  targetNetwork: string,
  amount: string
): Promise<SwapResult>
```
Execute a token swap (same-chain or cross-chain). Amount is human-readable. Permission: `wallet:swap`

```typescript
quoteSwap(
  sourceToken: string,
  targetToken: string,
  sourceNetwork: string,
  targetNetwork: string,
  amount: string
): Promise<SwapQuote>
```
Get a swap quote without executing. Permission: `wallet:quoteSwap`

```typescript
getUsdDepositInstructions(): Promise<OnRampResponse<UsdDepositInstructions>>
```
Get US bank details for fiat-to-crypto on-ramp. Requires approved KYC. Permission: `wallet:getUsdDepositInstructions`

```typescript
getEurDepositInstructions(): Promise<OnRampResponse<EurDepositInstructions>>
```
Get SEPA bank details for EUR fiat-to-crypto on-ramp. Requires approved KYC. Permission: `wallet:getEurDepositInstructions`

```typescript
getLinkedBanks(): Promise<LinkedBanksResponse>
```
Get all linked bank accounts for off-ramp withdrawals. Requires approved KYC. Permission: `wallet:getLinkedBanks`

```typescript
linkUsBankAccount(
  accountOwnerName: string,
  bankName: string,
  routingNumber: string,
  accountNumber: string,
  checkingOrSavings: 'checking' | 'savings',
  address: BillingAddress
): Promise<LinkBankResponse>
```
Link a US bank account for USD withdrawals via ACH. Requires approved KYC. Permission: `wallet:linkUsBankAccount`

```typescript
linkEuroAccount(
  accountOwnerName: string,
  accountOwnerType: AccountOwnerType,
  firstName: string,
  lastName: string,
  ibanAccountNumber: string,
  bic?: string
): Promise<LinkBankResponse>
```
Link a EUR/IBAN bank account for SEPA withdrawals. Requires approved KYC. Permission: `wallet:linkEuroAccount`

```typescript
deleteLinkedBank(bankId: string): Promise<void>
```
Delete a linked bank account. Permission: `wallet:deleteLinkedBank`

```typescript
getDeprecatedSmartAccounts(): Promise<DeprecatedSmartAccount[]>
```
Get deprecated smart accounts that still have active gas sponsorship. Permission: `wallet:getDeprecatedSmartAccounts`

### Wallet Types

```typescript
interface SmartAccount {
  id: number;
  ownerAddress: string;
  contractAddress: string | null;
  network: string;
  status: string;
  deploymentTransactionHash: string;
  createdAt: string;
}

interface WalletBalance {
  total: bigint;
  fnd: bigint;
  internalFnd: bigint;
}

interface WalletBalanceFormatted {
  total: string;    // e.g. '$10.50'
  fnd: string;
  internalFnd: string;
}

interface UserOperationReceipt {
  userOpHash: string;
  transactionHash: string;
  blockNumber: bigint;
  success: boolean;
}

interface GasOverrides {
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasLimit?: bigint;
}

interface ExecuteCall {
  target: string;
  value?: bigint;
  data: string;
}

interface SwapParams {
  sourceToken: string;
  targetToken: string;
  sourceNetwork: string;
  targetNetwork: string;
  amount: string;
}

enum SwapResultStatus {
  COMPLETED = 'COMPLETED',
  SUBMITTED = 'SUBMITTED',
}

interface SwapResult {
  sourceChain: object;
  targetChain: object;
  sourceToken: object;
  targetToken: object;
  status: SwapResultStatus;
}

interface SwapQuote {
  sourceChain: object;
  targetChain: object;
  sourceToken: object;
  targetToken: object;
  expectedAmountOut: string;
  minAmountOut: string;
}

interface UsdDepositInstructions {
  currency: 'usd';
  bankName: string;
  bankAddress: string;
  bankRoutingNumber: string;
  bankAccountNumber: string;
  bankBeneficiaryName: string;
  paymentRail: string;
}

interface EurDepositInstructions {
  currency: 'eur';
  iban: string;
  bic: string;
  accountHolderName: string;
}

interface OnRampResponse<T = UsdDepositInstructions | EurDepositInstructions> {
  currency: 'usd' | 'eur';
  depositInstructions: T;
  destinationAddress: string;
  destinationNetwork: string;
}

interface LinkedBank {
  id: string;
  bankName: string;
  last4: string;
  withdrawalAddress: string;
  network: string;
}

interface LinkedBanksResponse {
  banks: LinkedBank[];
}

interface LinkBankResponse {
  externalAccountId: string;
  bankName: string;
  withdrawalAddress: string;
  network: string;
}

interface BillingAddress {
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

type AccountOwnerType = 'individual' | 'business';

interface DeprecatedSmartAccount {
  id: number;
  ownerAddress: string;
  contractAddress: string;
  network: string;
  deprecatedAt: string;
  version: number;
}
```

---

## 3. Storage Module

Access via `sdk.getStorage()`. Provides persistent key-value storage scoped to the app.

### Methods

```typescript
get<T = any>(key: string): Promise<T>
```
Read a value by key. Permission: `storage:get`

```typescript
set(key: string, value: any): Promise<void>
```
Write a value by key. Permission: `storage:set`

```typescript
remove(key: string): Promise<void>
```
Delete a key. Permission: `storage:remove`

```typescript
clear(): Promise<void>
```
Delete all keys. Permission: `storage:clear`

### Storage Types

No additional types -- uses generic `T` for get, `any` for set.

---

## 4. Chain Module

Access via `sdk.getChain()`. Query and switch blockchain networks.

### Methods

```typescript
getCurrentNetwork(): Promise<string>
```
Returns the current network identifier (e.g. `'base'`, `'base-sepolia'`). Permission: `chain:getCurrentNetwork`

```typescript
getAvailableNetworks(): Promise<string[]>
```
Returns all network identifiers the app can switch to. Permission: `chain:getAvailableNetworks`

```typescript
switchNetwork(network: string): Promise<void>
```
Switch active blockchain network. Affects all subsequent wallet operations. Permission: `chain:switchNetwork`

```typescript
getCurrentChainConfig(): Promise<ChainConfig>
```
Returns full chain configuration for the current network. Permission: `chain:getCurrentChainConfig`

```typescript
getContractAddresses(): Promise<{
  fnd: string;
  iFnd: string | null;
  paymentRouter: string;
  subscriptionManager: string;
}>
```
Returns addresses for FND, iFND (may be null), PaymentRouter, and SubscriptionManager contracts on the current chain. Permission: `chain:getContractAddresses`

### Chain Types

```typescript
enum Underlying {
  USD = "USD",
}

interface Token {
  name: string;
  symbol: string;
  decimals: number;
  address: string;
}

interface StableCoin extends Token {
  underlying: Underlying;
}

interface ChainConfig {
  id: number;
  name: string;
  network: string;
  bridgeSwapRouterFactoryAddress: string;
  uniswapV3FactoryAddress: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: {
    name: string;
    url: string;
  };
  stableCoins: StableCoin[];
  supportedTokens: Token[];
  testnet: boolean;
}
```

---

## 5. User Module

Access via `sdk.getUser()`. Query user info, profiles, referrals, KYC, and access controls.

### Methods

```typescript
getDetails(): Promise<User>
```
Returns basic user info (id, email, name, active/superuser status). Permission: `user:getDetails`

```typescript
getProfile(): Promise<UserProfile>
```
Returns detailed profile (social handles, preferences, community, notification settings). Permission: `user:getProfile`

```typescript
getReferralOverview(): Promise<ReferralOverview>
```
Returns referral statistics (count, ranking, referral link/code). Permission: `user:getReferralOverview`

```typescript
getReferralDetails(page?: number): Promise<PaginatedResponse<ReferralDetails>>
```
Returns paginated referral details. Permission: `user:getReferralDetails`

```typescript
addUserContact(data: UserContactPayload): Promise<void>
```
Submit contact information for the current user. Permission: `user:addUserContact`

```typescript
getOrCreateKyc(redirectUri?: string): Promise<KycStatusResponse>
```
Get or initiate KYC verification. Returns status and a KYC link if verification has been started. Permission: `user:getOrCreateKyc`

```typescript
createSignupRequest(payload: CreateSignupRequestPayload): Promise<CreateSignupRequestResponse>
```
Submit a new membership signup request with crypto payment. Permission: `user:createSignupRequest`

```typescript
getVerifiedAccessControls(): Promise<AccessControlsPayload>
```
Returns cryptographically verified access controls signed by the Frontier API server. The SDK verifies an ECDSA secp256k1 signature against hardcoded per-environment public keys inside the iframe. **Use this for all access-gating decisions** -- unsigned data from other SDK methods should not be trusted for feature gating. Throws if signature verification fails. Permission: `user:getVerifiedAccessControls`

### User Types

```typescript
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  dateJoined: string;
  isSuperuser: boolean;
}

interface UserProfile {
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

interface PaginatedResponse<T> {
  count: number;
  results: T[];
}

interface ReferralOverview {
  referralCount: number;
  ranking: number;
  referralLink: string;
  referralCode: string;
  referredBy: string | null;
}

interface ReferralDetails {
  name: string;
  email: string;
  referralDate: string;
  reward: string;
  status: string;
}

interface UserContact {
  email: string;
  phone: string;
  name: string;
}

interface UserContactPayload {
  contacts: UserContact[];
}

type KycStatus = 'not_started' | 'pending' | 'in_review' | 'approved' | 'rejected';
type TosStatus = 'pending' | 'approved';

interface KycStatusResponse {
  status: KycStatus;
  isApproved: boolean;
  rejectionReason: string | null;
  kycLinkId: string | null;
  kycLink: string | null;
  tosStatus: TosStatus | null;
  tosLink: string | null;
}

interface CreateSignupRequestPayload {
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

interface CreateSignupRequestResponse {
  subscriptionUuid: string;
  paymentProvider: string;
}
```

### Access Controls Types

```typescript
interface AccessControlsPayload {
  smartAccountAddress: string | null;
  email: string;
  isSuperuser: boolean;
  subscriptionStatus: string | null;   // 'active' | 'canceled' | 'awaiting_approval' | null
  subscriptionPlan: string | null;
  subscriptionInterval: string | null;
  subscriptionType: string | null;     // 'crypto' | 'stripe' | 'grant' | 'office' | 'internship' | null
  addOns: string[];
  communities: string[];
  managedCommunities: string[];
  timestamp: string;
  kid: string;
}

interface SignedAccessControls {
  accessControls: string;  // Base64-encoded canonical JSON payload
  stage: string;           // API stage (e.g. 'production', 'sandbox')
  signature: string;       // Hex-encoded ECDSA signature (r||s, 128 hex chars)
}
```

---

## 6. Partnerships Module

Access via `sdk.getPartnerships()`. Manage sponsors and sponsor passes.

### Methods

```typescript
createSponsorPass(payload: CreateSponsorPassRequest): Promise<SponsorPass>
```
Create a new SponsorPass. Permission: `partnerships:createSponsorPass`

```typescript
listActiveSponsorPasses(payload?: ListSponsorPassesParams): Promise<PaginatedResponse<SponsorPass>>
```
List active (non-revoked) SponsorPasses, paginated. Permission: `partnerships:listActiveSponsorPasses`

```typescript
listAllSponsorPasses(payload?: ListAllSponsorPassesParams): Promise<PaginatedResponse<SponsorPass>>
```
List all SponsorPasses, optionally including revoked. Permission: `partnerships:listAllSponsorPasses`

```typescript
listSponsors(payload?: ListSponsorsParams): Promise<PaginatedResponse<Sponsor>>
```
List sponsors the user manages, paginated. Permission: `partnerships:listSponsors`

```typescript
getSponsor(payload: { id: number }): Promise<Sponsor>
```
Retrieve a Sponsor by ID. Permission: `partnerships:getSponsor`

```typescript
getSponsorPass(payload: { id: number }): Promise<SponsorPass>
```
Retrieve a SponsorPass by ID. Permission: `partnerships:getSponsorPass`

```typescript
revokeSponsorPass(payload: { id: number }): Promise<void>
```
Revoke (not delete) a SponsorPass. Permission: `partnerships:revokeSponsorPass`

### Partnerships Types

```typescript
type SponsorPassStatus = 'active' | 'revoked';

interface SponsorPass {
  id: number;
  sponsor: number;
  sponsorName: string;
  firstName: string;
  lastName: string;
  email: string;
  status: SponsorPassStatus;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  revokedAt: string | null;
}

interface CreateSponsorPassRequest {
  sponsor: number;
  firstName: string;
  lastName: string;
  email: string;
  expiresAt?: string;
}

interface ListSponsorPassesParams {
  limit?: number;
  offset?: number;
}

interface ListAllSponsorPassesParams extends ListSponsorPassesParams {
  includeRevoked?: boolean;
}

interface Sponsor {
  id: number;
  name: string;
  dailyRate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface ListSponsorsParams {
  limit?: number;
  offset?: number;
}
```

---

## 7. Third-Party Module

Access via `sdk.getThirdParty()`. Manage developer accounts, registered apps, and webhooks.

### Developer Methods

```typescript
listDevelopers(payload?: ListParams): Promise<PaginatedResponse<Developer>>
```
List developer accounts, paginated. Permission: `thirdParty:listDevelopers`

```typescript
getDeveloper(payload: { id: number }): Promise<Developer>
```
Get developer details by ID. Permission: `thirdParty:getDeveloper`

```typescript
updateDeveloper(payload: { id: number; data: UpdateDeveloperRequest }): Promise<Developer>
```
Update developer information. Permission: `thirdParty:updateDeveloper`

```typescript
rotateDeveloperApiKey(payload: { id: number }): Promise<RotateKeyResponse>
```
Rotate developer API key. New key is only shown once in the response. Permission: `thirdParty:rotateDeveloperApiKey`

### App Methods

```typescript
listApps(payload?: ListAppsParams): Promise<PaginatedResponse<App>>
```
List registered apps, paginated. Optional `developerId` filter. Permission: `thirdParty:listApps`

```typescript
createApp(payload: CreateAppRequest): Promise<App>
```
Register a new app. Name, description, and icon are auto-fetched from URL metadata. Permission: `thirdParty:createApp`

```typescript
getApp(payload: { id: number }): Promise<App>
```
Get app details by ID. Permission: `thirdParty:getApp`

```typescript
updateApp(payload: { id: number; data: UpdateAppRequest }): Promise<App>
```
Update an app. Permission: `thirdParty:updateApp`

```typescript
deleteApp(payload: { id: number }): Promise<void>
```
Request app deactivation. Permission: `thirdParty:deleteApp`

### Webhook Methods

```typescript
listWebhooks(payload?: ListWebhooksParams): Promise<PaginatedResponse<Webhook>>
```
List webhooks, paginated. Max 3 webhooks per developer. Optional `developerId` filter. Permission: `thirdParty:listWebhooks`

```typescript
createWebhook(payload: CreateWebhookRequest): Promise<Webhook>
```
Create a new webhook. Requires admin approval before going live. Permission: `thirdParty:createWebhook`

```typescript
getWebhook(payload: { id: number }): Promise<Webhook>
```
Get webhook details by ID. Permission: `thirdParty:getWebhook`

```typescript
updateWebhook(payload: { id: number; data: UpdateWebhookRequest }): Promise<Webhook>
```
Update a webhook. Config changes require admin re-approval. Permission: `thirdParty:updateWebhook`

```typescript
deleteWebhook(payload: { id: number }): Promise<void>
```
Delete a webhook. Permission: `thirdParty:deleteWebhook`

```typescript
rotateWebhookSigningKey(payload: { id: number }): Promise<RotateWebhookKeyResponse>
```
Rotate webhook signing key. New public key returned in response. Permission: `thirdParty:rotateWebhookSigningKey`

### Third-Party Types

```typescript
interface Developer {
  id: number;
  name: string;
  description: string;
  email: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateDeveloperRequest {
  name?: string;
  description?: string;
  email?: string;
}

interface RotateKeyResponse {
  message: string;
  developer: Developer;
}

type AppStatus =
  | 'in_review'
  | 'accepted'
  | 'released'
  | 'rejected'
  | 'request_deactivation'
  | 'deactivated';

type AppPermission = string;

interface App {
  id: number;
  developer: number;
  icon: string | null;
  name: string;
  readableId: string;
  description: string;
  url: string;
  cnameEntry: string;
  txtEntry: string | null;
  permissions: AppPermission[];
  permissionDisclaimer: string;
  status: AppStatus;
  reviewNotes: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateAppRequest {
  developer: number;
  url: string;
  cnameEntry: string;
  txtEntry?: string;
  permissions: AppPermission[];
  permissionDisclaimer: string;
}

interface UpdateAppRequest {
  developer?: number;
  url?: string;
  cnameEntry?: string;
  txtEntry?: string;
  permissions?: AppPermission[];
  permissionDisclaimer?: string;
}

type WebhookStatus = 'IN_REVIEW' | 'LIVE' | 'REJECTED';
type WebhookEvent = string;
type WebhookScope = Record<string, number[] | '*'>;

interface WebhookConfig {
  events: WebhookEvent[];
  scope: WebhookScope;
}

interface Webhook {
  id: number;
  developer: number;
  name: string;
  description: string;
  targetUrl: string;
  config: WebhookConfig;
  signingPublicKey: string;
  status: WebhookStatus;
  reviewNotes: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateWebhookRequest {
  developer: number;
  name: string;
  description: string;
  targetUrl: string;
  config: WebhookConfig;
}

interface UpdateWebhookRequest {
  developer?: number;
  name?: string;
  description?: string;
  targetUrl?: string;
  config?: WebhookConfig;
}

interface RotateWebhookKeyResponse {
  message: string;
  webhook: Webhook;
}

interface ListParams {
  limit?: number;
  offset?: number;
}

interface ListAppsParams extends ListParams {
  developerId?: number;
}

interface ListWebhooksParams extends ListParams {
  developerId?: number;
}
```

---

## 8. Communities Module

Access via `sdk.getCommunities()`. Manage communities, internship passes, and member reassignment requests.

Community listing is public. Internship passes require authentication, an active subscription, and community manager status. Reassign requests require authentication; creating requires managing the member's current community, accepting requires managing the target community. Superusers can access everything.

### Methods

```typescript
listCommunities(payload?: ListCommunitiesParams): Promise<PaginatedResponse<Community>>
```
List all visible communities, paginated. Permission: `communities:listCommunities`

```typescript
getCommunity(payload: { idOrSlug: string | number }): Promise<Community>
```
Get a community by numeric ID or slug string. Permission: `communities:getCommunity`

```typescript
createInternshipPass(payload: CreateInternshipPassRequest): Promise<InternshipPass>
```
Create an internship pass. Auto-creates an inactive account if the user does not exist. Permission: `communities:createInternshipPass`

```typescript
listInternshipPasses(payload?: ListInternshipPassesParams): Promise<PaginatedResponse<InternshipPass>>
```
List internship passes for managed communities. Active only by default; set `includeRevoked: true` to include revoked. Permission: `communities:listInternshipPasses`

```typescript
getInternshipPass(payload: { id: number }): Promise<InternshipPass>
```
Get an internship pass by ID. Permission: `communities:getInternshipPass`

```typescript
revokeInternshipPass(payload: { id: number }): Promise<void>
```
Revoke an internship pass. Cannot revoke an already-revoked pass. Permission: `communities:revokeInternshipPass`

```typescript
createReassignRequest(payload: CreateReassignRequestPayload): Promise<ReassignRequest>
```
Request to move a member to a different community. Caller must manage the member's current community. Permission: `communities:createReassignRequest`

```typescript
listReassignRequests(payload?: ListReassignRequestsParams): Promise<PaginatedResponse<ReassignRequest>>
```
List pending reassign requests visible to the caller. Permission: `communities:listReassignRequests`

```typescript
getReassignRequest(payload: { id: number }): Promise<ReassignRequest>
```
Get a reassign request by ID. Permission: `communities:getReassignRequest`

```typescript
acceptReassignRequest(payload: { id: number }): Promise<ReassignRequest>
```
Accept a reassign request. Moves the member to the target community. Only target community managers (or superusers) can accept. Permission: `communities:acceptReassignRequest`

```typescript
rejectReassignRequest(payload: { id: number }): Promise<void>
```
Reject a reassign request. Only pending requests can be rejected. Permission: `communities:rejectReassignRequest`

### Communities Types

```typescript
interface Community {
  id: number;
  name: string;
  description: string;
  slug: string;
  iconName: string;
  splashVideo: string | null;
}

interface ListCommunitiesParams {
  limit?: number;
  offset?: number;
}

type InternshipPassStatus = 'active' | 'revoked';

interface InternshipPass {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  community: number;
  communityName: string;
  status: InternshipPassStatus;
  createdAt: string;
  revokedAt: string | null;
  updatedAt: string;
}

interface CreateInternshipPassRequest {
  email: string;
  firstName: string;
  lastName: string;
  community: number;
}

interface ListInternshipPassesParams {
  limit?: number;
  offset?: number;
  includeRevoked?: boolean;
}

type ReassignRequestStatus = 'pending' | 'accepted' | 'rejected';

interface ReassignRequest {
  id: number;
  requester: number;
  requesterEmail: string;
  member: number;
  memberEmail: string;
  targetCommunity: number;
  targetCommunityName: string;
  status: ReassignRequestStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: number | null;
  resolvedByEmail: string | null;
}

interface CreateReassignRequestPayload {
  memberEmail: string;
  targetCommunity: number;
}

interface ListReassignRequestsParams {
  limit?: number;
  offset?: number;
}
```

---

## 9. Events Module

Access via `sdk.getEvents()`. Manage events, locations (event spaces and rooms), and room bookings.

### Methods

```typescript
listEvents(payload?: ListEventsParams): Promise<PaginatedResponse<Event>>
```
List active events with optional filters (search, type, location, date range). Permission: `events:listEvents`

```typescript
createEvent(payload: CreateEventRequest): Promise<Event>
```
Create a new event. Permission: `events:createEvent`

```typescript
addEventHost(payload: { eventId: number; email: string }): Promise<Event>
```
Add a co-host to an event. Only the primary host can add co-hosts, and only to upcoming events. Permission: `events:addEventHost`

```typescript
listLocations(payload?: ListLocationsParams): Promise<Location[]>
```
List available locations. Returns an array (not paginated). Optional `locationType` filter. Permission: `events:listLocations`

```typescript
listRoomBookings(payload?: ListRoomBookingsParams): Promise<PaginatedResponse<RoomBooking>>
```
List approved room bookings with optional filters. Permission: `events:listRoomBookings`

```typescript
createRoomBooking(payload: CreateRoomBookingRequest): Promise<RoomBooking>
```
Create a room booking. Location must be of type `'room'`. Permission: `events:createRoomBooking`

### Events Types

```typescript
type EventType = 'public' | 'members_plus_one' | 'members_only' | 'community_only';
type EventService = 'luma' | 'private' | 'test';
type ReviewStatus = 'not_required' | 'approved' | 'rejected' | 'pending';
type EventStatus = 'active' | 'suspended' | 'archived';
type LocationType = 'event_space' | 'room';

interface Event {
  id: number;
  name: string;
  description: string;
  eventType: EventType;
  eventService: EventService;
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
  reviewStatus: ReviewStatus;
  status: EventStatus;
}

interface ListEventsParams {
  search?: string;
  eventType?: EventType;
  locationType?: LocationType;
  locationId?: string;
  date?: string;          // YYYY-MM-DD
  startDate?: string;     // YYYY-MM-DD
  endDate?: string;       // YYYY-MM-DD
  page?: number;
}

interface CreateEventRequest {
  name: string;
  eventType: EventType;
  startsAt: string;       // ISO 8601
  endsAt: string;         // ISO 8601
  location: string;       // readable_id slug
  description?: string;
  coverImage?: string;    // Base64 data URI
  additionalHosts?: string[];
  color?: string;         // Hex color code
}

interface Location {
  id: number;
  owner: number | null;
  readableId: string;
  name: string;
  maxCapacity: number;
  description: string;
  directions: string;
  locationType: LocationType;
  warmupBuffer: string;    // e.g. "00:10:00"
  cooldownBuffer: string;  // e.g. "00:15:00"
  openBooking: boolean;
  floorLocation: string;
}

interface ListLocationsParams {
  locationType?: LocationType;
}

interface RoomBooking {
  id: number;
  startsAt: string;
  endsAt: string;
  location: string;
}

interface ListRoomBookingsParams {
  locationId?: string;
  date?: string;          // YYYY-MM-DD
  startDate?: string;     // YYYY-MM-DD
  endDate?: string;       // YYYY-MM-DD
  page?: number;
}

interface CreateRoomBookingRequest {
  startsAt: string;       // ISO 8601
  endsAt: string;         // ISO 8601
  location: string;       // readable_id (must be room type)
}
```

---

## 10. Offices Module

Access via `sdk.getOffices()`. Manage office access passes for membership contracts.

All endpoints require authentication, an active subscription, and manager status on the membership contract's organization (or superuser).

### Methods

```typescript
createAccessPass(payload: CreateAccessPassRequest): Promise<AccessPass>
```
Create an access pass for a membership contract. Auto-creates an inactive account if the user does not exist. Each user can only have one active pass per contract. Permission: `offices:createAccessPass`

```typescript
listAccessPasses(payload?: ListAccessPassesParams): Promise<PaginatedResponse<AccessPass>>
```
List access passes for contracts the user manages. Active only by default; set `includeRevoked: true` for all. Ordered newest first. Permission: `offices:listAccessPasses`

```typescript
getAccessPass(payload: { id: number }): Promise<AccessPass>
```
Get an access pass by ID. Permission: `offices:getAccessPass`

```typescript
revokeAccessPass(payload: { id: number }): Promise<void>
```
Revoke an access pass. Cannot revoke an already-revoked pass. Permission: `offices:revokeAccessPass`

### Offices Types

```typescript
type AccessPassStatus = 'active' | 'revoked';

interface AccessPass {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  status: AccessPassStatus;
  membershipContract: number;
  contractReference: string;
  createdAt: string;
  revokedAt: string | null;
  updatedAt: string;
}

interface CreateAccessPassRequest {
  email: string;
  firstName: string;
  lastName: string;
  membershipContract: number;
}

interface ListAccessPassesParams {
  limit?: number;
  offset?: number;
  includeRevoked?: boolean;
}
```

---

## 11. Navigation Module

Access via `sdk.getNavigation()`. App-to-app deep linking. Allows apps to navigate to other Frontier OS apps and receive incoming deep link data.

### Methods

```typescript
openApp(appId: string, options?: NavigationOpenAppOptions): Promise<void>
```
Navigate the host to another app in the Frontier OS ecosystem. `appId` is the target app ID from the Frontier app registry. `options.path` provides an optional deep link path for the target app. `options.params` provides optional key-value params for the target app. Permission: `navigation:openApp`

```typescript
close(): Promise<void>
```
Close the current app and return to the previous screen. Permission: `navigation:close`

```typescript
onDeepLink(callback: (data: DeepLinkData) => void): () => void
```
Register a callback for incoming deep link data. Called when this app was opened via another app's `openApp()` call. Returns an unsubscribe function. No permission required (passive listener).

### Navigation Types

```typescript
interface NavigationOpenAppOptions {
  path?: string;
  params?: Record<string, string>;
}

interface DeepLinkData {
  path?: string;
  params?: Record<string, string>;
}
```

---

## 12. UI Utilities

Import from `@frontiertower/frontier-sdk/ui-utils`.

### Detection

```typescript
function isInFrontierApp(): boolean
```
Returns `true` if the window is embedded in an iframe (`window.self !== window.top`). Use to detect whether the app is running inside the Frontier Wallet host.

```typescript
function getParentOrigin(): string | null
```
Returns the origin of the parent window (via `document.referrer` or `window.parent.location.origin`). Returns `null` if not in an iframe or origin cannot be determined.

### Standalone Fallback

```typescript
function renderStandaloneMessage(container: HTMLElement, appName?: string): void
```
Renders a styled "Frontier Wallet Required" message into the given container element. Default `appName` is `'Frontier App'`. Directs users to `os.frontiertower.io` to install the app.

```typescript
function createStandaloneHTML(appName?: string): string
```
Returns the same styled "Frontier Wallet Required" message as an HTML string (with gradient background). Default `appName` is `'Frontier App'`.

### Allowed Origins Constant

```typescript
const ALLOWED_ORIGINS: string[] = [
  'http://localhost:5173',
  'https://sandbox.os.frontiertower.io',
  'https://alpha.os.frontiertower.io',
  'https://beta.os.frontiertower.io',
  'https://os.frontiertower.io',
];
```

---

## 13. Security

### Allowed Origins

The SDK defines five allowed Frontier Wallet origins. Apps should only accept messages from these:

| Environment | Origin |
|---|---|
| Development | `http://localhost:5173` |
| Sandbox | `https://sandbox.os.frontiertower.io` |
| Alpha | `https://alpha.os.frontiertower.io` |
| Beta | `https://beta.os.frontiertower.io` |
| Production | `https://os.frontiertower.io` |

### Access Controls Verification

The `user:getVerifiedAccessControls` method provides a tamper-proof way to verify user access. The flow:

1. The PWA host relays a `SignedAccessControls` envelope from the Frontier API server.
2. The SDK decodes the Base64 payload, computes its SHA-256 hash, and verifies the ECDSA secp256k1 signature against a hardcoded public key for the current environment stage.
3. If the signature is valid, the decoded `AccessControlsPayload` is returned.
4. If invalid, the method throws -- the app should deny access.

Supported stages and their public keys (uncompressed secp256k1, hex):

| Stage(s) | Key |
|---|---|
| `test` | `04aab6c393...` (test-only key) |
| `development`, `local`, `sandbox`, `staging` | `04dc3ab0e1...` (shared dev/sandbox key) |
| `alpha`, `beta`, `production` | `045d1a0f9c...` (production key) |

**Rule: Always use `getVerifiedAccessControls()` for access-gating decisions.** Do not trust unsigned user data from other SDK methods for gating features, content, or permissions.

### PostMessage Security

- The SDK sends requests to `window.parent` with `'*'` as the target origin.
- The SDK only processes responses where `event.source === window.parent`.
- Requests auto-expire after 30 seconds.

---

## 14. Complete Permissions List (84 permissions across 10 modules)

### Wallet (22 permissions)

| Permission | Description |
|---|---|
| `wallet:getBalance` | Access wallet balance (raw bigint) |
| `wallet:getBalanceFormatted` | Access formatted wallet balance (display strings) |
| `wallet:getAddress` | Access wallet address |
| `wallet:getSmartAccount` | Access smart account details |
| `wallet:transferERC20` | Transfer ERC20 tokens |
| `wallet:approveERC20` | Approve ERC20 token spending |
| `wallet:transferNative` | Transfer native currency (ETH) |
| `wallet:transferFrontierDollar` | Transfer FND (Frontier Network Dollar) |
| `wallet:transferInternalFrontierDollar` | Transfer iFND (Internal Frontier Network Dollar) |
| `wallet:transferOverallFrontierDollar` | Transfer using iFND first, fallback to FND |
| `wallet:executeCall` | Execute arbitrary contract call |
| `wallet:executeBatchCall` | Execute multiple contract calls atomically |
| `wallet:getSupportedTokens` | Get supported token symbols for swaps |
| `wallet:swap` | Execute token swap (same-chain or cross-chain) |
| `wallet:quoteSwap` | Get swap quote without executing |
| `wallet:getUsdDepositInstructions` | Get USD bank deposit instructions (on-ramp) |
| `wallet:getEurDepositInstructions` | Get EUR/SEPA deposit instructions (on-ramp) |
| `wallet:getLinkedBanks` | Get linked bank accounts (off-ramp) |
| `wallet:linkUsBankAccount` | Link US bank account for USD withdrawals |
| `wallet:linkEuroAccount` | Link EUR/IBAN bank account for EUR withdrawals |
| `wallet:deleteLinkedBank` | Delete a linked bank account |
| `wallet:getDeprecatedSmartAccounts` | Get deprecated smart accounts with active gas sponsorship |

### Storage (4 permissions)

| Permission | Description |
|---|---|
| `storage:get` | Read from persistent storage |
| `storage:set` | Write to persistent storage |
| `storage:remove` | Remove key from persistent storage |
| `storage:clear` | Clear all persistent storage |

### Chain (5 permissions)

| Permission | Description |
|---|---|
| `chain:getCurrentNetwork` | Get current network name |
| `chain:getAvailableNetworks` | Get list of available networks |
| `chain:switchNetwork` | Switch to a different network |
| `chain:getCurrentChainConfig` | Get full chain configuration |
| `chain:getContractAddresses` | Get FND, iFND, PaymentRouter, SubscriptionManager addresses |

### User (8 permissions)

| Permission | Description |
|---|---|
| `user:getDetails` | Access current user details |
| `user:getProfile` | Access current user profile |
| `user:getReferralOverview` | Access referral statistics |
| `user:getReferralDetails` | Access detailed referral information |
| `user:addUserContact` | Add user contact information |
| `user:getOrCreateKyc` | Get or create KYC verification status |
| `user:createSignupRequest` | Submit membership signup request with crypto payment |
| `user:getVerifiedAccessControls` | Get cryptographically verified access controls |

### Partnerships (7 permissions)

| Permission | Description |
|---|---|
| `partnerships:listSponsors` | List sponsors you manage (paginated) |
| `partnerships:getSponsor` | Retrieve a Sponsor by ID |
| `partnerships:createSponsorPass` | Create a SponsorPass |
| `partnerships:listActiveSponsorPasses` | List active SponsorPasses (paginated) |
| `partnerships:listAllSponsorPasses` | List all SponsorPasses (paginated) |
| `partnerships:getSponsorPass` | Retrieve a SponsorPass by ID |
| `partnerships:revokeSponsorPass` | Revoke a SponsorPass |

### Third-Party (15 permissions)

| Permission | Description |
|---|---|
| `thirdParty:listDevelopers` | List developer accounts (paginated) |
| `thirdParty:getDeveloper` | Get developer details by ID |
| `thirdParty:updateDeveloper` | Update developer information |
| `thirdParty:rotateDeveloperApiKey` | Rotate developer API key |
| `thirdParty:listApps` | List registered apps (paginated) |
| `thirdParty:createApp` | Register a new app |
| `thirdParty:getApp` | Get app details by ID |
| `thirdParty:updateApp` | Update an app |
| `thirdParty:deleteApp` | Request app deactivation |
| `thirdParty:listWebhooks` | List webhooks (paginated) |
| `thirdParty:createWebhook` | Create a new webhook |
| `thirdParty:getWebhook` | Get webhook details by ID |
| `thirdParty:updateWebhook` | Update a webhook |
| `thirdParty:deleteWebhook` | Delete a webhook |
| `thirdParty:rotateWebhookSigningKey` | Rotate webhook signing key |

### Communities (11 permissions)

| Permission | Description |
|---|---|
| `communities:listCommunities` | List all visible communities (paginated) |
| `communities:getCommunity` | Get a community by ID or slug |
| `communities:createInternshipPass` | Create an internship pass for a managed community |
| `communities:listInternshipPasses` | List internship passes for managed communities |
| `communities:getInternshipPass` | Retrieve an internship pass by ID |
| `communities:revokeInternshipPass` | Revoke an internship pass |
| `communities:createReassignRequest` | Create a member reassignment request |
| `communities:listReassignRequests` | List pending reassignment requests |
| `communities:getReassignRequest` | Retrieve a reassignment request by ID |
| `communities:acceptReassignRequest` | Accept a reassignment request (moves member) |
| `communities:rejectReassignRequest` | Reject a reassignment request |

### Events (6 permissions)

| Permission | Description |
|---|---|
| `events:listEvents` | List events with optional filters (paginated) |
| `events:createEvent` | Create a new event |
| `events:addEventHost` | Add a co-host to an event |
| `events:listLocations` | List available locations (event spaces and rooms) |
| `events:listRoomBookings` | List room bookings (paginated) |
| `events:createRoomBooking` | Create a room booking |

### Offices (4 permissions)

| Permission | Description |
|---|---|
| `offices:createAccessPass` | Create an access pass for a membership contract |
| `offices:listAccessPasses` | List access passes for managed contracts (paginated) |
| `offices:getAccessPass` | Retrieve an access pass by ID |
| `offices:revokeAccessPass` | Revoke an access pass |

### Navigation (2 permissions)

| Permission | Description |
|---|---|
| `navigation:openApp` | Navigate to another app |
| `navigation:close` | Close current app |

### Wildcard Permissions

Each module supports a wildcard permission that grants access to all methods in that module:

| Wildcard | Grants |
|---|---|
| `wallet:*` | All wallet permissions |
| `storage:*` | All storage permissions |
| `chain:*` | All chain permissions |
| `user:*` | All user permissions |
| `partnerships:*` | All partnerships permissions |
| `thirdParty:*` | All third-party permissions |
| `communities:*` | All communities permissions |
| `events:*` | All events permissions |
| `offices:*` | All offices permissions |
| `navigation:*` | All navigation permissions |
