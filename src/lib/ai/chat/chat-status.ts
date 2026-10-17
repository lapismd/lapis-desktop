// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see src/lib/ai/NOTICE.md.
export function shouldShowWorkingIndicator(
  initializing: boolean,
  busy: boolean,
  error: string | null | undefined,
): boolean {
  return (initializing || busy) && !error;
}
