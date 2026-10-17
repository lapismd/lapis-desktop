// SPDX-License-Identifier: Apache-2.0
import type { CatalogState } from "../../../lib/ai/catalog/state.svelte.ts";
function shouldIgnoreRowToggle(event: Event): boolean {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("[data-catalog-ignore-toggle]"));
}

export function toggleLeafRow(
  catalog: CatalogState,
  event: Event,
  key: string,
  open: boolean,
): void {
  if (shouldIgnoreRowToggle(event)) return;
  catalog.setOpen(key, !open);
}

export function handleLeafKeydown(
  catalog: CatalogState,
  event: KeyboardEvent,
  key: string,
  open: boolean,
): void {
  if (event.key !== "Enter" && event.key !== " ") return;
  if (shouldIgnoreRowToggle(event)) return;
  event.preventDefault();
  catalog.setOpen(key, !open);
}
