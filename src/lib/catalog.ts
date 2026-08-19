import { domains, experienceFamilies } from "$site/data/experiences.js";
import { rankByReactionCount } from "$site/reaction-ranking.js";

export function filterKey(group: string, value: string) {
  return `${group}:${value}`;
}

export function claimHasFilter(
  claim: { types: string[]; directions: string[]; tags: string[] },
  key: string,
) {
  const [group, value] = key.split(":", 2);
  if (group === "type") return claim.types.includes(value);
  if (group === "population") return claim.directions.includes(value);
  return claim.tags.includes(value);
}

function stableHash(value: string, seed = 2166136261) {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rotate<T>(items: T[], offset: number) {
  if (items.length < 2) return [...items];
  const start = offset % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

function roundRobin<T>(queues: T[][]) {
  const remaining = queues.map((queue) => [...queue]);
  const ordered: T[] = [];
  while (remaining.some((queue) => queue.length > 0)) {
    for (const queue of remaining) {
      const item = queue.shift();
      if (item) ordered.push(item);
    }
  }
  return ordered;
}

type CatalogClaim = {
  slug: string;
  family: string;
  reportCount: number;
  reactionCount: number;
  sources: unknown[];
};

export function organizeCatalog<T extends CatalogClaim>(collection: T[]) {
  const familyClaims = new Map<string, T[]>();
  for (const claim of collection) {
    const items = familyClaims.get(claim.family) ?? [];
    items.push(claim);
    familyClaims.set(claim.family, items);
  }

  const seedMaterial = collection.map((claim) => [
    claim.slug,
    claim.reportCount,
    ...claim.sources.map((source) => String(
      Array.isArray(source) ? (source[1] ?? "") : ((source as { url?: string }).url ?? ""),
    )),
  ].join("|")).join("\n");
  const seed = stableHash(seedMaterial);

  for (const items of familyClaims.values()) {
    items.sort((a, b) => stableHash(`${seed}:${a.slug}`) - stableHash(`${seed}:${b.slug}`));
    const ranked = rankByReactionCount(items, (item: T) => item.reactionCount) as T[];
    items.splice(0, items.length, ...ranked);
  }

  const availableDomains = domains.filter((domain) =>
    domain.families.some((family: string) => familyClaims.has(family))
  );
  const rankedDomains = rotate(availableDomains, seed);
  const rankedFamilies = new Map(rankedDomains.map((domain) => [
    domain.id,
    rotate(
      domain.families
        .map((id: string) => experienceFamilies.find((family) => family.id === id))
        .filter(Boolean),
      stableHash(`${seed}:${domain.id}`),
    ),
  ]));

  const ordered = roundRobin(rankedDomains.map((domain) => roundRobin(
    (rankedFamilies.get(domain.id) ?? []).map((family) => familyClaims.get(family!.id) ?? []),
  )));

  return { familyClaims, ordered, rankedDomains, rankedFamilies };
}

export function formatMessage(
  messages: Record<string, string>,
  key: string,
  values: Record<string, string | number> = {},
) {
  const count = typeof values.count === "number" ? values.count : null;
  const pluralKey = count === null
    ? key
    : (count === 1 && messages[`${key}_one`] ? `${key}_one` : (messages[`${key}_other`] ? `${key}_other` : key));
  const template = messages[pluralKey] ?? messages[key] ?? key;
  return Object.entries(values).reduce(
    (value, [name, replacement]) => value.replaceAll(`{{${name}}}`, String(replacement)),
    template,
  );
}
