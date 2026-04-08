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

---

## Types

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

## Permissions (6)

| Permission | Description |
|---|---|
| `events:listEvents` | List events with optional filters (paginated) |
| `events:createEvent` | Create a new event |
| `events:addEventHost` | Add a co-host to an event |
| `events:listLocations` | List available locations (event spaces and rooms) |
| `events:listRoomBookings` | List room bookings (paginated) |
| `events:createRoomBooking` | Create a room booking |
