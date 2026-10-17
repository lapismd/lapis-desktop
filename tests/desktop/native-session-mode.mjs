export function nativeSessionMode(options = {}, inherited = process.env) {
  if (
    !options ||
    typeof options !== "object" ||
    Array.isArray(options) ||
    Object.keys(options).some((key) => key !== "background") ||
    (options.background !== undefined &&
      typeof options.background !== "boolean")
  )
    throw new Error("Choose an explicit boolean background API mode.");
  const background = options.background === true;
  const environment = {
    ...inherited,
    LAPIS_DESKTOP_ACCEPTANCE_BACKGROUND: background ? "1" : "0",
  };
  if (background) {
    delete environment.LAPIS_DESKTOP_ACCEPTANCE_REAL_PICKER;
    delete environment.LAPIS_DESKTOP_POPOUT_PROOF;
  }
  return {
    background,
    environment,
    requiredMarkers: background ? ["LAPIS_DESKTOP_ACCEPTANCE_BACKGROUND"] : [],
  };
}

export function assertBackgroundAvailability(executable, listing) {
  const suffix = "/Lapis Notes Acceptance.app/Contents/MacOS/lapis-desktop";
  const active = listing.split("\n").some((line) => {
    const command = line.trim().replace(/^\d+\s+/u, "");
    return command === executable || command.endsWith(suffix);
  });
  if (active)
    throw new Error(
      "Refusing background acceptance while another acceptance app is running.",
    );
}
