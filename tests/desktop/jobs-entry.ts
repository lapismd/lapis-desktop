import { init } from "@wdio/tauri-plugin";
import { launchDesktop } from "../../src/lib/desktop/launch.ts";
import { bootstrapDesktop } from "../../src/lib/desktop/bootstrap.ts";

// Native metadata and window lifetime use the production distribution defaults.
await init();
await launchDesktop(() => bootstrapDesktop());
