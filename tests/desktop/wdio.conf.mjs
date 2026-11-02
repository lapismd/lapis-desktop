import { focusNativeWindow } from "./native-visibility.mjs";
import { browser } from "@wdio/globals";
import { resolve } from "node:path";
import {
  appendFileSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { acceptanceBinary } from "../../scripts/native-acceptance-binary.mjs";
import { nativeInventory } from "../../scripts/native-families.mjs";

const specFiles = nativeInventory.files
  .filter((entry) => entry.mode === "wdio")
  .map((entry) => entry.file);
const countsPath = process.env.LAPIS_DESKTOP_NATIVE_COUNTS;
const record = (value) => {
  if (countsPath)
    appendFileSync(countsPath + ".jsonl", JSON.stringify(value) + "\n");
};

export const config = {
  runner: "local",
  specs: specFiles.map((file) => resolve(file)),
  maxInstances: 1,
  logLevel: "warn",
  outputDir: process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT,
  services: [
    [
      "@wdio/tauri-service",
      {
        driverProvider: "embedded",
        captureBackendLogs: false,
        captureFrontendLogs: true,
      },
    ],
  ],
  capabilities: [
    {
      browserName: "tauri",
      "tauri:options": {
        application: acceptanceBinary(
          process.env.LAPIS_DESKTOP_ACCEPTANCE_BINARY ??
            resolve(
              "src-tauri/target/debug/bundle/macos/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop",
            ),
        ),
      },
    },
  ],
  async beforeTest() {
    await focusNativeWindow(browser);
  },
  afterTest(test, _context, result) {
    record({
      kind: "case",
      title: test.title,
      passed: result.passed,
      duration: result.duration,
    });
  },
  after(result, _capabilities, specs) {
    record({ kind: "spec", result, specs: specs.map((file) => resolve(file)) });
  },
  onComplete(exitCode, _configuration, _capabilities, results) {
    if (!countsPath) return;
    const events = existsSync(countsPath + ".jsonl")
      ? readFileSync(countsPath + ".jsonl", "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line))
      : [];
    const cases = events.filter((event) => event.kind === "case");
    const specs = events
      .filter((event) => event.kind === "spec")
      .flatMap((event) => event.specs);
    const counts = {
      tests: cases.length,
      passed: cases.filter((event) => event.passed).length,
      failed: cases.filter((event) => !event.passed).length,
      cancelled: exitCode && !cases.length ? 1 : 0,
      skipped: 0,
      todo: 0,
      specFiles: specs,
      retries: results.retries,
    };
    writeFileSync(countsPath, JSON.stringify(counts) + "\n");
    if (
      exitCode !== 0 ||
      !cases.length ||
      counts.failed ||
      results.retries ||
      JSON.stringify([...specs].sort()) !==
        JSON.stringify(specFiles.map((file) => resolve(file)).sort())
    )
      throw Error(
        "Native WDIO execution was failed, incomplete, empty or retried",
      );
  },
  framework: "mocha",
  reporters: ["spec"],
  waitforTimeout: 15000,
  connectionRetryTimeout: 30000,
  connectionRetryCount: 0,
  mochaOpts: { timeout: 45000 },
};
