import type { terminalFixture } from "./fixture";

export type TerminalReview = {
  fixture: ReturnType<typeof terminalFixture>;
  restore(): Promise<void>;
  move(): Promise<void>;
  close(): Promise<void>;
  disable(): Promise<void>;
  exit(): Promise<void>;
  resize(): Promise<void>;
  inspect(): Promise<{
    sessions: number;
    inputs: string;
    dimensions: string;
    scrolls: string;
    preferences: string;
    configuration: string;
  }>;
};

const reviews = new WeakMap<HTMLElement, TerminalReview>();

export function registerTerminalReview(
  root: HTMLElement,
  review: TerminalReview,
) {
  reviews.set(root, review);
  return () => reviews.delete(root);
}

/** Story actions and observations stay outside the product's visible surface. */
export function terminalReview(canvas: HTMLElement): TerminalReview {
  const root = canvas.querySelector<HTMLElement>("[data-terminal-scenario]");
  const review = root && reviews.get(root);
  if (!review) throw new Error("The owned Terminal review is unavailable");
  return review;
}
