/**
 * Core type definitions for the Mainlayer SDK.
 */
interface MainlayerConfig {
    /** Your Mainlayer API key (starts with `ml_`) */
    apiKey?: string;
    /** JWT bearer token (alternative to apiKey) */
    token?: string;
    /** Override the base URL (default: https://api.mainlayer.fr) */
    baseUrl?: string;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
    /** Maximum number of retries for transient errors (default: 3) */
    maxRetries?: number;
    /** Custom fetch implementation (defaults to global fetch) */
    fetch?: typeof fetch;
}
interface MainlayerErrorResponse {
    detail?: string | {
        msg: string;
        type: string;
    }[];
    message?: string;
    error?: string;
    [key: string]: unknown;
}
interface PaginationParams {
    limit?: number;
    offset?: number;
}
interface PaginatedResponse<T> {
    items: T[];
    total?: number;
    limit?: number;
    offset?: number;
}
interface RegisterParams {
    email: string;
    password: string;
    wallet_address?: string;
}
interface LoginParams {
    email: string;
    password: string;
}
interface AuthToken {
    access_token: string;
    token_type: string;
}
interface VendorRegisterParams {
    /** On-chain wallet address */
    wallet_address: string;
    /** Nonce used in the signed message */
    nonce: string;
    /** Signature of the registration message */
    signed_message: string;
}
interface VendorRegisterResult {
    vendor_id: string;
    api_key: string;
    next_step?: string;
}
interface CreateApiKeyParams {
    name: string;
}
interface ApiKey {
    id: string;
    name: string;
    key: string;
    created_at: string;
    last_used_at?: string;
}
interface ApiKeyListItem {
    id: string;
    name: string;
    created_at: string;
    last_used_at?: string;
}
type ResourceType = "api" | "file" | "endpoint" | "page";
type FeeModel = "one_time" | "subscription" | "pay_per_call";
interface CreateResourceParams {
    /** URL-safe identifier for the resource */
    slug: string;
    type: ResourceType;
    /** Price per unit in USD */
    price_usdc: number;
    fee_model: FeeModel;
    description?: string;
    /** Vendor wallet address to receive payments */
    vendor_wallet?: string;
    /** Webhook URL called after a successful payment */
    callback_url?: string;
    /** Number of credits granted per payment */
    credits_per_payment?: number;
    /** Duration of access in seconds (for subscriptions) */
    duration_seconds?: number;
    /** API call quota granted per payment */
    quota_calls?: number;
    /** Price per additional call when quota is exceeded */
    overage_price_usdc?: number;
    /** Arbitrary metadata attached to the resource */
    metadata?: Record<string, unknown>;
    /** Whether this resource appears in public discovery */
    discoverable?: boolean;
}
type UpdateResourceParams = Partial<CreateResourceParams>;
interface Resource {
    id: string;
    slug: string;
    type: ResourceType;
    price_usdc: number;
    fee_model: FeeModel;
    description?: string;
    callback_url?: string;
    credits_per_payment?: number;
    duration_seconds?: number;
    quota_calls?: number;
    overage_price_usdc?: number;
    vendor_wallet?: string;
    metadata?: Record<string, unknown>;
    discoverable: boolean;
    active: boolean;
    vendor_id: string;
    created_at: string;
    updated_at: string;
}
/** Returned by PATCH /resources/{id}/activate */
interface ResourceActivateResult {
    id: string;
    active: boolean;
    discoverable: boolean;
    next_step?: string;
}
/** Public resource info (no auth required) */
interface ResourcePublicInfo {
    id: string;
    slug: string;
    description?: string;
    price_usdc: number;
    fee_model: FeeModel;
    credits_per_payment?: number;
    facilitator_url?: string;
}
interface ResourceQuotaParams {
    /** Maximum total purchases allowed per wallet address */
    max_purchases_per_wallet?: number;
    /** Maximum API calls allowed per day per wallet address */
    max_calls_per_day_per_wallet?: number;
}
interface ResourceQuota {
    resource_id: string;
    max_purchases_per_wallet?: number;
    max_calls_per_day_per_wallet?: number;
}
interface ResourceWebhookSecret {
    webhook_secret: string;
}
interface DiscoverParams extends PaginationParams {
    q?: string;
    type?: ResourceType;
    fee_model?: FeeModel;
}
interface PublicResource {
    id: string;
    slug: string;
    type: ResourceType;
    price_usdc: number;
    fee_model: FeeModel;
    description?: string;
    vendor_id: string;
}
interface CreatePaymentParams {
    resource_id: string;
    payer_wallet: string;
    tx_signature?: string;
    plan_id?: string;
    coupon_code?: string;
}
interface Payment {
    id: string;
    resource_id: string;
    payer_wallet: string;
    amount_usdc: number;
    status: string;
    tx_signature?: string;
    plan_id?: string;
    coupon_code?: string;
    created_at: string;
}
interface EntitlementsListParams {
    resource_id?: string;
    payer_wallet?: string;
}
interface EntitlementCheckParams {
    resource_id: string;
    payer_wallet: string;
}
interface Entitlement {
    id: string;
    resource_id: string;
    payer_wallet: string;
    granted_at: string;
    expires_at?: string;
    credits_remaining?: number;
    calls_remaining?: number;
}
interface EntitlementCheckResult {
    has_access: boolean;
    entitlement?: Entitlement;
}
interface CreatePlanParams {
    name: string;
    /** Price in USD */
    price_usdc: number;
    fee_model: FeeModel;
    /** Number of credits granted per billing cycle */
    credits_per_payment?: number;
    /** Duration of each billing cycle in seconds */
    duration_seconds?: number;
    /** Maximum API calls allowed per day on this plan */
    max_calls_per_day?: number;
}
type UpdatePlanParams = Partial<CreatePlanParams>;
interface Plan {
    name: string;
    resource_id: string;
    price_usdc: number;
    fee_model: FeeModel;
    credits_per_payment?: number;
    duration_seconds?: number;
    max_calls_per_day?: number;
    active: boolean;
    created_at: string;
}
interface ApproveSubscriptionParams {
    resource_id: string;
    payer_wallet: string;
    max_renewals: number;
    chain: string;
    signed_approval: string;
    delegate_token_account: string;
    signed_at: string;
    plan?: string;
    trial_days?: number;
}
interface CancelSubscriptionParams {
    resource_id: string;
    payer_wallet: string;
    signed_message: string;
}
interface Subscription {
    id: string;
    resource_id: string;
    payer_wallet: string;
    plan?: string;
    status: string;
    chain: string;
    current_period_start: string;
    current_period_end: string;
    max_renewals: number;
    renewals_count: number;
    created_at: string;
}
/** @deprecated Use ApproveSubscriptionParams */
type CreateSubscriptionParams = ApproveSubscriptionParams;
interface AnalyticsParams {
    start_date?: string;
    end_date?: string;
    resource_id?: string;
}
interface ResourceAnalytics {
    resource_id: string;
    slug: string;
    total_revenue_usdc: number;
    total_payments: number;
    unique_payers: number;
}
interface AnalyticsResult {
    total_revenue_usdc: number;
    total_payments: number;
    unique_payers: number;
    by_resource: ResourceAnalytics[];
}
interface UpdateVendorParams {
    name?: string;
    website?: string;
    description?: string;
    email?: string;
}
interface Vendor {
    id: string;
    name?: string;
    website?: string;
    description?: string;
    email?: string;
    wallet_address?: string;
    created_at: string;
}
type WebhookEvent = "payment.completed" | "payment.failed" | "subscription.created" | "subscription.cancelled" | "entitlement.granted" | "entitlement.expired";
interface CreateWebhookParams {
    url: string;
    events: WebhookEvent[] | string[];
    resource_id?: string;
}
interface Webhook {
    id: string;
    url: string;
    events: string[];
    resource_id?: string;
    active: boolean;
    created_at: string;
}
type DiscountType = "percentage" | "fixed";
interface CreateCouponParams {
    code: string;
    discount_type: DiscountType;
    /** Discount value: percentage (0–100) or fixed USD amount */
    discount_value: number;
    resource_ids?: string[];
    max_uses?: number;
    expires_at?: string;
}
interface Coupon {
    id: string;
    code: string;
    discount_type: DiscountType;
    discount_value: number;
    resource_ids?: string[];
    max_uses?: number;
    uses: number;
    expires_at?: string;
    created_at: string;
}
interface Invoice {
    id: string;
    payment_id: string;
    amount_usdc: number;
    status: string;
    issued_at: string;
    payer_wallet: string;
    resource_id: string;
}

/**
 * Typed error class for all Mainlayer API errors.
 *
 * @example
 * try {
 *   await client.resources.list();
 * } catch (err) {
 *   if (err instanceof MainlayerError) {
 *     console.error(err.status, err.message);
 *   }
 * }
 */
declare class MainlayerError extends Error {
    /** HTTP status code returned by the API */
    readonly status: number;
    /** Raw response body */
    readonly body: unknown;
    constructor(message: string, status: number, body?: unknown);
}
/** HTTP methods supported by the client */
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
/**
 * Core HTTP client for the Mainlayer API.
 * Handles authentication, retries, and error parsing.
 */
declare class HttpClient {
    private readonly baseUrl;
    private readonly timeout;
    private readonly maxRetries;
    private readonly fetchImpl;
    private authHeader;
    constructor(config?: MainlayerConfig);
    /** Update the auth token at runtime (e.g. after login) */
    setToken(token: string): void;
    /** Clear authentication */
    clearAuth(): void;
    /**
     * Execute an authenticated HTTP request with automatic retries.
     */
    request<T>(method: HttpMethod, path: string, options?: {
        body?: unknown;
        query?: Record<string, string | number | boolean | undefined | null>;
        skipAuth?: boolean;
    }): Promise<T>;
    /** Convenience GET */
    get<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>): Promise<T>;
    /** Convenience POST */
    post<T>(path: string, body?: unknown): Promise<T>;
    /** Convenience PUT */
    put<T>(path: string, body?: unknown): Promise<T>;
    /** Convenience PATCH */
    patch<T>(path: string, body?: unknown): Promise<T>;
    /** Convenience DELETE */
    delete<T>(path: string): Promise<T>;
}

/**
 * Authentication resource — register and log in as a Mainlayer vendor.
 */
declare class AuthResource {
    private readonly http;
    constructor(http: HttpClient);
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
    register(params: RegisterParams): Promise<unknown>;
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
    login(params: LoginParams): Promise<AuthToken>;
}

/**
 * API Keys resource — create and manage programmatic access keys.
 */
declare class ApiKeysResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Create a new API key.
     *
     * @param params - Key configuration
     * @returns The newly created API key (including the raw key value — store it securely)
     *
     * @example
     * const { key } = await client.apiKeys.create({ name: 'production' });
     */
    create(params: CreateApiKeyParams): Promise<ApiKey>;
    /**
     * List all API keys for the authenticated vendor.
     *
     * @returns Array of API key summaries (the raw key value is not returned)
     *
     * @example
     * const keys = await client.apiKeys.list();
     */
    list(): Promise<ApiKeyListItem[]>;
    /**
     * Delete an API key by its ID.
     *
     * @param id - The API key ID to delete
     *
     * @example
     * await client.apiKeys.delete('key_abc123');
     */
    delete(id: string): Promise<void>;
}

/**
 * Resources — the products and services you sell via Mainlayer.
 * Resources can be APIs, files, endpoints, or pages with configurable pricing models.
 */
declare class ResourcesResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * List all resources owned by the authenticated vendor.
     *
     * @returns Array of resources
     *
     * @example
     * const resources = await client.resources.list();
     */
    list(): Promise<Resource[]>;
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
    create(params: CreateResourceParams): Promise<Resource>;
    /**
     * Get a specific resource by ID.
     *
     * @param id - Resource ID
     * @returns The resource
     *
     * @example
     * const resource = await client.resources.get('res_abc123');
     */
    get(id: string): Promise<Resource>;
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
    update(id: string, params: UpdateResourceParams): Promise<Resource>;
    /**
     * Delete (deactivate) a resource by ID.
     *
     * @param id - Resource ID
     * @returns Confirmation message
     *
     * @example
     * await client.resources.delete('res_abc123');
     */
    delete(id: string): Promise<{
        message: string;
    }>;
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
    activate(id: string): Promise<ResourceActivateResult>;
    /**
     * Get public information about a resource (no authentication required).
     *
     * @param id - Resource ID
     * @returns Public resource info including pricing
     *
     * @example
     * const info = await client.resources.getPublic('res_abc123');
     */
    getPublic(id: string): Promise<PublicResource>;
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
    getPaymentRequired(id: string): Promise<unknown>;
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
    setQuota(id: string, params: ResourceQuotaParams): Promise<ResourceQuota>;
    /**
     * Get the current quota configuration for a resource.
     *
     * @param id - Resource ID
     * @returns Current quota configuration
     *
     * @example
     * const quota = await client.resources.getQuota('res_abc123');
     */
    getQuota(id: string): Promise<ResourceQuota>;
    /**
     * Remove all quota limits from a resource.
     *
     * @param id - Resource ID
     *
     * @example
     * await client.resources.deleteQuota('res_abc123');
     */
    deleteQuota(id: string): Promise<void>;
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
    getWebhookSecret(id: string): Promise<ResourceWebhookSecret>;
}

/**
 * Discovery resource — search the public Mainlayer marketplace.
 * No authentication required.
 */
declare class DiscoverResource {
    private readonly http;
    constructor(http: HttpClient);
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
    search(params?: DiscoverParams): Promise<PublicResource[]>;
}

/**
 * Payments resource — execute and retrieve payment history.
 */
declare class PaymentsResource {
    private readonly http;
    constructor(http: HttpClient);
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
    create(params: CreatePaymentParams): Promise<Payment>;
    /**
     * List all payments made through the authenticated vendor's resources.
     *
     * @returns Array of payment records
     *
     * @example
     * const history = await client.payments.list();
     */
    list(): Promise<Payment[]>;
}

/**
 * Entitlements resource — manage and verify access rights to your resources.
 *
 * Entitlements are granted automatically when a payment succeeds.
 * Use `check` to gate access in your application.
 */
declare class EntitlementsResource {
    private readonly http;
    constructor(http: HttpClient);
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
    list(params?: EntitlementsListParams): Promise<Entitlement[]>;
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
    check(params: EntitlementCheckParams): Promise<EntitlementCheckResult>;
}

/**
 * Plans resource — define pricing tiers for your resources.
 *
 * Plans let you offer multiple pricing options (e.g. monthly vs. annual)
 * for the same resource.
 */
declare class PlansResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * List all plans for a resource.
     *
     * @param resourceId - The resource ID
     * @returns Array of plans
     *
     * @example
     * const plans = await client.plans.list('res_abc123');
     */
    list(resourceId: string): Promise<Plan[]>;
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
    create(resourceId: string, params: CreatePlanParams): Promise<Plan>;
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
    update(resourceId: string, planName: string, params: UpdatePlanParams): Promise<Plan>;
    /**
     * Delete a plan by name.
     *
     * @param resourceId - The resource ID
     * @param planName - The plan name identifier
     *
     * @example
     * await client.plans.delete('res_abc123', 'monthly');
     */
    delete(resourceId: string, planName: string): Promise<void>;
}

/**
 * Subscriptions resource — manage recurring access to resources.
 *
 * Subscriptions are initiated by a payer's signed approval and can be
 * cancelled by the payer with a signed message.
 */
declare class SubscriptionsResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * List all active and past subscriptions for the authenticated vendor.
     *
     * @returns Array of subscription records
     *
     * @example
     * const subs = await client.subscriptions.list();
     */
    list(): Promise<Subscription[]>;
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
    approve(params: ApproveSubscriptionParams): Promise<Subscription>;
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
    cancel(params: CancelSubscriptionParams): Promise<void>;
}

/**
 * Analytics resource — revenue and usage insights for your resources.
 */
declare class AnalyticsResource {
    private readonly http;
    constructor(http: HttpClient);
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
    get(params?: AnalyticsParams): Promise<AnalyticsResult>;
}

/**
 * Vendor resource — register, view, and update your vendor profile.
 */
declare class VendorResource {
    private readonly http;
    constructor(http: HttpClient);
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
    register(params: VendorRegisterParams): Promise<VendorRegisterResult>;
    /**
     * Get the authenticated vendor's profile.
     *
     * @returns Vendor profile
     *
     * @example
     * const vendor = await client.vendor.get();
     * console.log(vendor.name, vendor.email);
     */
    get(): Promise<Vendor>;
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
    update(params: UpdateVendorParams): Promise<Vendor>;
}

/**
 * Webhooks resource — receive real-time event notifications.
 *
 * Webhooks notify your server when events occur (payments, subscription changes, etc.).
 */
declare class WebhooksResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * List all registered webhooks.
     *
     * @returns Array of webhook configurations
     *
     * @example
     * const webhooks = await client.webhooks.list();
     */
    list(): Promise<Webhook[]>;
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
    create(params: CreateWebhookParams): Promise<Webhook>;
    /**
     * Delete a webhook by ID.
     *
     * @param id - Webhook ID
     *
     * @example
     * await client.webhooks.delete('wh_abc123');
     */
    delete(id: string): Promise<void>;
}

/**
 * Coupons resource — create and manage discount codes for your resources.
 */
declare class CouponsResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * List all coupons.
     *
     * @returns Array of coupon records
     *
     * @example
     * const coupons = await client.coupons.list();
     */
    list(): Promise<Coupon[]>;
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
    create(params: CreateCouponParams): Promise<Coupon>;
}

/**
 * Invoices resource — retrieve payment invoices.
 */
declare class InvoicesResource {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * List all invoices for the authenticated vendor.
     *
     * @returns Array of invoice records
     *
     * @example
     * const invoices = await client.invoices.list();
     * const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount_usdc, 0);
     */
    list(): Promise<Invoice[]>;
}

/**
 * The official Mainlayer SDK client.
 *
 * @example Basic setup
 * ```typescript
 * import Mainlayer from '@mainlayer/sdk';
 *
 * const client = new Mainlayer({ apiKey: 'ml_...' });
 * ```
 *
 * @example Login flow
 * ```typescript
 * const client = new Mainlayer();
 * await client.auth.login({ email: 'you@example.com', password: 'secret' });
 * // Token is now stored automatically for subsequent requests
 * ```
 */
declare class Mainlayer {
    /** @internal */
    private readonly http;
    /** Authentication — register and log in */
    readonly auth: AuthResource;
    /** API Keys management */
    readonly apiKeys: ApiKeysResource;
    /** Resources — the products and services you sell */
    readonly resources: ResourcesResource;
    /** Public resource discovery */
    readonly discover: DiscoverResource;
    /** Payments — execute and list payment records */
    readonly payments: PaymentsResource;
    /** Entitlements — verify and manage access rights */
    readonly entitlements: EntitlementsResource;
    /** Plans — pricing tiers for your resources */
    readonly plans: PlansResource;
    /** Subscriptions — recurring access management */
    readonly subscriptions: SubscriptionsResource;
    /** Analytics — revenue and usage insights */
    readonly analytics: AnalyticsResource;
    /** Vendor profile */
    readonly vendor: VendorResource;
    /** Webhooks — real-time event notifications */
    readonly webhooks: WebhooksResource;
    /** Coupons — discount codes */
    readonly coupons: CouponsResource;
    /** Invoices */
    readonly invoices: InvoicesResource;
    constructor(config?: MainlayerConfig);
}

export { type AnalyticsParams, type AnalyticsResult, type ApiKey, type ApiKeyListItem, type ApproveSubscriptionParams, type AuthToken, type CancelSubscriptionParams, type Coupon, type CreateApiKeyParams, type CreateCouponParams, type CreatePaymentParams, type CreatePlanParams, type CreateResourceParams, type CreateSubscriptionParams, type CreateWebhookParams, type DiscountType, type DiscoverParams, type Entitlement, type EntitlementCheckParams, type EntitlementCheckResult, type EntitlementsListParams, type FeeModel, type Invoice, type LoginParams, Mainlayer, type MainlayerConfig, MainlayerError, type MainlayerErrorResponse, type PaginatedResponse, type PaginationParams, type Payment, type Plan, PlansResource, type PublicResource, type RegisterParams, type Resource, type ResourceActivateResult, type ResourceAnalytics, type ResourcePublicInfo, type ResourceQuota, type ResourceQuotaParams, type ResourceType, type ResourceWebhookSecret, ResourcesResource, type Subscription, SubscriptionsResource, type UpdatePlanParams, type UpdateResourceParams, type UpdateVendorParams, type Vendor, type VendorRegisterParams, type VendorRegisterResult, VendorResource, type Webhook, type WebhookEvent, Mainlayer as default };
