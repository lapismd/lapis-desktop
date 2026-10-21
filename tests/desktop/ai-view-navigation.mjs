/** Follow the production header menu instead of the retired footer shortcut. */
export async function revealConversationHistory(session, panel) {
  const trigger = (panel ?? session.browser).$(
    'button[aria-label="Conversation actions"]',
  );
  await trigger.waitForDisplayed();
  await trigger.click();
  const view = session.browser.$('[data-testid="ai-chat-view-menu"]');
  await view.waitForDisplayed();
  await view.click();
  const history = session.browser.$('[data-ai-view-command="ai:open-history"]');
  await history.waitForDisplayed();
  await history.click();
}
