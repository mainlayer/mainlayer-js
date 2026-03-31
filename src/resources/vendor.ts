import type { HttpClient } from "../client.js";
import type {
  UpdateVendorParams,
  Vendor,
  VendorRegisterParams,
  VendorRegisterResult,
} from "../types/index.js";

/**
 * Vendor resource — register, view, and update your vendor profile.
 */
export class VendorResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Register a new vendor with a signed wallet message.
   * Use this after `auth.register` to complete onboarding and receive an API key.
   *
   * @param params - Wallet address, nonce, and signed message
   * @returns Vendor ID, API key, and optional next onboarding step
   *
   * @example
   * const result = await client.vendor.register({
   *   wallet_address: '0xYourWalletAddress',
   *   nonce: 'random-nonce-string',
   *   signed_message: '0xSignedMessage',
   * });
   * console.log('API Key:', result.api_key);
   */
  register(params: VendorRegisterParams): Promise<VendorRegisterResult> {
    return this.http.post<VendorRegisterResult>("/vendors/register", params);
  }

  /**
   * Get the authenticated vendor's profile.
   *
   * @returns Vendor profile
   *
   * @example
   * const vendor = await client.vendor.get();
   * console.log(vendor.name, vendor.email);
   */
  get(): Promise<Vendor> {
    return this.http.get<Vendor>("/vendor");
  }

  /**
   * Update the authenticated vendor's profile.
   *
   * @param params - Fields to update
   * @returns The updated vendor profile
   *
   * @example
   * const updated = await client.vendor.update({
   *   name: 'Acme Corp',
   *   website: 'https://acme.example.com',
   * });
   */
  update(params: UpdateVendorParams): Promise<Vendor> {
    return this.http.patch<Vendor>("/vendor", params);
  }
}
