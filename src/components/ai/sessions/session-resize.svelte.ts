// SPDX-License-Identifier: Apache-2.0; adapted from jj-store 08b58c7e.
// Community's bounded pointer/keyboard inbox resizing, maintained locally.
export function createSessionResize(
  body: () => HTMLElement | null,
  list: () => HTMLElement | null,
) {
  let width = $state<number>();
  let available = $state(704);
  let pointer = $state<number | null>(null);
  let startX = 0,
    startWidth = 0;
  function bounds() {
    return {
      min: 224,
      max: Math.max(224, Math.min(480, available - 320)),
    };
  }
  function clamp(value: number) {
    const { min, max } = bounds();
    return Math.min(max, Math.max(min, value));
  }
  function current() {
    return width === undefined
      ? (list()?.getBoundingClientRect().width ?? 368)
      : clamp(width);
  }
  $effect(() => {
    const element = body();
    if (!element) return;
    available = element.clientWidth;
    const observer = new ResizeObserver(
      () => (available = element.clientWidth),
    );
    observer.observe(element);
    return () => observer.disconnect();
  });
  function finish(event: PointerEvent) {
    if (event.pointerId !== pointer) return;
    pointer = null;
    const element = event.currentTarget as HTMLElement;
    if (element.hasPointerCapture(event.pointerId))
      element.releasePointerCapture(event.pointerId);
  }
  return {
    get width() {
      return width === undefined ? undefined : clamp(width);
    },
    get resizing() {
      return pointer !== null;
    },
    reset() {
      width = undefined;
    },
    begin(event: PointerEvent) {
      if (event.button !== 0) return;
      pointer = event.pointerId;
      startX = event.clientX;
      startWidth = current();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    move(event: PointerEvent) {
      if (event.pointerId === pointer)
        width = clamp(startWidth + event.clientX - startX);
    },
    finish,
    key(event: KeyboardEvent) {
      const { min, max } = bounds();
      let next = current();
      if (event.key === "ArrowLeft") next -= 16;
      else if (event.key === "ArrowRight") next += 16;
      else if (event.key === "Home") next = min;
      else if (event.key === "End") next = max;
      else return;
      event.preventDefault();
      width = clamp(next);
    },
  };
}
