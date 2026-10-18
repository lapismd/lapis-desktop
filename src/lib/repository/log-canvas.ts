import { createColumnCanvasController } from "@lapismd/design-core/shadcn/column-canvas";
/** jj-store log/diff column geometry. The public root owns pane-responsive mode. */
export function createLogCanvas() {
  return createColumnCanvasController<string>({
    columns: {
      revisions: {
        defaultWidth: 480,
        minWidth: 360,
        maxWidth: 720,
        collapsible: true,
        resizable: true,
      },
      diff: {
        defaultWidth: 560,
        minWidth: 360,
        maxWidth: 980,
        pathLevel: 1,
        closeable: true,
        closed: true,
        openOnSelect: false,
        resizable: true,
      },
    },
  });
}
