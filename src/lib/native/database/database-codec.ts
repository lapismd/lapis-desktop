export type SqlValue =
  | { type: "null" }
  | { type: "integer"; value: string }
  | { type: "real"; value: number }
  | { type: "text"; value: string }
  | { type: "blob"; value: number[] };
export type SqlArgs = SqlValue[] | Record<string, SqlValue>;

const minimum = -(1n << 63n);
const maximum = (1n << 63n) - 1n;

function integer(value: bigint): string {
  if (value < minimum || value > maximum)
    throw new Error("SQL integer exceeds signed 64-bit range");
  return value.toString();
}

export function encodeValue(value: unknown): SqlValue {
  if (value === null) return { type: "null" };
  if (typeof value === "string") return { type: "text", value };
  if (typeof value === "bigint")
    return { type: "integer", value: integer(value) };
  if (typeof value === "boolean")
    return { type: "integer", value: value ? "1" : "0" };
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new Error("SQL real parameters must be finite");
    return Number.isSafeInteger(value)
      ? { type: "integer", value: String(value) }
      : { type: "real", value };
  }
  if (value instanceof ArrayBuffer)
    return { type: "blob", value: [...new Uint8Array(value)] };
  if (ArrayBuffer.isView(value)) {
    return {
      type: "blob",
      value: [
        ...new Uint8Array(value.buffer, value.byteOffset, value.byteLength),
      ],
    };
  }
  throw new Error("Unsupported SQL parameter type");
}

export function decodeValue(value: SqlValue): unknown {
  if (!value || typeof value !== "object")
    throw new Error("Invalid native SQL value");
  switch (value.type) {
    case "null":
      return null;
    case "text":
      if (typeof value.value !== "string") break;
      return value.value;
    case "real":
      if (typeof value.value !== "number" || !Number.isFinite(value.value))
        break;
      return value.value;
    case "integer": {
      if (
        typeof value.value !== "string" ||
        !/^-?(?:0|[1-9]\d*)$/u.test(value.value)
      )
        break;
      const parsed = BigInt(value.value);
      if (integer(parsed) !== value.value) break;
      const number = Number(parsed);
      return Number.isSafeInteger(number) ? number : parsed;
    }
    case "blob":
      if (
        !Array.isArray(value.value) ||
        value.value.some(
          (byte) => !Number.isInteger(byte) || byte < 0 || byte > 255,
        )
      )
        break;
      return Uint8Array.from(value.value);
  }
  throw new Error("Invalid native SQL value");
}

export function encodeArgs(
  values: unknown[] | Record<string, unknown>,
): SqlArgs {
  if (Array.isArray(values)) return values.map(encodeValue);
  return Object.fromEntries(
    Object.entries(values).map(([name, value]) => {
      if (!/^[:@$?]/u.test(name) || name.length > 256)
        throw new Error("Named SQL parameters must include their prefix");
      return [name, encodeValue(value)];
    }),
  );
}

export function callArgs(args: unknown[]): SqlArgs {
  const value = args[0];
  if (
    args.length === 1 &&
    value &&
    typeof value === "object" &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  ) {
    return encodeArgs(value as Record<string, unknown>);
  }
  return encodeArgs(args);
}

export function decodeRows(
  rows: Record<string, SqlValue>[],
): Record<string, unknown>[] {
  if (!Array.isArray(rows)) throw new Error("Invalid native database rows");
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, decodeValue(value)]),
    ),
  );
}
