/** Adapt the shared workspace's public regions to Tauri's HTML drag handles. */
export function installWindowDragRegions(root: HTMLElement): () => void {
  const source = "data-desktop-drag-region";
  const target = "data-tauri-drag-region";
  function update(element: Element): void {
    const value = element.getAttribute(source);
    if (value === null) element.removeAttribute(target);
    else element.setAttribute(target, value === "false" ? "false" : "deep");
  }
  function scan(element: Element): void {
    if (element.hasAttribute(source)) update(element);
    element.querySelectorAll(`[${source}]`).forEach(update);
  }
  scan(root);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") update(record.target as Element);
      else
        for (const node of record.addedNodes)
          if (node.nodeType === Node.ELEMENT_NODE) scan(node as Element);
    }
  });
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [source],
  });
  return () => {
    observer.disconnect();
    root
      .querySelectorAll(`[${source}]`)
      .forEach((element) => element.removeAttribute(target));
  };
}
