import { defineConfig } from "vitest/config";
import { readFileSync, existsSync } from "fs";

// Load .env.test
const envTestPath = ".env.test";
if (existsSync(envTestPath)) {
  const content = readFileSync(envTestPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.+)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

export default defineConfig({
  test: {
    include: ["src/__tests__/integration/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 15_000,
    sequence: { concurrent: false },
  },
});
