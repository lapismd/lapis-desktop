const key = "lapis.desktop.repository.blame.wrap";

/** A local display preference shared by blame files, independent of the vault. */
export function readBlameWrap(): boolean {
  try {
    return localStorage.getItem(key) !== "false";
  } catch {
    return true;
  }
}

export function saveBlameWrap(wrap: boolean): void {
  try {
    localStorage.setItem(key, String(wrap));
  } catch {
    // Optional browser persistence must not prevent reading recorded source.
  }
}
