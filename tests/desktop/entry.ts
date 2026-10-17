import { launchDesktop } from "../../src/lib/desktop/launch.ts";

await launchDesktop(async () => {
  const root = document.querySelector(
    '#boot [data-ui-component="workspace-startup"]',
  );
  const progress = root?.querySelector('[role="progressbar"]');
  const logo = root?.querySelector('[data-ui-part="logo"]');
  const logoRect = logo?.getBoundingClientRect();
  Object.assign(globalThis, {
    __lapisShellStartupAcceptance: {
      progress: Boolean(progress && progress.getBoundingClientRect().width > 0),
      message: root?.querySelector('[data-ui-part="message"]')?.textContent,
      standaloneLogos: document.querySelectorAll("#boot > img").length,
      appChildren: document.getElementById("app")?.childElementCount,
      logoTop: logoRect?.top,
      logoCenter: logoRect ? logoRect.x + logoRect.width / 2 : null,
      windowCenter: innerWidth / 2,
    },
  });
  await import("./runtime-entry.ts");
});
