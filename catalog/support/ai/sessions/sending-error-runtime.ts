// SPDX-License-Identifier: Apache-2.0
import { FakeAgentRuntime } from "../../../../tests/ai/support/fake-runtime.ts";
import type { AgentRequest } from "../../../../src/lib/ai/core/runtime.ts";

/** Reject one catalog-only turn before dispatch; explicit retry uses the normal fake runtime. */
export class SendingErrorRuntime extends FakeAgentRuntime {
  private failed = false;
  override async start(request: AgentRequest) {
    if (!this.failed) {
      this.failed = true;
      throw Object.assign(
        new Error(
          "Codex could not start this turn. Your message is retained. Please retry.",
        ),
        { outcome: "rejected" },
      );
    }
    return super.start(request);
  }
}
