import { appendFileSync } from "node:fs";
import { gates, validateResults } from "./impact.mjs";
if (process.env.PLANNER_RESULT !== "success")
  throw Error("CI change planning did not succeed");
const plan = JSON.parse(process.env.CI_PLAN),
  needs = JSON.parse(process.env.CI_RESULTS);
const results = Object.fromEntries(gates.map((g) => [g, needs[g]?.result]));
validateResults(plan, results);
appendFileSync(
  process.env.GITHUB_STEP_SUMMARY,
  "## CI results\n\n| Gate | Selected | Result |\n| --- | --- | --- |\n" +
    gates
      .map(
        (g) =>
          `| ${g} | ${plan.gates.includes(g)} | ${plan.gates.includes(g) ? results[g] : "not selected"} |`,
      )
      .join("\n") +
    "\n",
);
console.log(
  `All ${plan.gates.length} selected CI gates passed; other gates were explicitly unselected.`,
);
