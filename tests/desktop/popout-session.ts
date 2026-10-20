import type { App, Editor } from "@lapis-notes/api";
import { getWorkspaceHostBinding } from "@lapis-notes/api/workspace-host";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { Window as NativeWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { tick } from "svelte";
import { undoDepth } from "@codemirror/commands";
import { runFocusedHistory } from "../../src/lib/desktop/desktop-integration.ts";

let application: (() => App) | undefined;
export function installWorkspacePopupAcceptance(get: () => App): void {
  application = get;
}
function ensure(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function until(check: () => boolean | Promise<boolean>, message: string) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  throw new Error(message);
}

/** Real main-owned App/editor and related WebViews; no replacement window host. */
export async function runWorkspacePopupAcceptance(): Promise<void> {
  const info = () =>
    invoke<{
      popoutProofMode: string | null;
      nativePopouts: { label: string; controls: { Ok?: number[][] } }[];
      nativeChromeObservers: number;
    }>("shell_info");
  if ((await info()).popoutProofMode !== "session") return;
  const checks: string[] = [];
  const headerFailures: string[] = [];
  let restoreGuard: (() => void) | undefined;
  try {
    await until(
      () =>
        Boolean(
          [...document.querySelectorAll("button")].find((button) =>
            button.textContent?.includes("Open Vault"),
          ),
        ),
      "The native vault launcher must be ready",
    );
    [...document.querySelectorAll("button")]
      .find((button) => button.textContent?.includes("Open Vault"))!
      .click();
    await until(
      () => Boolean(document.querySelector('[data-notes-ready="true"]')),
      "The actual Notes App must load",
    );
    ensure(application, "The plugin-owned App observer must be installed");
    const app = application();
    const renderer = getWorkspaceHostBinding(app.workspace).controller.renderer;
    await app.workspace.openLinkText("Note.md", "", false);
    const leaf = app.workspace.activeLeaf;
    const editor = app.workspace.activeEditor?.editor as Editor | undefined;
    ensure(leaf && editor, "A real editable Note must be active");
    const original = editor.getValue();
    const draft = original + "\nRetained native popup draft — café 笔记\n";
    editor.replaceRange(
      draft.slice(original.length),
      editor.offsetToPos(original.length),
    );
    const initialUndoDepth = undoDepth(editor.view.state);
    const first = renderer.popoutTab(leaf.id);
    ensure(first, "The ordinary desktop opener must create a related window");
    const firstHandle = renderer.getPopoutHandle(first.id);
    ensure(
      firstHandle,
      "The shared renderer must retain the native window handle",
    );
    await until(
      () =>
        Boolean(
          firstHandle.document.querySelector(
            '.cm-content[contenteditable="true"]',
          ),
        ),
      "The same editor must mount in the related document",
    );
    ensure(
      app.workspace.getLeafById(leaf.id) === leaf &&
        editor.getValue() === draft,
      "Moving must retain leaf/editor identity and its draft",
    );
    ensure(
      firstHandle.document !== document &&
        firstHandle.document.querySelector(".cm-content")?.ownerDocument ===
          firstHandle.document,
      "The editor must own the related document",
    );
    checks.push("ordinary-native-open", "retained-editor-draft");
    await invoke("desktop_workspace_windows", {
      frame: {
        action: "focus",
        label: (firstHandle as unknown as { label: string }).label,
      },
    });
    ensure(
      firstHandle.window.document === firstHandle.document,
      "Native opening must preserve the initial related document rather than replacing it with a later navigation",
    );
    await until(
      () => firstHandle.document.hasFocus(),
      "The native popup must become focused before editing",
    );
    await until(
      () => editor.view.root === firstHandle.document,
      `The moved editor must bind its related document (undo depth ${initialUndoDepth})`,
    );
    editor.focus();
    await until(
      () => firstHandle.document.activeElement === editor.view.contentDOM,
      "The related document must focus the retained editor",
    );
    await tick();
    const beforeUndo = {
      initialUndoDepth,
      movedUndoDepth: undoDepth(editor.view.state),
      active: firstHandle.document.activeElement?.className,
      nativeFocus: firstHandle.document.hasFocus(),
    };
    runFocusedHistory(firstHandle.document, "undo", true);
    await tick();
    ensure(
      editor.getValue() === original,
      `Popup undo must use the retained editor history: ${JSON.stringify(beforeUndo)}`,
    );
    runFocusedHistory(firstHandle.document, "redo", true);
    await tick();
    ensure(
      editor.getValue() === draft,
      "Popup redo must restore the retained draft",
    );
    checks.push("popup-editor-history");

    const imageFile = app.vault.getFileByPath("pixel.png");
    ensure(imageFile, "The attachment fixture must be present");
    const image = firstHandle.document.createElement("img");
    image.src = app.vault.getResourcePath(imageFile);
    firstHandle.document.body.append(image);
    await until(
      () => image.complete && image.naturalWidth === 1,
      "A registered popup must read its own vault attachment",
    );
    image.remove();
    checks.push("scoped-attachment");
    const childApi = (
      firstHandle.window as unknown as {
        __TAURI__?: { core: { invoke(command: string): Promise<unknown> } };
      }
    ).__TAURI__;
    if (childApi) {
      const denied = await childApi.core.invoke("vault_recents").then(
        () => false,
        () => true,
      );
      ensure(
        denied,
        "A detached document must have no native vault IPC authority",
      );
    }
    checks.push("no-popup-ipc-grant");

    const foreign = await invoke<{ sessionId: string; resourceToken: string }>(
      "vault_select",
    );
    const foreignBytes = await invoke<number[]>("vault_fs", {
      sessionId: foreign.sessionId,
      request: { operation: "read-binary", path: "pixel.png" },
    });
    ensure(
      foreignBytes.length > 0,
      "The separate admitted vault must have a real attachment",
    );
    const foreignImage = firstHandle.document.createElement("img");
    let foreignLoaded: boolean | undefined;
    foreignImage.onload = () => {
      foreignLoaded = true;
    };
    foreignImage.onerror = () => {
      foreignLoaded = false;
    };
    foreignImage.src = convertFileSrc(
      `${foreign.resourceToken}/pixel.png`,
      "lapis-vault",
    );
    firstHandle.document.body.append(foreignImage);
    await until(
      () => foreignLoaded !== undefined,
      "The separate vault resource request must settle",
    );
    ensure(
      foreignLoaded === false,
      "A related document must not read a different admitted vault's resource",
    );
    foreignImage.remove();
    await invoke("vault_close", { sessionId: foreign.sessionId });
    checks.push("foreign-vault-resource-denied");
    const unboundIpcDenied = await firstHandle.window
      .fetch("ipc://localhost/vault_recents", { method: "POST", body: "{}" })
      .then(
        () => false,
        () => true,
      );
    ensure(
      unboundIpcDenied,
      "Related documents cannot use the shared protocol handler to bypass message IPC admission",
    );
    checks.push("unbound-protocol-ipc-denied");

    await app.workspace.openLinkText("Other.md", "", "tab");
    const otherLeaf = app.workspace.activeLeaf;
    ensure(
      otherLeaf && otherLeaf.id !== leaf.id,
      "A second leaf must be independently owned",
    );
    const second = renderer.popoutTab(otherLeaf.id);
    ensure(second, "A second native related window must open");
    const secondHandle = renderer.getPopoutHandle(second.id);
    ensure(secondHandle, "The second native handle must be independent");
    await until(
      () => Boolean(secondHandle.document.querySelector(".cm-content")),
      "The second editor must mount",
    );
    ensure(
      (await info()).nativePopouts.length === 2,
      "Both related windows must exist natively",
    );
    ensure(
      firstHandle.window.open("about:blank") === null,
      "Nested blank windows must remain denied",
    );
    checks.push("multiple-windows", "nested-window-denied");

    const label = (firstHandle as unknown as { label: string }).label;
    ensure(
      label?.startsWith("workspace-popup-"),
      "The native identity must come from the issued ticket",
    );
    const native = await NativeWindow.getByLabel(label);
    ensure(native, "The popup must be a real registered native window");
    await native.setSize(new LogicalSize(820, 560));
    await until(
      () =>
        firstHandle.window.innerWidth === 820 &&
        firstHandle.window.innerHeight === 560,
      "Native resize must update the retained editor's document viewport",
    );
    for (const handle of [firstHandle, secondHandle]) {
      const strip = handle.document
        .querySelector("[data-workspace-tab-strip]")
        ?.getBoundingClientRect();
      const controls = (await info()).nativePopouts.find(
        (entry) =>
          entry.label === (handle as unknown as { label: string }).label,
      )?.controls.Ok;
      const fits =
        strip &&
        strip.top === 0 &&
        controls?.length === 3 &&
        controls.every(
          ([x, y, width, height]) =>
            x >= 16 &&
            x + width <= 80 &&
            y >= strip.top &&
            y + height <= strip.bottom &&
            Math.abs(y + height / 2 - 20) < 0.5,
        );
      if (!fits)
        headerFailures.push(
          JSON.stringify({
            label: (handle as unknown as { label: string }).label,
            sameDocument: handle.window.document === handle.document,
            savedNodes: handle.document.body.childElementCount,
            currentNodes: handle.window.document.body.childElementCount,
            strip: strip?.toJSON(),
            controls,
          }),
        );
    }
    if (!headerFailures.length) checks.push("native-header-controls");
    const guard = app.fileEditingSessions.guard;
    let refused = 0;
    app.fileEditingSessions.guard = async () => {
      refused++;
      throw new Error("Native popup save failure fixture");
    };
    restoreGuard = () => {
      app.fileEditingSessions.guard = guard;
    };
    const windowState = () => ({
      windows: renderer.layout.windows.map((win) => ({
        id: win.id,
        kind: win.root.kind,
        tabs:
          win.root.kind === "tabs" ? win.root.items.map((item) => item.id) : [],
      })),
      firstId: first.id,
      secondId: second.id,
      firstCurrentDocument:
        firstHandle.window.document === firstHandle.document,
      firstClosed: firstHandle.window.closed,
      firstBound: renderer.getPopoutHandle(first.id) === firstHandle,
      sameOwner: app.workspace.app === app,
      firstBody: firstHandle.document.body.textContent?.slice(0, 160),
    });
    const beforeClose = windowState();
    await native.close();
    await until(
      () => refused === 1,
      "Native close must enter the existing save guard",
    ).catch((error) => {
      throw new Error(
        `${error}: ${JSON.stringify({ beforeClose, afterClose: windowState() })}`,
      );
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    ensure(
      !firstHandle.window.closed &&
        renderer.getPopoutHandle(first.id) === firstHandle &&
        editor.getValue() === draft,
      "A failed save must retain the popup, leaf and draft",
    );
    restoreGuard();
    restoreGuard = undefined;
    checks.push("failed-save-retains-window");
    await native.close();
    await until(
      () =>
        firstHandle.window.closed &&
        renderer.getPopoutHandle(first.id) === null,
      "Successful saving must release the first native window",
    );
    ensure(
      (await app.vault.adapter.read("Note.md")) === draft,
      "Native close must flush the actual saved note",
    );
    ensure(
      !secondHandle.window.closed,
      "Closing one popup must preserve the other",
    );
    checks.push("native-save-and-independent-close");
    ensure(
      renderer.moveTabToMain(otherLeaf.id),
      "The shared move-to-main action must redock the remaining tab",
    );
    await until(
      () =>
        secondHandle.window.closed &&
        Boolean(document.querySelector(".cm-content")),
      "Redocking must retire the related native window and restore its editor",
    );
    await until(
      async () =>
        (await info()).nativePopouts.length === 0 &&
        (await info()).nativeChromeObservers === 1,
      "Every related native resource must retire independently",
    );
    ensure(
      app.workspace.getLeafById(otherLeaf.id) === otherLeaf,
      "Redocking must preserve the original leaf identity",
    );
    checks.push("redock-main", "native-resource-cleanup");
    ensure(
      !headerFailures.length,
      `Actual native controls must fit the shared popup header after resizing: ${headerFailures.join("; ")}`,
    );
    console.log(
      `LAPIS_POPOUT_PROOF:${JSON.stringify({ result: "pass", mode: "session", checks })}`,
    );
  } catch (error) {
    console.error(
      `LAPIS_POPOUT_PROOF:${JSON.stringify({ result: "fail", mode: "session", checks, headerFailures, error: String(error) })}`,
    );
  } finally {
    restoreGuard?.();
    setTimeout(() => {
      void invoke("lifecycle_quit");
    }, 100);
  }
}
