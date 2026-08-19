export function reconcileCatalogItems(currentSlugs, knownSlugs = [], unseenSlugs = []) {
  const current = new Set(currentSlugs);
  const storedKnown = Array.isArray(knownSlugs) ? knownSlugs : [];
  const storedUnseen = Array.isArray(unseenSlugs) ? unseenSlugs : [];
  const known = new Set(storedKnown.filter((slug) => typeof slug === "string" && current.has(slug)));
  const unseen = new Set(storedUnseen.filter((slug) => typeof slug === "string" && current.has(slug)));

  if (known.size > 0) {
    for (const slug of current) {
      if (!known.has(slug)) unseen.add(slug);
    }
  }

  return {
    known: [...current],
    unseen: [...unseen],
  };
}

export function normalizeBrowseState(value, {
  validDomains,
  validFamilies,
  validFilters,
  initialLimit,
  itemCount,
}) {
  const state = typeof value === "object" && value !== null ? value : {};
  const activeDomain = state.activeDomain === "all" || validDomains.has(state.activeDomain)
    ? state.activeDomain
    : "all";
  const list = (candidate, allowed) => Array.isArray(candidate)
    ? [...new Set(candidate.filter((item) => typeof item === "string" && allowed.has(item)))]
    : [];
  const numericLimit = Number.isFinite(state.visibleLimit) ? Math.trunc(state.visibleLimit) : initialLimit;

  return {
    activeDomain,
    activeFilters: list(state.activeFilters, validFilters),
    closedDomains: list(state.closedDomains, validDomains),
    closedFamilies: list(state.closedFamilies, validFamilies),
    query: typeof state.query === "string" ? state.query.slice(0, 200) : "",
    scrollY: Number.isFinite(state.scrollY) ? Math.max(0, state.scrollY) : 0,
    visibleLimit: Math.min(itemCount, Math.max(initialLimit, numericLimit)),
  };
}
