# SDK Initialization & Core Protocol

Frontier SDK v0.20.0 — `@frontiertower/frontier-sdk`

Import paths:
- `@frontiertower/frontier-sdk` -- main SDK class and access modules
- `@frontiertower/frontier-sdk/ui-utils` -- detection and standalone helpers

---

## Class: `FrontierSDK`

```typescript
import { FrontierSDK } from '@frontiertower/frontier-sdk';
```

### Constructor

```typescript
const sdk = new FrontierSDK();
```

On construction the SDK:
1. Instantiates all ten access modules (wallet, storage, chain, user, partnerships, thirdParty, communities, events, offices, navigation).
2. Registers a `window.addEventListener('message', ...)` listener that routes `SDKResponse` messages from `window.parent`.
3. Sends an `{ type: 'app:ready', payload: null }` postMessage to `window.parent` to notify the host that the app iframe is ready.

### `destroy(): void`

Call when the app is being torn down. Removes the message event listener, calls `this.navigation.destroy()` to clean up deep-link listeners, and clears all pending request promises.

### Internal: `request(type: string, payload?: any): Promise<any>`

Used by all access classes. Sends an `SDKRequest` via `window.parent.postMessage` and returns a promise that resolves/rejects when the host responds. Requests time out after **30 000 ms**.

## PostMessage Protocol Types

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

## Module Getters

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

## Security

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

## Wildcard Permissions

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
