# Deployment Reference

Complete deployment guide for Frontier OS apps, covering Vercel configuration, CORS, app registration, environment variables, DNS, and webhooks.

---

## Vercel Deployment Configuration

All Frontier OS apps deploy to Vercel. The `vercel.json` file is identical across all apps.

### `vercel.json` (Exact)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "header",
          "key": "Origin",
          "value": "https://os.frontiertower.io"
        }
      ],
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://os.frontiertower.io"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type"
        }
      ]
    },
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "header",
          "key": "Origin",
          "value": "https://sandbox.os.frontiertower.io"
        }
      ],
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://sandbox.os.frontiertower.io"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type"
        }
      ]
    },
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "header",
          "key": "Origin",
          "value": "https://alpha.os.frontiertower.io"
        }
      ],
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://alpha.os.frontiertower.io"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type"
        }
      ]
    },
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "header",
          "key": "Origin",
          "value": "https://beta.os.frontiertower.io"
        }
      ],
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://beta.os.frontiertower.io"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type"
        }
      ]
    },
    {
      "source": "/(.*)",
      "has": [
        {
          "type": "header",
          "key": "Origin",
          "value": "http://localhost:5173"
        }
      ],
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "http://localhost:5173"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type"
        }
      ]
    }
  ]
}
```

### Why 5 Separate Blocks

Vercel does not support multiple values in a single `Access-Control-Allow-Origin` header. Each allowed origin requires its own conditional header block using the `has` matcher. The `has` condition checks the incoming `Origin` request header and only attaches the CORS response headers when the origin matches.

---

## Allowed Origins

The Frontier Wallet PWA runs at these 5 origins. Apps must allow CORS from all of them:

| Origin                                    | Environment  | Description                                                    |
| ----------------------------------------- | ------------ | -------------------------------------------------------------- |
| `http://localhost:5173`                   | Development  | Local Vite dev server for the PWA                              |
| `https://sandbox.os.frontiertower.io`     | Sandbox      | Sandbox environment                                            |
| `https://alpha.os.frontiertower.io`       | Alpha        | Early access / design preview                                  |
| `https://beta.os.frontiertower.io`        | Beta         | QA'd, pre-production                                           |
| `https://os.frontiertower.io`             | Production   | Production ready                                               |

These origins are also hardcoded in the SDK at `@frontiertower/frontier-sdk/ui-utils/detection.ts` as `ALLOWED_ORIGINS`.

The `isInFrontierApp()` function checks `window.self !== window.top` to detect if the app is running inside the Frontier Wallet iframe. The `getParentOrigin()` function resolves the parent frame's origin via `document.referrer` or `window.parent.location.origin`.

**Never use `Access-Control-Allow-Origin: *` in production.** Always use the exact origin list above.

---

## Security Headers

In addition to CORS, all deployment targets should include:

| Header                       | Recommended Value                                  | Purpose                                     |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------- |
| `Content-Security-Policy`    | Include `frame-ancestors` for all 5 Frontier origins | Prevents embedding by unauthorized sites   |
| `X-Content-Type-Options`     | `nosniff`                                          | Prevents MIME-type sniffing                 |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`                  | Controls referrer information leakage       |
| `Permissions-Policy`         | Disable unnecessary browser APIs                   | Reduces attack surface                      |

The `frame-ancestors` CSP directive is critical because apps load inside the PWA's iframe. Without it, the browser may block the embed.

---

## App Registration

Apps must be registered with the Frontier platform before they appear in the AppStore.

### Registration via ThirdParty SDK

The recommended way is to use the OS Developer app in the Frontier AppStore. The API alternative:

1. **Get developer access** -- contact support@frontiertower.io to be added as a developer manager.
2. **Get your developer profile** -- install the OS Developer app from the AppStore, or call `GET /third-party/developers/`.
3. **Rotate your API key** immediately after receiving it: `POST /third-party/developers/{developer_id}/rotate-key/`. Store the new key securely.
4. **Create the app** -- via OS Developer or `POST /third-party/apps/` with metadata: `name`, `url`, `description`, optional DNS entries.

### App Status Lifecycle

```
in_review  -->  accepted  -->  released
    ^                            |
    |--- (any update)            |
                                 v
                        request_deactivation  -->  deactivated

in_review  -->  rejected
```

- New apps start in `in_review`.
- Updating an app returns it to `in_review`.
- Deleting a released app sets `request_deactivation` (no hard-delete).

### Permissions in Registry

When registering, declare the SDK permissions your app requires:

```typescript
const APP_REGISTRY: AppMetadata[] = [
  {
    id: 'my-app',
    url: 'https://my-app.appstore.frontiertower.io',
    origin: 'https://my-app.appstore.frontiertower.io',
    version: '1.0.0',
    developer: {
      name: 'Developer Name',
      verified: true,
    },
    permissions: {
      wallet: true,
      storage: true,
      notifications: false,
    },
  } as AppMetadata,
];
```

Permissions must match the SDK methods actually called in source code. The fos-verifier agent enforces this (see [verification-rules.md](verification-rules.md)).

---

## Environment Variables

Frontier OS apps use the standard Vite environment variable pattern.

### `.env.local` (not committed)

```bash
VITE_APP_NAME=My App
VITE_API_URL=https://api.example.com
```

### Convention

- All client-exposed variables must use the `VITE_` prefix.
- Access in code via `import.meta.env.VITE_APP_NAME`.
- `.env.local` is gitignored. Never commit secrets.
- For Vercel deployment, set environment variables in the Vercel dashboard under Project Settings > Environment Variables.

---

## DNS Configuration

Apps are hosted on the `appstore.frontiertower.io` subdomain.

### Domain Pattern

```
<app-name>.appstore.frontiertower.io
```

Example: `kickstarter.appstore.frontiertower.io`

### DNS Entries

Two DNS records are needed:

1. **CNAME** -- points the subdomain to the Vercel deployment:
   ```
   <app-name>.appstore.frontiertower.io  CNAME  cname.vercel-dns.com
   ```

2. **TXT** -- Vercel domain verification:
   ```
   _vercel.<app-name>.appstore.frontiertower.io  TXT  vc-domain-verify=<token>
   ```

Configure the custom domain in the Vercel dashboard after DNS propagation. Vercel automatically provisions an SSL certificate.

---

## Webhook Setup

Webhooks let the Frontier API push events to your backend the moment something changes.

### Creating a Webhook

1. Use the OS Developer app or call `POST /third-party/webhooks/`.
2. Provide:
   ```json
   {
     "name": "My app events",
     "target_url": "https://my-backend.example.com/webhooks",
     "config": {
       "events": ["event:*"],
       "scope": { "communities": [10], "users": "*" }
     }
   }
   ```
3. New webhooks start in `IN_REVIEW`. After review, they become `LIVE` and start receiving deliveries.

### Webhook Lifecycle

- `IN_REVIEW` -- default after creation or config changes
- `LIVE` -- approved, receiving deliveries
- `REJECTED` -- not approved

### Event Format

Events use `namespace:action` format. Subscriptions support wildcards (`event:*` or `*`).

Available namespaces: `addon_product`, `addon`, `community`, `guest_check_in`, `internship_pass`, `supply_request`, `event`, `location`, `room_booking`, `sponsor`, `sponsor_pass`, `smart_account`, `bridge_account`, `recovery_request`, `post`, `citizen_suggestion`, `vote`, `developer`, `app`, `webhook`, `user`, `profile`, `subscription`.

### Delivery Payload

Each delivery is an HTTP POST:

```json
{
  "id": "{delivery_uuid}",
  "event": "namespace:action",
  "triggered_at": "2024-01-01T12:00:00Z",
  "data": { }
}
```

Headers on every delivery:
- `Content-Type: application/json`
- `X-Webhook-Event`
- `X-Webhook-Id`
- `X-Webhook-Timestamp`
- `X-Webhook-Signature`
- `X-Webhook-Signature-Algorithm: ed25519`

### Signature Verification (Ed25519)

Verify every delivery before processing:

1. Read `X-Webhook-Timestamp` from the request.
2. Build the message: `<timestamp>.<canonical_json_body>` (JSON with sorted keys, no extra spaces).
3. Verify `X-Webhook-Signature` (base64-encoded) using the webhook's Ed25519 public key.
4. Reject if verification fails, timestamp is stale, or event is unexpected.

```python
import base64, json
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

body = request.get_json(force=True)
timestamp = request.headers["X-Webhook-Timestamp"]
signature = base64.b64decode(request.headers["X-Webhook-Signature"])
message = f"{timestamp}.".encode() + json.dumps(body, separators=(",", ":"), sort_keys=True).encode()

public_key = Ed25519PublicKey.from_public_bytes(base64.b64decode(PUBLIC_KEY))
public_key.verify(signature, message)  # Raises if invalid
```

### Rotating Webhook Signing Keys

Call `POST /third-party/webhooks/{webhook_id}/rotate-key/`. Deliveries immediately use the new key. Always trust the latest public key for each webhook.

### Operational Tips

- Use HTTPS endpoints only.
- Treat `X-Webhook-Id` as an idempotency key.
- Keep one webhook per environment (staging vs production).
- Rotate signing keys and API keys regularly.

---

## Testing Deployment

After deploying, verify CORS is working:

```bash
curl -I https://<app-name>.appstore.frontiertower.io \
  -H "Origin: https://os.frontiertower.io"

# Should include:
# Access-Control-Allow-Origin: https://os.frontiertower.io
```

Verify the app loads correctly:
1. Check browser console for CORS errors.
2. Confirm the app is accessible directly at its URL.
3. Test inside the Frontier Wallet PWA across environments.
4. Verify metadata (`<title>`, `<meta name="description">`, `<link rel="icon">`) is present in the HTML.
