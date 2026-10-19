import { posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { repositoryFiles, readRepositoryFile } from "./repository-files.mjs";

export function countedLines(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//gu, "")
    .replace(/<!--[\s\S]*?-->/gu, "")
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("//")).length;
}
export function ambientApp(source) {
  const roots = new Set(["globalThis", "window", "self"]);
  let size;
  do {
    size = roots.size;
    for (const match of source.matchAll(/\b([\w$]+)\s*=\s*([\w$]+)\b/gu))
      if (roots.has(match[2])) roots.add(match[1]);
  } while (roots.size !== size);
  const names = [...roots].join("|");
  return (
    new RegExp(
      `\\b(?:${names})\\s*(?:(?:\\?\\.|\\.)\\s*app\\b|(?:\\?\\.)?\\s*\\[\\s*["']app["']\\s*\\])`,
      "u",
    ).test(source) ||
    /\{[^}]*\bapp\b[^}]*\}\s*=\s*(?:globalThis|window|self)\b/u.test(source) ||
    /Reflect\.(?:get|set)\s*\(\s*(?:globalThis|window|self)\s*,\s*["']app["']/u.test(
      source,
    )
  );
}
function importsTestCode(file, source) {
  for (const [, specifier] of source.matchAll(
    /(?:from\s*|import\s*\(?\s*)["']([^"']+)["']/gu,
  )) {
    const target = specifier.startsWith(".")
      ? posix.normalize(posix.join(posix.dirname(file), specifier))
      : specifier;
    if (
      /(?:^|\/)(?:tests|fixtures)\/|\.(?:test|spec|stories)\./u.test(target) ||
      /^(?:\.\.\/)*catalog\//u.test(target)
    )
      return true;
  }
  return false;
}
export function auditSources(files, read, { appOnly = false } = {}) {
  const findings = [];
  const report = (file, code, message, rule = "LD-GOV-005") =>
    findings.push({ file, line: 1, code, rule, message });
  for (const file of files) {
    if (
      !/\.(?:ts|mjs|js|rs|svelte|css)$/u.test(file) ||
      file.startsWith("public/")
    )
      continue;
    const source = read(file);
    const production = /^(?:src|src-tauri\/src)\//u.test(file);
    if (production && ambientApp(source))
      report(
        file,
        "LD-APP-AMBIENT",
        "Receive App explicitly; ambient App access is prohibited.",
      );
    if (appOnly) continue;
    if (/^src-tauri\/src\/(?!main\.rs$|lib\.rs$)[^/]+$/u.test(file))
      report(
        file,
        "LD-NATIVE-LAYOUT",
        "Keep only crate entrypoints at the native source root; group implementation by feature.",
      );
    const limit = /(?:^tests\/|\.(?:test|spec)\.)/u.test(file)
      ? 500
      : /\.stories\./u.test(file)
        ? 400
        : 300;
    if (countedLines(source) > limit)
      report(
        file,
        "LD-SOURCE-SIZE",
        `Split this responsibility: exceeds ${limit} counted lines.`,
      );
    if (production && importsTestCode(file, source))
      report(
        file,
        "LD-SOURCE-TEST-IMPORT",
        "Production cannot import test or catalog code.",
      );
    if (production && /(?:\bDeno\.|["']jsr:|deno-host-services)/u.test(source))
      report(
        file,
        "LD-RUNTIME-DENO",
        "The native desktop has no Deno runtime dependency.",
        "LD-GOV-006",
      );
    if (
      file.startsWith("src/") &&
      /@lapismd\/(?:ai-controller|ai-host)\b|(?:from\s*|import\s*\(?\s*)["'](?:node:|acpx(?:\/|["']))|user-agents-node|desktop_agent_acp_/u.test(
        source,
      )
    )
      report(
        file,
        "LD-AI-HOST-RUNTIME",
        "Keep AI execution in the admitted Rust host and use public lapis-ai clients.",
        "LD-AI-001",
      );
    if (
      file.startsWith("src/") &&
      /class(?:Name)?\s*=\s*["'][^"']*(?:\b(?:flex|grid|items-|gap-|p-\d|m-\d|text-|bg-|rounded-))/u.test(
        source,
      )
    )
      report(
        file,
        "LD-STYLE-UTILITY",
        "Use scoped native CSS and public Design Core tokens.",
      );
    if (
      file.startsWith("src/") &&
      /(?:\.cm-|\.bits-|\[data-radix)/u.test(source)
    )
      report(file, "LD-STYLE-INTERNAL", "Use public component styling hosts.");
  }
  return findings;
}
export function auditManifest(manifest, capabilities, normalConfig) {
  const findings = [];
  const report = (file, code, message) =>
    findings.push({ file, line: 1, code, rule: "LD-GOV-006", message });
  for (const section of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
  ])
    for (const [name, version] of Object.entries(manifest[section] ?? {}))
      if (
        /^(?:file:|link:|workspace:|git|https?:|\/|\.\.)/u.test(version) &&
        !(
          manifest.private === true &&
          ((name === "@lapismd/terminal" &&
            version === "link:../lapis-terminal/packages/terminal") ||
            (name === "@lapismd/ai" &&
              version === "link:../lapis-ai/packages/ai") ||
            (name === "@lapismd/jj-history" &&
              version === "link:../jj-store/packages/jj-history"))
        )
      )
        report(
          "package.json",
          "LD-PACKAGE-LOCAL",
          `${name} must use a registry range.`,
        );
  const expected = [
    "lapis-terminal:session",
    "allow-desktop-terminal-admit",
    "allow-desktop-terminal-release",
    "allow-desktop-ai-user-commands",
    "allow-desktop-ai-admit",
    "allow-desktop-ai-release",
    "allow-desktop-ai-backends",
    "lapis-ai:acp-session",
    "allow-desktop-repository-admit",
    "allow-desktop-backup-start",
    "allow-desktop-backup-capture",
    "allow-desktop-backup-stop",
    "allow-desktop-backup-restore",
    "allow-desktop-forge-accounts",
    "allow-desktop-backup-remote",
    "allow-desktop-backup-sync",
    "allow-desktop-backup-search",
    "allow-desktop-repository-release",
    "allow-desktop-repository-working-copy",
    "jj-store:local-history",
    "core:event:allow-listen",
    "core:event:allow-unlisten",
    "allow-shell-info",
    "allow-shell-ready",
    "allow-desktop-clipboard-read",
    "allow-desktop-clipboard-write",
    "allow-desktop-external-open",
    "allow-desktop-notify",
    "allow-desktop-url-next",
    "allow-desktop-url-ack",
    "allow-desktop-url-enqueue",
    "allow-lifecycle-reload",
    "allow-lifecycle-quit",
    "allow-lifecycle-result",
    "allow-vault-restore",
    "allow-vault-remember-notes",
    "allow-vault-recents",
    "allow-vault-select",
    "allow-vault-open-recent",
    "allow-vault-close",
    "allow-vault-fs",
    "allow-vault-watch-start",
    "allow-vault-watch-stop",
    "allow-vault-db-open",
    "allow-vault-db-execute",
    "allow-vault-db-close",
    "core:window:allow-start-dragging",
    "core:window:allow-internal-toggle-maximize",
  ];
  if (
    capabilities.windows?.join(",") !== "main" ||
    capabilities.remote ||
    capabilities.local !== true ||
    capabilities.permissions?.length !== expected.length ||
    expected.some(
      (permission) => !capabilities.permissions?.includes(permission),
    )
  )
    report(
      "src-tauri/capabilities/main.json",
      "LD-CAPABILITY-SCOPE",
      "Keep the main-window permission set exact and local.",
    );
  if (
    normalConfig.app?.withGlobalTauri !== false ||
    normalConfig.app?.security?.capabilities?.join(",") !== "main"
  )
    report(
      "src-tauri/tauri.conf.json",
      "LD-AUTOMATION-EXPOSED",
      "Normal configuration must select only main and disable global Tauri.",
    );
  return findings;
}
export function sourceFindings(root, options = {}) {
  const read = (file) => readRepositoryFile(root, file);
  const findings = auditSources(repositoryFiles(root), read, options);
  if (!options.appOnly)
    findings.push(
      ...auditManifest(
        JSON.parse(read("package.json")),
        JSON.parse(read("src-tauri/capabilities/main.json")),
        JSON.parse(read("src-tauri/tauri.conf.json")),
      ),
    );
  return findings;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const findings = sourceFindings(process.cwd(), {
    appOnly: process.argv.includes("--app-only"),
  });
  for (const finding of findings)
    console.error(
      `${finding.file}:${finding.line} ${finding.code}: ${finding.message}`,
    );
  if (findings.length) process.exitCode = 1;
  else console.log("Source boundaries pass.");
}
