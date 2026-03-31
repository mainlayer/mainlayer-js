// src/client.ts
var MainlayerError = class extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "MainlayerError";
    this.status = status;
    this.body = body;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var DEFAULT_BASE_URL = "https://api.mainlayer.fr";
var DEFAULT_TIMEOUT = 3e4;
var DEFAULT_MAX_RETRIES = 3;
var RETRYABLE_STATUSES = /* @__PURE__ */ new Set([408, 429, 500, 502, 503, 504]);
var HttpClient = class {
  constructor(config = {}) {
    this.authHeader = null;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.fetchImpl = config.fetch ?? globalThis.fetch;
    if (!this.fetchImpl) {
      throw new Error(
        "fetch is not available in this environment. Please provide a fetch implementation via the `fetch` config option."
      );
    }
    if (config.apiKey) {
      this.authHeader = `Bearer ${config.apiKey}`;
    } else if (config.token) {
      this.authHeader = `Bearer ${config.token}`;
    }
  }
  /** Update the auth token at runtime (e.g. after login) */
  setToken(token) {
    this.authHeader = `Bearer ${token}`;
  }
  /** Clear authentication */
  clearAuth() {
    this.authHeader = null;
  }
  /**
   * Execute an authenticated HTTP request with automatic retries.
   */
  async request(method, path, options = {}) {
    const url = new URL(`${this.baseUrl}${path}`);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== void 0 && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };
    if (!options.skipAuth && this.authHeader) {
      headers["Authorization"] = this.authHeader;
    }
    const bodyString = options.body !== void 0 ? JSON.stringify(options.body) : void 0;
    let lastError = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        await sleep(200 * 2 ** (attempt - 1));
      }
      let response;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        response = await this.fetchImpl(url.toString(), {
          method,
          headers,
          body: bodyString,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (err) {
        const message2 = err instanceof Error ? err.message : "Network request failed";
        lastError = new MainlayerError(message2, 0, null);
        if (err instanceof Error && err.name === "AbortError") {
          throw new MainlayerError(
            `Request timed out after ${this.timeout}ms`,
            408,
            null
          );
        }
        if (attempt < this.maxRetries) continue;
        throw lastError;
      }
      if (response.ok) {
        if (response.status === 204) {
          return void 0;
        }
        try {
          return await response.json();
        } catch {
          return void 0;
        }
      }
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch {
      }
      const message = extractErrorMessage(errorBody, response.status);
      lastError = new MainlayerError(message, response.status, errorBody);
      if (RETRYABLE_STATUSES.has(response.status) && attempt < this.maxRetries) {
        continue;
      }
      throw lastError;
    }
    throw lastError;
  }
  /** Convenience GET */
  get(path, query) {
    return this.request("GET", path, { query });
  }
  /** Convenience POST */
  post(path, body) {
    return this.request("POST", path, { body });
  }
  /** Convenience PUT */
  put(path, body) {
    return this.request("PUT", path, { body });
  }
  /** Convenience PATCH */
  patch(path, body) {
    return this.request("PATCH", path, { body });
  }
  /** Convenience DELETE */
  delete(path) {
    return this.request("DELETE", path);
  }
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function extractErrorMessage(body, status) {
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail)) {
    return body.detail.map((d) => d.msg).join(", ");
  }
  if (typeof body.message === "string") return body.message;
  if (typeof body.error === "string") return body.error;
  return `HTTP ${status} error`;
}

// src/resources/auth.ts
var AuthResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Register a new vendor account.
   *
   * @param params - Registration details
   * @returns The created vendor object
   *
   * @example
   * const vendor = await client.auth.register({
   *   email: 'alice@example.com',
   *   password: 's3cret!'
   * });
   */
  register(params) {
    return this.http.request("POST", "/auth/register", {
      body: params,
      skipAuth: true
    });
  }
  /**
   * Log in and obtain an access token.
   * The SDK automatically stores the returned token for subsequent requests.
   *
   * @param params - Login credentials
   * @returns An object containing `access_token` and `token_type`
   *
   * @example
   * const { access_token } = await client.auth.login({
   *   email: 'alice@example.com',
   *   password: 's3cret!'
   * });
   */
  async login(params) {
    const token = await this.http.request("POST", "/auth/login", {
      body: params,
      skipAuth: true
    });
    this.http.setToken(token.access_token);
    return token;
  }
};

// src/resources/api-keys.ts
var ApiKeysResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Create a new API key.
   *
   * @param params - Key configuration
   * @returns The newly created API key (including the raw key value — store it securely)
   *
   * @example
   * const { key } = await client.apiKeys.create({ name: 'production' });
   */
  create(params) {
    return this.http.post("/api-keys", params);
  }
  /**
   * List all API keys for the authenticated vendor.
   *
   * @returns Array of API key summaries (the raw key value is not returned)
   *
   * @example
   * const keys = await client.apiKeys.list();
   */
  list() {
    return this.http.get("/api-keys");
  }
  /**
   * Delete an API key by its ID.
   *
   * @param id - The API key ID to delete
   *
   * @example
   * await client.apiKeys.delete('key_abc123');
   */
  delete(id) {
    return this.http.delete(`/api-keys/${id}`);
  }
};

// src/resources/resources.ts
var ResourcesResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * List all resources owned by the authenticated vendor.
   *
   * @returns Array of resources
   *
   * @example
   * const resources = await client.resources.list();
   */
  list() {
    return this.http.get("/resources");
  }
  /**
   * Create a new resource.
   *
   * @param params - Resource configuration
   * @returns The created resource
   *
   * @example
   * const resource = await client.resources.create({
   *   slug: 'my-api',
   *   type: 'api',
   *   price_usdc: 0.10,
   *   fee_model: 'pay_per_call',
   *   description: 'Powerful data enrichment API',
   *   discoverable: true,
   * });
   */
  create(params) {
    return this.http.post("/resources", params);
  }
  /**
   * Get a specific resource by ID.
   *
   * @param id - Resource ID
   * @returns The resource
   *
   * @example
   * const resource = await client.resources.get('res_abc123');
   */
  get(id) {
    return this.http.get(`/resources/${id}`);
  }
  /**
   * Update a resource (full update — all fields replaced).
   *
   * @param id - Resource ID
   * @param params - Fields to update
   * @returns The updated resource
   *
   * @example
   * const updated = await client.resources.update('res_abc123', {
   *   slug: 'my-api',
   *   type: 'api',
   *   price_usdc: 0.25,
   *   fee_model: 'pay_per_call',
   * });
   */
  update(id, params) {
    return this.http.request("PUT", `/resources/${id}`, { body: params });
  }
  /**
   * Delete (deactivate) a resource by ID.
   *
   * @param id - Resource ID
   * @returns Confirmation message
   *
   * @example
   * await client.resources.delete('res_abc123');
   */
  delete(id) {
    return this.http.delete(`/resources/${id}`);
  }
  /**
   * Activate a resource, making it available to accept payments.
   *
   * @param id - Resource ID
   * @returns Activation result with status and optional next steps
   *
   * @example
   * const result = await client.resources.activate('res_abc123');
   * if (result.next_step) {
   *   console.log('Next step:', result.next_step);
   * }
   */
  activate(id) {
    return this.http.request("PATCH", `/resources/${id}/activate`);
  }
  /**
   * Get public information about a resource (no authentication required).
   *
   * @param id - Resource ID
   * @returns Public resource info including pricing
   *
   * @example
   * const info = await client.resources.getPublic('res_abc123');
   */
  getPublic(id) {
    return this.http.request("GET", `/resources/public/${id}`, {
      skipAuth: true
    });
  }
  /**
   * Get the payment-required payload for a resource.
   * Used for initiating the payment flow.
   *
   * @param id - Resource ID
   * @returns Payment required payload
   *
   * @example
   * const payload = await client.resources.getPaymentRequired('res_abc123');
   */
  getPaymentRequired(id) {
    return this.http.get(`/payment-required/${id}`);
  }
  // ─── Quota ──────────────────────────────────────────────────────────────────
  /**
   * Set purchase and call quotas for a resource.
   *
   * @param id - Resource ID
   * @param params - Quota limits per wallet
   * @returns The updated quota configuration
   *
   * @example
   * await client.resources.setQuota('res_abc123', {
   *   max_purchases_per_wallet: 3,
   *   max_calls_per_day_per_wallet: 100,
   * });
   */
  setQuota(id, params) {
    return this.http.request("PUT", `/resources/${id}/quota`, { body: params });
  }
  /**
   * Get the current quota configuration for a resource.
   *
   * @param id - Resource ID
   * @returns Current quota configuration
   *
   * @example
   * const quota = await client.resources.getQuota('res_abc123');
   */
  getQuota(id) {
    return this.http.get(`/resources/${id}/quota`);
  }
  /**
   * Remove all quota limits from a resource.
   *
   * @param id - Resource ID
   *
   * @example
   * await client.resources.deleteQuota('res_abc123');
   */
  deleteQuota(id) {
    return this.http.delete(`/resources/${id}/quota`);
  }
  /**
   * Get the webhook signing secret for a resource.
   * Use this to verify incoming webhook payloads.
   *
   * @param id - Resource ID
   * @returns The webhook secret
   *
   * @example
   * const { webhook_secret } = await client.resources.getWebhookSecret('res_abc123');
   */
  getWebhookSecret(id) {
    return this.http.get(`/resources/${id}/webhook-secret`);
  }
};

// src/resources/discover.ts
var DiscoverResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Search and browse publicly discoverable resources.
   *
   * @param params - Search and filter parameters
   * @returns Array of matching public resources
   *
   * @example
   * const results = await client.discover.search({
   *   q: 'ai image generation',
   *   type: 'api',
   *   fee_model: 'pay_per_call',
   *   limit: 20,
   * });
   */
  search(params = {}) {
    return this.http.request("GET", "/discover", {
      query: params,
      skipAuth: true
    });
  }
};

// src/resources/payments.ts
var PaymentsResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Execute a payment for a resource.
   *
   * @param params - Payment details including the resource ID and payer wallet
   * @returns The created payment record
   *
   * @example
   * const payment = await client.payments.create({
   *   resource_id: 'res_abc123',
   *   payer_wallet: '0xYourWalletAddress',
   *   coupon_code: 'WELCOME10',
   * });
   */
  create(params) {
    return this.http.post("/pay", params);
  }
  /**
   * List all payments made through the authenticated vendor's resources.
   *
   * @returns Array of payment records
   *
   * @example
   * const history = await client.payments.list();
   */
  list() {
    return this.http.get("/payments");
  }
};

// src/resources/entitlements.ts
var EntitlementsResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * List entitlements, optionally filtered by resource or payer wallet.
   *
   * @param params - Optional filters
   * @returns Array of entitlement records
   *
   * @example
   * const all = await client.entitlements.list();
   * const forResource = await client.entitlements.list({ resource_id: 'res_abc123' });
   */
  list(params = {}) {
    return this.http.get("/entitlements", {
      resource_id: params.resource_id,
      payer_wallet: params.payer_wallet
    });
  }
  /**
   * Check whether a specific wallet has access to a resource.
   * Use this as your authorization gate.
   *
   * @param params - Resource ID and payer wallet to check
   * @returns `{ has_access: boolean, entitlement?: Entitlement }`
   *
   * @example
   * const { has_access } = await client.entitlements.check({
   *   resource_id: 'res_abc123',
   *   payer_wallet: '0xPayerWalletAddress',
   * });
   *
   * if (!has_access) {
   *   return res.status(402).json({ error: 'Payment required' });
   * }
   */
  check(params) {
    return this.http.get("/entitlements/check", {
      resource_id: params.resource_id,
      payer_wallet: params.payer_wallet
    });
  }
};

// src/resources/plans.ts
var PlansResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * List all plans for a resource.
   *
   * @param resourceId - The resource ID
   * @returns Array of plans
   *
   * @example
   * const plans = await client.plans.list('res_abc123');
   */
  list(resourceId) {
    return this.http.get(`/resources/${resourceId}/plans`);
  }
  /**
   * Create a new pricing plan for a resource.
   *
   * @param resourceId - The resource ID
   * @param params - Plan configuration
   * @returns The created plan
   *
   * @example
   * const plan = await client.plans.create('res_abc123', {
   *   name: 'monthly',
   *   price_usdc: 9.99,
   *   fee_model: 'subscription',
   *   duration_seconds: 2592000, // 30 days
   * });
   */
  create(resourceId, params) {
    return this.http.post(`/resources/${resourceId}/plans`, params);
  }
  /**
   * Update an existing plan by name.
   *
   * @param resourceId - The resource ID
   * @param planName - The plan name identifier
   * @param params - Fields to update
   * @returns The updated plan
   *
   * @example
   * await client.plans.update('res_abc123', 'monthly', { price_usdc: 12.99 });
   */
  update(resourceId, planName, params) {
    return this.http.request("PUT", `/resources/${resourceId}/plans/${planName}`, {
      body: params
    });
  }
  /**
   * Delete a plan by name.
   *
   * @param resourceId - The resource ID
   * @param planName - The plan name identifier
   *
   * @example
   * await client.plans.delete('res_abc123', 'monthly');
   */
  delete(resourceId, planName) {
    return this.http.delete(`/resources/${resourceId}/plans/${planName}`);
  }
};

// src/resources/subscriptions.ts
var SubscriptionsResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * List all active and past subscriptions for the authenticated vendor.
   *
   * @returns Array of subscription records
   *
   * @example
   * const subs = await client.subscriptions.list();
   */
  list() {
    return this.http.get("/subscriptions");
  }
  /**
   * Approve and activate a subscription using the payer's signed authorization.
   *
   * @param params - Subscription approval details including signed authorization
   * @returns The created subscription record
   *
   * @example
   * const sub = await client.subscriptions.approve({
   *   resource_id: 'res_abc123',
   *   payer_wallet: '0xPayerWalletAddress',
   *   max_renewals: 12,
   *   chain: 'solana',
   *   signed_approval: '<signature>',
   *   delegate_token_account: '<account>',
   *   signed_at: new Date().toISOString(),
   *   plan: 'monthly',
   * });
   */
  approve(params) {
    return this.http.post("/subscriptions/approve", params);
  }
  /**
   * Cancel an active subscription using the payer's signed cancellation message.
   *
   * @param params - Cancellation details including payer wallet and signed message
   *
   * @example
   * await client.subscriptions.cancel({
   *   resource_id: 'res_abc123',
   *   payer_wallet: '0xPayerWalletAddress',
   *   signed_message: '<signature>',
   * });
   */
  cancel(params) {
    return this.http.post("/subscriptions/cancel", params);
  }
};

// src/resources/analytics.ts
var AnalyticsResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Retrieve vendor analytics, optionally scoped by date range or resource.
   *
   * @param params - Optional date range and resource filter
   * @returns Aggregated analytics including revenue, payment counts, and per-resource breakdown
   *
   * @example
   * // All-time analytics
   * const stats = await client.analytics.get();
   *
   * // Scoped to a date range
   * const monthly = await client.analytics.get({
   *   start_date: '2024-01-01',
   *   end_date: '2024-01-31',
   * });
   *
   * // For a specific resource
   * const resourceStats = await client.analytics.get({
   *   resource_id: 'res_abc123',
   * });
   */
  get(params = {}) {
    return this.http.get("/analytics", {
      start_date: params.start_date,
      end_date: params.end_date,
      resource_id: params.resource_id
    });
  }
};

// src/resources/vendor.ts
var VendorResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * Register a new vendor with a signed wallet message.
   * Use this after `auth.register` to complete onboarding and receive an API key.
   *
   * @param params - Wallet address, nonce, and signed message
   * @returns Vendor ID, API key, and optional next onboarding step
   *
   * @example
   * const result = await client.vendor.register({
   *   wallet_address: '0xYourWalletAddress',
   *   nonce: 'random-nonce-string',
   *   signed_message: '0xSignedMessage',
   * });
   * console.log('API Key:', result.api_key);
   */
  register(params) {
    return this.http.post("/vendors/register", params);
  }
  /**
   * Get the authenticated vendor's profile.
   *
   * @returns Vendor profile
   *
   * @example
   * const vendor = await client.vendor.get();
   * console.log(vendor.name, vendor.email);
   */
  get() {
    return this.http.get("/vendor");
  }
  /**
   * Update the authenticated vendor's profile.
   *
   * @param params - Fields to update
   * @returns The updated vendor profile
   *
   * @example
   * const updated = await client.vendor.update({
   *   name: 'Acme Corp',
   *   website: 'https://acme.example.com',
   * });
   */
  update(params) {
    return this.http.patch("/vendor", params);
  }
};

// src/resources/webhooks.ts
var WebhooksResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * List all registered webhooks.
   *
   * @returns Array of webhook configurations
   *
   * @example
   * const webhooks = await client.webhooks.list();
   */
  list() {
    return this.http.get("/webhooks");
  }
  /**
   * Register a new webhook endpoint.
   *
   * @param params - Webhook URL, event types, and optional resource scope
   * @returns The created webhook
   *
   * @example
   * const webhook = await client.webhooks.create({
   *   url: 'https://myapp.example.com/webhooks/mainlayer',
   *   events: ['payment.completed', 'subscription.cancelled'],
   * });
   */
  create(params) {
    return this.http.post("/webhooks", params);
  }
  /**
   * Delete a webhook by ID.
   *
   * @param id - Webhook ID
   *
   * @example
   * await client.webhooks.delete('wh_abc123');
   */
  delete(id) {
    return this.http.delete(`/webhooks/${id}`);
  }
};

// src/resources/coupons.ts
var CouponsResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * List all coupons.
   *
   * @returns Array of coupon records
   *
   * @example
   * const coupons = await client.coupons.list();
   */
  list() {
    return this.http.get("/coupons");
  }
  /**
   * Create a new coupon.
   *
   * @param params - Coupon configuration
   * @returns The created coupon
   *
   * @example
   * // 20% off, max 100 uses, expires at end of month
   * const coupon = await client.coupons.create({
   *   code: 'LAUNCH20',
   *   discount_type: 'percentage',
   *   discount_value: 20,
   *   max_uses: 100,
   *   expires_at: '2024-12-31T23:59:59Z',
   * });
   *
   * // $5 off a specific resource
   * const fixed = await client.coupons.create({
   *   code: 'SAVE5',
   *   discount_type: 'fixed',
   *   discount_value: 5,
   *   resource_ids: ['res_abc123'],
   * });
   */
  create(params) {
    return this.http.post("/coupons", params);
  }
};

// src/resources/invoices.ts
var InvoicesResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * List all invoices for the authenticated vendor.
   *
   * @returns Array of invoice records
   *
   * @example
   * const invoices = await client.invoices.list();
   * const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount_usdc, 0);
   */
  list() {
    return this.http.get("/invoices");
  }
};

// src/index.ts
var Mainlayer = class {
  constructor(config = {}) {
    this.http = new HttpClient(config);
    this.auth = new AuthResource(this.http);
    this.apiKeys = new ApiKeysResource(this.http);
    this.resources = new ResourcesResource(this.http);
    this.discover = new DiscoverResource(this.http);
    this.payments = new PaymentsResource(this.http);
    this.entitlements = new EntitlementsResource(this.http);
    this.plans = new PlansResource(this.http);
    this.subscriptions = new SubscriptionsResource(this.http);
    this.analytics = new AnalyticsResource(this.http);
    this.vendor = new VendorResource(this.http);
    this.webhooks = new WebhooksResource(this.http);
    this.coupons = new CouponsResource(this.http);
    this.invoices = new InvoicesResource(this.http);
  }
};
var index_default = Mainlayer;

export { Mainlayer, MainlayerError, index_default as default };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map