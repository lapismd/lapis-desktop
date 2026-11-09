import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  acceptConflictSide,
  conflictReview,
  openConflictReview,
  reviewedText,
  saveConflictResult,
} from "./conflict-review.mjs";

export async function wait(browser, directory, pluginId) {
  const path = join(directory, `${pluginId}.json`);
  await browser.waitUntil(() => existsSync(path));
  return path;
}

export async function recover(browser, path, pluginId, expected) {
  const resource = `.lapis/${pluginId}.json`;
  await openConflictReview(browser, resource);
  await reviewedText(
    browser,
    resource,
    "Your version",
    JSON.stringify(expected, null, 2),
  );
  await acceptConflictSide(browser, resource, "Left");
  await saveConflictResult(browser, resource);
  await browser.waitUntil(
    () =>
      JSON.stringify(JSON.parse(readFileSync(path, "utf8"))) ===
      JSON.stringify(expected),
  );
  await browser.$(conflictReview(resource)).waitForExist({ reverse: true });
}
