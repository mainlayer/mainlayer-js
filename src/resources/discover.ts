import type { HttpClient } from "../client.js";
import type { DiscoverParams, PublicResource } from "../types/index.js";

/**
 * Discovery resource — search the public Mainlayer marketplace.
 * No authentication required.
 */
export class DiscoverResource {
  constructor(private readonly http: HttpClient) {}

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
  search(params: DiscoverParams = {}): Promise<PublicResource[]> {
    return this.http.request<PublicResource[]>("GET", "/discover", {
      query: params as Record<string, string | number | boolean | undefined>,
      skipAuth: true,
    });
  }
}
