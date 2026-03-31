import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Mainlayer, { MainlayerError } from "../src/index.js";

// ─── Mock fetch factory ────────────────────────────────────────────────────────

function mockFetch(
  status: number,
  body: unknown,
  opts: { delay?: number } = {}
): typeof fetch {
  return vi.fn().mockImplementation(async () => {
    if (opts.delay) {
      await new Promise((r) => setTimeout(r, opts.delay));
    }
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
}

function mockFetchSequence(responses: Array<{ status: number; body: unknown }>): typeof fetch {
  let callCount = 0;
  return vi.fn().mockImplementation(async () => {
    const response = responses[callCount] ?? responses[responses.length - 1]!;
    callCount++;
    return new Response(JSON.stringify(response!.body), {
      status: response!.status,
      headers: { "Content-Type": "application/json" },
    });
  });
}

// ─── Client construction ──────────────────────────────────────────────────────

describe("Mainlayer constructor", () => {
  it("creates a client with an API key", () => {
    const client = new Mainlayer({ apiKey: "ml_test_key", fetch: mockFetch(200, {}) });
    expect(client).toBeTruthy();
    expect(client.resources).toBeTruthy();
    expect(client.payments).toBeTruthy();
    expect(client.analytics).toBeTruthy();
  });

  it("exposes all resource namespaces", () => {
    const client = new Mainlayer({ apiKey: "ml_test", fetch: mockFetch(200, {}) });
    const namespaces = [
      "auth", "apiKeys", "resources", "discover",
      "payments", "entitlements", "plans", "subscriptions",
      "analytics", "vendor", "webhooks", "coupons", "invoices",
    ] as const;
    for (const ns of namespaces) {
      expect(client[ns]).toBeTruthy();
    }
  });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe("auth", () => {
  it("login stores the token automatically", async () => {
    const fetchMock = vi.fn()
      // First call: login
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "tok_abc", token_type: "bearer" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      // Second call: resources.list (should have Authorization header)
      .mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const client = new Mainlayer({ fetch: fetchMock as unknown as typeof fetch });
    const token = await client.auth.login({ email: "a@b.com", password: "pass" });

    expect(token.access_token).toBe("tok_abc");

    // Trigger a request that requires auth
    await client.resources.list();

    const secondCall = fetchMock.mock.calls[1] as [string, RequestInit];
    const headers = secondCall[1]?.headers as Record<string, string>;
    expect(headers?.["Authorization"]).toBe("Bearer tok_abc");
  });

  it("register does not attach auth header", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "vendor_1" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );
    const client = new Mainlayer({ fetch: fetchMock as unknown as typeof fetch });
    await client.auth.register({ email: "a@b.com", password: "pass" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers?.["Authorization"]).toBeUndefined();
  });
});

// ─── Resources ────────────────────────────────────────────────────────────────

describe("resources", () => {
  it("list sends GET /resources", async () => {
    const fetchMock = mockFetch(200, [{ id: "r1", slug: "my-api" }]);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    const result = await client.resources.list();

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("r1");
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/resources");
    expect(url).not.toContain("/resources/");
  });

  it("create sends POST /resources with body", async () => {
    const created = { id: "r2", slug: "my-api", type: "api" };
    const fetchMock = mockFetch(201, created);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    const result = await client.resources.create({
      slug: "my-api",
      type: "api",
      price_usdc: 0.1,
      fee_model: "pay_per_call",
    });

    expect(result.id).toBe("r2");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.slug).toBe("my-api");
    expect(body.fee_model).toBe("pay_per_call");
  });

  it("update sends PATCH /resources/:id", async () => {
    const fetchMock = mockFetch(200, { id: "r1", price_usdc: 0.5 });
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await client.resources.update("r1", { price_usdc: 0.5 });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/resources/r1");
    expect(init.method).toBe("PATCH");
  });

  it("delete sends DELETE /resources/:id", async () => {
    const fetchMock = mockFetch(200, {});
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await client.resources.delete("r1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/resources/r1");
    expect(init.method).toBe("DELETE");
  });

  it("getPublic skips auth header", async () => {
    const fetchMock = mockFetch(200, { id: "r1", slug: "pub" });
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await client.resources.getPublic("r1");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers?.["Authorization"]).toBeUndefined();
  });
});

// ─── Discover ─────────────────────────────────────────────────────────────────

describe("discover", () => {
  it("search serializes query params", async () => {
    const fetchMock = mockFetch(200, []);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await client.discover.search({ q: "ai tools", type: "api", limit: 10 });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("q=ai+tools");
    expect(url).toContain("type=api");
    expect(url).toContain("limit=10");
  });
});

// ─── Payments ─────────────────────────────────────────────────────────────────

describe("payments", () => {
  it("create sends POST /pay", async () => {
    const payment = { id: "pay_1", resource_id: "r1", payer_wallet: "0xABC" };
    const fetchMock = mockFetch(200, payment);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    const result = await client.payments.create({
      resource_id: "r1",
      payer_wallet: "0xABC",
    });

    expect(result.id).toBe("pay_1");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/pay");
    expect(init.method).toBe("POST");
  });

  it("list sends GET /payments", async () => {
    const fetchMock = mockFetch(200, []);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await client.payments.list();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/payments");
  });
});

// ─── Entitlements ─────────────────────────────────────────────────────────────

describe("entitlements", () => {
  it("check serializes query params to GET /entitlements/check", async () => {
    const fetchMock = mockFetch(200, { has_access: true });
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    const result = await client.entitlements.check({
      resource_id: "r1",
      payer_wallet: "0xABC",
    });

    expect(result.has_access).toBe(true);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/entitlements/check");
    expect(url).toContain("resource_id=r1");
    expect(url).toContain("payer_wallet=0xABC");
  });

  it("list passes optional filters", async () => {
    const fetchMock = mockFetch(200, []);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await client.entitlements.list({ resource_id: "r1" });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("resource_id=r1");
    expect(url).not.toContain("payer_wallet");
  });
});

// ─── Analytics ────────────────────────────────────────────────────────────────

describe("analytics", () => {
  it("get sends GET /analytics without params", async () => {
    const analyticsData = {
      total_revenue_usdc: 100,
      total_payments: 10,
      unique_payers: 8,
      by_resource: [],
    };
    const fetchMock = mockFetch(200, analyticsData);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    const result = await client.analytics.get();

    expect(result.total_revenue_usdc).toBe(100);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/analytics");
  });

  it("get passes date range and resource_id", async () => {
    const fetchMock = mockFetch(200, {
      total_revenue_usdc: 50,
      total_payments: 5,
      unique_payers: 4,
      by_resource: [],
    });
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await client.analytics.get({
      start_date: "2024-01-01",
      end_date: "2024-01-31",
      resource_id: "r1",
    });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("start_date=2024-01-01");
    expect(url).toContain("end_date=2024-01-31");
    expect(url).toContain("resource_id=r1");
  });
});

// ─── Plans ────────────────────────────────────────────────────────────────────

describe("plans", () => {
  it("list sends GET /resources/:id/plans", async () => {
    const fetchMock = mockFetch(200, []);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await client.plans.list("r1");

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/resources/r1/plans");
  });

  it("create sends POST /resources/:id/plans", async () => {
    const plan = { id: "plan_1", name: "Monthly" };
    const fetchMock = mockFetch(201, plan);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    const result = await client.plans.create("r1", {
      name: "Monthly",
      price_usdc: 9.99,
      duration_seconds: 2592000,
    });

    expect(result.id).toBe("plan_1");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/resources/r1/plans");
    expect(init.method).toBe("POST");
  });
});

// ─── Webhooks ─────────────────────────────────────────────────────────────────

describe("webhooks", () => {
  it("create sends POST /webhooks with events array", async () => {
    const webhook = { id: "wh_1", url: "https://example.com/hook" };
    const fetchMock = mockFetch(201, webhook);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await client.webhooks.create({
      url: "https://example.com/hook",
      events: ["payment.completed"],
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.events).toContain("payment.completed");
  });
});

// ─── Coupons ──────────────────────────────────────────────────────────────────

describe("coupons", () => {
  it("create sends POST /coupons", async () => {
    const coupon = { id: "coup_1", code: "SAVE10", uses: 0 };
    const fetchMock = mockFetch(201, coupon);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    const result = await client.coupons.create({
      code: "SAVE10",
      discount_type: "percentage",
      discount_value: 10,
    });

    expect(result.code).toBe("SAVE10");
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe("MainlayerError", () => {
  it("throws MainlayerError with status and message on 4xx", async () => {
    const fetchMock = mockFetch(404, { detail: "Resource not found" });
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await expect(client.resources.get("nonexistent")).rejects.toMatchObject({
      name: "MainlayerError",
      status: 404,
      message: "Resource not found",
    });
  });

  it("throws MainlayerError with status 401 on unauthorized", async () => {
    const fetchMock = mockFetch(401, { detail: "Not authenticated" });
    const client = new Mainlayer({ apiKey: "ml_bad_key", fetch: fetchMock });

    await expect(client.resources.list()).rejects.toMatchObject({
      name: "MainlayerError",
      status: 401,
    });
  });

  it("parses array detail error format (FastAPI validation)", async () => {
    const fetchMock = mockFetch(422, {
      detail: [{ msg: "field required", type: "missing" }],
    });
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await expect(
      client.resources.create({} as Parameters<typeof client.resources.create>[0])
    ).rejects.toMatchObject({
      status: 422,
      message: "field required",
    });
  });

  it("has correct prototype for instanceof checks", async () => {
    const fetchMock = mockFetch(500, { detail: "Server error" });
    const client = new Mainlayer({
      apiKey: "ml_key",
      fetch: fetchMock,
      maxRetries: 0,
    });

    try {
      await client.resources.list();
      expect.fail("Should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(MainlayerError);
      expect((err as MainlayerError).status).toBe(500);
    }
  });
});

// ─── Retry logic ──────────────────────────────────────────────────────────────

describe("retry logic", () => {
  it("retries on 503 and succeeds on second attempt", async () => {
    const fetchMock = mockFetchSequence([
      { status: 503, body: { detail: "Service unavailable" } },
      { status: 200, body: [{ id: "r1" }] },
    ]);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock as unknown as typeof fetch });

    const result = await client.resources.list();

    expect(result).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws after max retries exhausted", async () => {
    const fetchMock = mockFetch(503, { detail: "Still unavailable" });
    const client = new Mainlayer({
      apiKey: "ml_key",
      fetch: fetchMock,
      maxRetries: 2,
    });

    await expect(client.resources.list()).rejects.toMatchObject({
      status: 503,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("does not retry on 400 client errors", async () => {
    const fetchMock = mockFetch(400, { detail: "Bad request" });
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock, maxRetries: 3 });

    await expect(client.resources.list()).rejects.toMatchObject({ status: 400 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

// ─── Request shape ────────────────────────────────────────────────────────────

describe("request headers", () => {
  it("sends Authorization header with API key", async () => {
    const fetchMock = mockFetch(200, []);
    const client = new Mainlayer({ apiKey: "ml_mykey", fetch: fetchMock });

    await client.resources.list();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers?.["Authorization"]).toBe("Bearer ml_mykey");
  });

  it("sends Content-Type and Accept headers", async () => {
    const fetchMock = mockFetch(200, []);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await client.resources.list();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers?.["Content-Type"]).toBe("application/json");
    expect(headers?.["Accept"]).toBe("application/json");
  });
});

// ─── Subscriptions ────────────────────────────────────────────────────────────

describe("subscriptions", () => {
  it("cancel sends DELETE /subscriptions/:id", async () => {
    const fetchMock = mockFetch(200, {});
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await client.subscriptions.cancel("sub_1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/subscriptions/sub_1");
    expect(init.method).toBe("DELETE");
  });
});

// ─── Vendor ───────────────────────────────────────────────────────────────────

describe("vendor", () => {
  it("get sends GET /vendor", async () => {
    const fetchMock = mockFetch(200, { id: "v1", name: "Acme" });
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    const result = await client.vendor.get();

    expect(result.id).toBe("v1");
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/vendor");
  });
});

// ─── Invoices ─────────────────────────────────────────────────────────────────

describe("invoices", () => {
  it("list sends GET /invoices", async () => {
    const fetchMock = mockFetch(200, []);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await client.invoices.list();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("/invoices");
  });
});

// ─── Base URL ─────────────────────────────────────────────────────────────────

describe("base URL", () => {
  it("uses default base URL", async () => {
    const fetchMock = mockFetch(200, []);
    const client = new Mainlayer({ apiKey: "ml_key", fetch: fetchMock });

    await client.resources.list();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("api.mainlayer.fr");
  });

  it("respects custom base URL", async () => {
    const fetchMock = mockFetch(200, []);
    const client = new Mainlayer({
      apiKey: "ml_key",
      baseUrl: "https://sandbox.mainlayer.fr",
      fetch: fetchMock,
    });

    await client.resources.list();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("sandbox.mainlayer.fr");
  });

  it("strips trailing slash from custom base URL", async () => {
    const fetchMock = mockFetch(200, []);
    const client = new Mainlayer({
      apiKey: "ml_key",
      baseUrl: "https://sandbox.mainlayer.fr/",
      fetch: fetchMock,
    });

    await client.resources.list();

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).not.toContain("//resources");
  });
});
