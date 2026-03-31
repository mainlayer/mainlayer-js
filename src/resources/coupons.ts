import type { HttpClient } from "../client.js";
import type { Coupon, CreateCouponParams } from "../types/index.js";

/**
 * Coupons resource — create and manage discount codes for your resources.
 */
export class CouponsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all coupons.
   *
   * @returns Array of coupon records
   *
   * @example
   * const coupons = await client.coupons.list();
   */
  list(): Promise<Coupon[]> {
    return this.http.get<Coupon[]>("/coupons");
  }

  /**
   * Create a new coupon.
   *
   * @param params - Coupon configuration
   * @returns The created coupon
   *
   * @example
   * // 20% off, max 100 uses, expires at end of month
   * const coupon = await client.coupons.create({
   *   code: 'LAUNCH20',
   *   discount_type: 'percentage',
   *   discount_value: 20,
   *   max_uses: 100,
   *   expires_at: '2024-12-31T23:59:59Z',
   * });
   *
   * // $5 off a specific resource
   * const fixed = await client.coupons.create({
   *   code: 'SAVE5',
   *   discount_type: 'fixed',
   *   discount_value: 5,
   *   resource_ids: ['res_abc123'],
   * });
   */
  create(params: CreateCouponParams): Promise<Coupon> {
    return this.http.post<Coupon>("/coupons", params);
  }
}
