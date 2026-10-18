<script lang="ts">
  import {
    REPOSITORY_LOG_NODE_RADIUS,
    REPOSITORY_LOG_STROKE_WIDTH,
    repositoryLogLaneStem,
    repositoryLogLaneX,
    repositoryLogMergePath,
    repositoryLogSplitPath,
    repositoryLogConvergePath,
    type RepositoryLogGraphRow,
  } from "../../lib/repository/graph/repository-log-graph.ts";
  let {
    row,
    width,
    rowHeight,
    graphHeight,
    continuous = false,
  }: {
    row: RepositoryLogGraphRow;
    width: number;
    rowHeight: number;
    graphHeight: number;
    continuous?: boolean;
  } = $props();
  const radius = REPOSITORY_LOG_NODE_RADIUS;
  const commitX = $derived(repositoryLogLaneX(row.commitLane));
  const centerY = $derived(rowHeight / 2);
  function laneColor(row: RepositoryLogGraphRow, lane: number): string {
    return row.lanes[lane]?.color ?? "var(--primary)";
  }
</script>

<svg
  class="repository-revision-graph__svg"
  {width}
  height={graphHeight}
  aria-hidden="true"
>
  {#each row.lanes as lane, index (index)}
    {@const x = repositoryLogLaneX(index)}
    {@const stem = repositoryLogLaneStem(row, index, rowHeight)}
    {#if stem.y1 !== stem.y2}
      <line
        x1={x}
        y1={continuous && stem.y1 === centerY ? 0 : stem.y1}
        x2={x}
        y2={continuous && stem.y2 === rowHeight ? graphHeight : stem.y2}
        stroke={lane.color}
        stroke-width={REPOSITORY_LOG_STROKE_WIDTH}
      />
    {/if}
  {/each}
  {#if row.splitFromLane != null}
    <path
      class="repository-revision-graph__edge"
      d={repositoryLogSplitPath(
        repositoryLogLaneX(row.splitFromLane),
        commitX,
        rowHeight,
      )}
      stroke={laneColor(row, row.splitFromLane)}
      stroke-width={REPOSITORY_LOG_STROKE_WIDTH}
    />
  {/if}
  {#each row.mergeFromLanes as mergeLane (mergeLane)}
    <path
      class="repository-revision-graph__edge"
      d={repositoryLogMergePath(
        commitX,
        repositoryLogLaneX(mergeLane),
        rowHeight,
      )}
      stroke={laneColor(row, mergeLane)}
      stroke-width={REPOSITORY_LOG_STROKE_WIDTH}
    />
  {/each}
  {#each row.convergingLanes as convergeLane (convergeLane)}
    <path
      class="repository-revision-graph__edge"
      d={repositoryLogConvergePath(
        repositoryLogLaneX(convergeLane),
        commitX,
        rowHeight,
      )}
      stroke={laneColor(row, convergeLane)}
      stroke-width={REPOSITORY_LOG_STROKE_WIDTH}
    />
  {/each}
  <circle
    class="repository-revision-graph__node"
    cx={commitX}
    cy={centerY}
    r={row.isTip ? radius + 1 : radius}
    fill={laneColor(row, row.commitLane)}
  />
</svg>

<style>
  .repository-revision-graph__svg {
    position: absolute;
    z-index: 2;
    top: 0;
    left: 0;
    overflow: visible;
    pointer-events: none;
  }
  .repository-revision-graph__edge {
    fill: none;
  }
</style>
