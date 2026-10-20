import type { WorkspacePopoutHost } from "@lapismd/design-core/workspace/core";
import {
  DesktopPopupHandle,
  type PopupCall,
  type PopupClose,
  type PopupTicket,
} from "./popup-handle.ts";

export type DesktopPopoutOptions = {
  sessionId: string;
  call: PopupCall;
  onClose(
    listener: (request: PopupClose) => Promise<void>,
  ): Promise<() => void>;
  onRetire(listener: (label: string) => void): Promise<() => void>;
  open: Window["open"];
  setup(window: Window, label: string): () => void;
  report(error: unknown): void;
};
export type PopoutFactory = (
  app: import("@lapis-notes/api").App,
) => Promise<DesktopPopouts>;

export async function createDesktopPopouts(
  options: DesktopPopoutOptions,
): Promise<DesktopPopouts> {
  const owner = new DesktopPopouts(options);
  await owner.start();
  return owner;
}

export class DesktopPopouts {
  readonly host: WorkspacePopoutHost;
  #tickets: PopupTicket[] = [];
  #handles = new Map<string, DesktopPopupHandle>();
  #stops: (() => void)[] = [];
  #background = new Set<Promise<unknown>>();
  #accepting = false;
  #disposed = false;
  #refilling: Promise<void> | undefined;
  #revision = 0;
  #openingBlocked = false;

  constructor(private options: DesktopPopoutOptions) {
    this.host = {
      open: (input) => {
        if (!this.#accepting || this.#disposed || this.#openingBlocked)
          return null;
        const ticket = this.#tickets.shift();
        if (!ticket) {
          void this.refill();
          return null;
        }
        let popup: Window | null = null;
        try {
          const { x, y, width, height } = input.bounds;
          popup = options.open(
            ticket.url,
            `workspace-shell-${input.id}`,
            `popup=yes,left=${x},top=${y},width=${width},height=${height}`,
          );
        } catch (error) {
          options.report(error);
        }
        if (!popup) {
          this.#openingBlocked = true;
          this.background(
            options
              .call({ action: "cancelTicket", label: ticket.label })
              .then(async () => {
                await this.refill();
                this.#openingBlocked = false;
              }),
          );
          return null;
        }
        popup.document.title = input.title;
        let stop: () => void;
        try {
          stop = options.setup(popup, ticket.label);
        } catch (error) {
          options.report(error);
          this.background(
            (async () => {
              const request = await options.call<PopupClose | null>({
                action: "requestClose",
                label: ticket.label,
              });
              if (request)
                await options.call({
                  action: "finishClose",
                  ...request,
                  saved: true,
                });
              await this.refill();
            })(),
          );
          return null;
        }
        const handle = new DesktopPopupHandle(
          popup,
          ticket.label,
          options.call,
          (error) => {
            if (this.#accepting) options.report(error);
          },
          () => {
            stop();
            this.#handles.delete(ticket.label);
            void this.refill();
          },
        );
        this.#handles.set(ticket.label, handle);
        void this.refill();
        return handle;
      },
    };
  }

  async start(): Promise<void> {
    try {
      this.#stops.push(
        await this.options.onClose(async (request) => {
          try {
            await this.#handles.get(request.label)?.requestClose(request);
          } catch (error) {
            this.options.report(error);
          }
        }),
      );
      this.#stops.push(
        await this.options.onRetire((label) =>
          this.#handles.get(label)?.retire(),
        ),
      );
      const tickets = await this.options.call<PopupTicket[]>({
        action: "begin",
        sessionId: this.options.sessionId,
      });
      this.#tickets = tickets.map((ticket) => this.ticket(ticket));
      this.#accepting = true;
    } catch (error) {
      await this.options
        .call({ action: "fence", sessionId: this.options.sessionId })
        .catch(() => {});
      await this.options
        .call({ action: "end", sessionId: this.options.sessionId })
        .catch(() => {});
      this.#stops
        .splice(0)
        .reverse()
        .forEach((stop) => stop());
      throw error;
    }
  }

  focusedDocument(fallback: Document): Document {
    for (const handle of this.#handles.values())
      if (handle.document.hasFocus()) return handle.document;
    return fallback;
  }

  blurFocused(): void {
    for (const handle of this.#handles.values()) {
      const element = handle.document.activeElement;
      if (element && "blur" in element) (element as HTMLElement).blur();
    }
  }

  async fence(): Promise<void> {
    if (this.#disposed) return;
    this.#accepting = false;
    this.#tickets = [];
    this.#revision++;
    await this.#refilling;
    await Promise.all(this.#background);
    await this.options.call({
      action: "fence",
      sessionId: this.options.sessionId,
    });
  }

  async resume(): Promise<void> {
    if (this.#disposed) return;
    await this.options.call({
      action: "resume",
      sessionId: this.options.sessionId,
    });
    this.#accepting = true;
    this.#openingBlocked = false;
    await this.refill();
  }

  async dispose(): Promise<void> {
    if (this.#disposed) return;
    await this.fence();
    const handles = [...this.#handles.values()];
    for (const handle of handles) handle.close();
    await Promise.all(handles.map((handle) => handle.drained()));
    await this.options.call({
      action: "end",
      sessionId: this.options.sessionId,
    });
    this.#disposed = true;
    this.#stops
      .splice(0)
      .reverse()
      .forEach((stop) => stop());
  }

  private ticket(ticket: PopupTicket): PopupTicket {
    if (
      typeof ticket?.label !== "string" ||
      !ticket.label.startsWith("workspace-popup-") ||
      ticket.url !== "about:blank"
    ) {
      throw new Error("Invalid native workspace window ticket");
    }
    return ticket;
  }

  private background(promise: Promise<unknown>): void {
    const tracked = promise
      .catch((error) => {
        if (this.#accepting) this.options.report(error);
      })
      .finally(() => {
        this.#background.delete(tracked);
      });
    this.#background.add(tracked);
  }

  private refill(): Promise<void> {
    if (!this.#accepting || this.#disposed) return Promise.resolve();
    if (this.#refilling) return this.#refilling;
    const revision = this.#revision;
    this.#refilling = (async () => {
      while (
        this.#accepting &&
        this.#tickets.length < 4 &&
        revision === this.#revision
      ) {
        const received = await this.options.call<PopupTicket | null>({
          action: "issue",
          sessionId: this.options.sessionId,
        });
        if (!received) break;
        const ticket = this.ticket(received);
        if (!this.#accepting || revision !== this.#revision) {
          await this.options.call({
            action: "cancelTicket",
            label: ticket.label,
          });
          break;
        }
        this.#tickets.push(ticket);
      }
    })()
      .catch((error) => {
        if (this.#accepting) this.options.report(error);
      })
      .finally(() => {
        this.#refilling = undefined;
      });
    return this.#refilling;
  }
}
