import type { HttpClient } from "../client.js";
import type { Plan, CreatePlanParams, UpdatePlanParams } from "../types/index.js";

/**
 * Plans resource — define pricing tiers for your resources.
 *
 * Plans let you offer multiple pricing options (e.g. monthly vs. annual)
 * for the same resource.
 */
export class PlansResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all plans for a resource.
   *
   * @param resourceId - The resource ID
   * @returns Array of plans
   *
   * @example
   * const plans = await client.plans.list('res_abc123');
   */
  list(resourceId: string): Promise<Plan[]> {
    return this.http.get<Plan[]>(`/resources/${resourceId}/plans`);
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
  create(resourceId: string, params: CreatePlanParams): Promise<Plan> {
    return this.http.post<Plan>(`/resources/${resourceId}/plans`, params);
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
  update(resourceId: string, planName: string, params: UpdatePlanParams): Promise<Plan> {
    return this.http.request<Plan>("PUT", `/resources/${resourceId}/plans/${planName}`, {
      body: params,
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
  delete(resourceId: string, planName: string): Promise<void> {
    return this.http.delete<void>(`/resources/${resourceId}/plans/${planName}`);
  }
}
