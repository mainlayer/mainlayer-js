import type { HttpClient } from "../client.js";
import type {
  Entitlement,
  EntitlementCheckParams,
  EntitlementCheckResult,
  EntitlementsListParams,
} from "../types/index.js";

/**
 * Entitlements resource — manage and verify access rights to your resources.
 *
 * Entitlements are granted automatically when a payment succeeds.
 * Use `check` to gate access in your application.
 */
export class EntitlementsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List entitlements, optionally filtered by resource or payer wallet.
   *
   * @param params - Optional filters
   * @returns Array of entitlement records
   *
   * @example
   * const all = await client.entitlements.list();
   * const forResource = await client.entitlements.list({ resource_id: 'res_abc123' });
   */
  list(params: EntitlementsListParams = {}): Promise<Entitlement[]> {
    return this.http.get<Entitlement[]>("/entitlements", {
      resource_id: params.resource_id,
      payer_wallet: params.payer_wallet,
    });
  }

  /**
   * Check whether a specific wallet has access to a resource.
   * Use this as your authorization gate.
   *
   * @param params - Resource ID and payer wallet to check
   * @returns `{ has_access: boolean, entitlement?: Entitlement }`
   *
   * @example
   * const { has_access } = await client.entitlements.check({
   *   resource_id: 'res_abc123',
   *   payer_wallet: '0xPayerWalletAddress',
   * });
   *
   * if (!has_access) {
   *   return res.status(402).json({ error: 'Payment required' });
   * }
   */
  check(params: EntitlementCheckParams): Promise<EntitlementCheckResult> {
    return this.http.get<EntitlementCheckResult>("/entitlements/check", {
      resource_id: params.resource_id,
      payer_wallet: params.payer_wallet,
    });
  }
}
