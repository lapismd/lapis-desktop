import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  test: {
    name: "desktop-ai-policy",
    environment: "node",
    include: ["tests/ai/**/*.test.ts"],
    setupFiles: ["tests/ai/setup.ts"],
    fileParallelism: false,
    server: {
      deps: {
        inline: [
          /@lapis-notes\/(?:api|ui)/,
          /@lapismd\/design-core/,
          /lucide-static/,
        ],
      },
    },
  },
});
