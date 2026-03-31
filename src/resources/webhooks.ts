import type { HttpClient } from "../client.js";
import type { CreateWebhookParams, Webhook } from "../types/index.js";

/**
 * Webhooks resource — receive real-time event notifications.
 *
 * Webhooks notify your server when events occur (payments, subscription changes, etc.).
 */
export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all registered webhooks.
   *
   * @returns Array of webhook configurations
   *
   * @example
   * const webhooks = await client.webhooks.list();
   */
  list(): Promise<Webhook[]> {
    return this.http.get<Webhook[]>("/webhooks");
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
  create(params: CreateWebhookParams): Promise<Webhook> {
    return this.http.post<Webhook>("/webhooks", params);
  }

  /**
   * Delete a webhook by ID.
   *
   * @param id - Webhook ID
   *
   * @example
   * await client.webhooks.delete('wh_abc123');
   */
  delete(id: string): Promise<void> {
    return this.http.delete<void>(`/webhooks/${id}`);
  }
}
