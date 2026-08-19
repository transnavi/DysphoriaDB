import assert from "node:assert/strict";
import test from "node:test";

import { rankByReactionCount } from "../site/reaction-ranking.js";

test("cards rank by Me too count while ties keep their fair order", () => {
  const cards = [
    { slug: "first", count: 3 },
    { slug: "low", count: 1 },
    { slug: "same", count: 3 },
    { slug: "middle", count: 2 },
  ];

  assert.deepEqual(
    rankByReactionCount(cards, (card) => card.count).map(({ slug }) => slug),
    ["first", "same", "middle", "low"],
  );
});

test("missing reaction counts sort as zero", () => {
  const cards = [
    { slug: "missing" },
    { slug: "ranked", count: 1 },
    { slug: "invalid", count: "unknown" },
  ];

  assert.deepEqual(
    rankByReactionCount(cards, (card) => card.count).map(({ slug }) => slug),
    ["ranked", "missing", "invalid"],
  );
});
