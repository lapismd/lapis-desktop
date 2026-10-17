import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  nativeSessionMode,
  assertBackgroundAvailability,
} from "../desktop/native-session-mode.mjs";
import { acceptanceBinary } from "../../scripts/native-acceptance-binary.mjs";

test("native acceptance stays headed unless background API mode is explicit", () => {
  const inherited = {
    LAPIS_DESKTOP_ACCEPTANCE_BACKGROUND: "1",
    OTHER: "retained",
  };
  const standard = nativeSessionMode({}, inherited);
  assert.equal(standard.background, false);
  assert.equal(standard.environment.LAPIS_DESKTOP_ACCEPTANCE_BACKGROUND, "0");
  assert.equal(standard.environment.OTHER, "retained");
  assert.deepEqual(standard.requiredMarkers, []);
  const background = nativeSessionMode({ background: true }, inherited);
  assert.equal(background.background, true);
  assert.equal(background.environment.LAPIS_DESKTOP_ACCEPTANCE_BACKGROUND, "1");
  assert.deepEqual(background.requiredMarkers, [
    "LAPIS_DESKTOP_ACCEPTANCE_BACKGROUND",
  ]);
});
test("invalid native session modes reject before a process can start", () => {
  for (const value of [
    null,
    { headless: true },
    { background: "true" },
    { background: true, window: "other" },
  ])
    assert.throws(() => nativeSessionMode(value, {}), /background/);
});

test("background API mode cannot inherit interactive picker or popup-proof flags", () => {
  const inherited = {
    LAPIS_DESKTOP_ACCEPTANCE_REAL_PICKER: "1",
    LAPIS_DESKTOP_POPOUT_PROOF: "1",
  };
  const background = nativeSessionMode(
    { background: true },
    inherited,
  ).environment;
  assert.equal(background.LAPIS_DESKTOP_ACCEPTANCE_REAL_PICKER, undefined);
  assert.equal(background.LAPIS_DESKTOP_POPOUT_PROOF, undefined);
  assert.equal(
    nativeSessionMode({}, inherited).environment
      .LAPIS_DESKTOP_ACCEPTANCE_REAL_PICKER,
    "1",
  );
});
test("background acceptance preserves an already running acceptance application", () => {
  const executable =
    "/current/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop";
  assert.throws(
    () => assertBackgroundAvailability(executable, ` 12 ${executable}\n`),
    /another acceptance app/,
  );
  assert.throws(
    () =>
      assertBackgroundAvailability(
        executable,
        " 21 /different/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop\n",
      ),
    /another acceptance app/,
  );
  assert.doesNotThrow(() =>
    assertBackgroundAvailability(
      executable,
      " 42 /Applications/Lapis Notes Preview.app/Contents/MacOS/lapis-desktop\n",
    ),
  );
});
test("background mode refuses stale acceptance artifacts before they could show a window", () => {
  const root = mkdtempSync(join(tmpdir(), "lapis-native-mode-"));
  const binary = join(root, "binary");
  try {
    writeFileSync(binary, "TAURI_WEBDRIVER_PORT LAPIS_DESKTOP_ACCEPTANCE_ROOT");
    assert.equal(acceptanceBinary(binary), binary);
    const mode = nativeSessionMode({ background: true }, {});
    assert.throws(
      () => acceptanceBinary(binary, mode.requiredMarkers),
      /missing LAPIS_DESKTOP_ACCEPTANCE_BACKGROUND/,
    );
    writeFileSync(
      binary,
      "TAURI_WEBDRIVER_PORT LAPIS_DESKTOP_ACCEPTANCE_ROOT LAPIS_DESKTOP_ACCEPTANCE_BACKGROUND",
    );
    assert.equal(acceptanceBinary(binary, mode.requiredMarkers), binary);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
