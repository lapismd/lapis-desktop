import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { createServer } from "vite";

async function until(predicate) {
  const deadline = Date.now() + 5000;
  while (!predicate()) {
    if (Date.now() >= deadline)
      throw new Error("Vite did not observe the source HTML change");
    await delay(30);
  }
}

test(
  "development HMR observes source HTML without reloading for generated output",
  { timeout: 20000 },
  async () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "lapis-dev-watch-")));
    const generated = [
      "spec/book/page.html",
      "spec/.generated/page.html",
      ".local/preview/page.html",
      "src-tauri/target/page.html",
      "storybook-static/page.html",
    ];
    for (const path of ["control.html", ...generated]) {
      const file = join(root, path);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, "<!doctype html><html><body>Fixture</body></html>");
    }
    const server = await createServer({
      configFile: join(process.cwd(), "vite.config.ts"),
      root,
      cacheDir: join(root, "node_modules/.vite"),
      optimizeDeps: { noDiscovery: true, include: [], entries: [] },
      server: { host: "127.0.0.1", port: 0, strictPort: false },
      logLevel: "silent",
    });
    try {
      const messages = [];
      const send = server.ws.send.bind(server.ws);
      server.ws.send = (...args) => {
        messages.push(args[0]);
        return send(...args);
      };
      await server.listen();
      // A live source change proves the actual filesystem watcher is ready.
      for (
        let attempt = 0;
        !messages.some((message) => message?.type === "full-reload");
        attempt++
      ) {
        assert.ok(attempt < 30, "The source watcher must remain enabled");
        appendFileSync(join(root, "control.html"), "\n");
        await delay(80);
      }
      messages.length = 0;
      for (const path of generated)
        appendFileSync(join(root, path), "\nGenerated update");
      await delay(300);
      appendFileSync(join(root, "control.html"), "\nSource update");
      await until(() =>
        messages.some(
          (message) =>
            message?.type === "full-reload" &&
            message.path?.endsWith("control.html"),
        ),
      );
      await delay(100);
      assert.deepEqual(
        messages.filter(
          (message) =>
            message?.type === "full-reload" &&
            !message.path?.endsWith("control.html"),
        ),
        [],
      );
    } finally {
      await server.close();
      rmSync(root, { recursive: true, force: true });
    }
  },
);
