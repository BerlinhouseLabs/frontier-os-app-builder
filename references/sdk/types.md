# Shared SDK Types

Types used across multiple SDK modules.

---

## Pagination

```typescript
interface PaginatedResponse<T> {
  count: number;
  results: T[];
}

interface PaginatedParams {
  limit?: number;
  offset?: number;
}
```

Most list methods accept `PaginatedParams` (or a superset) and return `PaginatedResponse<T>`.

---

## Total Permissions Count

85 permissions across 10 modules. See each module's reference file for its specific permissions.
