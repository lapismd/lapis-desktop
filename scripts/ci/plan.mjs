import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { planChanges, gates } from "./impact.mjs";
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
const full =
  process.env.GITHUB_EVENT_NAME === "workflow_dispatch" &&
  event.inputs?.full !== "false";
const base = event.pull_request?.base?.sha ?? event.before;
const head = event.pull_request?.head?.sha ?? process.env.GITHUB_SHA;
let files, metadata, fallback;
try {
  if (
    !/^[a-f0-9]{40}$/.test(base ?? "") ||
    /^0+$/.test(base) ||
    !/^[a-f0-9]{40}$/.test(head ?? "")
  )
    throw Error("No usable change range");
  const raw = execFileSync(
    "git",
    ["diff", "--name-status", "-z", "--find-renames", base, head],
    { encoding: "utf8" },
  );
  const entries = raw.split("\0");
  files = [];
  while (entries.length && entries[0]) {
    const status = entries.shift(),
      count = /^[RC]/.test(status) ? 2 : 1;
    if (!/^[ACDMRTUXB][0-9]*$/.test(status))
      throw Error("Unknown Git change status");
    for (let n = 0; n < count; n++) {
      const file = entries.shift();
      if (!file) throw Error("Incomplete rename/change record");
      files.push(file);
    }
  }
  if (
    !full &&
    files.some((f) => f.startsWith("src-tauri/") && f.endsWith(".rs"))
  )
    metadata = JSON.parse(
      execFileSync(
        "cargo",
        [
          "metadata",
          "--locked",
          "--no-deps",
          "--format-version=1",
          "--manifest-path",
          "src-tauri/Cargo.toml",
        ],
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
          timeout: 120000,
        },
      ),
    );
} catch (error) {
  fallback = error.message;
  files = undefined;
}
const plan = planChanges(files, { full, metadata, root: process.cwd() });
if (fallback) plan.reasons.push(`Full fallback: ${fallback}`);
plan.range = { base, head };
mkdirSync(".local", { recursive: true });
writeFileSync(".local/ci-plan.json", JSON.stringify(plan, null, 2) + "\n");
const outputs = [
  `plan=${JSON.stringify(plan)}`,
  `full=${plan.full}`,
  `unit_groups=${JSON.stringify(plan.unit)}`,
  `quality_groups=${JSON.stringify(plan.quality)}`,
  `rust_packages=${JSON.stringify(plan.rustPackages)}`,
  `rust=${plan.quality.includes("rust") || plan.unit.includes("rust")}`,
  ...gates.map((g) => `${g.replaceAll("-", "_")}=${plan.gates.includes(g)}`),
];
appendFileSync(process.env.GITHUB_OUTPUT, outputs.join("\n") + "\n");
appendFileSync(
  process.env.GITHUB_STEP_SUMMARY,
  "## Selected CI gates\n\n" +
    plan.gates.map((g) => `- ${g}`).join("\n") +
    "\n\n" +
    plan.reasons.map((r) => `- ${r}`).join("\n") +
    "\n",
);
