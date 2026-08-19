export type LocaleDefinition = {
  path: string;
  htmlLang: string;
  hreflang: string;
  ogLocale: string;
  label: string;
};

export type CatalogTag = {
  group: "type" | "population" | "topic";
  value: string;
  label: string;
  className: string;
  categoryLabel: string;
};

export type CatalogSource = {
  title: string;
  url: string;
  kind: string;
  note: string;
};

export type CatalogVariation = Record<string, unknown> & {
  direction: string;
  directionLabel: string;
  text: string;
};

export type CatalogItem = {
  slug: string;
  family: string;
  domain: string;
  types: string[];
  directions: string[];
  tags: string[];
  reportCount: number;
  reactionCount: number;
  sources: CatalogSource[];
  title: string;
  summary: string;
  patterns: string[][];
  variations: CatalogVariation[];
  typeTags: CatalogTag[];
  populationTags: CatalogTag[];
  topicTags: CatalogTag[];
  searchText: string;
};

export type CatalogFamily = {
  id: string;
  label: string;
  items: CatalogItem[];
};

export type CatalogDomain = {
  id: string;
  label: string;
  families: CatalogFamily[];
};

export type LocalizedSite = {
  locale: string;
  localeDefinition: LocaleDefinition;
  messages: Record<string, string>;
  domains: CatalogDomain[];
  domainTabs: Array<{ id: string; label: string }>;
  experiences: CatalogItem[];
};

export type BrowseState = {
  query: string;
  activeDomain: string;
  activeFilters: string[];
  closedDomains: string[];
  closedFamilies: string[];
  selectedReactions: string[];
  newSlugs: string[];
};

export type CatalogPageData = {
  site: LocalizedSite;
  browse: BrowseState;
};

export type DetailPageData = {
  site: Pick<LocalizedSite, "locale" | "localeDefinition" | "messages">;
  experience: CatalogItem;
  context: { domain: string; family: string };
  related: Array<{ slug: string; title: string }>;
  selectedReactions: string[];
};
