export const reactionStorageKey = "gender-experience-reactions-v1";

export function storedReactionIds(storedValue) {
  try {
    const ids = JSON.parse(storedValue ?? "[]");
    return new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

export function reactionIsSelected(initiallySelected, id, storedValue) {
  return initiallySelected || storedReactionIds(storedValue).has(id);
}

export function updatedReactionStorageValue(storedValue, id, selected) {
  const ids = storedReactionIds(storedValue);
  if (selected) ids.add(id);
  else ids.delete(id);
  return JSON.stringify([...ids]);
}

export function toggledReactionState(count, selected) {
  const nextSelected = !selected;
  return {
    selected: nextSelected,
    count: Math.max(0, count + (nextSelected ? 1 : -1)),
  };
}
