import type { StorybookConfig } from "@storybook/svelte-vite";
import { mergeConfig } from "vite";
import catalog from "../vite.catalog.config.ts";

const config: StorybookConfig = {
  stories: ["../catalog/**/*.mdx", "../catalog/**/*.stories.ts"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/svelte-vite",
    options: { builder: { viteConfigPath: "vite.catalog.config.ts" } },
  },
  viteFinal(config) {
    return mergeConfig(config, {
      server: { host: "127.0.0.1", watch: catalog.server?.watch },
    });
  },
};
export default config;
