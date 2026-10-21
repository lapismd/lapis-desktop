import type { Handle, LocalFileDiffChange } from "@lapismd/jj-history";
import type { FileListingFile } from "@lapismd/design-core/diff";
import type {
  AiHistoryBinding,
  AiTurnRecord,
} from "../../repository/ai-history.ts";
import { changeStats } from "../../repository/history-files.ts";
import { diffText } from "../../repository/history-state.ts";

export type TurnFile = FileListingFile & { diff?: LocalFileDiffChange };
export type TurnComparison = {
  files: TurnFile[];
  complete: boolean;
  countsComplete: boolean;
};
export async function withTurn<T>(
  binding: AiHistoryBinding,
  record: AiTurnRecord,
  action: (handle: Handle) => Promise<T>,
): Promise<T> {
  if (!record.after) throw new Error("This turn has no ending checkpoint.");
  let handle: Handle;
  try {
    handle = await binding.reader.open(record.after.operation);
  } catch {
    // Git carries commit identities, while the original device's operation may
    // not exist. Re-admit the exact commits at one current immutable pin.
    const heads = await binding.reader.heads();
    if (heads.heads.length !== 1)
      throw new Error(
        "Select a repository operation before inspecting imported changes.",
      );
    handle = await binding.reader.open(heads.heads[0]!);
  }
  try {
    return await action(handle);
  } finally {
    await binding.reader.close(handle);
  }
}
export async function readTurnFile(
  binding: AiHistoryBinding,
  record: AiTurnRecord,
  path: string,
) {
  return withTurn(binding, record, async (handle) => {
    const response = await binding.reader.read(handle, {
      kind: "diff",
      query: {
        from: record.before.commit,
        to: record.after!.commit,
        path,
        content: true,
      },
    });
    if (
      response.kind !== "diff" ||
      response.data.from !== record.before.commit ||
      response.data.to !== record.after!.commit ||
      response.data.path !== path
    )
      throw new Error("File comparison returned a different selection.");
    const file = response.data.changes.find((f) => f.path === path);
    if (!file) throw new Error("The selected file is unavailable.");
    return file;
  });
}
export async function readTurnComparison(
  binding: AiHistoryBinding,
  record: AiTurnRecord,
): Promise<TurnComparison> {
  if (record.phase !== "complete" || !record.after)
    throw new Error("This turn's saved comparison is incomplete.");
  return withTurn(binding, record, async (handle) => {
    const paths: LocalFileDiffChange[] = [];
    let cursor: string | null | undefined;
    for (let page = 0; page < 2; page++) {
      const response = await binding.reader.read(handle, {
        kind: "diff_paths",
        query: {
          from: record.before.commit,
          to: record.after!.commit,
          path: "",
          limit: 50,
          anchor: cursor,
          direction: "forward",
        },
      });
      if (
        response.kind !== "diff_paths" ||
        response.data.from !== record.before.commit ||
        response.data.to !== record.after!.commit
      )
        throw new Error("Changed files returned a different selection.");
      paths.push(
        ...response.data.changes.filter(
          (f) => !f.path.split("/").includes(".lapis"),
        ),
      );
      cursor = response.data.next;
      if (!cursor) break;
    }
    let retainedBytes = 0;
    const files: TurnFile[] = [];
    // Four comparisons at a time. Totals are absent when any text is unavailable.
    for (let start = 0; start < paths.length; start += 4) {
      const batch = await Promise.all(
        paths.slice(start, start + 4).map(async (path) => {
          const response = await binding.reader.read(handle, {
            kind: "diff",
            query: {
              from: record.before.commit,
              to: record.after!.commit,
              path: path.path,
              content: true,
            },
          });
          if (
            response.kind !== "diff" ||
            response.data.from !== record.before.commit ||
            response.data.to !== record.after!.commit ||
            response.data.path !== path.path
          )
            throw new Error("File comparison returned a different selection.");
          const diff = response.data.changes.find((f) => f.path === path.path);
          const content = diff && diffText(diff);
          const bytes =
            content && !("unavailable" in content)
              ? new TextEncoder().encode(content.oldText + content.newText)
                  .length
              : 0;
          const retain = !!diff && retainedBytes + bytes <= 2 * 1024 * 1024;
          if (retain) retainedBytes += bytes;
          return {
            path: path.path,
            ...changeStats(diff),
            diff: retain ? diff : undefined,
          };
        }),
      );
      files.push(...batch);
    }
    return {
      files,
      complete: !cursor,
      countsComplete:
        !cursor &&
        files.every(
          (f) => f.additions !== undefined && f.deletions !== undefined,
        ),
    };
  });
}
