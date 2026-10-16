import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig(({ mode }) => ({
  plugins: [
    svelte(),
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
  server: { host: "127.0.0.1", port: 1431, strictPort: true },
  clearScreen: false,
  build: { target: "safari16" },
}));
