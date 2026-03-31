/**
 * Example: Check access and execute a payment for a resource.
 *
 * Run with: ML_API_KEY=ml_... npx tsx examples/pay-for-resource.ts
 */

import Mainlayer, { MainlayerError } from "../src/index.js";

const client = new Mainlayer({ apiKey: process.env["ML_API_KEY"] });

// Replace these with real values
const RESOURCE_ID = "res_abc123";
const PAYER_WALLET = "0xYourWalletAddress";

async function main() {
  // 1. Check if the wallet already has access before charging
  console.log("Checking existing entitlement...");
  const { has_access, entitlement } = await client.entitlements.check({
    resource_id: RESOURCE_ID,
    payer_wallet: PAYER_WALLET,
  });

  if (has_access) {
    console.log("Wallet already has access!");
    if (entitlement?.expires_at) {
      console.log(`  Expires: ${entitlement.expires_at}`);
    }
    if (entitlement?.calls_remaining !== undefined) {
      console.log(`  Calls remaining: ${entitlement.calls_remaining}`);
    }
    return;
  }

  // 2. No active entitlement — execute a payment
  console.log("No active entitlement. Executing payment...");
  try {
    const payment = await client.payments.create({
      resource_id: RESOURCE_ID,
      payer_wallet: PAYER_WALLET,
    });
    console.log(`Payment executed!`);
    console.log(`  Payment ID: ${payment.id}`);
    console.log(`  Amount:     $${payment.amount_usdc}`);
    console.log(`  Status:     ${payment.status}`);
  } catch (err) {
    if (err instanceof MainlayerError) {
      console.error(`Payment failed (HTTP ${err.status}): ${err.message}`);
    } else {
      throw err;
    }
  }

  // 3. Verify access is now granted
  const check = await client.entitlements.check({
    resource_id: RESOURCE_ID,
    payer_wallet: PAYER_WALLET,
  });
  console.log(`\nAccess granted: ${check.has_access}`);
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
