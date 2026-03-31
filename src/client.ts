import type { MainlayerConfig, MainlayerErrorResponse } from "./types/index.js";

/**
 * Typed error class for all Mainlayer API errors.
 *
 * @example
 * try {
 *   await client.resources.list();
 * } catch (err) {
 *   if (err instanceof MainlayerError) {
 *     console.error(err.status, err.message);
 *   }
 * }
 */
export class MainlayerError extends Error {
  /** HTTP status code returned by the API */
  readonly status: number;
  /** Raw response body */
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "MainlayerError";
    this.status = status;
    this.body = body;
    // Maintain proper prototype chain in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const DEFAULT_BASE_URL = "https://api.mainlayer.fr";
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;

/** HTTP methods supported by the client */
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Set of HTTP status codes that should trigger a retry */
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Core HTTP client for the Mainlayer API.
 * Handles authentication, retries, and error parsing.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly fetchImpl: typeof fetch;
  private authHeader: string | null = null;

  constructor(config: MainlayerConfig = {}) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.fetchImpl = config.fetch ?? globalThis.fetch;

    if (!this.fetchImpl) {
      throw new Error(
        "fetch is not available in this environment. " +
          "Please provide a fetch implementation via the `fetch` config option."
      );
    }

    if (config.apiKey) {
      this.authHeader = `Bearer ${config.apiKey}`;
    } else if (config.token) {
      this.authHeader = `Bearer ${config.token}`;
    }
  }

  /** Update the auth token at runtime (e.g. after login) */
  setToken(token: string): void {
    this.authHeader = `Bearer ${token}`;
  }

  /** Clear authentication */
  clearAuth(): void {
    this.authHeader = null;
  }

  /**
   * Execute an authenticated HTTP request with automatic retries.
   */
  async request<T>(
    method: HttpMethod,
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, string | number | boolean | undefined | null>;
      skipAuth?: boolean;
    } = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (!options.skipAuth && this.authHeader) {
      headers["Authorization"] = this.authHeader;
    }

    const bodyString =
      options.body !== undefined ? JSON.stringify(options.body) : undefined;

    let lastError: MainlayerError | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 200ms, 400ms, 800ms…
        await sleep(200 * 2 ** (attempt - 1));
      }

      let response: Response;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        response = await this.fetchImpl(url.toString(), {
          method,
          headers,
          body: bodyString,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Network request failed";
        lastError = new MainlayerError(message, 0, null);

        // Only retry on network errors, not AbortErrors from timeout
        if (err instanceof Error && err.name === "AbortError") {
          throw new MainlayerError(
            `Request timed out after ${this.timeout}ms`,
            408,
            null
          );
        }
        if (attempt < this.maxRetries) continue;
        throw lastError;
      }

      if (response.ok) {
        // 204 No Content
        if (response.status === 204) {
          return undefined as T;
        }
        try {
          return (await response.json()) as T;
        } catch {
          return undefined as T;
        }
      }

      // Parse error body
      let errorBody: MainlayerErrorResponse = {};
      try {
        errorBody = await response.json();
      } catch {
        // ignore parse failure
      }

      const message = extractErrorMessage(errorBody, response.status);
      lastError = new MainlayerError(message, response.status, errorBody);

      if (RETRYABLE_STATUSES.has(response.status) && attempt < this.maxRetries) {
        continue;
      }

      throw lastError;
    }

    throw lastError!;
  }

  /** Convenience GET */
  get<T>(
    path: string,
    query?: Record<string, string | number | boolean | undefined | null>
  ): Promise<T> {
    return this.request<T>("GET", path, { query });
  }

  /** Convenience POST */
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, { body });
  }

  /** Convenience PUT */
  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, { body });
  }

  /** Convenience PATCH */
  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, { body });
  }

  /** Convenience DELETE */
  delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractErrorMessage(
  body: MainlayerErrorResponse,
  status: number
): string {
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail)) {
    return body.detail.map((d) => d.msg).join(", ");
  }
  if (typeof body.message === "string") return body.message;
  if (typeof body.error === "string") return body.error;
  return `HTTP ${status} error`;
}
