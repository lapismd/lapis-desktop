import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve, sep, extname } from "node:path";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

/** Direct encoded HTTP fixture; never forwards a decoded Fetch response. */
export async function compressedRenderer() {
  const directory = resolve(".local/native-test/ui");
  const html = readFileSync(resolve(directory, "index.html"));
  const records = new Map();
  const origin = "http://127.0.0.1:1431";
  const server = createServer((request, response) => {
    try {
      const pathname = new URL(request.url, origin).pathname;
      const relative = decodeURIComponent(
        pathname === "/" ? "/index.html" : pathname,
      );
      const path = resolve(directory, `.${relative}`);
      if (!path.startsWith(directory + sep))
        throw new Error("Outside renderer");
      const body = readFileSync(path);
      const encoded = gzipSync(body);
      const status = extname(path) === ".html" ? 201 : 200;
      const headers = {
        "Content-Type": types[extname(path)] ?? "application/octet-stream",
        "Content-Encoding": "gzip",
        "Content-Length": String(encoded.length),
        "Cache-Control": "no-store",
        ETag: `"${createHash("sha256").update(body).digest("hex")}"`,
      };
      records.set(pathname, { status, headers, decodedLength: body.length });
      response.writeHead(status, headers);
      response.end(request.method === "HEAD" ? undefined : encoded);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end("Renderer fixture unavailable");
    }
  });
  await new Promise((done, fail) => {
    server.once("error", fail);
    server.listen(1431, "127.0.0.1", done);
  });
  return {
    origin,
    html,
    records,
    async close() {
      server.closeAllConnections();
      await new Promise((done, fail) =>
        server.close((error) => (error ? fail(error) : done())),
      );
    },
  };
}
