import { execFileSync } from "node:child_process";
import { nativeBuildEnvironment } from "../validation/model.mjs";
import { qualityCommands, unitCommands } from "./commands.mjs";
const kind = process.argv[2];
if (!["unit", "quality"].includes(kind)) throw Error("Require unit or quality");
const hosted =
  process.env.GITHUB_ACTIONS === "true" &&
  process.env.LAPIS_DESKTOP_VALIDATION_RUNTIME === "native";
const commands = hosted
  ? kind === "unit"
    ? unitCommands()
    : qualityCommands()
  : [["pnpm", [kind === "unit" ? "test" : "check"]]];
for (const [command, args] of commands)
  execFileSync(command, args, {
    stdio: "inherit",
    env: hosted
      ? {
          ...process.env,
          ...nativeBuildEnvironment(kind === "unit" ? "test" : "check"),
        }
      : process.env,
  });
