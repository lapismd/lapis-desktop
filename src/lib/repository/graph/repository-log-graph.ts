import type { RepositoryLogDevice, RepositoryLogRevision } from "./model.ts";
import * as laneState from "./repository-log-lanes.ts";
export type { RepositoryLogGraphLane } from "./repository-log-lanes.ts";

export const REPOSITORY_LOG_ROW_HEIGHT = 76;
export const REPOSITORY_LOG_LANE_WIDTH = 12;
export const REPOSITORY_LOG_NODE_RADIUS = 4;
export const REPOSITORY_LOG_LEFT_PAD = 8;
export const REPOSITORY_LOG_STROKE_WIDTH = 2.5;

export const REPOSITORY_LOG_LANE_COLORS = [
  "var(--ui-log-lane-1, #2563eb)",
  "var(--ui-log-lane-2, #16a34a)",
  "var(--ui-log-lane-3, #d97706)",
  "var(--ui-log-lane-4, #dc2626)",
  "var(--ui-log-lane-5, #7c3aed)",
  "var(--ui-log-lane-6, #0891b2)",
  "var(--ui-log-lane-7, #db2777)",
  "var(--ui-log-lane-8, #65a30d)",
] as const;

export type RepositoryLogGraphRow = {
  revision: RepositoryLogRevision;
  commitLane: number;
  lanes: laneState.RepositoryLogGraphLane[];
  mergeFromLanes: number[];
  convergingLanes: number[];
  splitFromLane: number | null;
  commitStartsLane: boolean;
  isFirst: boolean;
  isTip: boolean;
  deviceAliases: string[];
  changeIdShort: string;
  changeIdEncoded: string;
  commitIdShort: string;
};

const JJ_REVERSE_HEX = "zyxwvutsrqponmlk";
export const REPOSITORY_LOG_ID_PREFIX = 8;

export function encodeJjChangeId(hex: string): string {
  if (!/^[0-9a-fA-F]+$/u.test(hex) || hex.length % 2 !== 0) return "";
  return [...hex.toLowerCase()]
    .map((digit) => JJ_REVERSE_HEX[Number.parseInt(digit, 16)] ?? "")
    .join("");
}

export function shortestRepositoryLogPrefix(
  values: readonly string[],
  min = REPOSITORY_LOG_ID_PREFIX,
): Map<string, string> {
  const prefixes = new Map<string, string>();
  for (const value of values) {
    if (!value) continue;
    let length = Math.min(Math.max(min, 1), value.length);
    while (
      length < value.length &&
      values.some(
        (other) => other !== value && other.startsWith(value.slice(0, length)),
      )
    ) {
      length += 1;
    }
    prefixes.set(value, value.slice(0, length));
  }
  return prefixes;
}

export function repositoryLogRowLabel(row: {
  revision: RepositoryLogRevision;
  changeIdShort: string;
  commitIdShort: string;
}): string {
  return [
    row.revision.message,
    row.changeIdShort,
    row.commitIdShort,
    row.revision.reason === "merge" ? "Merge" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function tipRevisionIds(
  revisions: readonly RepositoryLogRevision[],
): string[] {
  const referenced = new Set<string>();
  for (const revision of revisions) {
    for (const parent of revision.parents) referenced.add(parent);
  }
  return revisions
    .filter((revision) => !referenced.has(revision.eventId))
    .map((revision) => revision.eventId);
}

export function repositoryLogLaneX(lane: number): number {
  return (
    REPOSITORY_LOG_LEFT_PAD +
    lane * REPOSITORY_LOG_LANE_WIDTH +
    REPOSITORY_LOG_LANE_WIDTH / 2
  );
}

export function repositoryLogLaneStem(
  row: RepositoryLogGraphRow,
  lane: number,
  rowHeight = REPOSITORY_LOG_ROW_HEIGHT,
): { y1: number; y2: number } {
  if (row.lanes[lane]?.hash == null) return { y1: 0, y2: 0 };
  const center = rowHeight / 2;
  const isSplitCommitLane =
    row.splitFromLane != null && lane === row.commitLane;
  const starts =
    row.commitStartsLane && row.commitLane === lane && !isSplitCommitLane;
  const converge = row.convergingLanes.includes(lane);
  return {
    y1: row.isFirst || starts ? center : 0,
    y2: isSplitCommitLane ? center : converge ? 0 : rowHeight,
  };
}

export function repositoryLogSplitPath(
  parentX: number,
  commitX: number,
  rowHeight = REPOSITORY_LOG_ROW_HEIGHT,
): string {
  const centerY = rowHeight / 2;
  return `M ${parentX} ${rowHeight} C ${parentX} ${rowHeight - 10}, ${commitX} ${centerY + 10}, ${commitX} ${centerY}`;
}

export function repositoryLogMergePath(
  commitX: number,
  parentX: number,
  rowHeight = REPOSITORY_LOG_ROW_HEIGHT,
): string {
  const centerY = rowHeight / 2;
  return `M ${commitX} ${centerY} C ${commitX} ${centerY + 14}, ${parentX} ${centerY + 6}, ${parentX} ${rowHeight}`;
}

export function repositoryLogConvergePath(
  fromX: number,
  commitX: number,
  rowHeight = REPOSITORY_LOG_ROW_HEIGHT,
): string {
  const centerY = rowHeight / 2;
  return `M ${fromX} 0 C ${fromX} 10, ${commitX} ${centerY - 10}, ${commitX} ${centerY}`;
}

export function repositoryLogContentLeft(row: RepositoryLogGraphRow): number {
  const rightmost = Math.max(
    row.lanes.length - 1,
    row.mergeFromLanes.length ? Math.max(...row.mergeFromLanes) : 0,
    row.commitLane,
  );
  return (
    REPOSITORY_LOG_LEFT_PAD +
    (rightmost + 1) * REPOSITORY_LOG_LANE_WIDTH +
    REPOSITORY_LOG_LANE_WIDTH
  );
}

export function repositoryLogSvgWidth(rows: RepositoryLogGraphRow[]): number {
  let maxLanes = 1;
  for (const row of rows) {
    maxLanes = Math.max(
      maxLanes,
      row.lanes.length,
      row.mergeFromLanes.length ? Math.max(...row.mergeFromLanes) + 1 : 0,
      row.commitLane + 1,
    );
  }
  return (
    REPOSITORY_LOG_LEFT_PAD +
    maxLanes * REPOSITORY_LOG_LANE_WIDTH +
    REPOSITORY_LOG_LANE_WIDTH
  );
}

export function buildRepositoryLogGraph(
  revisions: readonly RepositoryLogRevision[],
  devices: readonly RepositoryLogDevice[] = [],
): RepositoryLogGraphRow[] {
  const lanes: laneState.RepositoryLogGraphLane[] = [];
  let colorIndex = 0;
  const rows: RepositoryLogGraphRow[] = [];
  const tips = new Set(tipRevisionIds(revisions));
  const aliasesByHead = new Map<string, string[]>();
  for (const device of devices) {
    const aliases = aliasesByHead.get(device.revisionEventId) ?? [];
    aliases.push(device.alias);
    aliasesByHead.set(device.revisionEventId, aliases);
  }
  const changeIds = revisions.map((revision) =>
    encodeJjChangeId(revision.changeId),
  );
  const changeShorts = shortestRepositoryLogPrefix(changeIds);
  const commitShorts = shortestRepositoryLogPrefix(
    revisions.map((revision) => revision.eventId),
  );

  for (let commitIndex = 0; commitIndex < revisions.length; commitIndex += 1) {
    const revision = revisions[commitIndex];
    if (!revision) continue;
    let commitLane = lanes.findIndex((lane) => lane.hash === revision.eventId);
    let commitStartsLane = false;
    if (commitLane === -1) {
      commitStartsLane = true;
      commitLane = laneState.occupyRepositoryLogLane(
        lanes,
        revision.eventId,
        REPOSITORY_LOG_LANE_COLORS[
          colorIndex++ % REPOSITORY_LOG_LANE_COLORS.length
        ] ?? REPOSITORY_LOG_LANE_COLORS[0],
      );
    }

    const currentLanes = lanes.map((lane) => ({ ...lane }));
    const convergingLanes = currentLanes.flatMap((lane, index) =>
      lane.hash === revision.eventId && index !== commitLane ? [index] : [],
    );
    const firstParent = revision.parents[0];
    const otherParents = revision.parents.slice(1);
    const firstParentLane = firstParent
      ? currentLanes.findIndex((lane) => lane.hash === firstParent)
      : -1;
    const splitFromLane =
      commitStartsLane &&
      firstParentLane !== -1 &&
      firstParentLane !== commitLane
        ? firstParentLane
        : null;
    const currentColor =
      lanes[commitLane]?.color ?? REPOSITORY_LOG_LANE_COLORS[0];
    const continueLane = commitLane;
    for (let index = lanes.length - 1; index >= 0; index -= 1) {
      if (index !== continueLane && lanes[index]?.hash === revision.eventId) {
        laneState.vacateRepositoryLogLane(lanes, index);
      }
    }
    if (firstParent) {
      lanes[continueLane] = { hash: firstParent, color: currentColor };
    } else {
      laneState.vacateRepositoryLogLane(lanes, continueLane);
    }

    laneState.trimRepositoryLogLanes(lanes);

    const mergeFromLanes: number[] = [];
    for (const parent of otherParents) {
      const existing = lanes.findIndex((lane) => lane.hash === parent);
      if (existing !== -1) {
        mergeFromLanes.push(existing);
        continue;
      }
      const parentLane = laneState.occupyRepositoryLogLane(
        lanes,
        parent,
        REPOSITORY_LOG_LANE_COLORS[
          colorIndex++ % REPOSITORY_LOG_LANE_COLORS.length
        ] ?? REPOSITORY_LOG_LANE_COLORS[0],
      );
      mergeFromLanes.push(parentLane);
    }

    rows.push({
      revision,
      commitLane,
      lanes: currentLanes,
      mergeFromLanes,
      convergingLanes,
      splitFromLane,
      commitStartsLane,
      isFirst: commitIndex === 0,
      isTip: tips.has(revision.eventId),
      deviceAliases: aliasesByHead.get(revision.eventId) ?? [],
      changeIdShort: changeShorts.get(changeIds[commitIndex] ?? "") ?? "",
      changeIdEncoded: changeIds[commitIndex] ?? "",
      commitIdShort:
        commitShorts.get(revision.eventId) ??
        revision.eventId.slice(0, REPOSITORY_LOG_ID_PREFIX),
    });
  }

  return rows;
}
