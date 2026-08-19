import { error } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { filterKey } from "$lib/catalog";
import { localizedSite } from "$lib/server/catalog";
import { getReactionCounts } from "$lib/server/reactions";
import type { CatalogPageData, DetailPageData } from "$lib/types";
import { domains, experienceFamilies, experiences } from "$site/data/experiences.js";

const cookieOptions = (secure: boolean) => ({
  path: "/",
  httpOnly: false,
  sameSite: "lax" as const,
  secure,
  maxAge: 60 * 60 * 24 * 365,
});
const validDomains = new Set(domains.map(({ id }) => id));
const validFamilies = new Set(experienceFamilies.map(({ id }) => id));
const validExperienceIds = new Set(experiences.map(({ id }) => id));
const validFilters = new Set(experiences.flatMap((experience) => [
  ...experience.types.map((value) => filterKey("type", value)),
  ...experience.directions.map((value) => filterKey("population", value)),
  ...experience.stages.map((value) => filterKey("stage", value)),
  ...experience.tags.map((value) => filterKey("topic", value)),
]));

function parseList(value: string | undefined, allowed: Set<string>) {
  return [...new Set((value ?? "").split(",").filter((item) => allowed.has(item)))];
}

function syncNewItems(event: RequestEvent) {
  const secure = event.url.protocol === "https:";
  const current = experiences.map(({ id }) => id);
  const known = new Set(parseList(event.cookies.get("gex_known_v1"), validExperienceIds));
  const unread = new Set(parseList(event.cookies.get("gex_unread_v1"), validExperienceIds));
  if (known.size > 0) {
    for (const id of current) {
      if (!known.has(id)) unread.add(id);
    }
  }
  event.cookies.set("gex_known_v1", current.join(","), cookieOptions(secure));
  event.cookies.set("gex_unread_v1", [...unread].join(","), cookieOptions(secure));
  return [...unread];
}

function browseState(event: RequestEvent) {
  const requestedDomain = event.url.searchParams.get("domain") ?? "all";
  return {
    query: (event.url.searchParams.get("q") ?? "").slice(0, 200),
    activeDomain: requestedDomain === "all" || validDomains.has(requestedDomain) ? requestedDomain : "all",
    activeFilters: [...new Set(event.url.searchParams.getAll("filter").filter((key) => validFilters.has(key)))],
    closedDomains: parseList(event.cookies.get("gex_closed_domains_v1"), validDomains),
    closedFamilies: parseList(event.cookies.get("gex_closed_families_v1"), validFamilies),
    selectedReactions: parseList(event.cookies.get("gex_selected_v1"), validExperienceIds),
    newExperienceIds: syncNewItems(event),
  };
}

function runtimeEnv(event: RequestEvent) {
  return event.platform?.env;
}

async function countsFor(event: RequestEvent) {
  try {
    return await getReactionCounts(runtimeEnv(event));
  } catch (cause) {
    console.error(JSON.stringify({
      message: "reaction_count_load_failed",
      error: cause instanceof Error ? cause.message : String(cause),
    }));
    return {};
  }
}

export async function loadCatalogPage(event: RequestEvent, locale: string): Promise<CatalogPageData> {
  event.setHeaders({ "cache-control": "private, no-store", vary: "Cookie" });
  return {
    site: await localizedSite(locale, await countsFor(event)),
    browse: browseState(event),
  };
}

export async function loadDetailPage(event: RequestEvent, locale: string): Promise<DetailPageData> {
  const sourceExperience = experiences.find(({ id }) => id === event.params.id);
  if (!sourceExperience) error(404, "Experience not found");
  event.setHeaders({ "cache-control": "private, no-store", vary: "Cookie" });
  const site = await localizedSite(locale, await countsFor(event));
  const experience = site.experiences.find(({ id }) => id === sourceExperience.id)!;
  const family = site.domains
    .flatMap(({ families }) => families)
    .find(({ id }) => id === experience.family);
  return {
    site: {
      locale: site.locale,
      localeDefinition: site.localeDefinition,
      messages: site.messages,
    },
    experience,
    context: {
      domain: site.domainTabs.find(({ id }) => id === experience.domain)?.label ?? experience.domain,
      family: family?.label ?? experience.family,
    },
    related: (family?.items ?? [])
      .filter(({ id }) => id !== experience.id)
      .map(({ id, title }) => ({ id, title })),
    selectedReactions: parseList(event.cookies.get("gex_selected_v1"), validExperienceIds),
  };
}
