import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import {
  pluginHostInputs,
  pluginHostModules,
} from "./scripts/plugin-host-modules.ts";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const catalogRoots = ["./catalog/", "./.storybook/"].map((directory) =>
  fileURLToPath(new URL(directory, import.meta.url)),
);

export default defineConfig(({ mode }) => ({
  define:
    mode === "native-test"
      ? {
          __LAPIS_DISTRIBUTION_FIXTURE__: readFileSync(
            new URL("./.local/native-install/public.json", import.meta.url),
            "utf8",
          ),
        }
      : {},
  plugins: [
    svelte(),
    pluginHostModules(),
    {
      name: "production-catalog-boundary",
      generateBundle() {
        for (const id of this.getModuleIds()) {
          if (catalogRoots.some((root) => id.includes(root)))
            this.error(`Catalog module cannot enter the desktop app: ${id}`);
        }
      },
    },
    ...(mode === "native-test"
      ? [
          {
            name: "native-acceptance-entry",
            transformIndexHtml: {
              order: "pre" as const,
              handler: (html: string) => {
                if (!html.includes('src="/src/main.ts"'))
                  throw new Error(
                    "Native acceptance requires the production entry declaration",
                  );
                return html.replace(
                  'src="/src/main.ts"',
                  'src="/tests/desktop/entry.ts"',
                );
              },
            },
          },
        ]
      : []),
  ],
  resolve: {
    dedupe: [
      "svelte",
      "@lapis-notes/api",
      "@lapismd/design-core",
      "@codemirror/autocomplete",
      "@codemirror/commands",
      "@codemirror/language",
      "@codemirror/lint",
      "@codemirror/search",
      "@codemirror/state",
      "@codemirror/view",
      "@lezer/common",
      "@lezer/highlight",
      "@lezer/lr",
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 1431,
    strictPort: true,
    watch: {
      ignored: [
        "**/.jj/**",
        "**/.local/**",
        "**/src-tauri/target/**",
        "**/spec/book/**",
        "**/spec/.generated/**",
        "**/storybook-static/**",
      ],
    },
  },
  clearScreen: false,
  build: {
    target: "safari16",
    rollupOptions: {
      preserveEntrySignatures: "strict",
      input: {
        index: fileURLToPath(new URL("./index.html", import.meta.url)),
        ...pluginHostInputs,
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name.startsWith("plugin-host-")
            ? "[name].js"
            : "assets/[name]-[hash].js",
      },
    },
  },
}));
