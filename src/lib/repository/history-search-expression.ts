import type { SearchQueryExpression } from "@lapis-notes/api";
import type { HistoryExpression } from "./indexed-search.ts";

/** Lower the shared parser AST; never interpret unsupported syntax as plain text. */
export function historyExpression(
  node: SearchQueryExpression | null,
  field: string | null = null,
): HistoryExpression {
  if (!node) throw new Error("Enter a history search query");
  switch (node.type) {
    case "group":
      return historyExpression(node.expression, field);
    case "and":
    case "or":
      return {
        type: node.type,
        clauses: node.clauses.map((child) => historyExpression(child, field)),
      };
    case "not":
      return { type: "not", operand: historyExpression(node.operand, field) };
    case "field": {
      if (
        ![
          "file",
          "path",
          "content",
          "author",
          "before",
          "after",
          "commit",
        ].includes(node.name)
      )
        throw new Error(`History does not support ${node.name} filters`);
      return historyExpression(node.value, node.name);
    }
    case "literal": {
      if ((node.kind !== "word" && node.kind !== "phrase") || !node.value)
        throw new Error("History supports text and phrase values");
      let value = node.value;
      if (field === "after" || field === "before") {
        const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
          ? `${value}T00:00:00Z`
          : value;
        const millis = Date.parse(date);
        if (!Number.isSafeInteger(millis))
          throw new Error("Use an ISO date for history date filters");
        // A date-only 'before' includes the entire specified UTC day.
        value = String(
          millis +
            (field === "before" && /^\d{4}-\d{2}-\d{2}$/.test(node.value)
              ? 86_399_999
              : 0),
        );
      }
      return { type: "term", field, value };
    }
    default:
      throw new Error("This query predicate is unavailable for history");
  }
}

export function historyTerms(node: SearchQueryExpression | null): string[] {
  if (!node) return [];
  switch (node.type) {
    case "literal":
      return node.value && ["word", "phrase"].includes(node.kind)
        ? [node.value]
        : [];
    case "group":
      return historyTerms(node.expression);
    case "and":
    case "or":
      return node.clauses.flatMap(historyTerms);
    case "field":
      return ["content", "file", "path"].includes(node.name)
        ? historyTerms(node.value)
        : [];
    default:
      return [];
  }
}
export function historyRanges(text: string, terms: string[]) {
  const ranges: { start: number; end: number }[] = [];
  for (const term of terms) {
    const haystack = text.toLowerCase(),
      needle = term.toLowerCase();
    if (!needle) continue;
    let start = haystack.indexOf(needle);
    while (start >= 0 && ranges.length < 100) {
      ranges.push({ start, end: start + needle.length });
      start = haystack.indexOf(needle, start + needle.length);
    }
  }
  return ranges.sort((a, b) => a.start - b.start);
}
