import type { HttpClient } from "../client.js";
import type { Invoice } from "../types/index.js";

/**
 * Invoices resource — retrieve payment invoices.
 */
export class InvoicesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all invoices for the authenticated vendor.
   *
   * @returns Array of invoice records
   *
   * @example
   * const invoices = await client.invoices.list();
   * const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount_usdc, 0);
   */
  list(): Promise<Invoice[]> {
    return this.http.get<Invoice[]>("/invoices");
  }
}
