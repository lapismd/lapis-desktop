import {
  initialOperationFiles,
  type OperationFilesState,
} from "./operation-files.ts";
import type {
  LocalCodeSnapshot,
  LocalCodeObjectKey,
  LocalGraphOperationNode,
  LocalOperationDiffData,
} from "@lapismd/jj-history";
export interface OperationState {
  phase: "idle" | "loading" | "ready" | "unavailable";
  busy: boolean;
  heads: string[];
  headsReady: boolean;
  operation?: string;
  snapshot?: LocalCodeSnapshot;
  nodes: LocalGraphOperationNode[];
  ready: boolean;
  next?: LocalCodeObjectKey | null;
  selected?: LocalGraphOperationNode;
  parent?: string;
  detail?: LocalOperationDiffData;
  files: OperationFilesState;
}
export const initialOperationState = (): OperationState => ({
  files: initialOperationFiles(),
  phase: "idle",
  busy: false,
  heads: [],
  headsReady: false,
  nodes: [],
  ready: false,
  operation: undefined,
  snapshot: undefined,
  next: undefined,
  selected: undefined,
  parent: undefined,
  detail: undefined,
});
