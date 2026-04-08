# Navigation Module

**Trigger keywords:** navigate, deep link, deeplink, open app, app link, cross-app, redirect, launch app, inter-app

Access via `sdk.getNavigation()`. App-to-app deep linking. Allows apps to navigate to other Frontier OS apps and receive incoming deep link data.

---

## Methods

```typescript
openApp(appId: string, options?: NavigationOpenAppOptions): Promise<void>
```
Navigate the host to another app in the Frontier OS ecosystem. `appId` is the target app ID from the Frontier app registry. `options.path` provides an optional deep link path for the target app. `options.params` provides optional key-value params for the target app. Permission: `navigation:openApp`

```typescript
close(): Promise<void>
```
Close the current app and return to the previous screen. Permission: `navigation:close`

```typescript
onDeepLink(callback: (data: DeepLinkData) => void): () => void
```
Register a callback for incoming deep link data. Called when this app was opened via another app's `openApp()` call. Returns an unsubscribe function. No permission required (passive listener).

---

## Types

```typescript
interface NavigationOpenAppOptions {
  path?: string;
  params?: Record<string, string>;
}

interface DeepLinkData {
  path?: string;
  params?: Record<string, string>;
}
```

---

## Permissions (2)

| Permission | Description |
|---|---|
| `navigation:openApp` | Navigate to another app |
| `navigation:close` | Close current app |
