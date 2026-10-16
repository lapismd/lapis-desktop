import { mount, unmount, tick } from "svelte";
import PopoutProof from "./PopoutProof.svelte";
import { installWindowDragRegions } from "../../src/lib/desktop/window-drag.ts";

/** Capture the platform popup API before the production external-link adapter. */
export function installPopoutProof(open: typeof window.open): void {
  const windows = new Map<
    string,
    { popup: Window; component: ReturnType<typeof mount>; stop: () => void }
  >();
  let serial = 0;
  Object.assign(globalThis, {
    __lapisPopoutProof: {
      async open() {
        const popup = open(
          "about:blank",
          "_blank",
          "popup=yes,width=720,height=480",
        );
        if (!popup) return null;
        const id = `proof-${++serial}`;
        const target = popup.document;
        for (const attribute of document.documentElement.attributes)
          target.documentElement.setAttribute(attribute.name, attribute.value);
        for (const node of document.head.querySelectorAll(
          'style,link[rel="stylesheet"]',
        ))
          target.head.append(node.cloneNode(true));
        target.title = "Lapis related window proof";
        Object.assign(target.body.style, {
          margin: "0",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
        });
        const component = mount(PopoutProof, {
          target: target.body,
          props: { id },
        });
        const stop = installWindowDragRegions(target.documentElement);
        windows.set(id, { popup, component, stop });
        await tick();
        return id;
      },
      inspect(id: string) {
        const entry = windows.get(id);
        if (!entry) throw new Error("No related proof window is mounted");
        const { popup } = entry;
        const surface = popup.document.querySelector(
          "[data-workspace-popout-id]",
        );
        const strip = popup.document.querySelector(
          "[data-workspace-tab-strip]",
        );
        return {
          closed: popup.closed,
          opener: popup.opener === window,
          ownedDocument: surface?.ownerDocument === popup.document,
          surface: surface?.getAttribute("data-workspace-popout-id"),
          text: popup.document.body.textContent,
          top: strip?.getBoundingClientRect().top,
          drag: strip?.getAttribute("data-tauri-drag-region"),
          focused: popup.document.hasFocus(),
          width: popup.innerWidth,
          height: popup.innerHeight,
        };
      },
      focus: (id: string) => windows.get(id)?.popup.focus(),
      nested: (id: string) =>
        Boolean(windows.get(id)?.popup.open("about:blank")),
      async close(id: string) {
        const entry = windows.get(id);
        if (!entry) return;
        entry.stop();
        await unmount(entry.component);
        entry.popup.close();
        windows.delete(id);
      },
      invalid: () => Boolean(open("file:///etc/passwd", "_blank")),
    },
  });
}
