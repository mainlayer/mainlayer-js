import type { HttpClient } from "../client.js";
import type {
  Resource,
  CreateResourceParams,
  UpdateResourceParams,
  PublicResource,
} from "../types/index.js";

/**
 * Resources — the products and services you sell via Mainlayer.
 * Resources can be APIs, files, endpoints, or pages with configurable pricing models.
 */
export class ResourcesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all resources owned by the authenticated vendor.
   *
   * @returns Array of resources
   *
   * @example
   * const resources = await client.resources.list();
   */
  list(): Promise<Resource[]> {
    return this.http.get<Resource[]>("/resources");
  }

  /**
   * Create a new resource.
   *
   * @param params - Resource configuration
   * @returns The created resource
   *
   * @example
   * const resource = await client.resources.create({
   *   slug: 'my-api',
   *   type: 'api',
   *   price_usdc: 0.10,
   *   fee_model: 'pay_per_call',
   *   description: 'Powerful data enrichment API',
   *   discoverable: true,
   * });
   */
  create(params: CreateResourceParams): Promise<Resource> {
    return this.http.post<Resource>("/resources", params);
  }

  /**
   * Get a specific resource by ID.
   *
   * @param id - Resource ID
   * @returns The resource
   *
   * @example
   * const resource = await client.resources.get('res_abc123');
   */
  get(id: string): Promise<Resource> {
    return this.http.get<Resource>(`/resources/${id}`);
  }

  /**
   * Update a resource (partial update).
   *
   * @param id - Resource ID
   * @param params - Fields to update
   * @returns The updated resource
   *
   * @example
   * const updated = await client.resources.update('res_abc123', {
   *   price_usdc: 0.25,
   *   description: 'Updated description',
   * });
   */
  update(id: string, params: UpdateResourceParams): Promise<Resource> {
    return this.http.patch<Resource>(`/resources/${id}`, params);
  }

  /**
   * Delete a resource by ID.
   *
   * @param id - Resource ID
   *
   * @example
   * await client.resources.delete('res_abc123');
   */
  delete(id: string): Promise<void> {
    return this.http.delete<void>(`/resources/${id}`);
  }

  /**
   * Get public information about a resource (no authentication required).
   *
   * @param id - Resource ID
   * @returns Public resource info
   *
   * @example
   * const info = await client.resources.getPublic('res_abc123');
   */
  getPublic(id: string): Promise<PublicResource> {
    return this.http.request<PublicResource>("GET", `/resources/public/${id}`, {
      skipAuth: true,
    });
  }
}
