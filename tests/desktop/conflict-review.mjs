import assert from "node:assert/strict";

export const nativeFailure =
  'section[aria-label="Notes workspace"] [data-ui-component="workspace-notification-toasts"] [data-ui-part="toast"][role="alert"]';

export const conflictReview = (path) =>
  `section[aria-label="File conflict: ${path}"]`;

export async function openConflictReview(browser, path) {
  const review = browser.$(conflictReview(path));
  if (!(await review.isDisplayed())) {
    const problem = browser.$(
      "//button[contains(., 'Review your draft') or contains(., 'Review the retained draft')]",
    );
    await problem.waitForDisplayed({ timeout: 15000 });
    await problem.click();
  }
  await review.waitForDisplayed({ timeout: 15000 });
  return review;
}

export async function reviewedText(browser, path, side, contents) {
  const region = browser
    .$(conflictReview(path))
    .$(`section[aria-label="${side}"]`);
  await browser.waitUntil(
    async () => (await region.getText()).includes(contents.trim()),
    { timeout: 15000 },
  );
  assert.ok((await region.getText()).includes(contents.trim()));
}

export async function acceptConflictSide(browser, path, side) {
  const review = browser.$(conflictReview(path));
  const accept = review.$(
    `button[aria-label="Accept All Incoming Changes from ${side}"]`,
  );
  await accept.waitForEnabled();
  await accept.click();
}

export async function saveConflictResult(browser, path) {
  const save = browser.$(conflictReview(path)).$("button=Save merged version");
  await save.waitForEnabled();
  await save.click();
}
