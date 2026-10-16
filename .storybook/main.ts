import type { StorybookConfig } from "@storybook/svelte-vite";

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
    return {
      ...config,
      server: { ...config.server, host: "127.0.0.1" },
    };
  },
};
export default config;
