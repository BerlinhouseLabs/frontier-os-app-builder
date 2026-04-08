# Partnerships Module

**Trigger keywords:** sponsor, partnership, partner, sponsorship, benefactor, supporter, patron

Access via `sdk.getPartnerships()`. Manage sponsors and sponsor passes.

---

## Methods

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

---

## Types

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

## Permissions (7)

| Permission | Description |
|---|---|
| `partnerships:listSponsors` | List sponsors you manage (paginated) |
| `partnerships:getSponsor` | Retrieve a Sponsor by ID |
| `partnerships:createSponsorPass` | Create a SponsorPass |
| `partnerships:listActiveSponsorPasses` | List active SponsorPasses (paginated) |
| `partnerships:listAllSponsorPasses` | List all SponsorPasses (paginated) |
| `partnerships:getSponsorPass` | Retrieve a SponsorPass by ID |
| `partnerships:revokeSponsorPass` | Revoke a SponsorPass |
