/**
 * Example: Create a paid API resource with pricing plans and webhooks.
 *
 * Run with: ML_API_KEY=ml_... npx tsx examples/create-resource.ts
 */

import Mainlayer from "../src/index.js";

const client = new Mainlayer({ apiKey: process.env["ML_API_KEY"] });

async function main() {
  // 1. Create the resource
  console.log("Creating resource...");
  const resource = await client.resources.create({
    slug: "image-upscaler-v2",
    type: "api",
    price_usdc: 0.05,
    fee_model: "pay_per_call",
    description: "Upscale images 4x with AI — up to 4K output",
    callback_url: "https://myapp.example.com/mainlayer/callback",
    quota_calls: 1,
    discoverable: true,
  });
  console.log(`Resource created: ${resource.id} (slug: ${resource.slug})`);

  // 2. Add a subscription plan as an alternative pricing option
  const plan = await client.plans.create(resource.id, {
    name: "Monthly Pro — 10,000 calls",
    price_usdc: 29.00,
    duration_seconds: 30 * 24 * 60 * 60, // 30 days
    active: true,
  });
  console.log(`Plan created: ${plan.id} — ${plan.name} @ $${plan.price_usdc}`);

  // 3. Register a webhook to receive payment notifications
  const webhook = await client.webhooks.create({
    url: "https://myapp.example.com/webhooks/mainlayer",
    events: ["payment.completed", "entitlement.granted"],
    resource_id: resource.id,
  });
  console.log(`Webhook registered: ${webhook.id} → ${webhook.url}`);

  // 4. Create a launch discount coupon
  const coupon = await client.coupons.create({
    code: "LAUNCH50",
    discount_type: "percentage",
    discount_value: 50,
    resource_ids: [resource.id],
    max_uses: 100,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  console.log(`Coupon created: ${coupon.code} (${coupon.discount_value}% off)`);

  console.log("\nAll done! Resource is live and ready to accept payments.");
  console.log(`Public resource ID: ${resource.id}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
