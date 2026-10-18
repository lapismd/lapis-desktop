import { createColumnCanvasController } from "@lapismd/design-core/shadcn/column-canvas";
/** jj-store log/diff column geometry. The public root owns pane-responsive mode. */
export function createLogCanvas(operations = false) {
  return createColumnCanvasController<string>({
    columns: {
      revisions: {
        defaultWidth: 480,
        minWidth: 360,
        maxWidth: 720,
        collapsible: true,
        resizable: true,
      },
      ...(operations
        ? {
            details: {
              defaultWidth: 400,
              minWidth: 320,
              maxWidth: 720,
              pathLevel: 1,
              closeable: true,
              closed: true,
              openOnSelect: false,
              resizable: true,
            },
          }
        : {}),
      diff: {
        defaultWidth: 560,
        minWidth: 360,
        maxWidth: 980,
        pathLevel: operations ? 2 : 1,
        closeable: true,
        closed: true,
        openOnSelect: false,
        resizable: true,
      },
    },
  });
}
