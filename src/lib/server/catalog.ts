import { organizeCatalog } from "$lib/catalog";
import type { CatalogItem, CatalogTag, LocalizedSite } from "$lib/types";
import { domains, experiences, journeyStages } from "$site/data/experiences.js";
import {
  createI18n,
  localeDefinitions,
  normalizeLocale,
} from "$site/i18n/index.js";

type TranslationMap = Record<string, string>;
type TaxonomyMap = Record<string, TranslationMap>;
type LocalizedClaimText = {
  title?: string;
  summary?: string;
  patterns?: string[][];
  variations?: string[];
};
type ClaimVariation = Record<string, unknown> & { direction: string };

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "#";
  } catch {
    return "#";
  }
}

function sourceKind(source: string[], messages: TranslationMap, sourceKinds: TranslationMap) {
  if (source[2]?.startsWith("Community report")) {
    return `${messages.communityReport}${source[2].slice("Community report".length)}`;
  }
  if (source[2]) return sourceKinds[source[2]] ?? source[2];
  if (source[1].includes("genderdysphoria.fyi") || source[1].includes("transnavi.jp")) {
    return messages.communityReference;
  }
  if (source[1].includes("x.com/") || source[1].includes("reddit.com/")) {
    return messages.communityReport;
  }
  return messages.reference;
}

export async function localizedSite(
  localeValue: string,
  counts: Record<string, number> = {},
): Promise<LocalizedSite> {
  const locale = normalizeLocale(localeValue);
  const i18n = await createI18n(locale);
  const messages = i18n.t("ui", { returnObjects: true }) as Record<string, string>;
  const taxonomy = i18n.t("taxonomy", { returnObjects: true }) as TaxonomyMap;
  const terms = i18n.t("terms", { returnObjects: true }) as TranslationMap;
  const sourceKinds = i18n.t("sourceKinds", { returnObjects: true }) as TranslationMap;
  const sourceNotes = i18n.t("sourceNotes", { returnObjects: true }) as TranslationMap;
  const claimTexts = i18n.t("experiences", { returnObjects: true }) as Record<string, LocalizedClaimText>;
  const taxonomyLabel = (group: string, value: string) => taxonomy[group]?.[value] ?? value;
  const termLabel = (value: string) => terms[value] ?? value;
  const localizedExperiences: CatalogItem[] = experiences.map((claim): CatalogItem => {
    const localized = claimTexts[claim.slug] ?? {};
    const variations = (claim.variations ?? []) as ClaimVariation[];
    const types: CatalogTag[] = claim.types.map((value) => ({
      group: "type",
      value,
      label: taxonomyLabel("types", value),
      className: `type-${value.toLowerCase().replaceAll(" ", "-")}`,
      categoryLabel: messages.experienceType,
    }));
    const populations: CatalogTag[] = claim.directions
      .filter((value) => value !== "cross-directional")
      .map((value) => ({
        group: "population",
        value,
        label: taxonomyLabel("directions", value),
        className: "population-tag",
        categoryLabel: messages.population,
      }));
    const stages: CatalogTag[] = claim.stages.map((value) => ({
      group: "stage",
      value,
      label: taxonomyLabel("stages", value),
      className: "stage-tag",
      categoryLabel: messages.stage,
    }));
    const topics: CatalogTag[] = claim.tags.map((value) => ({
      group: "topic",
      value,
      label: termLabel(value),
      className: "topic-tag",
      categoryLabel: messages.topic,
    }));
    const searchText = [
      localized.title ?? claim.slug,
      localized.summary ?? "",
      taxonomyLabel("families", claim.family),
      taxonomyLabel("domains", claim.domain),
      ...types.map(({ label }) => label),
      ...claim.directions.map((value) => taxonomyLabel("directions", value)),
      ...stages.map(({ label }) => label),
      ...claim.responses.map(termLabel),
      ...topics.map(({ label }) => label),
      ...(localized.patterns ?? []).flat(),
      ...(localized.variations ?? []),
    ].join(" ").toLocaleLowerCase(locale);

    return {
      ...claim,
      reactionCount: Number(counts[claim.slug] ?? 0),
      title: localized.title ?? claim.slug,
      summary: localized.summary ?? "",
      patterns: localized.patterns ?? [],
      variations: variations.map((variation, index) => ({
        ...variation,
        text: localized.variations?.[index] ?? "",
        directionLabel: taxonomyLabel("directions", variation.direction),
      })),
      typeTags: types,
      populationTags: populations,
      stageTags: stages,
      topicTags: topics,
      searchText,
      sources: claim.sources.map((source) => ({
        title: source[0],
        url: safeExternalUrl(source[1]),
        kind: sourceKind(source, messages, sourceKinds),
        note: source[3] ? (sourceNotes[source[3]] ?? source[3]) : "",
      })),
    };
  });
  const organized = organizeCatalog(localizedExperiences);

  return {
    locale,
    localeDefinition: localeDefinitions[locale],
    messages,
    domains: organized.rankedDomains.map((domain) => ({
      id: domain.id,
      label: taxonomyLabel("domains", domain.id),
      families: (organized.rankedFamilies.get(domain.id) ?? []).map((family) => ({
        id: family!.id,
        label: taxonomyLabel("families", family!.id),
        items: organized.familyClaims.get(family!.id) ?? [],
      })),
    })),
    domainTabs: [
      { id: "all", label: messages.all },
      ...domains.map((domain) => ({
        id: domain.id,
        label: taxonomyLabel("domains", domain.id),
      })),
    ],
    stageFilters: journeyStages.map(({ id }) => ({
      group: "stage",
      value: id,
      label: taxonomyLabel("stages", id),
      className: "stage-tag",
      categoryLabel: messages.stage,
    })),
    experiences: localizedExperiences,
  };
}
