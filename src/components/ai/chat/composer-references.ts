// SPDX-License-Identifier: Apache-2.0
// Adapted from jj-store composer-chip-widgets.ts and composer-decorations.ts.
import { mount, unmount } from "svelte";
import type { App } from "@lapis-notes/api";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import type { MiraExtension } from "@lapismd/mira/extensions";
import type { AgentRecipientOption } from "../../../lib/ai/conversations/recipients.ts";
import {
  composerReferenceRanges,
  type ComposerReference,
} from "../../../lib/ai/chat/composer-reference-ranges.ts";
import ChatInlineReference from "./ChatInlineReference.svelte";

class ReferenceWidget extends WidgetType {
  constructor(
    readonly reference: ComposerReference,
    readonly app?: App,
  ) {
    super();
  }
  eq(other: ReferenceWidget) {
    return (
      this.app === other.app &&
      JSON.stringify(this.reference) === JSON.stringify(other.reference)
    );
  }
  toDOM(view: EditorView) {
    const host = view.dom.ownerDocument.createElement("span");
    const { from, to, ...props } = this.reference;
    const component = mount(ChatInlineReference, {
      target: host,
      props: {
        ...props,
        app: this.app,
        onRemove: () => {
          if (view.state.readOnly) return;
          view.dispatch({
            changes: {
              from,
              to: view.state.doc.sliceString(to, to + 1) === " " ? to + 1 : to,
            },
            selection: { anchor: from },
            userEvent: "delete",
          });
          view.focus();
        },
      },
    });
    cleanup.set(host, () => {
      void unmount(component);
    });
    return host;
  }
  destroy(host: HTMLElement) {
    cleanup.get(host)?.();
    cleanup.delete(host);
  }
}
const cleanup = new WeakMap<HTMLElement, () => void>();

/** Public Mira editor extension; never changes serialized source or dispatches work. */
export function composerReferences(
  profiles: () => readonly AgentRecipientOption[],
  people: () => readonly import("../../../lib/ai/conversations/recipients.ts").ComposerPersonOption[] = () => [],
  app: () => App | undefined = () => undefined,
): MiraExtension {
  const decorate = (view: EditorView) =>
    Decoration.set(
      composerReferenceRanges(view.state, profiles(), people()).map(
        (reference) =>
          Decoration.replace({
            widget: new ReferenceWidget(reference, app()),
          }).range(reference.from, reference.to),
      ),
      true,
    );
  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = decorate(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged)
          this.decorations = decorate(update.view);
      }
    },
    {
      decorations: (value) => value.decorations,
      provide: (extension) =>
        EditorView.atomicRanges.of(
          (view) => view.plugin(extension)?.decorations ?? Decoration.none,
        ),
    },
  );
  return { name: "notes-composer-references", codeMirror: () => [plugin] };
}
