import assert from "node:assert/strict";
import test from "node:test";

import { normalizeBrowseState, reconcileCatalogItems } from "../site/browser-state.js";

test("new catalog items remain marked until they are viewed", () => {
  assert.deepEqual(
    reconcileCatalogItems(["a", "b"], [], []),
    { known: ["a", "b"], unseen: [] },
  );
  assert.deepEqual(
    reconcileCatalogItems(["a", "b", "c"], ["a", "b"], ["b"]),
    { known: ["a", "b", "c"], unseen: ["b", "c"] },
  );
  assert.deepEqual(
    reconcileCatalogItems(["a"], { corrupted: true }, "a"),
    { known: ["a"], unseen: [] },
  );
});

test("stored browsing state is bounded to current catalog values", () => {
  const normalized = normalizeBrowseState({
    activeDomain: "body",
    activeFilters: ["type:dysphoric", "invalid", "type:dysphoric"],
    closedDomains: ["body", "missing"],
    closedFamilies: ["family-a", "missing"],
    query: "x".repeat(240),
    scrollY: -20,
  }, {
    validDomains: new Set(["body"]),
    validFamilies: new Set(["family-a"]),
    validFilters: new Set(["type:dysphoric"]),
  });

  assert.equal(normalized.activeDomain, "body");
  assert.deepEqual(normalized.activeFilters, ["type:dysphoric"]);
  assert.deepEqual(normalized.closedDomains, ["body"]);
  assert.deepEqual(normalized.closedFamilies, ["family-a"]);
  assert.equal(normalized.query.length, 200);
  assert.equal(normalized.scrollY, 0);
});
