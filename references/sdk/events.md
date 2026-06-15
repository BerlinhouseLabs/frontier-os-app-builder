# Events Module

**Trigger keywords:** event, meetup, gathering, calendar, schedule, room, booking, reserve, reservation, space, venue, location, conference, meeting, coworking

Access via `sdk.getEvents()`. Manage events, locations (event spaces and rooms), and room bookings.

---

## Methods

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

```typescript
getCryptoDepositPreflight(payload: { eventId: number }): Promise<DepositPreflight>
```
Preflight an event's FND security deposit. Host only, read-only. Returns the spender plus candidate ERC-20 tokens (iFND first, then FND) with on-chain decimals and base-unit amounts so you can approve the allowance BEFORE placing the deposit. Throws if not authenticated, not the host, or no deposit is required. Permission: `events:getCryptoDepositPreflight`

```typescript
placeCryptoDeposit(payload: { eventId: number }): Promise<DepositResult>
```
Place the FND security deposit. The backend `transferFrom`s the stablecoin from the member's smart account into treasury; the member must first approve the allowance to the preflight `spender` via `getWallet().approveERC20(token.address, spender, BigInt(token.baseUnits))`. Returns `status: 'secured'` (`reference` is the tx hash) or `'awaiting_payment'` (read `statusReason`, fix, retry). Host only. Permission: `events:placeCryptoDeposit`

**Canonical 3-step deposit flow** (host only):
```typescript
// 1. Preflight — discover the spender + candidate tokens (iFND first, then FND)
const { spender, tokens } = await sdk.getEvents().getCryptoDepositPreflight({ eventId: 42 });
const token = tokens[0]; // prefer iFND; fall back to tokens[1] (FND) if the member lacks iFND
// 2. Approve the allowance to the spender (on-chain; the member confirms in the wallet)
await sdk.getWallet().approveERC20(token.address, spender, BigInt(token.baseUnits));
// 3. Place the deposit — the backend transferFroms it into treasury
const result = await sdk.getEvents().placeCryptoDeposit({ eventId: 42 });
```

---

## Types

```typescript
type EventType = 'public' | 'members_plus_one' | 'members_only' | 'community_only';
type EventService = 'luma' | 'private' | 'test';
type ReviewStatus = 'not_required' | 'approved' | 'rejected' | 'pending';
type EventStatus = 'active' | 'suspended' | 'archived';
type LocationType = 'event_space' | 'room';

// Compact deposit status on the Event payload (host UI gating). 7 values.
type DepositStatus = 'not_required' | 'required' | 'pending' | 'secured' | 'released' | 'withheld' | 'failed';

// Raw status returned by placeCryptoDeposit. 6 values — has 'awaiting_payment' + 'grant', lacks 'not_required'/'required'/'pending'.
type CryptoDepositStatus = 'secured' | 'awaiting_payment' | 'grant' | 'released' | 'withheld' | 'failed';

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
  isHost?: boolean;                 // True iff the requesting user is this event's host (the user the deposit endpoints authorize)
  deposit?: EventDeposit | null;    // Read-only security-deposit summary, null when no deposit row
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

interface EventDeposit {
  status: DepositStatus;
  amount: number;         // snapshotted deposit amount in `currency` (e.g. 400 for the FND rail)
  currency: string;       // e.g. "usd"
}

interface DepositPreflightToken {
  key: string;            // e.g. "ifnd_token" or "fnd_token"
  address: string;        // ERC-20 contract to approve the allowance on
  decimals: number;       // on-chain token decimals (read from the contract, never assumed)
  baseUnits: string;      // deposit amount in this token's base units, as a decimal string (wrap in BigInt() for approveERC20)
}

interface DepositPreflight {
  spender: string;        // address to approve the allowance to (treasury) — never hardcode it
  network: string;        // e.g. "base" (prod) or "base_sepolia" (sandbox)
  amount: string;         // deposit amount in `currency`, as a decimal string (e.g. "400.00")
  currency: string;       // e.g. "usd"
  tokens: DepositPreflightToken[];  // candidate tokens in preference order: iFND first, then FND
}

interface DepositResult {
  provider: 'crypto';     // always 'crypto' on this rail
  status: CryptoDepositStatus;
  amount: string;         // deposit amount in `currency`, as a decimal string
  currency: string;       // e.g. "usd"
  reference: string;      // on-chain tx hash when secured; empty otherwise
  statusReason: string;   // human-readable reason when not secured (e.g. insufficient iFND/FND allowance or balance)
}
```

> **Deposit notes:** `DepositStatus` (7 values, carried on the `Event` payload) DIFFERS from `CryptoDepositStatus` (6 values, returned by `placeCryptoDeposit` — it adds `awaiting_payment` + `grant` and drops `not_required`/`required`/`pending`). `DepositPreflightToken.baseUnits` is a decimal STRING — wrap it via `BigInt()` for `approveERC20`. Never hardcode `spender` or token addresses, and read on-chain `decimals` rather than assuming 6.

---

## Permissions (8)

| Permission | Description |
|---|---|
| `events:listEvents` | List events with optional filters (paginated) |
| `events:createEvent` | Create a new event |
| `events:addEventHost` | Add a co-host to an event |
| `events:listLocations` | List available locations (event spaces and rooms) |
| `events:listRoomBookings` | List room bookings (paginated) |
| `events:createRoomBooking` | Create a room booking |
| `events:getCryptoDepositPreflight` | Preflight an event's FND security deposit (spender, candidate tokens, amounts) before approving the allowance |
| `events:placeCryptoDeposit` | Place an event's FND security deposit (backend transferFrom from the member's smart account) |
