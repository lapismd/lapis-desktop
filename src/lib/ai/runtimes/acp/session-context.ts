import {
  InitialAgentContext,
  type AgentProfileContext,
} from "../../core/agent-profile.ts";
export type { AgentProfileContext } from "../../core/agent-profile.ts";
/** Binding-frozen initial context is sent once, separately from authored text. */
export class AcpInitialContext {
  readonly profile: InitialAgentContext;
  constructor(
    profile: AgentProfileContext | undefined,
    private initial?: string,
  ) {
    this.profile = new InitialAgentContext(profile);
  }
  apply(prepared: { text: string; context?: string }) {
    this.profile.apply(prepared);
    if (this.initial) {
      prepared.context = [this.initial, prepared.context]
        .filter(Boolean)
        .join("\n\n");
      this.initial = undefined;
    }
  }
}
