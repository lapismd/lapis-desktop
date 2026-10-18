import { fileURLToPath } from "node:url";
import { parseOptions, runStorybook } from "./storybook-runtime.mjs";

try {
  if (!["darwin", "linux"].includes(process.platform))
    throw new Error("Preview maintenance requires macOS/Linux ps and lsof");
  const root = fileURLToPath(new URL("../", import.meta.url));
  console.log(
    JSON.stringify(
      await runStorybook(root, parseOptions(process.argv.slice(2))),
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
