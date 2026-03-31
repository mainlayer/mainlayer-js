import { HttpClient } from "./client.js";
import { AuthResource } from "./resources/auth.js";
import { ApiKeysResource } from "./resources/api-keys.js";
import { ResourcesResource } from "./resources/resources.js";
import { DiscoverResource } from "./resources/discover.js";
import { PaymentsResource } from "./resources/payments.js";
import { EntitlementsResource } from "./resources/entitlements.js";
import { PlansResource } from "./resources/plans.js";
import { SubscriptionsResource } from "./resources/subscriptions.js";
import { AnalyticsResource } from "./resources/analytics.js";
import { VendorResource } from "./resources/vendor.js";
import { WebhooksResource } from "./resources/webhooks.js";
import { CouponsResource } from "./resources/coupons.js";
import { InvoicesResource } from "./resources/invoices.js";
import type { MainlayerConfig } from "./types/index.js";

export { MainlayerError } from "./client.js";
export type * from "./types/index.js";
// Re-export resource classes for advanced usage
export type { ResourcesResource } from "./resources/resources.js";
export type { PlansResource } from "./resources/plans.js";
export type { SubscriptionsResource } from "./resources/subscriptions.js";
export type { VendorResource } from "./resources/vendor.js";

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
export class Mainlayer {
  /** @internal */
  private readonly http: HttpClient;

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

  constructor(config: MainlayerConfig = {}) {
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
}

export default Mainlayer;
