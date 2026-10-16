import * as a11y from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/svelte-vite";
import { beforeAll } from "vitest";
import * as preview from "./preview";

const project = setProjectAnnotations([a11y, preview]);
beforeAll(project.beforeAll);
