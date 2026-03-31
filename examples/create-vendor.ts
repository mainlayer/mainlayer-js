/**
 * Example: Register a new vendor account and obtain an API key.
 *
 * Run with: npx tsx examples/create-vendor.ts
 */

import Mainlayer from "../src/index.js";

const client = new Mainlayer();

async function main() {
  // 1. Register a new account
  console.log("Registering vendor account...");
  await client.auth.register({
    email: "vendor@example.com",
    password: "supersecret123!",
  });
  console.log("Account registered.");

  // 2. Log in (token is stored automatically)
  console.log("Logging in...");
  const { access_token } = await client.auth.login({
    email: "vendor@example.com",
    password: "supersecret123!",
  });
  console.log("Logged in. Token:", access_token.slice(0, 20) + "...");

  // 3. Create an API key for programmatic use
  const { key, id, name } = await client.apiKeys.create({ name: "production" });
  console.log(`\nAPI Key created!`);
  console.log(`  ID:   ${id}`);
  console.log(`  Name: ${name}`);
  console.log(`  Key:  ${key}  <-- store this securely, it won't be shown again`);

  // 4. Update vendor profile
  await client.vendor.update({
    name: "Acme AI Tools",
    website: "https://acme.example.com",
    description: "Cutting-edge AI APIs for developers",
  });
  console.log("\nVendor profile updated.");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
