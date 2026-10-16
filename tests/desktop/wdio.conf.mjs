import { resolve } from "node:path";
import { acceptanceBinary } from "../../scripts/native-acceptance-binary.mjs";

export const config = {
  runner: "local",
  specs: [
    "./shell.spec.mjs",
    "./vault.spec.mjs",
    "./database.spec.mjs",
    "./notes.spec.mjs",
  ],
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
          resolve("src-tauri/target/debug/lapis-desktop"),
        ),
      },
    },
  ],
  framework: "mocha",
  reporters: ["spec"],
  waitforTimeout: 15000,
  connectionRetryTimeout: 30000,
  connectionRetryCount: 0,
  mochaOpts: { timeout: 45000 },
};
