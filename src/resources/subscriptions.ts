import type { HttpClient } from "../client.js";
import type { CreateSubscriptionParams, Subscription } from "../types/index.js";

/**
 * Subscriptions resource — manage recurring access to resources.
 */
export class SubscriptionsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all active and past subscriptions.
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
  create(params: CreateSubscriptionParams): Promise<Subscription> {
    return this.http.post<Subscription>("/subscriptions", params);
  }

  /**
   * Cancel a subscription by ID.
   *
   * @param id - Subscription ID
   *
   * @example
   * await client.subscriptions.cancel('sub_abc123');
   */
  cancel(id: string): Promise<void> {
    return this.http.delete<void>(`/subscriptions/${id}`);
  }
}
