import type { HttpClient } from "../client.js";
import type { Plan, CreatePlanParams } from "../types/index.js";

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
   *   name: 'Monthly',
   *   price_usdc: 9.99,
   *   duration_seconds: 2592000, // 30 days
   *   active: true,
   * });
   */
  create(resourceId: string, params: CreatePlanParams): Promise<Plan> {
    return this.http.post<Plan>(`/resources/${resourceId}/plans`, params);
  }
}
