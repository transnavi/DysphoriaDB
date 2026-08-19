import assert from "node:assert/strict";
import test from "node:test";

import { rankByReactionCount } from "../site/reaction-ranking.js";

test("cards rank by Me too count while ties keep their fair order", () => {
  const cards = [
    { id: "first", count: 3 },
    { id: "low", count: 1 },
    { id: "same", count: 3 },
    { id: "middle", count: 2 },
  ];

  assert.deepEqual(
    rankByReactionCount(cards, (card) => card.count).map(({ id }) => id),
    ["first", "same", "middle", "low"],
  );
});

test("missing reaction counts sort as zero", () => {
  const cards = [
    { id: "missing" },
    { id: "ranked", count: 1 },
    { id: "invalid", count: "unknown" },
  ];

  assert.deepEqual(
    rankByReactionCount(cards, (card) => card.count).map(({ id }) => id),
    ["ranked", "missing", "invalid"],
  );
});
