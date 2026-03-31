import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  // Ensure it works in all environments (Node, Bun, Deno, browser)
  platform: "neutral",
  target: "es2020",
});
