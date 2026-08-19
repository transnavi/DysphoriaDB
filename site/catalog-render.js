import { domains, experienceFamilies, experiences } from "./data/experiences.js";
import {
  experiencePath,
  localizeClaim,
  localizeSourceKind,
  localizeSourceNote,
  localizeTaxonomy,
  localizeTerm,
} from "./i18n/index.js";

export const INITIAL_CARD_COUNT = 16;
export const CARD_BATCH_SIZE = 12;

export function filterKey(group, value) {
  return `${group}:${value}`;
}

export function claimHasFilter(claim, key) {
  const [group, value] = key.split(":", 2);
  if (group === "type") return claim.types.includes(value);
  if (group === "population") return claim.directions.includes(value);
  return claim.tags.includes(value);
}

export function buildSearchIndex(i18n, collection = experiences) {
  return new Map(collection.map((claim) => {
    const localized = localizeClaim(i18n, claim);
    const searchable = [
      localized.title,
      localized.summary,
      localizeTaxonomy(i18n, "families", claim.family),
      localizeTaxonomy(i18n, "domains", claim.domain),
      ...claim.types.map((type) => localizeTaxonomy(i18n, "types", type)),
      ...claim.directions.map((direction) => localizeTaxonomy(i18n, "directions", direction)),
      ...claim.responses.map((response) => localizeTerm(i18n, response)),
      ...claim.tags.map((tag) => localizeTerm(i18n, tag)),
      ...(localized.patterns ?? []).flat(),
      ...(localized.variations ?? []).map((variation) => variation.text),
    ].join(" ").toLocaleLowerCase();
    return [claim.slug, searchable];
  }));
}

function sourceKind(i18n, source) {
  const t = i18n.t.bind(i18n);
  if (source[2]?.startsWith("Community report")) {
    const relation = source[2].slice("Community report".length);
    return `${t("ui.communityReport")}${relation}`;
  }
  if (source[2]) return localizeSourceKind(i18n, source[2]);
  if (source[1].includes("genderdysphoria.fyi") || source[1].includes("transnavi.jp")) return t("ui.communityReference");
  if (source[1].includes("x.com/") || source[1].includes("reddit.com/")) return t("ui.communityReport");
  return t("ui.reference");
}

export function renderSourceItem(i18n, source, detailed = false) {
  const [label, url] = source;
  const note = source[3] ? localizeSourceNote(i18n, source[3]) : "";
  return `<li><span class="source-kind">${sourceKind(i18n, source)}</span><a href="${url}" target="_blank" rel="noreferrer">${label} ↗</a>${detailed && note ? `<span class="source-note">${note}</span>` : ""}</li>`;
}

function localizedFilter(i18n, group, value) {
  if (group === "type") return localizeTaxonomy(i18n, "types", value);
  if (group === "population") return localizeTaxonomy(i18n, "directions", value);
  return localizeTerm(i18n, value);
}

export function renderTag(i18n, activeFilters, group, value, className, categoryKey) {
  const key = filterKey(group, value);
  const label = localizedFilter(i18n, group, value);
  const categoryLabel = i18n.t(categoryKey);
  return `<button type="button" class="category-tag ${className}" data-filter-group="${group}" data-filter-value="${value}" data-category-label="${categoryLabel}" aria-label="${label}; ${categoryLabel}" aria-pressed="${activeFilters.has(key)}">${label}</button>`;
}

export function renderReaction(i18n, locale, claim, selectedReactions, pendingReactions) {
  const selected = selectedReactions.has(claim.slug);
  const label = i18n.t(selected ? "ui.meTooSelectedLabel" : "ui.meTooLabel", {
    title: localizeClaim(i18n, claim).title,
    count: claim.reactionCount,
  });
  return `
    <button class="reaction-button" type="button" data-reaction-slug="${claim.slug}" aria-label="${label}" aria-pressed="${selected}" ${pendingReactions.has(claim.slug) ? "disabled" : ""}>
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
      <span>${i18n.t("ui.meToo")}</span>
      <span class="reaction-count">${new Intl.NumberFormat(locale).format(claim.reactionCount)}</span>
    </button>
  `;
}

function visibleClaims({ activeDomain, activeFilters, query, searchIndex, collection }) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return collection.filter((claim) => (
    (searchIndex.get(claim.slug) ?? "").includes(normalizedQuery)
    && (activeDomain === "all" || claim.domain === activeDomain)
    && [...activeFilters].every((key) => claimHasFilter(claim, key))
  ));
}

function rankedCatalog(visible) {
  const familyScores = new Map();
  const familyClaims = new Map();
  for (const claim of visible) {
    const score = familyScores.get(claim.family) ?? { reactions: 0, reports: 0 };
    score.reactions += claim.reactionCount;
    score.reports += claim.reportCount;
    familyScores.set(claim.family, score);
    const items = familyClaims.get(claim.family) ?? [];
    items.push(claim);
    familyClaims.set(claim.family, items);
  }

  const scoreForFamily = (family) => familyScores.get(family) ?? { reactions: 0, reports: 0 };
  const compareScore = (a, b) => b.reactions - a.reactions || b.reports - a.reports;
  const domainScore = (domain) => domain.families.reduce((score, family) => {
    const result = scoreForFamily(family);
    return { reactions: score.reactions + result.reactions, reports: score.reports + result.reports };
  }, { reactions: 0, reports: 0 });

  const rankedDomains = [...domains].sort((a, b) => compareScore(domainScore(a), domainScore(b)));
  const rankedFamilies = new Map(rankedDomains.map((domain) => [domain.id, domain.families
    .map((id) => experienceFamilies.find((family) => family.id === id))
    .filter(Boolean)
    .sort((a, b) => compareScore(scoreForFamily(a.id), scoreForFamily(b.id)))]));

  for (const items of familyClaims.values()) {
    items.sort((a, b) => b.reactionCount - a.reactionCount || b.reportCount - a.reportCount);
  }

  const ordered = rankedDomains.flatMap((domain) => (rankedFamilies.get(domain.id) ?? [])
    .flatMap((family) => familyClaims.get(family.id) ?? []));
  return { familyClaims, ordered, rankedDomains, rankedFamilies };
}

export function renderCatalog({
  i18n,
  locale,
  activeDomain = "all",
  activeFilters = new Set(),
  closedFamilies = new Set(),
  selectedReactions = new Set(),
  pendingReactions = new Set(),
  query = "",
  limit = INITIAL_CARD_COUNT,
  searchIndex = buildSearchIndex(i18n),
  collection = experiences,
}) {
  const visible = visibleClaims({ activeDomain, activeFilters, query, searchIndex, collection });
  const ranked = rankedCatalog(visible);
  const shown = ranked.ordered.slice(0, limit);
  const shownSlugs = new Set(shown.map((claim) => claim.slug));

  const renderClaim = (claim) => {
    const localized = localizeClaim(i18n, claim);
    const tone = claim.types.includes("dysphoric") && claim.types.includes("euphoric")
      ? "mixed"
      : (claim.types[0] ?? "neutral").toLowerCase().replaceAll(" ", "-");
    return `
      <article class="card tone-${tone}" title="${claim.types.map((type) => localizeTaxonomy(i18n, "types", type)).join(" · ")}">
        <h3><a class="claim-link" href="${experiencePath(locale, claim.slug)}">${localized.title}</a></h3>
        <p class="summary">${localized.summary}</p>
        <p class="report-count ${claim.reportCount ? "" : "report-count-empty"}" ${claim.reportCount ? "" : "aria-hidden=\"true\""}>${claim.reportCount ? i18n.t("ui.reviewedReports", { count: claim.reportCount }) : "&nbsp;"}</p>
        <div class="categories" aria-label="${i18n.t("ui.tags")}">
          ${claim.types.map((type) => renderTag(i18n, activeFilters, "type", type, `type-${type.toLowerCase().replaceAll(" ", "-")}`, "ui.experienceType")).join("")}
          ${claim.directions.filter((direction) => direction !== "cross-directional").map((direction) => renderTag(i18n, activeFilters, "population", direction, "population-tag", "ui.population")).join("")}
          ${claim.tags.slice(0, 3).map((tag) => renderTag(i18n, activeFilters, "topic", tag, "topic-tag", "ui.topic")).join("")}
        </div>
        <div class="card-actions">
          <details class="sources">
            <summary>${i18n.t("ui.sourceCount", { count: claim.sources.length })}</summary>
            <ul class="source-list">${claim.sources.map((source) => renderSourceItem(i18n, source)).join("")}</ul>
          </details>
          ${renderReaction(i18n, locale, claim, selectedReactions, pendingReactions)}
        </div>
      </article>
    `;
  };

  const html = ranked.rankedDomains.map((domain) => {
    if (activeDomain !== "all" && domain.id !== activeDomain) return "";
    const families = (ranked.rankedFamilies.get(domain.id) ?? []).map((family) => {
      const familyItems = (ranked.familyClaims.get(family.id) ?? []).filter((claim) => shownSlugs.has(claim.slug));
      if (familyItems.length === 0) return "";
      return `
        <details class="experience-group" data-family="${family.id}" ${closedFamilies.has(family.id) ? "" : "open"}>
          <summary><h2>${localizeTaxonomy(i18n, "families", family.id)}</h2></summary>
          <div class="group-grid">${familyItems.map(renderClaim).join("")}</div>
        </details>
      `;
    }).join("");
    if (!families) return "";
    return `
      <section class="domain-section">
        ${activeDomain === "all" ? `<h2 class="domain-title">${localizeTaxonomy(i18n, "domains", domain.id)}</h2>` : ""}
        <div class="domain-content">${families}</div>
      </section>
    `;
  }).join("");

  return { html, total: visible.length, shown: shown.length };
}
