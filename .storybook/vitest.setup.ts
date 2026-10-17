import * as a11y from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/svelte-vite";
import { afterAll, beforeAll } from "vitest";
import * as preview from "./preview";

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
