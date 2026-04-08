# Storage Module

**Trigger keywords:** storage, persist, save, preferences, settings, cache, remember, state, draft, favorites, bookmarks

Access via `sdk.getStorage()`. Provides persistent key-value storage scoped to the app.

---

## Methods

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

## Types

No additional types -- uses generic `T` for get, `any` for set.

---

## Permissions (4)

| Permission | Description |
|---|---|
| `storage:get` | Read from persistent storage |
| `storage:set` | Write to persistent storage |
| `storage:remove` | Remove key from persistent storage |
| `storage:clear` | Clear all persistent storage |
