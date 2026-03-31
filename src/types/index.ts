/**
 * Core type definitions for the Mainlayer SDK.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

export interface MainlayerConfig {
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

// ─── Error ────────────────────────────────────────────────────────────────────

export interface MainlayerErrorResponse {
  detail?: string | { msg: string; type: string }[];
  message?: string;
  error?: string;
  [key: string]: unknown;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total?: number;
  limit?: number;
  offset?: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface RegisterParams {
  email: string;
  password: string;
  wallet_address?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

// ─── API Keys ─────────────────────────────────────────────────────────────────

export interface CreateApiKeyParams {
  name: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used_at?: string;
}

export interface ApiKeyListItem {
  id: string;
  name: string;
  created_at: string;
  last_used_at?: string;
}

// ─── Resources ────────────────────────────────────────────────────────────────

export type ResourceType = "api" | "file" | "endpoint" | "page";
export type FeeModel = "one_time" | "subscription" | "pay_per_call";

export interface CreateResourceParams {
  /** URL-safe identifier for the resource */
  slug: string;
  type: ResourceType;
  /** Price per unit in USD */
  price_usdc: number;
  fee_model: FeeModel;
  description?: string;
  /** Webhook URL called after a successful payment */
  callback_url?: string;
  /** Number of credits granted per payment */
  credits_per_payment?: number;
  /** Duration of access in seconds (for subscriptions) */
  duration_seconds?: number;
  /** API call quota granted per payment */
  quota_calls?: number;
  /** Whether this resource appears in public discovery */
  discoverable?: boolean;
}

export type UpdateResourceParams = Partial<CreateResourceParams>;

export interface Resource {
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
  discoverable: boolean;
  vendor_id: string;
  created_at: string;
  updated_at: string;
}

// ─── Discovery ────────────────────────────────────────────────────────────────

export interface DiscoverParams extends PaginationParams {
  q?: string;
  type?: ResourceType;
  fee_model?: FeeModel;
}

export interface PublicResource {
  id: string;
  slug: string;
  type: ResourceType;
  price_usdc: number;
  fee_model: FeeModel;
  description?: string;
  vendor_id: string;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface CreatePaymentParams {
  resource_id: string;
  payer_wallet: string;
  tx_signature?: string;
  plan_id?: string;
  coupon_code?: string;
}

export interface Payment {
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

// ─── Entitlements ─────────────────────────────────────────────────────────────

export interface EntitlementsListParams {
  resource_id?: string;
  payer_wallet?: string;
}

export interface EntitlementCheckParams {
  resource_id: string;
  payer_wallet: string;
}

export interface Entitlement {
  id: string;
  resource_id: string;
  payer_wallet: string;
  granted_at: string;
  expires_at?: string;
  credits_remaining?: number;
  calls_remaining?: number;
}

export interface EntitlementCheckResult {
  has_access: boolean;
  entitlement?: Entitlement;
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface CreatePlanParams {
  name: string;
  /** Price in USD */
  price_usdc: number;
  duration_seconds: number;
  active?: boolean;
}

export interface Plan {
  id: string;
  resource_id: string;
  name: string;
  price_usdc: number;
  duration_seconds: number;
  active: boolean;
  created_at: string;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export interface CreateSubscriptionParams {
  resource_id: string;
  payer_wallet: string;
  plan_id?: string;
}

export interface Subscription {
  id: string;
  resource_id: string;
  payer_wallet: string;
  plan_id?: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsParams {
  start_date?: string;
  end_date?: string;
  resource_id?: string;
}

export interface ResourceAnalytics {
  resource_id: string;
  slug: string;
  total_revenue_usdc: number;
  total_payments: number;
  unique_payers: number;
}

export interface AnalyticsResult {
  total_revenue_usdc: number;
  total_payments: number;
  unique_payers: number;
  by_resource: ResourceAnalytics[];
}

// ─── Vendor ───────────────────────────────────────────────────────────────────

export interface UpdateVendorParams {
  name?: string;
  website?: string;
  description?: string;
  email?: string;
}

export interface Vendor {
  id: string;
  name?: string;
  website?: string;
  description?: string;
  email?: string;
  wallet_address?: string;
  created_at: string;
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export type WebhookEvent =
  | "payment.completed"
  | "payment.failed"
  | "subscription.created"
  | "subscription.cancelled"
  | "entitlement.granted"
  | "entitlement.expired";

export interface CreateWebhookParams {
  url: string;
  events: WebhookEvent[] | string[];
  resource_id?: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  resource_id?: string;
  active: boolean;
  created_at: string;
}

// ─── Coupons ──────────────────────────────────────────────────────────────────

export type DiscountType = "percentage" | "fixed";

export interface CreateCouponParams {
  code: string;
  discount_type: DiscountType;
  /** Discount value: percentage (0–100) or fixed USD amount */
  discount_value: number;
  resource_ids?: string[];
  max_uses?: number;
  expires_at?: string;
}

export interface Coupon {
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

// ─── Invoices ─────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  payment_id: string;
  amount_usdc: number;
  status: string;
  issued_at: string;
  payer_wallet: string;
  resource_id: string;
}
