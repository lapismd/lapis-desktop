import type { DesktopInvoke } from "./desktop-integration.ts";

export type AppUrlRequest = {
  id: string;
  url: string | null;
  error: string | null;
};
type Target = (
  request: AppUrlRequest,
  acknowledge: () => Promise<void>,
) => Promise<void>;

/** Native requests remain queued while no ready App owns delivery. */
export class DesktopUrlDelivery {
  private readonly invoke: DesktopInvoke;
  private readonly report: (error: unknown) => void;
  private target: Target | undefined;
  private running: Promise<void> | undefined;
  private requested = false;
  constructor(invoke: DesktopInvoke, report: (error: unknown) => void) {
    this.invoke = invoke;
    this.report = report;
  }
  attach(target: Target): () => void {
    this.target = target;
    void this.flush();
    return () => {
      if (this.target === target) this.target = undefined;
    };
  }
  flush(): Promise<void> {
    this.requested = true;
    if (this.running) return this.running;
    if (!this.target) return Promise.resolve();
    this.running = (async () => {
      do {
        this.requested = false;
        const target = this.target;
        while (target && this.target === target) {
          const request = await this.invoke<AppUrlRequest | null>(
            "desktop_url_next",
          );
          if (!request || this.target !== target) break;
          await target(request, () =>
            this.invoke("desktop_url_ack", { id: request.id }),
          );
        }
      } while (this.requested && this.target);
    })()
      .catch((error) => {
        this.requested = false;
        this.report(error);
      })
      .finally(() => {
        this.running = undefined;
        if (this.requested && this.target) void this.flush();
      });
    return this.running;
  }
  dispose(): void {
    this.target = undefined;
    this.requested = false;
  }
}
