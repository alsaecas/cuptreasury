import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "src/domain/treasury/**/*.ts",
        "src/lib/wdk/guarded/**/*.ts",
      ],
      thresholds: {
        "src/domain/treasury/**/*.ts": {
          branches: 65,
          functions: 85,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
