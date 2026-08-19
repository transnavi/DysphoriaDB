import { experiences } from "$site/data/experiences.js";
import { catalogMetadata } from "$site/data/catalog-metadata.js";
import { createI18n, localeDefinitions, localeRoot } from "$site/i18n/index.js";

const locales = Object.keys(localeDefinitions) as Array<keyof typeof localeDefinitions>;
type TranslationMap = Record<string, string>;
type ExportExperienceText = {
  title?: string;
  summary?: string;
  patterns?: string[][];
  variations?: string[];
};
type ExportTranslations = {
  experiences: Record<string, ExportExperienceText>;
  taxonomy: Record<string, TranslationMap>;
  terms: TranslationMap;
};

async function translationsByLocale() {
  return Object.fromEntries(await Promise.all(locales.map(async (locale) => {
    const i18n = await createI18n(locale);
    return [locale, {
      experiences: i18n.t("experiences", { returnObjects: true }) as Record<string, ExportExperienceText>,
      taxonomy: i18n.t("taxonomy", { returnObjects: true }) as Record<string, TranslationMap>,
      terms: i18n.t("terms", { returnObjects: true }) as TranslationMap,
    } satisfies ExportTranslations];
  }))) as Record<(typeof locales)[number], ExportTranslations>;
}

const translated = (map: TranslationMap | undefined, value: string) => map?.[value] ?? value;

export async function exportData() {
  const translations = await translationsByLocale();
  return {
    schemaVersion: 3,
    dateModified: catalogMetadata.dateModified,
    license: catalogMetadata.license,
    attribution: "TransNavi contributors",
    locales: Object.fromEntries(locales.map((locale) => [locale, {
      language: localeDefinitions[locale].htmlLang,
      path: localeRoot(locale),
    }])),
    experiences: experiences.map((experience) => ({
      id: experience.id,
      family: experience.family,
      domain: experience.domain,
      types: experience.types,
      directions: experience.directions,
      stages: experience.stages,
      responses: experience.responses,
      tags: experience.tags,
      reportCount: experience.reportCount,
      sources: experience.sources.map(([title, url, kind, note]) => ({
        title,
        url,
        ...(kind ? { kind } : {}),
        ...(note ? { note } : {}),
      })),
      content: Object.fromEntries(locales.map((locale) => {
        const localized = translations[locale].experiences[experience.id] ?? {};
        return [locale, {
          title: localized.title ?? experience.id,
          summary: localized.summary ?? "",
          patterns: localized.patterns ?? [],
          variations: localized.variations ?? [],
          tags: experience.tags.map((tag) => translated(translations[locale].terms, tag)),
        }];
      })),
    })),
  };
}

const csvCell = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;

export async function exportCsv() {
  const translations = await translationsByLocale();
  const headers = ["id", "locale", "title", "summary", "domain", "family", "types", "directions", "stages", "tags", "report_count", "sources"];
  const rows = [headers, ...experiences.flatMap((experience) => locales.map((locale) => {
    const bundle = translations[locale];
    const localized = bundle.experiences[experience.id] ?? {};
    return [
      experience.id,
      locale,
      localized.title ?? experience.id,
      localized.summary ?? "",
      translated(bundle.taxonomy.domains, experience.domain),
      translated(bundle.taxonomy.families, experience.family),
      experience.types.map((type) => translated(bundle.taxonomy.types, type)).join(" | "),
      experience.directions.map((direction) => translated(bundle.taxonomy.directions, direction)).join(" | "),
      experience.stages.map((stage) => translated(bundle.taxonomy.stages, stage)).join(" | "),
      experience.tags.map((tag) => translated(bundle.terms, tag)).join(" | "),
      experience.reportCount,
      experience.sources.map(([, url]) => url).join(" | "),
    ];
  }))];
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}
