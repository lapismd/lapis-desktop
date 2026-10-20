// SPDX-License-Identifier: Apache-2.0; adapted from jj-store community-avatar-picker/image-files.ts.
import { MAX_AGENT_AVATAR_IMAGE_BYTES } from "../../../../lib/ai/settings/agent-avatar.ts";
/** Host-owned persistence bound; the shared picker owns editing and previews. */
export async function readAgentAvatarImage(
  file: File,
  signal: AbortSignal,
): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)
  )
    throw new Error("Choose a PNG, JPEG, GIF, or WebP image");
  if (file.size > MAX_AGENT_AVATAR_IMAGE_BYTES)
    throw new Error("Choose an image smaller than 1 MB");
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const clean = () => signal.removeEventListener("abort", abort);
    const abort = () => {
      reader.abort();
      clean();
      reject(new DOMException("Cancelled", "AbortError"));
    };
    reader.onload = () => {
      clean();
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("The image could not be read. Try again."));
    };
    reader.onerror = () => {
      clean();
      reject(new Error("The image could not be read. Try again."));
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    else reader.readAsDataURL(file);
  });
}
