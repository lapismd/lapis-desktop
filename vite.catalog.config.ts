import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// The catalog owns its compiler without importing native application startup.
export default defineConfig({
  // Match the Notes catalog's supported inline component-CSS compilation path.
  plugins: [svelte({ emitCss: false })],
  server: {
    watch: {
      ignored: [
        "**/src-tauri/target/**",
        "**/.local/**",
        "**/storybook-static/**",
        "**/spec/book/**",
      ],
    },
  },
  resolve: { dedupe: ["svelte", "@lapis-notes/api", "@lapismd/design-core"] },
  optimizeDeps: {
    include: [
      "@lapismd/agent-redaction",
      "@cfworker/json-schema",
      "@storybook/addon-a11y > axe-core",
      "@lapis-notes/api > eventemitter3",
      "@lapis-notes/api > @codemirror/state",
      "@lapis-notes/api > @codemirror/view",
      "@lapis-notes/api > @codemirror/commands",
      "@lapis-notes/api > @codemirror/language",
      "@lapis-notes/api > @codemirror/lint",
      "@lapis-notes/api > @codemirror/search",
      "@lapis-notes/api > @huggingface/transformers",
      "@lapis-notes/api > @iconify-json/lucide",
      "@lapis-notes/api > @iconify/utils",
      "@lapis-notes/api > fflate",
      "@lapis-notes/api > i18next",
      "@lapis-notes/api > luxon",
      "@lapis-notes/api > minimatch",
      "@lapismd/design-core > tailwind-merge",
      "@lapismd/mira/**",
      "@lapismd/mira-plugin-mermaid > @braintree/sanitize-url",
      "@lapismd/mira-plugin-mermaid > dayjs",
      "@lapismd/mira-plugin-mermaid > fastdom",
      "@lapismd/mira-plugin-mermaid > fastdom/extensions/fastdom-promised.js",
      "@lapis-notes/ui > fuse.js",
      "@lapismd/design-core > bits-ui",
    ],
    exclude: [
      "@lapis-notes/api",
      "@lapis-notes/ui",
      "@lapis-notes/workspace",
      "@lapis-notes/file-explorer",
      "@lapis-notes/source-editor",
      "@lapis-notes/markdown",
      "@lapis-notes/search",
      "@lapis-notes/graph",
      "@lapismd/design-core",
    ],
  },
});
