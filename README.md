# @mainlayer/sdk

[![CI](https://github.com/mainlayer/mainlayer-js/actions/workflows/ci.yml/badge.svg)](https://github.com/mainlayer/mainlayer-js/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@mainlayer/sdk)](https://www.npmjs.com/package/@mainlayer/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

Official TypeScript/JavaScript SDK for [Mainlayer](https://mainlayer.xyz) — payment infrastructure for AI agents and developers.

Mainlayer lets you create accounts, publish paid resources, accept payments, and manage subscriptions programmatically. Think of it as Stripe, purpose-built for AI agents.

---

## Installation

```bash
npm install @mainlayer/sdk
# or
yarn add @mainlayer/sdk
# or
bun add @mainlayer/sdk
```

---

## Quickstart

```typescript
import Mainlayer from '@mainlayer/sdk';

const client = new Mainlayer({ apiKey: 'ml_...' });

// Create a paid resource
const resource = await client.resources.create({
  slug: 'my-api',
  type: 'api',
  price_usdc: 0.10,
  fee_model: 'pay_per_call',
});

// Check if a user has paid
const { has_access } = await client.entitlements.check({
  resource_id: resource.id,
  payer_wallet: '0xUserWallet',
});

// View revenue
const stats = await client.analytics.get();
console.log(`Revenue: $${stats.total_revenue_usdc}`);
```

---

## Authentication

You can authenticate with an **API key** or a **JWT token** (obtained via `auth.login`):

```typescript
// API key (recommended for server-side use)
const client = new Mainlayer({ apiKey: process.env.MAINLAYER_API_KEY });

// JWT token
const client = new Mainlayer({ token: 'eyJ...' });

// Login flow — token is stored automatically
const unauthClient = new Mainlayer();
await unauthClient.auth.login({ email: 'you@example.com', password: 'secret' });
// All subsequent calls are now authenticated
```

---

## API Reference

### `client.auth`

| Method | Description |
|--------|-------------|
| `auth.register({ email, password, wallet_address? })` | Register a new vendor account |
| `auth.login({ email, password })` | Log in and store access token automatically |

### `client.apiKeys`

| Method | Description |
|--------|-------------|
| `apiKeys.create({ name })` | Create an API key (returns raw key once — store securely) |
| `apiKeys.list()` | List all API keys |
| `apiKeys.delete(id)` | Delete an API key |

### `client.resources`

| Method | Description |
|--------|-------------|
| `resources.list()` | List your resources |
| `resources.create(params)` | Create a resource |
| `resources.get(id)` | Get a resource by ID |
| `resources.update(id, params)` | Partially update a resource |
| `resources.delete(id)` | Delete a resource |
| `resources.getPublic(id)` | Get public info (no auth required) |

**Resource params:**
```typescript
{
  slug: string;              // URL-safe identifier
  type: 'api' | 'file' | 'endpoint' | 'page';
  price_usdc: number;        // Price per unit
  fee_model: 'one_time' | 'subscription' | 'pay_per_call';
  description?: string;
  callback_url?: string;     // Called after successful payment
  credits_per_payment?: number;
  duration_seconds?: number;
  quota_calls?: number;
  discoverable?: boolean;    // Show in public marketplace
}
```

### `client.discover`

| Method | Description |
|--------|-------------|
| `discover.search({ q?, type?, fee_model?, limit?, offset? })` | Search public resources |

### `client.payments`

| Method | Description |
|--------|-------------|
| `payments.create({ resource_id, payer_wallet, tx_signature?, plan_id?, coupon_code? })` | Execute a payment |
| `payments.list()` | List payment history |

### `client.entitlements`

| Method | Description |
|--------|-------------|
| `entitlements.list({ resource_id?, payer_wallet? })` | List entitlements |
| `entitlements.check({ resource_id, payer_wallet })` | Check access — use as your auth gate |

### `client.plans`

| Method | Description |
|--------|-------------|
| `plans.list(resourceId)` | List pricing plans for a resource |
| `plans.create(resourceId, params)` | Create a pricing plan |

### `client.subscriptions`

| Method | Description |
|--------|-------------|
| `subscriptions.list()` | List subscriptions |
| `subscriptions.create(params)` | Create a subscription |
| `subscriptions.cancel(id)` | Cancel a subscription |

### `client.analytics`

| Method | Description |
|--------|-------------|
| `analytics.get({ start_date?, end_date?, resource_id? })` | Get revenue and usage analytics |

### `client.vendor`

| Method | Description |
|--------|-------------|
| `vendor.get()` | Get vendor profile |
| `vendor.update(params)` | Update vendor profile |

### `client.webhooks`

| Method | Description |
|--------|-------------|
| `webhooks.list()` | List webhooks |
| `webhooks.create({ url, events, resource_id? })` | Register a webhook |
| `webhooks.delete(id)` | Delete a webhook |

**Available events:** `payment.completed`, `payment.failed`, `subscription.created`, `subscription.cancelled`, `entitlement.granted`, `entitlement.expired`

### `client.coupons`

| Method | Description |
|--------|-------------|
| `coupons.list()` | List coupons |
| `coupons.create(params)` | Create a discount coupon |

### `client.invoices`

| Method | Description |
|--------|-------------|
| `invoices.list()` | List invoices |

---

## Error Handling

All API errors throw a `MainlayerError` with a typed `status` code:

```typescript
import Mainlayer, { MainlayerError } from '@mainlayer/sdk';

try {
  await client.resources.get('nonexistent');
} catch (err) {
  if (err instanceof MainlayerError) {
    console.error(`HTTP ${err.status}: ${err.message}`);
    // err.body contains the raw API response
  }
}
```

---

## Retry Logic

The SDK automatically retries transient errors (408, 429, 500, 502, 503, 504) with exponential backoff. The default is 3 retries.

```typescript
const client = new Mainlayer({
  apiKey: 'ml_...',
  maxRetries: 5,    // Increase retries
  timeout: 60_000,  // 60s timeout per request
});
```

---

## Configuration

```typescript
const client = new Mainlayer({
  apiKey: 'ml_...',           // Your API key
  token: 'eyJ...',            // OR JWT token
  baseUrl: 'https://...',     // Override API base URL (e.g. for testing)
  timeout: 30_000,            // Request timeout in ms (default: 30000)
  maxRetries: 3,              // Max retries for transient errors (default: 3)
  fetch: customFetchImpl,     // Custom fetch implementation
});
```

---

## Usage in different environments

The SDK uses the standard `fetch` API and works out of the box in:

- **Node.js 18+** (native fetch)
- **Bun** (native fetch)
- **Deno** (native fetch)
- **Browser** (native fetch)
- **Edge runtimes** (Cloudflare Workers, Vercel Edge, etc.)

For older Node.js versions, pass a `fetch` polyfill:
```typescript
import fetch from 'node-fetch';
const client = new Mainlayer({ apiKey: 'ml_...', fetch: fetch as typeof globalThis.fetch });
```

---

## License

MIT — see [LICENSE](LICENSE)
