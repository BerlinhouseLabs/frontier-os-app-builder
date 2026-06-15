# UI Utilities

Import from `@frontiertower/frontier-sdk/ui-utils`.

---

## Detection

```typescript
function isInFrontierApp(): boolean
```
Returns `true` if the window is embedded in an iframe (`window.self !== window.top`). Use to detect whether the app is running inside the Frontier Wallet host.

```typescript
function getParentOrigin(): string | null
```
Returns the origin of the parent window (via `document.referrer` or `window.parent.location.origin`). Returns `null` if not in an iframe or origin cannot be determined.

## Standalone Fallback

```typescript
function renderStandaloneMessage(container: HTMLElement, appName?: string): void
```
Renders a styled "Frontier Wallet Required" message into the given container element. Default `appName` is `'Frontier App'`. Directs users to `os.frontiertower.io` to install the app.

```typescript
function createStandaloneHTML(appName?: string): string
```
Returns the same styled "Frontier Wallet Required" message as an HTML string (with gradient background). Default `appName` is `'Frontier App'`.

## Allowed Origins Constant

```typescript
const ALLOWED_ORIGINS: string[] = [
  'http://localhost:5173',
  'https://sandbox.os.frontiertower.io',
  'https://os.frontiertower.io',
];
```
