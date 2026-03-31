import type { HttpClient } from "../client.js";
import type {
  ApproveSubscriptionParams,
  CancelSubscriptionParams,
  Subscription,
} from "../types/index.js";

/**
 * Subscriptions resource — manage recurring access to resources.
 *
 * Subscriptions are initiated by a payer's signed approval and can be
 * cancelled by the payer with a signed message.
 */
export class SubscriptionsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all active and past subscriptions for the authenticated vendor.
   *
   * @returns Array of subscription records
   *
   * @example
   * const subs = await client.subscriptions.list();
   */
  list(): Promise<Subscription[]> {
    return this.http.get<Subscription[]>("/subscriptions");
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
  approve(params: ApproveSubscriptionParams): Promise<Subscription> {
    return this.http.post<Subscription>("/subscriptions/approve", params);
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
  cancel(params: CancelSubscriptionParams): Promise<void> {
    return this.http.post<void>("/subscriptions/cancel", params);
  }
}
