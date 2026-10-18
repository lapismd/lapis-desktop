/** Display-only lookup; native identities and profile resolution stay host-owned. */
export async function reviewGravatar(
  email: string,
): Promise<string | undefined> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized)) return;
  if (normalized.endsWith("@nostr.invalid")) return;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalized),
  );
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `https://www.gravatar.com/avatar/${hash}?d=404&s=80`;
}
