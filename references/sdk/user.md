# User Module

**Trigger keywords:** user, profile, account, member, membership, auth, login, referral, invite, refer, signup, register, kyc, verify, identity, access control, gate, permission, name, person

Access via `sdk.getUser()`. Query user info, profiles, referrals, KYC, and access controls.

---

## Methods

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

---

## Types

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

## Permissions (8)

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
