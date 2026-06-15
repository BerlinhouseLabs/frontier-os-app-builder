# Frontier OS App Patterns

Reference for the standard structure, conventions, and tech stack used by all Frontier OS apps.

---

## Tech Stack

| Layer        | Package                         | Version   |
| ------------ | ------------------------------- | --------- |
| Runtime      | React                           | 19        |
| Bundler      | Vite                            | 7         |
| Language     | TypeScript                      | 5.9       |
| CSS          | Tailwind CSS (via PostCSS)      | 4         |
| Testing      | Vitest + jsdom + Testing Library| 4 / 27    |
| SDK          | @frontiertower/frontier-sdk     | 0.24.0    |
| Routing      | react-router-dom                | 7         |

---

## Directory Layout

Every app follows this structure:

```
app-<name>/
  index.html                 # HTML shell (parameterized)
  package.json               # Project manifest (parameterized)
  postcss.config.js          # PostCSS with Tailwind (identical)
  tsconfig.json              # TypeScript config (identical)
  vercel.json                # Vercel deployment + CORS (identical)
  vite.config.ts             # Vite + Vitest config (parameterized)
  src/
    main.tsx                 # React root + RouterProvider (identical pattern)
    router.tsx               # Route definitions (parameterized)
    lib/
      frontier-services.tsx  # useServices() provider + mock services (identical across all apps)
      sdk-context.tsx        # SdkProvider + useSdk hook (added during SDK Integration phase)
      sdk-services.tsx       # SDK adapter mapping services to real SDK (added during SDK Integration phase)
    views/
      Layout.tsx             # Shell layout component (parameterized)
      <FeatureViews>.tsx     # App-specific view components
    components/              # Reusable UI components
    hooks/                   # Custom React hooks
    styles/
      index.css              # Tailwind + dark theme variables (parameterized)
    test/
      setup.ts               # Vitest setup (identical pattern)
      lib/                   # Unit tests for lib/
      views/                 # Tests for view components
      hooks/                 # Tests for hooks
      components/            # Tests for components
```

### Naming Conventions

- Repository: `frontier-os-app-<name>` (kebab-case)
- Package name in `package.json`: `app-<name>` (kebab-case, no org scope)
- Views: PascalCase files in `src/views/`
- Components: PascalCase files in `src/components/`
- Hooks: camelCase `use<Name>` files in `src/hooks/`
- Tests: Mirror source structure under `src/test/`, with `.test.ts` or `.test.tsx` suffix

---

## Files Identical Across All Apps

These files are copied verbatim. They must not be modified per app.

### `src/lib/frontier-services.tsx`

This file provides the `useServices()` hook and `FrontierServicesProvider`. It is identical across all apps and stays **SDK-free** (imports only React) — it is the mock seam. During standalone development `FrontierServicesProvider` returns mock services; after SDK Integration the **Layout** passes it real SDK-backed services in-frame (mocks standalone), so feature code never changes.

### `src/lib/sdk-context.tsx` — identical across all apps, created during SDK Integration phase (not at scaffold time)

```tsx
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { FrontierSDK } from '@frontiertower/frontier-sdk';

const SdkContext = createContext<FrontierSDK | null>(null);

export const useSdk = (): FrontierSDK => {
  const sdk = useContext(SdkContext);
  if (!sdk) throw new Error('useSdk must be used within SdkProvider');
  return sdk;
};

export const SdkProvider = ({ children }: { children: ReactNode }) => {
  const sdkRef = useRef<FrontierSDK | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sdk = new FrontierSDK();
    sdkRef.current = sdk;
    setReady(true);

    return () => {
      sdk.destroy();
    };
  }, []);

  if (!ready) return null;

  return (
    <SdkContext.Provider value={sdkRef.current}>
      {children}
    </SdkContext.Provider>
  );
};
```

### `src/lib/sdk-services.tsx` — identical across all apps, created during SDK Integration phase (not at scaffold time)

This file provides the adapter that maps the `FrontierServices` interface to real SDK calls. It is created during the SDK Integration phase.

### `postcss.config.js`

```js
import tailwindcss from '@tailwindcss/postcss';

export default {
  plugins: [tailwindcss()],
};
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "exclude": ["src/test", "**/*.test.ts", "**/*.test.tsx"]
}
```

### `vercel.json`

See [deployment.md](deployment.md) for the full file. All apps share the same `vercel.json`: CORS for the production origin plus a `Content-Security-Policy: frame-ancestors` listing the 3 live Frontier OS origins (production `os.frontiertower.io`, sandbox `sandbox.os.frontiertower.io`, and `localhost:5173`) and the standard security headers.

---

## Files Parameterized Per App

These files follow a fixed template but contain app-specific values.

### `package.json`

Parameterized fields:

| Field           | Example value                        |
| --------------- | ------------------------------------ |
| `name`          | `"app-subscriptions"`                |
| `dependencies`  | App-specific packages added here     |

Fixed fields (do not change):

- `"version": "1.0.0"`
- `"private": true`
- `"type": "module"`
- `scripts` block (see Package Scripts below)
- Core dependencies: `@frontiertower/frontier-sdk`, `react`, `react-dom`, `react-router-dom`, `viem` (`^2.44.0` — for on-chain apps that build calldata for `executeCall`/`executeBatchCall`; safe to drop for pure-UI apps)
- Core devDependencies: `@tailwindcss/postcss`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `postcss`, `tailwindcss`, `typescript`, `vite`
- Test devDependencies (when tests exist): `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event`, `@vitest/coverage-v8`, `jsdom`, `vitest`

### `index.html`

Parameterized fields:

| Element                 | What changes              |
| ----------------------- | ------------------------- |
| `<title>`               | App display name          |
| `<meta name="description">` | App description      |

Fixed structure:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>{{APP_TITLE}}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="{{APP_DESCRIPTION}}">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body class="dark">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Key points:
- `body class="dark"` is always set (dark-only theme)
- Plus Jakarta Sans font is loaded from Google Fonts with weights 400, 500, 600, 700
- Favicon is always `/favicon.svg`

### `vite.config.ts`

Parameterized fields:

| Field           | What changes                        |
| --------------- | ----------------------------------- |
| `server.port`   | Each app gets a unique dev port     |

Template:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: {{PORT}},
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/test/**/*.test.{ts,tsx}'],
  },
});
```

Note: Import `defineConfig` from `vitest/config` (not `vite`) so the `test` block is typed. If the app has no tests, the `test` block and vitest devDependencies may be omitted.

### `Layout.tsx`

Parameterized field: the app name passed to `createStandaloneHTML()`.

### `router.tsx`

Fully app-specific. Defines routes as children of the Layout element.

### `src/styles/index.css`

The `@theme` block and `@layer base` are standard. Apps may add extra `@layer components` rules for app-specific component styles.

---

## Layout Pattern

Every app's `Layout.tsx` follows this exact flow:

```
1. isInFrontierApp()        -- Check if running inside Frontier Wallet iframe
2. If NOT in Frontier:
     createStandaloneHTML('App Name')  -- Render a standalone fallback page
     return early
3. If loading:
     Show spinner
4. If in Frontier and ready:
     <SdkProvider>
       <Outlet />            -- react-router child routes render here
     </SdkProvider>
```

Implementation:

```tsx
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { isInFrontierApp, createStandaloneHTML } from '@frontiertower/frontier-sdk/ui-utils';
import { SdkProvider } from '../lib/sdk-context';

export const Layout = () => {
  const [loading, setLoading] = useState(true);
  const [standaloneHtml, setStandaloneHtml] = useState('');

  useEffect(() => {
    const inFrontier = isInFrontierApp();

    if (!inFrontier) {
      setStandaloneHtml(createStandaloneHTML('{{APP_NAME}}'));
      setLoading(false);
      return;
    }

    setLoading(false);
  }, []);

  if (standaloneHtml) {
    return (
      <div
        className="min-h-screen bg-background text-foreground"
        dangerouslySetInnerHTML={{ __html: standaloneHtml }}
      />
    );
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // In-frame: SdkProvider provides the SDK; SdkServicesBridge wires it into
  // FrontierServicesProvider so feature code's useServices() works unchanged.
  // (SdkServicesBridge helper — see templates/app/layout.tsx.)
  return (
    <SdkProvider>
      <SdkServicesBridge>
        <Outlet />
      </SdkServicesBridge>
    </SdkProvider>
  );
};
```

The `isInFrontierApp()` function checks `window.self !== window.top` -- it returns `true` when the app is loaded inside an iframe (the Frontier Wallet PWA embeds apps this way).

The `createStandaloneHTML()` fallback renders a branded page telling the user to open the app inside Frontier Wallet.

#### Standalone-First Layout (Phase 1 through feature phases)

```typescript
import { Outlet } from 'react-router-dom';
import { FrontierServicesProvider } from '../lib/frontier-services';

export const Layout = () => (
  <FrontierServicesProvider>
    <Outlet />
  </FrontierServicesProvider>
);
```

No iframe detection, no loading state, no standalone fallback. The app just renders with mock services.

#### SDK-Aware Layout (after SDK Integration phase)

The Layout pattern with `isInFrontierApp()`, `createStandaloneHTML()`, `SdkProvider`, AND the `FrontierServicesProvider` bridge (so `useServices()` works against the real SDK) is applied during the SDK Integration phase. See the SDK-Aware Layout Pattern above and `templates/app/layout.tsx`.

---

### Services Pattern (Standalone-First)

New apps use the `useServices()` abstraction instead of `useSdk()` directly. This enables standalone development with mock data before the SDK is wired in.

**Standard hook using services:**

```typescript
import { useState, useEffect } from 'react';
import { formatAmount } from '@frontiertower/frontier-sdk';
import { useServices } from '../lib/frontier-services';

export function useBalance() {
  const services = useServices();
  // Balance fields are bigint base units; format them for display with formatAmount().
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await services.wallet.getBalance();
        setBalance(formatAmount(result.total));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load balance');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [services]);

  return { balance, loading, error };
}
```

**Key differences from SDK pattern:**
- Import `useServices` from `../lib/frontier-services` (not `useSdk` from `../lib/sdk-context`)
- Access modules as properties: `services.wallet` (not `sdk.getWallet()`)
- Types imported from `../lib/frontier-services` (not `@frontiertower/frontier-sdk`)
- Works standalone with mock data — no iframe required during development

---

## Router Variant (Standard)

All current apps use react-router-dom with `createBrowserRouter`. The router file defines a single root route with `Layout` as the element and feature views as children:

```tsx
import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './views/Layout';
// ... import views

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'rooms', element: <Rooms /> },
      { path: 'book/:categoryId', element: <Book /> },
      // ... more routes
    ],
  },
]);
```

### Single-Component Variant

For very simple apps that need only one view, the router can be omitted. In this case:
- `main.tsx` renders the Layout directly instead of `<RouterProvider>`
- `Layout.tsx` renders the single view component instead of `<Outlet />`
- No `router.tsx` file needed
- `react-router-dom` can be removed from dependencies

### `main.tsx` (Identical Pattern)

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in document.');
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

---

## Package Scripts

| Script    | Command           | Purpose                               |
| --------- | ----------------- | ------------------------------------- |
| `dev`     | `vite`            | Start dev server with HMR             |
| `build`   | `tsc && vite build` | Type-check then production build    |
| `preview` | `vite preview`    | Preview production build locally      |
| `lint`    | `tsc --noEmit`    | Type-check without emitting           |
| `test`    | `vitest run`      | Run tests once (CI mode)              |

The `test` script is only included when the app has tests and vitest is in devDependencies.

---

## Dark Theme CSS Variables

All apps use a dark-only theme defined in `src/styles/index.css` via Tailwind 4's `@theme` directive. These CSS custom properties are available as Tailwind utilities (e.g., `bg-background`, `text-foreground`, `border-border`).

### Color Tokens

| Token                    | Value     | Usage                           |
| ------------------------ | --------- | ------------------------------- |
| `--color-primary`        | `#764AE2` | Primary actions, links          |
| `--color-primary-foreground` | `#ffffff` | Text on primary backgrounds |
| `--color-accent`         | `#E4DCF9` | Accent highlights               |
| `--color-accent-foreground` | `#0A0A0A` | Text on accent backgrounds   |
| `--color-alert`          | `#EF4444` | Error states                    |
| `--color-alert-foreground` | `#F5F5F5` | Text on alert backgrounds     |
| `--color-danger`         | `#F87171` | Destructive actions             |
| `--color-danger-foreground` | `#ffffff` | Text on danger backgrounds   |
| `--color-success`        | `#10b981` | Success states                  |
| `--color-background`     | `#000000` | Page background                 |
| `--color-foreground`     | `#FAFAFA` | Default text                    |
| `--color-muted`          | `#1E293B` | Muted background                |
| `--color-muted-foreground` | `#A3A3A3` | Secondary text                |
| `--color-muted-background` | `#262626` | Alternative muted bg          |
| `--color-card`           | `#0A0A0A` | Card backgrounds                |
| `--color-card-foreground` | `#F5F5F5` | Card text                      |
| `--color-border`         | `#242424` | Borders                         |
| `--color-input`          | `#242424` | Input borders/backgrounds       |
| `--color-ring`           | `#B6B1F6` | Focus rings                     |
| `--color-outline`        | `#404040` | Outlines                        |

### Typography

| Token         | Value                                              |
| ------------- | -------------------------------------------------- |
| `--font-sans` | `"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif` |

### Base Styles

The `@layer base` block sets:
- `box-sizing: border-box` on all elements
- Font smoothing (webkit + moz)
- `body` font-size `0.875rem` (14px), line-height `1.5`
- `-webkit-user-select: none` and `touch-action: manipulation` for mobile feel
- `#root` as a flex column filling viewport height
- Heading weights at `600`, line-height `1.25`
- Paragraph color set to `--color-muted-foreground`
- Link color set to `--color-primary`

### Component Styles

The `@layer components` block provides:
- `.loading-screen` -- centered full-height container
- `.spinner` / `.spinner-lg` -- CSS-only spinning loader using border-top trick

Apps may add additional component styles in this layer for app-specific needs (e.g., phone input styling).

---

## Test Setup Pattern

### `src/test/setup.ts`

```ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.open for external links
vi.stubGlobal('open', vi.fn());

// Mock ResizeObserver
vi.stubGlobal('ResizeObserver', vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

// Mock IntersectionObserver
vi.stubGlobal('IntersectionObserver', vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));
```

### Test Directory Structure

Tests mirror the source structure under `src/test/`:

```
src/test/
  setup.ts                    # Global test setup
  lib/                        # Tests for src/lib/
  views/                      # Tests for src/views/
  hooks/                      # Tests for src/hooks/
  components/                 # Tests for src/components/
```

### Vitest Configuration

Configured in `vite.config.ts`:
- `globals: true` -- no need to import `describe`, `it`, `expect`
- `environment: 'jsdom'` -- DOM simulation
- `setupFiles: ['./src/test/setup.ts']` -- runs before every test file
- `include: ['src/test/**/*.test.{ts,tsx}']` -- only files under `src/test/`

### tsconfig.json Test Handling

- `"types": ["vitest/globals", "@testing-library/jest-dom"]` -- global type augmentation
- `"exclude": ["src/test", "**/*.test.ts", "**/*.test.tsx"]` -- test files excluded from production type-check (`tsc --noEmit` / `tsc && vite build`)

---

### SDK Integration Pattern

The final phase of every app wires the real Frontier SDK in. This is a mechanical step:

1. **Add SDK dependency**: `npm install @frontiertower/frontier-sdk`
2. **Create `src/lib/sdk-context.tsx`**: Standard SdkProvider + useSdk hook (from template)
3. **Create `src/lib/sdk-services.tsx`**: Adapter mapping FrontierServices interface to real SDK calls
4. **Leave `src/lib/frontier-services.tsx` unchanged**: it stays the SDK-free mock seam. The iframe/standalone switch happens in Layout (step 5) — do NOT add SDK imports or detection here.
5. **Swap in `src/views/Layout.tsx`** (from `templates/app/layout.tsx`): `isInFrontierApp()` detection + standalone fallback; in-frame it wraps the app in `SdkProvider` AND bridges the SDK into `FrontierServicesProvider` (via `createSdkServices(sdk)`) so `useServices()` resolves against the real SDK
6. **Swap in the full `vercel.json`**: CORS for the production origin + `Content-Security-Policy: frame-ancestors` listing the 3 live origins (`os.frontiertower.io`, `sandbox.os.frontiertower.io`, `localhost:5173`) + security headers

After SDK Integration, the app works in both modes:
- **Standalone** (browser): Uses mock services, shows development data
- **Iframe** (Frontier PWA): Uses real SDK, shows live data
