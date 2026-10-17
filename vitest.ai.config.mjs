import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "desktop-ai-policy",
    environment: "node",
    include: ["tests/ai/**/*.test.ts"],
    setupFiles: ["tests/ai/setup.ts"],
    fileParallelism: false,
    server: { deps: { inline: [/@lapis-notes\/(?:api|ui)/] } },
  },
});
