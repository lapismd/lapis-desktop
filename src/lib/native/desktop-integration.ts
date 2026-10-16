import type { NativeDesktopNotificationPayload } from "@lapis-notes/api/desktop-native";

export type DesktopInvoke = <T>(
  command: string,
  payload?: Record<string, unknown>,
) => Promise<T>;

/** Renderer platform ports; the native host validates every payload again. */
export class DesktopIntegrationPorts {
  private readonly invoke: DesktopInvoke;
  constructor(invoke: DesktopInvoke) {
    this.invoke = invoke;
  }
  readText = (): Promise<string> => this.invoke("desktop_clipboard_read");
  writeText = (text: string): Promise<void> =>
    this.invoke("desktop_clipboard_write", { text });
  notify = (notification: NativeDesktopNotificationPayload): Promise<void> =>
    this.invoke("desktop_notify", { notification });
  openExternal = (url: string): Promise<void> =>
    this.invoke("desktop_external_open", { url });
  openAppUrl = (url: string): Promise<void> =>
    this.invoke("desktop_url_enqueue", { url });
}

/** Existing shared controls use the standard text clipboard API. */
export function installDesktopClipboard(
  ports: DesktopIntegrationPorts,
  navigator: Navigator,
): () => void {
  const original = navigator.clipboard;
  const descriptor = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  const clipboard = new Proxy(original ?? {}, {
    get(target, name) {
      if (name === "readText") return ports.readText;
      if (name === "writeText") return ports.writeText;
      const value = Reflect.get(target, name, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: clipboard,
  });
  return () => {
    if (descriptor) Object.defineProperty(navigator, "clipboard", descriptor);
    else Reflect.deleteProperty(navigator, "clipboard");
  };
}

export function externalLink(value: string, origin: string): string | null {
  try {
    const url = new URL(value, origin);
    return ["http:", "https:"].includes(url.protocol) &&
      url.origin !== origin &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function installDesktopExternalLinks(
  ports: DesktopIntegrationPorts,
  report: (error: unknown) => void,
): () => void {
  const original = window.open;
  const open = (value: string) => {
    if (/^(?:lapis|lapis-notes|web\+lapis|obsidian):/iu.test(value)) {
      void ports.openAppUrl(value).catch(report);
      return;
    }
    const url = externalLink(value, location.origin);
    if (url) void ports.openExternal(url).catch(report);
  };
  window.open = (value) => {
    if (value) open(String(value));
    return null;
  };
  const click = (event: MouseEvent) => {
    if (event.defaultPrevented) return;
    const anchor =
      event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (/^(?:lapis|lapis-notes|web\+lapis|obsidian):/iu.test(anchor.href)) {
      event.preventDefault();
      void ports.openAppUrl(anchor.href).catch(report);
      return;
    }
    const url = externalLink(anchor.href, location.origin);
    if (!url) return;
    event.preventDefault();
    void ports.openExternal(url).catch(report);
  };
  window.addEventListener("click", click);
  return () => {
    window.open = original;
    window.removeEventListener("click", click);
  };
}
