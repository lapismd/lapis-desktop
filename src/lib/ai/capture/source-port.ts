// SPDX-License-Identifier: Apache-2.0
import type { CapturedSession } from "../conversations/import-types.ts";
/** Transient delivery IDs identify one immutable observation, never a durable reader ACK. */
export type CaptureRead =
  | { type: "idle"; eligible: number; deferred: number }
  | {
      type: "snapshot";
      delivery: string;
      capture: CapturedSession;
      deferred: number;
    };
export interface AiCaptureSource {
  next(signal: AbortSignal): Promise<CaptureRead>;
  confirm(delivery: string, signal: AbortSignal): Promise<void>;
  close(): Promise<void>;
}
export interface AiCaptureSources {
  /** A fresh independently admitted scope for each Start/Stop cycle. */
  connect(): AiCaptureSource;
}
