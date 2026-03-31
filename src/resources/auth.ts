import type { HttpClient } from "../client.js";
import type {
  RegisterParams,
  LoginParams,
  AuthToken,
} from "../types/index.js";

/**
 * Authentication resource — register and log in as a Mainlayer vendor.
 */
export class AuthResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Register a new vendor account.
   *
   * @param params - Registration details
   * @returns The created vendor object
   *
   * @example
   * const vendor = await client.auth.register({
   *   email: 'alice@example.com',
   *   password: 's3cret!'
   * });
   */
  register(params: RegisterParams): Promise<unknown> {
    return this.http.request("POST", "/auth/register", {
      body: params,
      skipAuth: true,
    });
  }

  /**
   * Log in and obtain an access token.
   * The SDK automatically stores the returned token for subsequent requests.
   *
   * @param params - Login credentials
   * @returns An object containing `access_token` and `token_type`
   *
   * @example
   * const { access_token } = await client.auth.login({
   *   email: 'alice@example.com',
   *   password: 's3cret!'
   * });
   */
  async login(params: LoginParams): Promise<AuthToken> {
    const token = await this.http.request<AuthToken>("POST", "/auth/login", {
      body: params,
      skipAuth: true,
    });
    // Automatically wire up the token for all subsequent requests
    this.http.setToken(token.access_token);
    return token;
  }
}
