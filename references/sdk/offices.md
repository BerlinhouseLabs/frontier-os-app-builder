# Offices Module

**Trigger keywords:** office, access pass, building, door, entry, visitor, check-in, checkin, physical access, facility

Access via `sdk.getOffices()`. Manage office access passes for membership contracts.

All endpoints require authentication, an active subscription, and manager status on the membership contract's organization (or superuser).

---

## Methods

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

---

## Types

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

## Permissions (4)

| Permission | Description |
|---|---|
| `offices:createAccessPass` | Create an access pass for a membership contract |
| `offices:listAccessPasses` | List access passes for managed contracts (paginated) |
| `offices:getAccessPass` | Retrieve an access pass by ID |
| `offices:revokeAccessPass` | Revoke an access pass |
