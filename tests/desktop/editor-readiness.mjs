function comparableEditorText(value) {
  return String(value).replace(/\r\n?/gu, "\n").trimEnd();
}

export function editorContentsReady(actual, expected) {
  return comparableEditorText(actual) === comparableEditorText(expected);
}

/** Wait for the requested source bytes before sending replacement input. */
export async function waitForEditorContents(
  browser,
  editor,
  expected,
  { timeout = 10_000 } = {},
) {
  await browser.waitUntil(
    async () => editorContentsReady(await editor.getText(), expected),
    { timeout },
  );
}
