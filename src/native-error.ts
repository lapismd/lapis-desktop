export function nativeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (error && typeof error === "object" && "message" in error) {
    return Object.assign(
      new Error(String(error.message)),
      "code" in error ? { code: error.code } : {},
    );
  }
  return new Error(
    typeof error === "string" ? error : "The native operation failed",
  );
}
