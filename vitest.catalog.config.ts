import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import catalog from "./vite.catalog.config";

export default defineConfig({
  ...catalog,
  plugins: [
    ...(catalog.plugins ?? []),
    storybookTest({
      configDir: fileURLToPath(new URL(".storybook", import.meta.url)),
      initialGlobals: { colorMode: process.env.LAPIS_CATALOG_THEME ?? "light" },
    }),
  ],
  test: {
    name: "desktop-catalog",
    setupFiles: ["./.storybook/vitest.setup.ts"],
    testTimeout: 60_000,
    fileParallelism: false,
    browser: {
      fileParallelism: false,
      enabled: true,
      headless: true,
      provider: playwright({
        launchOptions: { args: ["--js-flags=--expose-gc"] },
      }),
      viewport:
        process.env.LAPIS_CATALOG_VIEWPORT === "narrow"
          ? { width: 420, height: 800 }
          : { width: 1100, height: 760 },
      instances: [{ browser: "chromium" }],
    },
  },
});
