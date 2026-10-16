import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";

const catalogRoots = ["./catalog/", "./.storybook/"].map((directory) =>
  fileURLToPath(new URL(directory, import.meta.url)),
);

export default defineConfig(({ mode }) => ({
  plugins: [
    svelte(),
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
  resolve: { dedupe: ["svelte", "@lapis-notes/api", "@lapismd/design-core"] },
  server: { host: "127.0.0.1", port: 1431, strictPort: true },
  clearScreen: false,
  build: { target: "safari16" },
}));
