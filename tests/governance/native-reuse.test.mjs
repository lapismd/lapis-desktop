import assert from "node:assert/strict";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import {
  httpAcceptancePath,
  prepareHttpAcceptanceBinary,
} from "../../scripts/http-acceptance.mjs";
import { nativeWdioSpecPath } from "../../scripts/native-wdio-reports.mjs";

const instrumented =
  "TAURI_WEBDRIVER_PORT LAPIS_DESKTOP_ACCEPTANCE_ROOT development binary";

test("WDIO report identity accepts exact paths and file URLs", () => {
  const path = "/tmp/native acceptance/shell.spec.mjs";
  assert.equal(nativeWdioSpecPath(path), path);
  assert.equal(
    nativeWdioSpecPath("file:///tmp/native%20acceptance/shell.spec.mjs"),
    path,
  );
});

test("HTTP acceptance prepares once and verified consumers never compile", async () => {
  const root = mkdtempSync(join(tmpdir(), "http-acceptance-"));
  try {
    mkdirSync(join(root, "src-tauri/target/debug"), { recursive: true });
    writeFileSync(
      join(root, "src-tauri/tauri.e2e.conf.json"),
      JSON.stringify({ productName: "Acceptance" }),
    );
    const built = join(root, "src-tauri/target/debug/lapis-desktop");
    let builds = 0;
    const prepared = await prepareHttpAcceptanceBinary(
      async (command, args, environment) => {
        builds++;
        assert.equal(command, "cargo");
        assert.deepEqual(args, [
          "build",
          "--manifest-path",
          "src-tauri/Cargo.toml",
          "--locked",
          "--features",
          "e2e",
        ]);
        assert.equal(environment.CARGO_BUILD_JOBS, "2");
        assert.equal(
          environment.TAURI_CONFIG,
          JSON.stringify({ productName: "Acceptance" }),
        );
        writeFileSync(built, instrumented);
        chmodSync(built, 0o755);
      },
      { root, environment: {} },
    );
    assert.equal(prepared, join(root, httpAcceptancePath));
    assert.equal(readFileSync(prepared, "utf8"), instrumented);
    assert.equal(builds, 1);
    const reused = await prepareHttpAcceptanceBinary(
      async () => assert.fail("Verified reuse must not compile"),
      {
        root,
        environment: { LAPIS_DESKTOP_HTTP_ACCEPTANCE_BINARY: prepared },
      },
    );
    assert.equal(reused, prepared);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
