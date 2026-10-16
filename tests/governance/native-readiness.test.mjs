import { test } from "node:test";
import assert from "node:assert/strict";
import { rendererReadiness } from "../desktop/native-readiness.mjs";

test("native readiness retains a receipt split across output chunks", () => {
  const receipt = rendererReadiness();
  assert.equal(receipt(Buffer.from("lapis-desktop: rend")), false);
  assert.equal(receipt(Buffer.from("erer ready\n")), true);
  assert.equal(receipt(Buffer.from("later output")), true);
});

test("native readiness finds a receipt before a large output tail", () => {
  const receipt = rendererReadiness();
  assert.equal(receipt(Buffer.from("almost ready\n")), false);
  assert.equal(
    receipt(Buffer.from("lapis-desktop: renderer ready\n" + "x".repeat(4096))),
    true,
  );
});
