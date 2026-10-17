import { launchDesktop } from "./lib/desktop/launch.ts";

await launchDesktop(async () => {
  const { bootstrapDesktop } = await import("./lib/desktop/bootstrap.ts");
  await bootstrapDesktop();
});
