// SPDX-License-Identifier: Apache-2.0
// Application transcript identity; native cursors are never renumbered.
import type { RuntimeEventProvenance } from "./types.ts";

export function runtimeProvenanceKey(source: RuntimeEventProvenance): string {
  return JSON.stringify([
    source.sessionId,
    source.runId,
    source.sequence,
    ...(source.frameIndex === undefined ? [] : [source.frameIndex]),
  ]);
}
