/** Keep a recognisable prefix and the final two characters without lengthening short IDs. */
export function abbreviateRevisionId(value: string, leadingChars = 5): string {
  const leading = revisionLeadingChars(leadingChars, 5);
  return value.length <= leading + 4
    ? value
    : `${value.slice(0, leading)}..${value.slice(-2)}`;
}

export function revisionLeadingChars(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}
