/**
 * Example: Full vendor onboarding flow.
 *
 * Demonstrates registering an account, logging in, completing vendor
 * registration with a wallet, and creating your first resource.
 *
 * Run with: npx tsx examples/vendor-onboarding.ts
 */

import Mainlayer, { MainlayerError } from "../src/index.js";

const client = new Mainlayer();

async function main() {
  // ── Step 1: Create an account ──────────────────────────────────────────────
  console.log("Step 1: Registering account...");
  await client.auth.register({
    email: "vendor@example.com",
    password: "supersecret123!",
  });
  console.log("  Account created.");

  // ── Step 2: Log in — token is stored automatically ─────────────────────────
  console.log("\nStep 2: Logging in...");
  const { access_token } = await client.auth.login({
    email: "vendor@example.com",
    password: "supersecret123!",
  });
  console.log("  Logged in. Token prefix:", access_token.slice(0, 20) + "...");

  // ── Step 3: Complete vendor registration with a wallet ─────────────────────
  // In a real integration, obtain the nonce from your UI and have the user
  // sign a standard message with their wallet before calling this.
  console.log("\nStep 3: Completing vendor registration...");
  const vendor = await client.vendor.register({
    wallet_address: "0xYourWalletAddress",
    nonce: "random-nonce-from-server",
    signed_message: "0xSignedRegistrationMessage",
  });
  console.log("  Vendor ID:", vendor.vendor_id);
  console.log("  API Key:  ", vendor.api_key, " <-- store securely");
  if (vendor.next_step) {
    console.log("  Next step:", vendor.next_step);
  }

  // ── Step 4: Update vendor profile ─────────────────────────────────────────
  console.log("\nStep 4: Updating vendor profile...");
  await client.vendor.update({
    name: "Acme AI Tools",
    website: "https://acme.example.com",
    description: "Best-in-class AI APIs for developers",
  });
  console.log("  Profile updated.");

  // ── Step 5: Create an API key for programmatic access ─────────────────────
  console.log("\nStep 5: Creating API key...");
  const { key, id, name } = await client.apiKeys.create({ name: "production" });
  console.log(`  API Key created!`);
  console.log(`    ID:   ${id}`);
  console.log(`    Name: ${name}`);
  console.log(`    Key:  ${key}  <-- store securely, shown only once`);

  // ── Step 6: Create and activate first resource ────────────────────────────
  console.log("\nStep 6: Creating first resource...");
  const resource = await client.resources.create({
    slug: "my-inference-api",
    type: "api",
    price_usdc: 0.02,
    fee_model: "pay_per_call",
    description: "Low-latency text inference — 200ms p95",
    callback_url: "https://acme.example.com/mainlayer/callback",
    quota_calls: 1,
    discoverable: true,
  });
  console.log("  Resource created:", resource.id);

  console.log("\nActivating resource...");
  const activation = await client.resources.activate(resource.id);
  console.log("  Active:", activation.active);
  if (activation.next_step) {
    console.log("  Next step:", activation.next_step);
  }

  // ── Step 7: Set per-wallet purchase limits ────────────────────────────────
  console.log("\nStep 7: Setting quota limits...");
  await client.resources.setQuota(resource.id, {
    max_purchases_per_wallet: 1000,
    max_calls_per_day_per_wallet: 100,
  });
  console.log("  Quota configured.");

  console.log("\nOnboarding complete. Your resource is live!");
  console.log(`  Dashboard: https://dashboard.mainlayer.fr`);
  console.log(`  Docs:      https://docs.mainlayer.fr`);
}

main().catch((err) => {
  if (err instanceof MainlayerError) {
    console.error(`Mainlayer API error (HTTP ${err.status}): ${err.message}`);
  } else {
    console.error("Unexpected error:", err);
  }
  process.exit(1);
});
