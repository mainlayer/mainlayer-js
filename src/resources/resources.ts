import type { HttpClient } from "../client.js";
import type {
  Resource,
  CreateResourceParams,
  UpdateResourceParams,
  PublicResource,
  ResourceActivateResult,
  ResourceQuota,
  ResourceQuotaParams,
  ResourceWebhookSecret,
} from "../types/index.js";

/**
 * Resources — the products and services you sell via Mainlayer.
 * Resources can be APIs, files, endpoints, or pages with configurable pricing models.
 */
export class ResourcesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all resources owned by the authenticated vendor.
   *
   * @returns Array of resources
   *
   * @example
   * const resources = await client.resources.list();
   */
  list(): Promise<Resource[]> {
    return this.http.get<Resource[]>("/resources");
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
  create(params: CreateResourceParams): Promise<Resource> {
    return this.http.post<Resource>("/resources", params);
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
  get(id: string): Promise<Resource> {
    return this.http.get<Resource>(`/resources/${id}`);
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
  update(id: string, params: UpdateResourceParams): Promise<Resource> {
    return this.http.request<Resource>("PUT", `/resources/${id}`, { body: params });
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
  delete(id: string): Promise<{ message: string }> {
    return this.http.delete<{ message: string }>(`/resources/${id}`);
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
  activate(id: string): Promise<ResourceActivateResult> {
    return this.http.request<ResourceActivateResult>("PATCH", `/resources/${id}/activate`);
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
  getPublic(id: string): Promise<PublicResource> {
    return this.http.request<PublicResource>("GET", `/resources/public/${id}`, {
      skipAuth: true,
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
  getPaymentRequired(id: string): Promise<unknown> {
    return this.http.get<unknown>(`/payment-required/${id}`);
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
  setQuota(id: string, params: ResourceQuotaParams): Promise<ResourceQuota> {
    return this.http.request<ResourceQuota>("PUT", `/resources/${id}/quota`, { body: params });
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
  getQuota(id: string): Promise<ResourceQuota> {
    return this.http.get<ResourceQuota>(`/resources/${id}/quota`);
  }

  /**
   * Remove all quota limits from a resource.
   *
   * @param id - Resource ID
   *
   * @example
   * await client.resources.deleteQuota('res_abc123');
   */
  deleteQuota(id: string): Promise<void> {
    return this.http.delete<void>(`/resources/${id}/quota`);
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
  getWebhookSecret(id: string): Promise<ResourceWebhookSecret> {
    return this.http.get<ResourceWebhookSecret>(`/resources/${id}/webhook-secret`);
  }
}
