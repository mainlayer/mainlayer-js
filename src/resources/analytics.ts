import type { HttpClient } from "../client.js";
import type { AnalyticsParams, AnalyticsResult } from "../types/index.js";

/**
 * Analytics resource — revenue and usage insights for your resources.
 */
export class AnalyticsResource {
  constructor(private readonly http: HttpClient) {}

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
  get(params: AnalyticsParams = {}): Promise<AnalyticsResult> {
    return this.http.get<AnalyticsResult>("/analytics", {
      start_date: params.start_date,
      end_date: params.end_date,
      resource_id: params.resource_id,
    });
  }
}
