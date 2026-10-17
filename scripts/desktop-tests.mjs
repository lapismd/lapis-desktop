import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "./desktop-acceptance.mjs";

/** Quiet checks are distinct from the complete native window/OS gate. */
export async function runDesktopTests(args, execute = run) {
  const flags = args.filter((argument) => argument !== "--");
  if (
    flags.length > 1 ||
    (flags.length === 1 && !["--headless", "--headed"].includes(flags[0]))
  )
    throw new Error("Choose one desktop mode: --headless or --headed.");
  const environment = {
    ...process.env,
    MACOSX_DEPLOYMENT_TARGET: "13.0",
    CARGO_BUILD_JOBS: "2",
  };
  if (flags[0] === "--headed") {
    console.log(
      "Headed desktop acceptance: actual native WebView and OS actions.",
    );
    await execute(
      process.execPath,
      ["scripts/desktop-acceptance.mjs"],
      environment,
    );
    return;
  }
  console.log(
    "Headless desktop checks: renderer tests, native services and the complete browser catalog. No native UI is launched.",
  );
  console.log(
    "Native WebView/window/OS qualification remains separate: pnpm test:desktop:headed.",
  );
  await execute("pnpm", ["test"], environment);
  await execute("pnpm", ["test:storybook"], environment);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  runDesktopTests(process.argv.slice(2)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
