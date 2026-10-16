import { spawn } from "node:child_process";

for (const { viewport, theme } of [
  { viewport: "desktop", theme: "light" },
  { viewport: "narrow", theme: "light" },
  { viewport: "desktop", theme: "dark" },
  { viewport: "narrow", theme: "dark" },
]) {
  console.log(`Desktop catalog: ${viewport} viewport, ${theme} theme`);
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      "pnpm",
      [
        "exec",
        "vitest",
        "run",
        "--config",
        "vitest.catalog.config.ts",
        ...process.argv.slice(2),
      ],
      {
        stdio: "inherit",
        env: {
          ...process.env,
          LAPIS_CATALOG_VIEWPORT: viewport,
          LAPIS_CATALOG_THEME: theme,
        },
      },
    );
    const stop = () => child.kill("SIGTERM");
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    child.once("error", reject);
    child.once("exit", (code) => {
      process.removeListener("SIGINT", stop);
      process.removeListener("SIGTERM", stop);
      resolve(code ?? 1);
    });
  });
  if (result !== 0) process.exit(result);
}
