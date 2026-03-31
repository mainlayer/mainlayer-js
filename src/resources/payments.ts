import type { HttpClient } from "../client.js";
import type { CreatePaymentParams, Payment } from "../types/index.js";

/**
 * Payments resource — execute and retrieve payment history.
 */
export class PaymentsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Execute a payment for a resource.
   *
   * @param params - Payment details including the resource ID and payer wallet
   * @returns The created payment record
   *
   * @example
   * const payment = await client.payments.create({
   *   resource_id: 'res_abc123',
   *   payer_wallet: '0xYourWalletAddress',
   *   coupon_code: 'WELCOME10',
   * });
   */
  create(params: CreatePaymentParams): Promise<Payment> {
    return this.http.post<Payment>("/pay", params);
  }

  /**
   * List all payments made through the authenticated vendor's resources.
   *
   * @returns Array of payment records
   *
   * @example
   * const history = await client.payments.list();
   */
  list(): Promise<Payment[]> {
    return this.http.get<Payment[]>("/payments");
  }
}
