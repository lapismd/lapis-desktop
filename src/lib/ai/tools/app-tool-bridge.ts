// SPDX-License-Identifier: Apache-2.0
// App-owned bridge port; authenticated native transport is qualified separately.
import type { AgentEvent } from "../core/events.ts";
import type { AppToolSessionDescriptor } from "../core/runtime.ts";
import type { CreateAppToolSessionInput } from "./app-tool-contracts.ts";
export type AppToolBridgeEvent = { bindingId: string; event: AgentEvent };
export interface AppToolBridgeCoordinator {
  prepare(input: CreateAppToolSessionInput): Promise<AppToolSessionDescriptor>;
  closeBinding(bindingId: string): Promise<void>;
  respondToApproval(requestId: string, optionId: string): boolean;
  subscribe(listener: (event: AppToolBridgeEvent) => void): () => void;
  close(): Promise<void>;
}
