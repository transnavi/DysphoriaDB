export function reconcileCatalogItems(currentIds, knownIds = [], unseenIds = []) {
  const current = new Set(currentIds);
  const storedKnown = Array.isArray(knownIds) ? knownIds : [];
  const storedUnseen = Array.isArray(unseenIds) ? unseenIds : [];
  const known = new Set(storedKnown.filter((id) => typeof id === "string" && current.has(id)));
  const unseen = new Set(storedUnseen.filter((id) => typeof id === "string" && current.has(id)));

  if (known.size > 0) {
    for (const id of current) {
      if (!known.has(id)) unseen.add(id);
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
}) {
  const state = typeof value === "object" && value !== null ? value : {};
  const activeDomain = state.activeDomain === "all" || validDomains.has(state.activeDomain)
    ? state.activeDomain
    : "all";
  const list = (candidate, allowed) => Array.isArray(candidate)
    ? [...new Set(candidate.filter((item) => typeof item === "string" && allowed.has(item)))]
    : [];
  return {
    activeDomain,
    activeFilters: list(state.activeFilters, validFilters),
    closedDomains: list(state.closedDomains, validDomains),
    closedFamilies: list(state.closedFamilies, validFamilies),
    query: typeof state.query === "string" ? state.query.slice(0, 200) : "",
    scrollY: Number.isFinite(state.scrollY) ? Math.max(0, state.scrollY) : 0,
  };
}
