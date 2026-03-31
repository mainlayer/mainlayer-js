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
   * Update a resource (partial update).
   *
   * @param id - Resource ID
   * @param params - Fields to update
   * @returns The updated resource
   *
   * @example
   * const updated = await client.resources.update('res_abc123', {
   *   price_usdc: 0.25,
   *   description: 'Updated description',
   * });
   */
  update(id, params) {
    return this.http.patch(`/resources/${id}`, params);
  }
  /**
   * Delete a resource by ID.
   *
   * @param id - Resource ID
   *
   * @example
   * await client.resources.delete('res_abc123');
   */
  delete(id) {
    return this.http.delete(`/resources/${id}`);
  }
  /**
   * Get public information about a resource (no authentication required).
   *
   * @param id - Resource ID
   * @returns Public resource info
   *
   * @example
   * const info = await client.resources.getPublic('res_abc123');
   */
  getPublic(id) {
    return this.http.request("GET", `/resources/public/${id}`, {
      skipAuth: true
    });
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
   *   name: 'Monthly',
   *   price_usdc: 9.99,
   *   duration_seconds: 2592000, // 30 days
   *   active: true,
   * });
   */
  create(resourceId, params) {
    return this.http.post(`/resources/${resourceId}/plans`, params);
  }
};

// src/resources/subscriptions.ts
var SubscriptionsResource = class {
  constructor(http) {
    this.http = http;
  }
  /**
   * List all active and past subscriptions.
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
   * Create a subscription approval for a resource.
   *
   * @param params - Subscription details
   * @returns The created subscription record
   *
   * @example
   * const sub = await client.subscriptions.create({
   *   resource_id: 'res_abc123',
   *   payer_wallet: '0xPayerWalletAddress',
   *   plan_id: 'plan_monthly',
   * });
   */
  create(params) {
    return this.http.post("/subscriptions", params);
  }
  /**
   * Cancel a subscription by ID.
   *
   * @param id - Subscription ID
   *
   * @example
   * await client.subscriptions.cancel('sub_abc123');
   */
  cancel(id) {
    return this.http.delete(`/subscriptions/${id}`);
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