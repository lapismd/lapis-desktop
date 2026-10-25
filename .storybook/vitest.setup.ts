import * as a11y from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/svelte-vite";
import { afterAll, afterEach, beforeAll } from "vitest";
import { installFatalStorybookRuntimeWarningGuard } from "../scripts/storybook-runtime-warnings.mjs";
import * as preview from "./preview";

// Register before story hooks so caught teardown diagnostics remain failures.
const runtimeGuard = installFatalStorybookRuntimeWarningGuard();
afterEach(() => runtimeGuard.assertClean());
afterAll(() => {
  try {
    runtimeGuard.assertClean();
  } finally {
    runtimeGuard.dispose();
  }
});

const project = setProjectAnnotations([a11y, preview]);
beforeAll(project.beforeAll);

// Collect discarded isolated-test graphs before Chromium loads another file.
// This is test-process resource management, separate from owned App teardown.
afterAll(() => {
  const collect = Reflect.get(globalThis, "gc");
  if (typeof collect !== "function") {
    throw new Error("Desktop catalog requires Chromium --expose-gc");
  }
  collect();
});
