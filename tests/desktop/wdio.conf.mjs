import { resolve } from "node:path";

export const config = {
  runner: "local",
  specs: ["./shell.spec.mjs", "./vault.spec.mjs", "./database.spec.mjs"],
  maxInstances: 1,
  logLevel: "warn",
  outputDir: process.env.LAPIS_DESKTOP_ACCEPTANCE_ROOT,
  services: [
    [
      "@wdio/tauri-service",
      {
        driverProvider: "embedded",
        captureBackendLogs: false,
        captureFrontendLogs: false,
      },
    ],
  ],
  capabilities: [
    {
      browserName: "tauri",
      "tauri:options": {
        application: resolve("src-tauri/target/debug/lapis-desktop"),
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
