import type { WorkspacePopoutHandle } from "@lapismd/design-core/workspace/core";

export type PopupTicket = { label: string; url: string };
export type PopupClose = { label: string; requestId: string };
export type PopupFrame =
  | {
      action: "begin" | "issue" | "fence" | "resume" | "end";
      sessionId: string;
    }
  | {
      action: "cancelTicket" | "requestClose" | "focus" | "drag" | "zoom";
      label: string;
    }
  | { action: "finishClose"; label: string; requestId: string; saved: boolean };
export type PopupCall = <T = unknown>(frame: PopupFrame) => Promise<T>;

/** Shared workspace handle; every native operation goes through its main owner. */
export class DesktopPopupHandle implements WorkspacePopoutHandle {
  readonly document: Document;
  #listeners = new Set<() => void>();
  #guard: (() => Promise<boolean>) | undefined;
  #request: PopupClose | undefined;
  #guarding: Promise<void> | undefined;
  #closing: Promise<void> | undefined;
  #retired = false;
  #retirement: Promise<void>;
  #resolveRetirement!: () => void;

  constructor(
    readonly window: Window,
    readonly label: string,
    private call: PopupCall,
    private report: (error: unknown) => void,
    private cleanup: () => void,
  ) {
    this.document = window.document;
    this.#retirement = new Promise((resolve) => {
      this.#resolveRetirement = resolve;
    });
  }

  focus(): void {
    if (!this.#retired)
      void this.call({ action: "focus", label: this.label }).catch(this.report);
  }

  close(): void {
    if (this.#retired || this.#closing) return;
    this.#closing = this.closeNative().catch((error) => {
      this.#closing = undefined;
      throw error;
    });
    void this.#closing.catch(this.report);
  }

  onClose(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  onCloseRequest(listener: () => Promise<boolean>): () => void {
    this.#guard = listener;
    return () => {
      if (this.#guard === listener) this.#guard = undefined;
    };
  }

  requestClose(request: PopupClose): Promise<void> {
    if (this.#retired || this.#closing) return Promise.resolve();
    if (this.#guarding) return this.#guarding;
    this.#request = request;
    this.#guarding = (async () => {
      let saved = false;
      try {
        saved = (await this.#guard?.()) === true;
      } catch (error) {
        this.report(error);
      }
      if (saved) this.close();
      else if (!this.#closing && !this.#retired) {
        await this.call({ action: "finishClose", ...request, saved: false });
        this.#request = undefined;
      }
    })().finally(() => {
      this.#guarding = undefined;
    });
    return this.#guarding;
  }

  retire(): void {
    if (this.#retired) return;
    this.#retired = true;
    this.#resolveRetirement();
    this.cleanup();
    for (const listener of this.#listeners) {
      try {
        listener();
      } catch (error) {
        this.report(error);
      }
    }
    this.#listeners.clear();
    this.#guard = undefined;
  }

  drained(): Promise<void> {
    return this.#closing ?? Promise.resolve();
  }

  private async closeNative(): Promise<void> {
    const request =
      this.#request ??
      (await this.call<PopupClose | null>({
        action: "requestClose",
        label: this.label,
      }));
    if (this.#retired) return;
    if (!request || request.label !== this.label)
      throw new Error("Related window close receipt is unavailable");
    await this.call({ action: "finishClose", ...request, saved: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.#retirement,
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  "The related window has not confirmed closing; the workspace remains open",
                ),
              ),
            8000,
          );
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
