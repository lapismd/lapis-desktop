/** Fixture actions and observations never enter the visible product DOM. */
type Review = {
  actions?: Record<string, () => unknown>;
  read?: (name: string) => string;
};
const reviews = new WeakMap<HTMLElement, Review>();
export function registerAiReview(root: HTMLElement, review: Review) {
  reviews.set(root, review);
  return () => {
    reviews.delete(root);
  };
}
function reviewFor(canvas: HTMLElement): Review {
  const root = canvas.matches("[data-ai-review]")
    ? canvas
    : canvas.querySelector<HTMLElement>("[data-ai-review]");
  const review = root && reviews.get(root);
  if (!review) throw new Error("The owned AI review fixture is unavailable");
  return review;
}
export async function aiReviewAction(
  canvas: HTMLElement,
  name: string,
): Promise<void> {
  const action = reviewFor(canvas).actions?.[name];
  if (!action) throw new Error(`Unknown AI fixture action: ${name}`);
  await action();
}
export function aiReviewValue(canvas: HTMLElement, name: string): string {
  const read = reviewFor(canvas).read;
  if (!read) throw new Error("The AI fixture has no observations");
  return read(name);
}
