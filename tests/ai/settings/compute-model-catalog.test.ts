// Copied/adapted from JJ Store compute-model-catalog.test.ts; Apache-2.0.
import assert from "node:assert/strict";
import { it as test } from "vitest";
import {
  computeModelChoices,
  modelFit,
  modelMemoryBudget,
} from "../../../src/lib/ai/settings/compute-model-catalog.ts";
const hardware = { memory_bytes: 16e9 };
test("fit reserves host RAM and respects smaller draft limits without inventing GPU capacity", () => {
  assert.equal(modelMemoryBudget(hardware, null), 11.2);
  assert.equal(modelMemoryBudget(hardware, 4), 4);
  assert.equal(modelMemoryBudget(hardware, 32), 11.2);
  assert.equal(modelMemoryBudget({}, 4), undefined);
  assert.equal(modelMemoryBudget({ memory_bytes: -1 }, 4), undefined);
  assert.equal(modelMemoryBudget({ memory_bytes: 16000000000n }, null), 11.2);
  assert.deepEqual(
    [6, 9, 11, 12].map((size) => modelFit(size, 10)),
    ["Fits well", "Tight fit", "Trade-off", "Too large"],
  );
  assert.equal(modelFit(undefined, 10), "Fit unknown");
});
test("catalog recommends a comfortable tier and keeps exact installed and custom identities", () => {
  const id = "unsloth/gemma-4-E4B-it-GGUF:Q4_K_M";
  const rows = computeModelChoices(
    [
      { id, name: "Installed Gemma", installed: true },
      { id: "imported-exact", name: "My weights", installed: true },
    ],
    hardware,
    null,
    "custom/model:Q8",
  );
  assert.equal(rows[0]?.id, id);
  assert.equal(rows[0]?.recommended, true);
  assert.equal(rows[0]?.installed, true);
  assert.equal(rows.filter((row) => row.id === id).length, 1);
  assert.equal(
    rows.find((row) => row.id === "imported-exact")?.fit,
    "Fit unknown",
  );
  assert.equal(
    rows.find((row) => row.id === "custom/model:Q8")?.installed,
    false,
  );
  assert.equal(
    rows.find((row) => row.id.includes("Qwen3.8"))?.fit,
    "Too large",
  );
  const limited = computeModelChoices([], hardware, 4, null);
  assert.ok(
    limited.every((row) => !row.recommended || row.fit === "Fits well"),
  );
  assert.ok(
    computeModelChoices([], {}, null, null).every(
      (row) => !row.recommended && row.fit === "Fit unknown",
    ),
  );
});
