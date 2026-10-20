import { invoke } from "@tauri-apps/api/core";
import { Window as NativeWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";

type NativeInfo = {
  popoutProofMode: "allow" | "deny" | "session" | null;
  nativeChromeObservers: number;
  nativePopouts: {
    label: string;
    focused: boolean;
    controls: { Ok: number[][] };
  }[];
};
type Driver = {
  open(): Promise<string | null>;
  inspect(id: string): {
    closed: boolean;
    opener: boolean;
    ownedDocument: boolean;
    surface: string;
    text: string;
    top: number;
    drag: string;
    focused: boolean;
    width: number;
    height: number;
  };
  focus(id: string): void;
  nested(id: string): boolean;
  invalid(): boolean;
  close(id: string): Promise<void>;
};

function ensure(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
async function until(check: () => boolean | Promise<boolean>, message: string) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(message);
}

/** Self-driven native proof without the driver's replacement WebKit delegate. */
export async function runPopoutProof(): Promise<void> {
  const info = () => invoke<NativeInfo>("shell_info");
  const mode = (await info()).popoutProofMode;
  if (mode !== "allow" && mode !== "deny") return;
  const driver = (globalThis as unknown as { __lapisPopoutProof: Driver })
    .__lapisPopoutProof;
  const checks: string[] = [];
  try {
    const first = await driver.open();
    if (mode === "deny") {
      ensure(first === null, "Popup creation must require explicit opt-in");
      checks.push("creation-denied");
    } else {
      ensure(first, "The related native popup must return its Window");
      const firstLabel = (await info()).nativePopouts[0]?.label;
      ensure(firstLabel, "The popup must be an owned native window");
      const second = await driver.open();
      ensure(
        second && second !== first,
        "The second native window must be independent",
      );
      for (const id of [first, second]) {
        const state = driver.inspect(id);
        ensure(
          !state.closed && state.opener && state.ownedDocument,
          "Related Window/Document ownership failed",
        );
        ensure(
          state.surface === id &&
            state.text.includes("Related window") &&
            state.top === 0 &&
            state.drag === "deep",
          "The shared popup surface must fill its own native document",
        );
      }
      checks.push("related-documents", "shared-surfaces");
      const nativeWindow = await NativeWindow.getByLabel(firstLabel);
      ensure(nativeWindow, "The related window must remain registered");
      await nativeWindow.setFocus();
      driver.focus(first);
      await until(
        async () =>
          driver.inspect(first).focused &&
          (await info()).nativePopouts.some(
            (entry) => entry.label === firstLabel && entry.focused,
          ),
        "Native focus must follow the related Window",
      );
      checks.push("native-focus");
      await nativeWindow.setSize(new LogicalSize(820, 560));
      await until(
        () =>
          driver.inspect(first).width === 820 &&
          driver.inspect(first).height === 560,
        "Native resize must update the related Document viewport",
      );
      checks.push("native-resize");
      for (const window of (await info()).nativePopouts) {
        ensure(
          window.controls.Ok?.length === 3 &&
            window.controls.Ok.every(
              ([x, top, width, height]) =>
                x >= 16 &&
                x + width <= 80 &&
                Math.abs(top + height / 2 - 20) < 0.5,
            ),
          "Native controls must remain centered after resize",
        );
      }
      ensure(
        (await info()).nativeChromeObservers === 3,
        "Each native window needs one chrome observer",
      );
      checks.push("native-controls");
      ensure(!driver.nested(first), "Nested popup creation must be denied");
      checks.push("nested-denied");
      ensure(!driver.invalid(), "Arbitrary file windows must be denied");
      checks.push("file-denied");
      await driver.close(first);
      await nativeWindow.close();
      await until(async () => {
        const state = await info();
        return (
          state.nativePopouts.length === 1 && state.nativeChromeObservers === 2
        );
      }, "Closing the first window must retire its native resources");
      ensure(
        !driver.inspect(second).closed,
        "The other popup must remain open",
      );
      checks.push("independent-close");
      const secondLabel = (await info()).nativePopouts[0]?.label;
      ensure(
        secondLabel,
        "The remaining popup must have its own native window",
      );
      const secondWindow = await NativeWindow.getByLabel(secondLabel);
      ensure(secondWindow, "The second native window must remain registered");
      await driver.close(second);
      await secondWindow.close();
      await until(async () => {
        const state = await info();
        return (
          state.nativePopouts.length === 0 && state.nativeChromeObservers === 1
        );
      }, "Popup cleanup must retain only the main-window observer");
      checks.push("observer-cleanup");
    }
    console.log(
      `LAPIS_POPOUT_PROOF:${JSON.stringify({ result: "pass", mode, checks })}`,
    );
  } catch (error) {
    console.error(
      `LAPIS_POPOUT_PROOF:${JSON.stringify({ result: "fail", mode, checks, error: String(error) })}`,
    );
  } finally {
    setTimeout(() => {
      void invoke("lifecycle_quit");
    }, 100);
  }
}
