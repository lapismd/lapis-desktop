import {
  initialOperationFiles,
  type OperationFilesState,
} from "./operation-files.ts";
import type {
  LocalGraphCommit,
  LocalCodeSnapshot,
  LocalCodeObjectKey,
  LocalGraphOperationNode,
  LocalOperationDiffData,
} from "@lapismd/jj-history";
export interface OperationState {
  phase: "idle" | "loading" | "ready" | "unavailable";
  busy: boolean;
  workspace: string | null;
  workspaceCommits: LocalGraphCommit[];
  commits: LocalGraphCommit[];
  heads: string[];
  headsReady: boolean;
  operation?: string;
  snapshot?: LocalCodeSnapshot;
  nodes: LocalGraphOperationNode[];
  ready: boolean;
  next?: LocalCodeObjectKey | null;
  selected?: LocalGraphOperationNode;
  parentNodes: LocalGraphOperationNode[];
  parent?: string;
  detail?: LocalOperationDiffData;
  files: OperationFilesState;
}
export const initialOperationState = (): OperationState => ({
  files: initialOperationFiles(),
  phase: "idle",
  busy: false,
  workspace: null,
  workspaceCommits: [],
  commits: [],
  heads: [],
  headsReady: false,
  nodes: [],
  ready: false,
  operation: undefined,
  snapshot: undefined,
  next: undefined,
  selected: undefined,
  parentNodes: [],
  parent: undefined,
  detail: undefined,
});

export const resetOperationSelection = () => ({
  selected: undefined,
  parent: undefined,
  detail: undefined,
  parentNodes: [],
});
