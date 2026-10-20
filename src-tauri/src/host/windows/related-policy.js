// Detached documents present the main App; services and network stay with it.
// Install before framework scripts: shared scheme IPC cannot identify a child.
(() => {
  const root =
    document.documentElement ??
    document.appendChild(document.createElement("html"));
  const head =
    document.head ??
    root.insertBefore(document.createElement("head"), root.firstChild);
  const policy = document.createElement("meta");
  policy.httpEquiv = "Content-Security-Policy";
  policy.content = "connect-src 'none'";
  head.prepend(policy);
})();
