import type { AppToolSessionDescriptor } from "../../core/runtime.ts";
export interface AcpAppTools {
  target(
    descriptor: AppToolSessionDescriptor | undefined,
    base: string,
  ): string;
  arm(bridgeId: string, turnId: string): Promise<void>;
  end(bridgeId: string, turnId: string): Promise<void>;
}
export type ToolTurnPort = {
  arm(turnId: string): Promise<void>;
  end(turnId: string): Promise<void>;
};
export class ToolTurn {
  #end?: Promise<void>;
  readonly #port: ToolTurnPort;
  readonly #id: string;
  constructor(port: ToolTurnPort, id: string) {
    this.#port = port;
    this.#id = id;
  }
  arm(): Promise<void> {
    return this.#port.arm(this.#id);
  }
  end(): Promise<void> {
    return (this.#end ??= this.#port.end(this.#id));
  }
}
