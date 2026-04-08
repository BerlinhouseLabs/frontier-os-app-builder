# ThirdParty Module

**Trigger keywords:** developer, api key, webhook, app registration, app store, third party, integration, external, developer portal

Access via `sdk.getThirdParty()`. Manage developer accounts, registered apps, and webhooks.

---

## Developer Methods

```typescript
listDevelopers(payload?: ListParams): Promise<PaginatedResponse<Developer>>
```
List developer accounts, paginated. Permission: `thirdParty:listDevelopers`

```typescript
getDeveloper(payload: { id: number }): Promise<Developer>
```
Get developer details by ID. Permission: `thirdParty:getDeveloper`

```typescript
updateDeveloper(payload: { id: number; data: UpdateDeveloperRequest }): Promise<Developer>
```
Update developer information. Permission: `thirdParty:updateDeveloper`

```typescript
rotateDeveloperApiKey(payload: { id: number }): Promise<RotateKeyResponse>
```
Rotate developer API key. New key is only shown once in the response. Permission: `thirdParty:rotateDeveloperApiKey`

## App Methods

```typescript
listApps(payload?: ListAppsParams): Promise<PaginatedResponse<App>>
```
List registered apps, paginated. Optional `developerId` filter. Permission: `thirdParty:listApps`

```typescript
createApp(payload: CreateAppRequest): Promise<App>
```
Register a new app. Name, description, and icon are auto-fetched from URL metadata. Permission: `thirdParty:createApp`

```typescript
getApp(payload: { id: number }): Promise<App>
```
Get app details by ID. Permission: `thirdParty:getApp`

```typescript
updateApp(payload: { id: number; data: UpdateAppRequest }): Promise<App>
```
Update an app. Permission: `thirdParty:updateApp`

```typescript
deleteApp(payload: { id: number }): Promise<void>
```
Request app deactivation. Permission: `thirdParty:deleteApp`

## Webhook Methods

```typescript
listWebhooks(payload?: ListWebhooksParams): Promise<PaginatedResponse<Webhook>>
```
List webhooks, paginated. Max 3 webhooks per developer. Optional `developerId` filter. Permission: `thirdParty:listWebhooks`

```typescript
createWebhook(payload: CreateWebhookRequest): Promise<Webhook>
```
Create a new webhook. Requires admin approval before going live. Permission: `thirdParty:createWebhook`

```typescript
getWebhook(payload: { id: number }): Promise<Webhook>
```
Get webhook details by ID. Permission: `thirdParty:getWebhook`

```typescript
updateWebhook(payload: { id: number; data: UpdateWebhookRequest }): Promise<Webhook>
```
Update a webhook. Config changes require admin re-approval. Permission: `thirdParty:updateWebhook`

```typescript
deleteWebhook(payload: { id: number }): Promise<void>
```
Delete a webhook. Permission: `thirdParty:deleteWebhook`

```typescript
rotateWebhookSigningKey(payload: { id: number }): Promise<RotateWebhookKeyResponse>
```
Rotate webhook signing key. New public key returned in response. Permission: `thirdParty:rotateWebhookSigningKey`

---

## Types

```typescript
interface Developer {
  id: number;
  name: string;
  description: string;
  email: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateDeveloperRequest {
  name?: string;
  description?: string;
  email?: string;
}

interface RotateKeyResponse {
  message: string;
  developer: Developer;
}

type AppStatus =
  | 'in_review'
  | 'accepted'
  | 'released'
  | 'rejected'
  | 'request_deactivation'
  | 'deactivated';

type AppPermission = string;

interface App {
  id: number;
  developer: number;
  icon: string | null;
  name: string;
  readableId: string;
  description: string;
  url: string;
  cnameEntry: string;
  txtEntry: string | null;
  permissions: AppPermission[];
  permissionDisclaimer: string;
  status: AppStatus;
  reviewNotes: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateAppRequest {
  developer: number;
  url: string;
  cnameEntry: string;
  txtEntry?: string;
  permissions: AppPermission[];
  permissionDisclaimer: string;
}

interface UpdateAppRequest {
  developer?: number;
  url?: string;
  cnameEntry?: string;
  txtEntry?: string;
  permissions?: AppPermission[];
  permissionDisclaimer?: string;
}

type WebhookStatus = 'IN_REVIEW' | 'LIVE' | 'REJECTED';
type WebhookEvent = string;
type WebhookScope = Record<string, number[] | '*'>;

interface WebhookConfig {
  events: WebhookEvent[];
  scope: WebhookScope;
}

interface Webhook {
  id: number;
  developer: number;
  name: string;
  description: string;
  targetUrl: string;
  config: WebhookConfig;
  signingPublicKey: string;
  status: WebhookStatus;
  reviewNotes: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateWebhookRequest {
  developer: number;
  name: string;
  description: string;
  targetUrl: string;
  config: WebhookConfig;
}

interface UpdateWebhookRequest {
  developer?: number;
  name?: string;
  description?: string;
  targetUrl?: string;
  config?: WebhookConfig;
}

interface RotateWebhookKeyResponse {
  message: string;
  webhook: Webhook;
}

interface ListParams {
  limit?: number;
  offset?: number;
}

interface ListAppsParams extends ListParams {
  developerId?: number;
}

interface ListWebhooksParams extends ListParams {
  developerId?: number;
}
```

---

## Permissions (15)

| Permission | Description |
|---|---|
| `thirdParty:listDevelopers` | List developer accounts (paginated) |
| `thirdParty:getDeveloper` | Get developer details by ID |
| `thirdParty:updateDeveloper` | Update developer information |
| `thirdParty:rotateDeveloperApiKey` | Rotate developer API key |
| `thirdParty:listApps` | List registered apps (paginated) |
| `thirdParty:createApp` | Register a new app |
| `thirdParty:getApp` | Get app details by ID |
| `thirdParty:updateApp` | Update an app |
| `thirdParty:deleteApp` | Request app deactivation |
| `thirdParty:listWebhooks` | List webhooks (paginated) |
| `thirdParty:createWebhook` | Create a new webhook |
| `thirdParty:getWebhook` | Get webhook details by ID |
| `thirdParty:updateWebhook` | Update a webhook |
| `thirdParty:deleteWebhook` | Delete a webhook |
| `thirdParty:rotateWebhookSigningKey` | Rotate webhook signing key |
