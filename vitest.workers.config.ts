import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
export default defineConfig({
  test: {
    name: "desktop-background-workers",
    include: ["tests/workers/**/*.test.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
});
