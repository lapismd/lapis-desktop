/** Opaque device-owned configuration identity, never endpoint or launch authority. */
export const isProviderProfileId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
export function providerTarget(agent: string, profileId?: string): string {
  if (!profileId) return agent;
  if (agent !== "local" || !isProviderProfileId(profileId))
    throw new Error("Invalid Lapis provider profile");
  return `local:profile:${profileId}`;
}
export const isLocalProviderTarget = (value: string) =>
  value === "local" ||
  (value.startsWith("local:profile:") && isProviderProfileId(value.slice(14)));
