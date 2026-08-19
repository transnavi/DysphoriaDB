export function rankByReactionCount(items, countFor) {
  return items
    .map((item, index) => ({
      count: Number(countFor(item)),
      index,
      item,
    }))
    .sort((a, b) => {
      const aCount = Number.isFinite(a.count) ? a.count : 0;
      const bCount = Number.isFinite(b.count) ? b.count : 0;
      return bCount - aCount || a.index - b.index;
    })
    .map(({ item }) => item);
}
