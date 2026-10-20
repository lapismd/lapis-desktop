// SPDX-License-Identifier: Apache-2.0
/** Portable presentation only; never a file path or an execution capability. */
export const MAX_AGENT_AVATAR_IMAGE_BYTES = 1024 * 1024;
const MAX_AVATAR_DATA_URL_LENGTH =
  Math.ceil(MAX_AGENT_AVATAR_IMAGE_BYTES / 3) * 4 + 64;
export function validateAgentAvatar(value: unknown): string | undefined {
  if (value === undefined || value === "") return undefined;
  if (
    typeof value !== "string" ||
    value.length > MAX_AVATAR_DATA_URL_LENGTH ||
    /[\x00-\x1f\x7f]/u.test(value)
  )
    throw new Error("Invalid agent avatar");
  if (
    /^data:image\/(?:png|jpeg|gif|webp);base64,[a-z0-9+/]+={0,2}$/iu.test(value)
  )
    return value;
  // The shared AvatarPicker encodes emoji/initial selections as an SVG image.
  if (
    value.startsWith("data:image/svg+xml,") &&
    value.length <= 32768 &&
    value.length > 19
  )
    return value;
  try {
    const url = new URL(value);
    if (
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      value.length <= 2048
    )
      return value;
  } catch {
    /* Refuse non-URL values below. */
  }
  throw new Error(
    "Use an HTTP(S) image URL or an image from the avatar picker",
  );
}
export function validateAgentAvatarBackground(
  value: unknown,
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^#[0-9a-f]{6}$/iu.test(value))
    throw new Error("Invalid agent avatar background");
  return value;
}
