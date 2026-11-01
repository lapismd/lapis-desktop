import { cp } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { hostedMain, releaseTargets } from "./contract.mjs";
import { sealCandidate, verifyCandidate } from "./candidate.mjs";
const { values } = parseArgs({
  options: {
    seal: { type: "boolean" },
    directory: { type: "string", default: ".local/release/candidate" },
  },
});
hostedMain();
if (values.seal) {
  for (const { target } of releaseTargets)
    for (const phase of ["install", "reinstall", "homebrew"])
      await cp(
        `.local/release/homebrew/${target}/${phase}.json`,
        join(values.directory, `homebrew-${target}-${phase}.json`),
      );
  await sealCandidate(values.directory);
}
const { manifest } = await verifyCandidate(
  values.directory,
  process.env.GITHUB_SHA,
);
console.log(
  `Verified qualified candidate ${manifest.tag} from ${manifest.sourceCommit}`,
);
