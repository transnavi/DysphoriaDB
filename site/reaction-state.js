export const reactionStorageKey = "gender-experience-reactions-v1";

export function storedReactionSlugs(storedValue) {
  try {
    const slugs = JSON.parse(storedValue ?? "[]");
    return new Set(Array.isArray(slugs) ? slugs.filter((slug) => typeof slug === "string") : []);
  } catch {
    return new Set();
  }
}

export function reactionIsSelected(initiallySelected, slug, storedValue) {
  return initiallySelected || storedReactionSlugs(storedValue).has(slug);
}

export function updatedReactionStorageValue(storedValue, slug, selected) {
  const slugs = storedReactionSlugs(storedValue);
  if (selected) slugs.add(slug);
  else slugs.delete(slug);
  return JSON.stringify([...slugs]);
}

export function toggledReactionState(count, selected) {
  const nextSelected = !selected;
  return {
    selected: nextSelected,
    count: Math.max(0, count + (nextSelected ? 1 : -1)),
  };
}
