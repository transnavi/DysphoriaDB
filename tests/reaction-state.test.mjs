import assert from "node:assert/strict";
import test from "node:test";

import {
  reactionIsSelected,
  toggledReactionState,
  updatedReactionStorageValue,
} from "../site/reaction-state.js";

test("stored reactions initialize as selected", () => {
  assert.equal(reactionIsSelected(
    false,
    "unfamiliar-reflection",
    JSON.stringify(["unfamiliar-reflection"]),
  ), true);
  assert.equal(reactionIsSelected(false, "unfamiliar-reflection", "invalid"), false);
  assert.equal(reactionIsSelected(true, "unfamiliar-reflection", null), true);
});

test("stored reactions follow selection changes", () => {
  const selected = updatedReactionStorageValue(null, "unfamiliar-reflection", true);
  assert.deepEqual(JSON.parse(selected), ["unfamiliar-reflection"]);
  assert.deepEqual(JSON.parse(updatedReactionStorageValue(selected, "unfamiliar-reflection", false)), []);
});

test("selecting a reaction increments the optimistic count", () => {
  assert.deepEqual(toggledReactionState(3, false), { selected: true, count: 4 });
  assert.deepEqual(toggledReactionState(3, true), { selected: false, count: 2 });
  assert.deepEqual(toggledReactionState(0, true), { selected: false, count: 0 });
});
