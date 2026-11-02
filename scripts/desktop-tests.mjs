import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "./desktop-acceptance.mjs";
import { parseAcceptanceArgs } from "./native-families.mjs";
import { nativeBuildEnvironment } from "./native-build-environment.mjs";

/** Quiet checks are distinct from the complete native window/OS gate. */
export async function runDesktopTests(args, execute = run) {
  const flags = args.filter((argument) => argument !== "--");
  const headed = flags[0] === "--headed";
  if (
    (!headed &&
      (flags.length > 1 || (flags.length && flags[0] !== "--headless"))) ||
    (headed &&
      flags.slice(1).some((flag) => ["--headed", "--headless"].includes(flag)))
  )
    throw new Error("Choose one desktop mode: --headless or --headed.");
  const nativeOptions = headed ? flags.slice(1) : [];
  if (nativeOptions.length) parseAcceptanceArgs(nativeOptions);
  const environment = {
    ...nativeBuildEnvironment(),
    CARGO_BUILD_JOBS: "2",
  };
  if (headed) {
    console.log(
      "Headed desktop acceptance: actual native WebView and OS actions.",
    );
    await execute(
      process.execPath,
      ["scripts/desktop-acceptance.mjs", ...nativeOptions],
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
