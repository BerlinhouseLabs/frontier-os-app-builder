# Communities Module

**Trigger keywords:** community, group, team, club, internship, intern, cohort, reassign, transfer member, collective, society

Access via `sdk.getCommunities()`. Manage communities, internship passes, and member reassignment requests.

Community listing is public. Internship passes require authentication, an active subscription, and community manager status. Reassign requests require authentication; creating requires managing the member's current community, accepting requires managing the target community. Superusers can access everything.

---

## Methods

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

---

## Types

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

## Permissions (11)

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
