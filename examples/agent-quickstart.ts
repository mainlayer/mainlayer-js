/**
 * Example: AI agent quickstart — monetize your agent's capabilities.
 *
 * This example shows how an AI agent can:
 *   1. Publish a paid capability as a Mainlayer resource
 *   2. Gate access based on payment status
 *   3. Report analytics
 *
 * Run with: ML_API_KEY=ml_... npx tsx examples/agent-quickstart.ts
 */

import Mainlayer, { MainlayerError } from "../src/index.js";

const mainlayer = new Mainlayer({ apiKey: process.env["ML_API_KEY"] });

// ─── Step 1: Publish a paid agent capability ──────────────────────────────────

async function publishCapability() {
  console.log("Publishing agent capability...");
  const resource = await mainlayer.resources.create({
    slug: "document-summarizer",
    type: "api",
    price_usdc: 0.02,        // $0.02 per call
    fee_model: "pay_per_call",
    description: "Summarize any document in seconds using advanced AI",
    discoverable: true,
    quota_calls: 1,
  });
  console.log(`Capability published: ${resource.slug} (ID: ${resource.id})`);
  return resource;
}

// ─── Step 2: Gate a request behind payment check ─────────────────────────────

async function handleRequest(resourceId: string, callerWallet: string, document: string) {
  // Check entitlement before doing any work
  const { has_access } = await mainlayer.entitlements.check({
    resource_id: resourceId,
    payer_wallet: callerWallet,
  });

  if (!has_access) {
    console.log(`Access denied for wallet ${callerWallet}.`);
    console.log(`Prompt them to pay at: https://mainlayer.fr/pay/${resourceId}`);
    return { error: "payment_required", resource_id: resourceId };
  }

  // Access confirmed — process the request
  console.log(`Access confirmed for ${callerWallet}. Processing...`);
  const summary = `[Simulated summary of: "${document.slice(0, 50)}..."]`;
  return { summary };
}

// ─── Step 3: Check revenue analytics ─────────────────────────────────────────

async function checkRevenue(resourceId: string) {
  const stats = await mainlayer.analytics.get({ resource_id: resourceId });
  console.log("\nRevenue snapshot:");
  console.log(`  Total payments:   ${stats.total_payments}`);
  console.log(`  Unique customers: ${stats.unique_payers}`);
  console.log(`  Total revenue:    $${stats.total_revenue_usdc.toFixed(4)}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  try {
    // Publish the capability
    const resource = await publishCapability();

    // Simulate an unpaid request
    console.log("\nSimulating request from unpaid wallet...");
    const denied = await handleRequest(resource.id, "0xUnpaidWallet", "My important document.");
    console.log("Result:", JSON.stringify(denied));

    // Check analytics (will have 0 payments in this demo)
    await checkRevenue(resource.id);

    console.log("\nQuickstart complete! Your agent is ready to accept payments.");
  } catch (err) {
    if (err instanceof MainlayerError) {
      console.error(`Mainlayer error (${err.status}): ${err.message}`);
    } else {
      throw err;
    }
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
