import assert from "node:assert/strict";
import test from "node:test";
import { conflictProblemResource } from "../desktop/conflict-review.mjs";

test("conflict navigation selects the exact encoded path group", () => {
  assert.equal(
    conflictProblemResource(".lapis/app.json"),
    "lapis-file-conflict:.lapis%2Fapp.json",
  );
  assert.equal(
    conflictProblemResource('Notes/quoted "café".md'),
    "lapis-file-conflict:Notes%2Fquoted%20%22caf%C3%A9%22.md",
  );
});
