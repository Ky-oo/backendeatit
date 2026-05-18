import { defineConfig } from "vitest/config";
import dotenvx from "@dotenvx/dotenvx";

dotenvx.config({ overload: false });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    env: {
      DATABASE_URL: process.env.DATABASE_URL_TEST!,
    },
    coverage: {
      provider: "v8",
      include: ["services/**/*.ts"],
      reporter: ["text", "lcov"],
    },
  },
});
