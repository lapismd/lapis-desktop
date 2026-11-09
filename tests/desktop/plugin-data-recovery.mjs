import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  acceptConflictSide,
  conflictProblemResource,
  conflictReview,
  openConflictReview,
  reviewedText,
  saveConflictResult,
} from "./conflict-review.mjs";

function matches(path, expected) {
  try {
    return (
      JSON.stringify(JSON.parse(readFileSync(path, "utf8"))) ===
      JSON.stringify(expected)
    );
  } catch {
    return false;
  }
}

export async function wait(browser, directory, pluginId) {
  const path = join(directory, `${pluginId}.json`);
  await browser.waitUntil(() => existsSync(path));
  return path;
}

export async function recover(browser, path, pluginId, expected) {
  const resource = `.lapis/${pluginId}.json`;
  const problem = `li.ui-workspace-problems__group[data-resource="${conflictProblemResource(resource)}"]`;
  await browser.waitUntil(
    async () =>
      matches(path, expected) ||
      (await browser.$(conflictReview(resource)).isExisting()) ||
      (await browser.$(problem).isExisting()),
    {
      timeoutMsg:
        "Plugin data mirror must synchronize or expose its exact conflict",
    },
  );
  if (!matches(path, expected)) {
    await openConflictReview(browser, resource);
    await reviewedText(
      browser,
      resource,
      "Your version",
      JSON.stringify(expected, null, 2),
    );
    await acceptConflictSide(browser, resource, "Left");
    await saveConflictResult(browser, resource);
  }
  await browser.waitUntil(() => matches(path, expected), {
    timeoutMsg: "Plugin data mirror must match recovered canonical data",
  });
  await browser.$(conflictReview(resource)).waitForExist({ reverse: true });
}
