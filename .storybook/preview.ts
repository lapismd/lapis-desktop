import "@lapismd/repository-ui/styles.css";
import "@lapismd/agent-ui/styles.css";
import type { Preview } from "@storybook/svelte-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";
import "../src/styles/shell.css";
import "../src/styles/notes-workspace.css";
import "../src/styles/window-chrome.css";
import "./preview.css";

const preview: Preview = {
  globalTypes: {
    colorMode: {
      description: "Desktop appearance",
      toolbar: { icon: "circlehollow", items: ["light", "dark"] },
    },
  },
  initialGlobals: { colorMode: "light" },
  decorators: [
    withThemeByDataAttribute({
      themes: { lapis: "lapis" },
      defaultTheme: "lapis",
      attributeName: "data-ui-theme",
    }),
    (story, context) => {
      document.documentElement.classList.toggle(
        "dark",
        context.globals.colorMode === "dark",
      );
      return story();
    },
  ],
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    controls: { expanded: true },
  },
};
export default preview;
