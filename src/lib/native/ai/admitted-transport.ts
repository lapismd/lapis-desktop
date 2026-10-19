import type {
  AcpTransport,
  OpenOptions,
  SessionRequest,
  StreamMessage,
} from "@lapismd/ai";
import { OwnedAiWork } from "../../ai/core/owned-work.ts";

export interface AiAdmissionPort {
  create(): AcpTransport;
  activate(): Promise<void>;
  release(reload: boolean): Promise<void>;
  allowed(): boolean;
}

/** One App's admission and channel lifetime, independent of presentation. */
export class AdmittedAiTransport implements AcpTransport {
  readonly #work = new OwnedAiWork();
  readonly #streams = new Map<string, string>();
  #raw?: AcpTransport;
  #admission?: Promise<void>;
  #attempted = false;
  #closed = false;
  #leaving = false;
  #shutdown?: Promise<void>;
  #targetCount?: number;
  get targetCount(): number | undefined {
    return this.#targetCount;
  }
  constructor(private readonly port: AiAdmissionPort) {}

  #run<T>(
    action: (transport: AcpTransport) => Promise<T>,
    cleanup = false,
  ): Promise<T> {
    const closed = () => this.#closed || (!cleanup && this.#leaving);
    if (closed()) return Promise.reject(new Error("AI transport is closed"));
    if (!cleanup && !this.port.allowed())
      return Promise.reject(new Error("AI is disabled in this workspace"));
    if (cleanup && !this.#admission)
      return Promise.reject(new Error("AI has no admitted scope"));
    return this.#work.run(async () => {
      this.#attempted = true;
      this.#admission ??= this.port.activate().catch((error) => {
        this.#admission = undefined;
        throw error;
      });
      await this.#admission;
      if (closed()) throw new Error("AI transport is closed");
      if (!cleanup && !this.port.allowed())
        throw new Error("AI is disabled in this workspace");
      this.#raw ??= this.port.create();
      return action(this.#raw);
    });
  }
  invalidateAdmission(): void {
    this.#admission = undefined;
    this.#targetCount = undefined;
  }
  targets() {
    return this.#run(async (raw) => {
      const targets = await raw.targets();
      if (!this.#closed && !this.#leaving) this.#targetCount = targets.length;
      return targets;
    });
  }
  list() {
    return this.#run((raw) => raw.list());
  }
  open(options: OpenOptions) {
    return this.#run((raw) => raw.open(options));
  }
  submit(id: string, requestId: string, request: SessionRequest) {
    return this.#run((raw) => raw.submit(id, requestId, request));
  }
  snapshot(id: string, after: number) {
    return this.#run((raw) => raw.snapshot(id, after));
  }
  attach(id: string, after: number, receive: (message: StreamMessage) => void) {
    return this.#run(async (raw) => {
      const token = await raw.attach(id, after, (message) => {
        if (!this.#closed && !this.#leaving) receive(message);
      });
      this.#streams.set(token, id);
      return token;
    });
  }
  detach(id: string, token: string) {
    return this.#run(async (raw) => {
      await raw.detach(id, token);
      this.#streams.delete(token);
    }, true);
  }
  ack(id: string, token: string, sequence: number) {
    return this.#run((raw) => raw.ack(id, token, sequence), true);
  }
  close(id: string) {
    return this.#run(async (raw) => {
      await raw.close(id);
      for (const [token, session] of this.#streams)
        if (session === id) this.#streams.delete(token);
    }, true);
  }
  fence(): void {
    this.#leaving = true;
  }
  dispose(reload: boolean): Promise<void> {
    this.#closed = true;
    return (this.#shutdown ??= this.#dispose(reload).catch((error) => {
      this.#shutdown = undefined;
      throw error;
    }));
  }
  async #dispose(reload: boolean): Promise<void> {
    await this.#work.settle();
    const results = await Promise.allSettled(
      [...this.#streams].map(async ([token, id]) => {
        await this.#raw!.detach(id, token);
        this.#streams.delete(token);
      }),
    );
    const detachFailures = results.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    );
    if (reload && detachFailures.length)
      throw new AggregateError(detachFailures, "AI stream cleanup failed");
    if (this.#attempted) {
      try {
        await this.port.release(reload);
        // Full revocation supervises every native subscription and worker,
        // resolving even an uncertain detach acknowledgement.
        if (!reload) {
          this.#streams.clear();
          return;
        }
      } catch (error) {
        results.push({ status: "rejected", reason: error });
      }
    }
    const failures = results.flatMap((result) =>
      result.status === "rejected" ? [result.reason] : [],
    );
    if (failures.length)
      throw new AggregateError(failures, "AI native cleanup failed");
  }
}
