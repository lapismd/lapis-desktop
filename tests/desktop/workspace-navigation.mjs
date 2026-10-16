import { focusNativeWindow } from "./native-visibility.mjs";
import { Key } from "webdriverio";

export async function returnToVaults(browser) {
  await focusNativeWindow(browser);
  const trigger = browser.$('button[aria-label^="Current workspace:"]');
  if (!(await trigger.isDisplayed()))
    await browser.$('button[aria-label="Open left sidebar"]').click();
  await trigger.waitForDisplayed();
  await trigger.click();
  await browser
    .$('[data-ui-component="workspace-navigation"]')
    .waitForDisplayed();
  await browser.$("span=Back to vaults").click();
}

export async function reloadNotes(browser) {
  await browser.keys([Key.Command, "r"]);
  await browser.keys(Key.NULL);
}
