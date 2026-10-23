// SPDX-License-Identifier: Apache-2.0
// Retained from the Lapis AI plugin; see ../NOTICE.md.
import {
  CONVERSATION_SCHEMA_VERSION,
  LEGACY_CONVERSATION_SCHEMA_VERSION,
  PREVIOUS_CONVERSATION_SCHEMA_VERSION,
} from "./types.ts";
import { normalizePortableVaultPath } from "./paths.ts";
export function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function requiredString(
  value: Record<string, unknown>,
  key: string,
  label: string,
): string {
  if (typeof value[key] !== "string" || !value[key]) {
    throw new Error(`${label}.${key} must be a non-empty string`);
  }
  return value[key];
}

export function assertSchemaVersion(
  value: Record<string, unknown>,
  label: string,
) {
  if (
    value.schemaVersion !== CONVERSATION_SCHEMA_VERSION &&
    value.schemaVersion !== PREVIOUS_CONVERSATION_SCHEMA_VERSION &&
    value.schemaVersion !== LEGACY_CONVERSATION_SCHEMA_VERSION
  ) {
    throw new Error(`${label} uses an unsupported required schema version`);
  }
}

export function assertCurrentSchemaVersion(
  value: Record<string, unknown>,
  label: string,
): void {
  if (value.schemaVersion !== CONVERSATION_SCHEMA_VERSION) {
    throw new Error(`${label} requires schema version 3`);
  }
}

export function assertModelRef(value: unknown, label: string): void {
  if (value == null) return;
  const model = record(value, label);
  requiredString(model, "provider", label);
  requiredString(model, "model", label);
}

export function assertTimestamp(
  value: Record<string, unknown>,
  key: string,
  label: string,
) {
  const timestamp = requiredString(value, key, label);
  if (!Number.isFinite(Date.parse(timestamp))) {
    throw new Error(`${label}.${key} must be an ISO timestamp`);
  }
}

export function assertOptionalString(
  value: Record<string, unknown>,
  key: string,
  label: string,
): void {
  if (value[key] != null && typeof value[key] !== "string") {
    throw new Error(`${label}.${key} must be a string`);
  }
}

export function assertInventory(value: unknown, label: string): void {
  const inventory = record(value, `${label}.inventory`);
  if (inventory.kind !== "skills" && inventory.kind !== "tools") {
    throw new Error(`${label}.inventory.kind is invalid`);
  }
  if (!Array.isArray(inventory.items)) {
    throw new Error(`${label}.inventory.items must be an array`);
  }
  for (const entry of inventory.items) {
    const item = record(entry, `${label}.inventory.item`);
    requiredString(item, "name", `${label}.inventory.item`);
    if (item.kind !== "skill" && item.kind !== "tool") {
      throw new Error(`${label}.inventory.item.kind is invalid`);
    }
    assertOptionalString(item, "description", `${label}.inventory.item`);
    assertOptionalString(item, "path", `${label}.inventory.item`);
  }
}

export function assertPortableOptionalPath(
  value: unknown,
  label: string,
): void {
  if (value == null) return;
  if (typeof value !== "string") throw new Error(`${label} must be a string`);
  normalizePortableVaultPath(value, { allowRoot: true, label });
}

export function assertProjectionMode(value: unknown, label: string): void {
  if (
    value != null &&
    value !== "full" &&
    value !== "delta" &&
    value !== "summary-tail"
  ) {
    throw new Error(`${label} is invalid`);
  }
}

export function assertOptionalCount(value: unknown, label: string): void {
  if (value != null && (!Number.isSafeInteger(value) || Number(value) < 0)) {
    throw new Error(`${label} is invalid`);
  }
}

export function assertThinking(value: unknown, label: string): void {
  if (
    value != null &&
    value !== "default" &&
    value !== "off" &&
    value !== "low" &&
    value !== "medium" &&
    value !== "high"
  ) {
    throw new Error(`${label} is invalid`);
  }
}
