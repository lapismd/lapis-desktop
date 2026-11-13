export function listWindows(run) {
  let output;
  try {
    output = run("wmctrl", ["-lpG"]).trim();
  } catch (error) {
    if (error && typeof error === "object" && error.status === 1) return [];
    throw error;
  }
  return output ? output.split("\n") : [];
}
