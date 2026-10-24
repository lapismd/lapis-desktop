const completions = new WeakMap<HTMLElement, Promise<void>>();

export function registerNotesReadiness(
  root: HTMLElement,
  completion: Promise<void>,
): () => void {
  completions.set(root, completion);
  return () => {
    if (completions.get(root) === completion) completions.delete(root);
  };
}

/** Join the owning fixture's startup before asserting the rendered controls. */
export function notesReady(canvas: HTMLElement): Promise<void> {
  const roots = canvas.querySelectorAll<HTMLElement>(".notes-demo");
  const completion = roots.length === 1 && completions.get(roots[0]!);
  if (!completion) throw new Error("No unique owned Notes fixture");
  return completion;
}
