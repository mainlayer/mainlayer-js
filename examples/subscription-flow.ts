/**
 * Example: Create a subscription resource with pricing plans.
 *
 * Demonstrates creating a subscription-based resource, adding pricing plans,
 * retrieving the webhook signing secret, and listing active subscriptions.
 *
 * Run with: ML_API_KEY=ml_... npx tsx examples/subscription-flow.ts
 */

import Mainlayer, { MainlayerError } from "../src/index.js";

const client = new Mainlayer({ apiKey: process.env["ML_API_KEY"] });

async function main() {
  // ── Step 1: Create a subscription resource ─────────────────────────────────
  console.log("Step 1: Creating subscription resource...");
  const resource = await client.resources.create({
    slug: "pro-data-api",
    type: "api",
    price_usdc: 0.0, // Pricing is controlled by plans
    fee_model: "subscription",
    description: "Real-time data enrichment API with tiered subscription plans",
    callback_url: "https://myapp.example.com/mainlayer/callback",
    discoverable: true,
  });
  console.log("  Resource created:", resource.id);

  // ── Step 2: Activate the resource ─────────────────────────────────────────
  console.log("\nStep 2: Activating resource...");
  const activation = await client.resources.activate(resource.id);
  console.log("  Active:", activation.active);

  // ── Step 3: Add pricing plans ─────────────────────────────────────────────
  console.log("\nStep 3: Creating pricing plans...");

  const starterPlan = await client.plans.create(resource.id, {
    name: "starter",
    price_usdc: 9.99,
    fee_model: "subscription",
    duration_seconds: 30 * 24 * 60 * 60, // 30 days
    max_calls_per_day: 1000,
  });
  console.log(`  Plan: ${starterPlan.name} — $${starterPlan.price_usdc}/month`);

  const proPlan = await client.plans.create(resource.id, {
    name: "pro",
    price_usdc: 49.99,
    fee_model: "subscription",
    duration_seconds: 30 * 24 * 60 * 60, // 30 days
    max_calls_per_day: 10000,
  });
  console.log(`  Plan: ${proPlan.name} — $${proPlan.price_usdc}/month`);

  const enterprisePlan = await client.plans.create(resource.id, {
    name: "enterprise",
    price_usdc: 199.99,
    fee_model: "subscription",
    duration_seconds: 365 * 24 * 60 * 60, // 1 year
    max_calls_per_day: 100000,
  });
  console.log(`  Plan: ${enterprisePlan.name} — $${enterprisePlan.price_usdc}/year`);

  // ── Step 4: Update a plan's price ─────────────────────────────────────────
  console.log("\nStep 4: Updating starter plan price...");
  await client.plans.update(resource.id, "starter", { price_usdc: 7.99 });
  console.log("  Starter plan updated to $7.99/month");

  // ── Step 5: Register a webhook for subscription events ───────────────────
  console.log("\nStep 5: Registering webhook...");
  const webhook = await client.webhooks.create({
    url: "https://myapp.example.com/webhooks/mainlayer",
    events: [
      "subscription.created",
      "subscription.cancelled",
      "payment.completed",
    ],
    resource_id: resource.id,
  });
  console.log("  Webhook registered:", webhook.id);

  // ── Step 6: Retrieve webhook signing secret ────────────────────────────────
  console.log("\nStep 6: Fetching webhook signing secret...");
  const { webhook_secret } = await client.resources.getWebhookSecret(resource.id);
  console.log("  Webhook secret prefix:", webhook_secret.slice(0, 12) + "...");
  console.log("  Use this secret to verify incoming webhook payloads.");

  // ── Step 7: List current subscriptions ────────────────────────────────────
  console.log("\nStep 7: Listing subscriptions...");
  const subscriptions = await client.subscriptions.list();
  console.log(`  Active subscriptions: ${subscriptions.length}`);

  // ── Step 8: List all plans to confirm ────────────────────────────────────
  const plans = await client.plans.list(resource.id);
  console.log(`\nResource ${resource.id} has ${plans.length} pricing plans:`);
  for (const plan of plans) {
    console.log(`  - ${plan.name}: $${plan.price_usdc}`);
  }

  console.log("\nSubscription resource setup complete!");
  console.log(`  Dashboard: https://dashboard.mainlayer.fr`);
}

main().catch((err) => {
  if (err instanceof MainlayerError) {
    console.error(`Mainlayer API error (HTTP ${err.status}): ${err.message}`);
  } else {
    console.error("Unexpected error:", err);
  }
  process.exit(1);
});
