export type RepositoryLogGraphLane = {
  hash: string | null;
  color: string;
};

export function occupyRepositoryLogLane(
  lanes: RepositoryLogGraphLane[],
  hash: string,
  color: string,
): number {
  const vacant = lanes.findIndex((lane) => lane.hash == null);
  const index = vacant === -1 ? lanes.length : vacant;
  const lane = { hash, color };
  if (vacant === -1) lanes.push(lane);
  else lanes[index] = lane;
  return index;
}

export function vacateRepositoryLogLane(
  lanes: RepositoryLogGraphLane[],
  index: number,
): void {
  const lane = lanes[index];
  if (lane) lanes[index] = { ...lane, hash: null };
}

export function trimRepositoryLogLanes(lanes: RepositoryLogGraphLane[]): void {
  while (lanes.length > 0 && lanes.at(-1)?.hash == null) lanes.pop();
}
