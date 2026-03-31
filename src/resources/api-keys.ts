import type { HttpClient } from "../client.js";
import type {
  ApiKey,
  ApiKeyListItem,
  CreateApiKeyParams,
} from "../types/index.js";

/**
 * API Keys resource — create and manage programmatic access keys.
 */
export class ApiKeysResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a new API key.
   *
   * @param params - Key configuration
   * @returns The newly created API key (including the raw key value — store it securely)
   *
   * @example
   * const { key } = await client.apiKeys.create({ name: 'production' });
   */
  create(params: CreateApiKeyParams): Promise<ApiKey> {
    return this.http.post<ApiKey>("/api-keys", params);
  }

  /**
   * List all API keys for the authenticated vendor.
   *
   * @returns Array of API key summaries (the raw key value is not returned)
   *
   * @example
   * const keys = await client.apiKeys.list();
   */
  list(): Promise<ApiKeyListItem[]> {
    return this.http.get<ApiKeyListItem[]>("/api-keys");
  }

  /**
   * Delete an API key by its ID.
   *
   * @param id - The API key ID to delete
   *
   * @example
   * await client.apiKeys.delete('key_abc123');
   */
  delete(id: string): Promise<void> {
    return this.http.delete<void>(`/api-keys/${id}`);
  }
}
