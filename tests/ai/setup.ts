// Retained policy tests exercise public in-memory Vault exports without a DOM.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
