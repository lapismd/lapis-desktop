import {
  Notice,
  parseSearchQueryAst,
  type SearchProviderHit,
  type SearchProviderMatch,
} from "@lapis-notes/api";
import { BackgroundWork } from "../../../lib/desktop/background-work.ts";
import { HistoryIndexController } from "../../../lib/repository/history-index-controller.ts";
import {
  historyExpression,
  historyRanges,
  historyTerms,
} from "../../../lib/repository/history-search-expression.ts";
import type {
  IndexedHistoryService,
  IndexedHistoryHit,
} from "../../../lib/repository/indexed-search.ts";
import type { RepositoryPlugin } from "../repository-plugin.ts";

function hitModel(hit: IndexedHistoryHit, query: string): SearchProviderHit {
  const record = hit.record,
    checkpoint = record.revision.checkpoint;
  const path = record.path ?? undefined;
  const commit = record.deleted
    ? (record.previous ?? checkpoint.commit)
    : checkpoint.commit;
  return {
    id: `${checkpoint.commit}/${path ?? "checkpoint"}`,
    groupId: path ?? "checkpoints",
    path,
    title: path
      ? path
          .split("/")
          .at(-1)!
          .replace(/\.[^.]+$/, "")
      : "Checkpoints",
    extension: path?.split(".").at(-1),
    timestamp: checkpoint.timestamp_millis,
    version: {
      id: checkpoint.commit,
      label: checkpoint.description.split("\n")[0] || "Saved checkpoint",
      author: record.revision.author,
      timestamp: checkpoint.timestamp_millis,
      contentId: record.content_id ?? undefined,
    },
    badges: [
      path ? "Saved version" : "Checkpoint",
      ...(record.deleted ? ["Deleted"] : []),
      ...(record.unavailable ? ["Path only"] : []),
    ],
    matches: [
      {
        id: "excerpt",
        field: record.unavailable ? "path" : path ? "content" : "checkpoint",
        text: hit.excerpt,
        ranges: historyRanges(
          hit.excerpt,
          historyTerms(parseSearchQueryAst(query).expression),
        ),
        line: hit.line ?? undefined,
        context:
          hit.line && path && !record.unavailable && !record.deleted
            ? JSON.stringify({ start: hit.line - 1, end: hit.line })
            : undefined,
      },
    ],
    target: {
      operation: checkpoint.operation,
      commit,
      ...(path ? { path } : {}),
      query,
    },
  };
}

export function registerHistoryResultProvider(
  plugin: RepositoryPlugin,
  service: IndexedHistoryService,
) {
  const index = new HistoryIndexController(
    service,
    plugin.feedback("History search index", "history-search-index"),
  );
  const work = new BackgroundWork(plugin.app.notifications, plugin.id);
  const progress = work.follow("Indexing saved vault history", index);
  const listeners = new Set<() => void>();
  let generation = -1,
    closed = false,
    phase = "ready";
  const changed = index.subscribe((state) => {
    if (
      (state.status && generation !== state.status.generation) ||
      phase !== state.phase
    ) {
      generation = state.status?.generation ?? generation;
      phase = state.phase;
      for (const listener of listeners) listener();
    }
  });
  const activate = async (
    hit: SearchProviderHit,
    _match?: SearchProviderMatch,
  ) => {
    if (closed) throw new Error("History search is closed");
    if (hit.target.path)
      await plugin.openBlame(
        hit.target.operation!,
        hit.target.commit!,
        hit.target.path,
      );
    else await plugin.open(hit.target.operation, hit.target.commit);
  };
  const registration = plugin.registerSearchResultProvider("saved-versions", {
    label: "Repository history",
    scope: "history",
    fields: ["file", "path", "content", "author", "before", "after", "commit"],
    modes: ["lexical"],
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async search(request) {
      request.signal.throwIfAborted();
      const page = await work.run("Searching saved vault history", () =>
        service.query({
          expression: historyExpression(request.query.expression),
          case_sensitive: request.caseSensitive,
          cursor: request.cursor ?? null,
          limit: Math.min(100, request.limit),
        }),
      );
      request.signal.throwIfAborted();
      if (!page.status.complete && phase !== "paused") index.schedule();
      return {
        generation: String(page.status.generation),
        hits: page.hits.map((hit) => hitModel(hit, request.text)),
        next: page.next ?? undefined,
        status: {
          phase: page.status.complete
            ? "ready"
            : phase === "paused"
              ? "paused"
              : "indexing",
          description:
            phase === "paused"
              ? "Indexing paused; showing available saved history"
              : undefined,
          indexed: page.status.indexed,
          complete: page.status.complete,
          omitted: page.status.omitted,
        },
      };
    },
    activate,
    async expand(hit, match, direction, signal) {
      signal.throwIfAborted();
      const range = JSON.parse(match.context ?? "{}");
      const start =
        direction === "before"
          ? Math.max(0, Number(range.start) - 5)
          : Number(range.start);
      const end =
        direction === "after" ? Number(range.end) + 5 : Number(range.end);
      const result = await service.context({
        commit: hit.target.commit!,
        path: hit.target.path!,
        start,
        end,
      });
      signal.throwIfAborted();
      return {
        ...match,
        text: result.text,
        line: result.start + 1,
        ranges: historyRanges(
          result.text,
          historyTerms(parseSearchQueryAst(hit.target.query ?? "").expression),
        ),
        context:
          result.before || result.after
            ? JSON.stringify({ start: result.start, end: result.end })
            : undefined,
      };
    },
  });
  index.schedule();
  const capture = plugin.backup?.controller.subscribe((state) => {
    if (state.checkpoint && state.phase === "ready") index.schedule();
  });
  plugin.app.workspace.onLayoutReady(() => {
    if (closed) return;
    plugin.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.getViewState();
      if (
        view.type !== "repository-history-search" &&
        view.state?.__missingViewType !== "repository-history-search"
      )
        return;
      void leaf
        .setViewState(
          {
            ...view,
            type: "search",
            state: {
              query:
                typeof view.state?.query === "string" ? view.state.query : "",
              scope: "history",
            },
          },
          { activatePlugins: false },
        )
        .catch((error) => plugin.report(error));
    });
  });
  plugin.addCommand({
    id: "open-history-search",
    name: "Search saved vault history",
    callback: () => {
      if (!plugin.app.plugins.plugins.has("search")) {
        new Notice("Enable Search to search saved vault history");
        return;
      }
      void plugin.app.commands
        .executeCommand("search:open-search", "", "history")
        .catch((error) => plugin.report(error));
    },
  });
  return async () => {
    closed = true;
    registration.dispose();
    capture?.();
    changed();
    await index.close();
    progress();
    listeners.clear();
  };
}
