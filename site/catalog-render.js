import { domains, experienceFamilies, experiences } from "./data/experiences.js";
import {
  experiencePath,
  localeRoot,
  localizeExperience,
  localizeSourceKind,
  localizeSourceNote,
  localizeTaxonomy,
  localizeTerm,
} from "./i18n/index.js";

export const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? escapeHtml(url.href) : "#";
  } catch {
    return "#";
  }
}

export function filterKey(group, value) {
  return `${group}:${value}`;
}

export function experienceHasFilter(experience, key) {
  const [group, value] = key.split(":", 2);
  if (group === "type") return experience.types.includes(value);
  if (group === "population") return experience.directions.includes(value);
  return experience.tags.includes(value);
}

export function buildSearchIndex(i18n, collection = experiences) {
  return new Map(collection.map((experience) => {
    const localized = localizeExperience(i18n, experience);
    const searchable = [
      localized.title,
      localized.summary,
      localizeTaxonomy(i18n, "families", experience.family),
      localizeTaxonomy(i18n, "domains", experience.domain),
      ...experience.types.map((type) => localizeTaxonomy(i18n, "types", type)),
      ...experience.directions.map((direction) => localizeTaxonomy(i18n, "directions", direction)),
      ...experience.responses.map((response) => localizeTerm(i18n, response)),
      ...experience.tags.map((tag) => localizeTerm(i18n, tag)),
      ...(localized.patterns ?? []).flat(),
      ...(localized.variations ?? []).map((variation) => variation.text),
    ].join(" ").toLocaleLowerCase();
    return [experience.id, searchable];
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
  return `<li><span class="source-kind">${escapeHtml(sourceKind(i18n, source))}</span><a href="${safeExternalUrl(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)} ↗</a>${detailed && note ? `<span class="source-note">${escapeHtml(note)}</span>` : ""}</li>`;
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
  return `<button type="button" class="category-tag ${escapeHtml(className)}" data-filter-group="${escapeHtml(group)}" data-filter-value="${escapeHtml(value)}" data-category-label="${escapeHtml(categoryLabel)}" aria-label="${escapeHtml(label)}; ${escapeHtml(categoryLabel)}" aria-pressed="${activeFilters.has(key)}">${escapeHtml(label)}</button>`;
}

export function renderReaction(i18n, locale, experience, selectedReactions, pendingReactions) {
  const selected = selectedReactions.has(experience.id);
  const label = i18n.t(selected ? "ui.meTooSelectedLabel" : "ui.meTooLabel", {
    title: localizeExperience(i18n, experience).title,
    count: experience.reactionCount,
  });
  return `
    <button class="reaction-button" type="button" data-reaction-id="${escapeHtml(experience.id)}" aria-label="${escapeHtml(label)}" aria-pressed="${selected}" ${pendingReactions.has(experience.id) ? "disabled" : ""}>
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
      <span>${escapeHtml(i18n.t("ui.meToo"))}</span>
      <span class="reaction-count">${new Intl.NumberFormat(locale).format(experience.reactionCount)}</span>
    </button>
  `;
}

export function renderExperienceDetail({
  i18n,
  locale,
  experience,
  activeFilters = new Set(),
  selectedReactions = new Set(),
  pendingReactions = new Set(),
  collection = experiences,
}) {
  const related = collection.filter((candidate) => candidate.family === experience.family && candidate !== experience);
  const localized = localizeExperience(i18n, experience);
  return `
    <a class="detail-back" href="${localeRoot(locale)}">← ${escapeHtml(i18n.t("ui.allExperiences"))}</a>
    <article>
      <div class="detail-context">
        <span>${escapeHtml(localizeTaxonomy(i18n, "domains", experience.domain))}</span>
        <span>${escapeHtml(localizeTaxonomy(i18n, "families", experience.family))}</span>
      </div>
      <h1>${escapeHtml(localized.title)}</h1>
      <p class="detail-summary">${escapeHtml(localized.summary)}</p>
      ${experience.reportCount ? `<p class="report-count">${escapeHtml(i18n.t("ui.reviewedReports", { count: experience.reportCount }))}</p>` : ""}
      <div class="categories detail-tags" role="group" aria-label="${escapeHtml(i18n.t("ui.tags"))}">
        ${experience.types.map((type) => renderTag(i18n, activeFilters, "type", type, `type-${type.toLowerCase().replaceAll(" ", "-")}`, "ui.experienceType")).join("")}
        ${experience.directions.filter((direction) => direction !== "cross-directional").map((direction) => renderTag(i18n, activeFilters, "population", direction, "population-tag", "ui.population")).join("")}
        ${experience.tags.map((tag) => renderTag(i18n, activeFilters, "topic", tag, "topic-tag", "ui.topic")).join("")}
      </div>
      <div class="reaction-row detail-reaction">${renderReaction(i18n, locale, experience, selectedReactions, pendingReactions)}</div>
      ${localized.patterns ? `
        <section class="detail-section">
          <h2>${escapeHtml(i18n.t("ui.reportedVariations"))}</h2>
          <dl class="pattern-list">
            ${localized.patterns.map(([title, text]) => `<div><dt>${escapeHtml(title)}</dt><dd>${escapeHtml(text)}</dd></div>`).join("")}
          </dl>
        </section>
      ` : ""}
      ${localized.variations ? `
        <section class="detail-section">
          <h2>${escapeHtml(i18n.t("ui.populationVariations"))}</h2>
          <ul class="detail-variations">${localized.variations.map((variation) => `<li><strong>${escapeHtml(localizeTaxonomy(i18n, "directions", variation.direction))}:</strong> ${escapeHtml(variation.text)}</li>`).join("")}</ul>
        </section>
      ` : ""}
      <section class="detail-section" id="sources">
        <h2>${escapeHtml(i18n.t("ui.sources"))}</h2>
        <ul class="detail-source-list">${experience.sources.map((source) => renderSourceItem(i18n, source, true)).join("")}</ul>
      </section>
      ${related.length ? `
        <section class="detail-section">
          <h2>${escapeHtml(i18n.t("ui.relatedExperiences"))}</h2>
          <ul class="related-list">${related.map((item) => `<li><a href="${experiencePath(locale, item.id)}" data-experience-id="${escapeHtml(item.id)}">${escapeHtml(localizeExperience(i18n, item).title)}</a></li>`).join("")}</ul>
        </section>
      ` : ""}
    </article>
  `;
}

function visibleExperiences({ activeDomain, activeFilters, query, searchIndex, collection }) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return collection.filter((experience) => (
    (searchIndex.get(experience.id) ?? "").includes(normalizedQuery)
    && (activeDomain === "all" || experience.domain === activeDomain)
    && [...activeFilters].every((key) => experienceHasFilter(experience, key))
  ));
}

function stableHash(value, seed = 2166136261) {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rotate(items, offset) {
  if (items.length < 2) return [...items];
  const start = offset % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

function roundRobin(queues) {
  const remaining = queues.map((queue) => [...queue]);
  const ordered = [];
  while (remaining.some((queue) => queue.length > 0)) {
    for (const queue of remaining) {
      const item = queue.shift();
      if (item) ordered.push(item);
    }
  }
  return ordered;
}

function prioritizeNew(items, hasNewItem) {
  return [
    ...items.filter(hasNewItem),
    ...items.filter((item) => !hasNewItem(item)),
  ];
}

function fairCatalog(visible, collection, newExperienceIds) {
  const familyExperiences = new Map();
  for (const experience of visible) {
    const items = familyExperiences.get(experience.family) ?? [];
    items.push(experience);
    familyExperiences.set(experience.family, items);
  }

  const seedMaterial = collection.map((experience) => [
    experience.id,
    experience.reportCount,
    ...experience.sources.map((source) => source[1]),
  ].join("|")).join("\n");
  const seed = stableHash(seedMaterial);

  for (const items of familyExperiences.values()) {
    items.sort((a, b) => stableHash(`${seed}:${a.id}`) - stableHash(`${seed}:${b.id}`));
    items.splice(0, items.length, ...prioritizeNew(items, (experience) => newExperienceIds.has(experience.id)));
  }

  const availableDomains = domains.filter((domain) => domain.families.some((family) => familyExperiences.has(family)));
  const rankedDomains = prioritizeNew(rotate(availableDomains, seed), (domain) => domain.families.some(
    (family) => familyExperiences.get(family)?.some((experience) => newExperienceIds.has(experience.id)),
  ));
  const rankedFamilies = new Map(rankedDomains.map((domain) => [domain.id, prioritizeNew(rotate(domain.families
    .map((id) => experienceFamilies.find((family) => family.id === id))
    .filter((family) => family && familyExperiences.has(family.id)), stableHash(`${seed}:${domain.id}`)),
  (family) => familyExperiences.get(family.id)?.some((experience) => newExperienceIds.has(experience.id)))]));

  const domainQueues = rankedDomains.map((domain) => roundRobin(
    (rankedFamilies.get(domain.id) ?? []).map((family) => familyExperiences.get(family.id) ?? []),
  ));
  const ordered = roundRobin(domainQueues);
  return { familyExperiences, ordered, rankedDomains, rankedFamilies };
}

export function renderCatalog({
  i18n,
  locale,
  activeDomain = "all",
  activeFilters = new Set(),
  closedFamilies = new Set(),
  closedDomains = new Set(),
  newExperienceIds = new Set(),
  selectedReactions = new Set(),
  pendingReactions = new Set(),
  query = "",
  limit = Number.POSITIVE_INFINITY,
  searchIndex = buildSearchIndex(i18n),
  collection = experiences,
}) {
  const visible = visibleExperiences({ activeDomain, activeFilters, query, searchIndex, collection });
  const ranked = fairCatalog(visible, collection, newExperienceIds);
  const shown = ranked.ordered.slice(0, Math.max(0, limit));
  const shownIds = new Set(shown.map((experience) => experience.id));

  const renderExperience = (experience) => {
    const localized = localizeExperience(i18n, experience);
    const tone = experience.types.includes("dysphoric") && experience.types.includes("euphoric")
      ? "mixed"
      : (experience.types[0] ?? "neutral").toLowerCase().replaceAll(" ", "-");
    return `
      <article class="card tone-${tone}" data-card-id="${escapeHtml(experience.id)}" title="${escapeHtml(experience.types.map((type) => localizeTaxonomy(i18n, "types", type)).join(" · "))}">
        <h4 class="card-title"><a class="experience-link" data-experience-id="${escapeHtml(experience.id)}" href="${experiencePath(locale, experience.id)}">${escapeHtml(localized.title)}</a>${newExperienceIds.has(experience.id) ? `<span class="new-badge">${escapeHtml(i18n.t("ui.newBadge"))}</span>` : ""}</h4>
        <p class="summary">${escapeHtml(localized.summary)}</p>
        <p class="report-count ${experience.reportCount ? "" : "report-count-empty"}" ${experience.reportCount ? "" : "aria-hidden=\"true\""}>${experience.reportCount ? escapeHtml(i18n.t("ui.reviewedReports", { count: experience.reportCount })) : "&nbsp;"}</p>
        <div class="categories" role="group" aria-label="${escapeHtml(i18n.t("ui.tags"))}">
          ${experience.types.map((type) => renderTag(i18n, activeFilters, "type", type, `type-${type.toLowerCase().replaceAll(" ", "-")}`, "ui.experienceType")).join("")}
          ${experience.directions.filter((direction) => direction !== "cross-directional").map((direction) => renderTag(i18n, activeFilters, "population", direction, "population-tag", "ui.population")).join("")}
          ${experience.tags.slice(0, 3).map((tag) => renderTag(i18n, activeFilters, "topic", tag, "topic-tag", "ui.topic")).join("")}
        </div>
        <div class="card-actions">
          <details class="sources">
            <summary>${escapeHtml(i18n.t("ui.sourceCount", { count: experience.sources.length }))}</summary>
            <ul class="source-list">${experience.sources.map((source) => renderSourceItem(i18n, source)).join("")}</ul>
          </details>
          ${renderReaction(i18n, locale, experience, selectedReactions, pendingReactions)}
        </div>
      </article>
    `;
  };

  const html = ranked.rankedDomains.map((domain) => {
    if (activeDomain !== "all" && domain.id !== activeDomain) return "";
    const families = (ranked.rankedFamilies.get(domain.id) ?? []).map((family) => {
      const familyItems = (ranked.familyExperiences.get(family.id) ?? []).filter((experience) => shownIds.has(experience.id));
      if (familyItems.length === 0) return "";
      return `
        <details class="experience-group" data-family="${escapeHtml(family.id)}" ${closedFamilies.has(family.id) ? "" : "open"}>
          <summary><h3>${escapeHtml(localizeTaxonomy(i18n, "families", family.id))}</h3></summary>
          <div class="group-grid">${familyItems.map(renderExperience).join("")}</div>
        </details>
      `;
    }).join("");
    if (!families) return "";
    const title = escapeHtml(localizeTaxonomy(i18n, "domains", domain.id));
    if (activeDomain === "all") {
      return `
        <details class="domain-section" data-domain-section="${escapeHtml(domain.id)}" ${closedDomains.has(domain.id) ? "" : "open"}>
          <summary class="domain-summary"><h2 class="domain-title">${title}</h2></summary>
          <div class="domain-content">${families}</div>
        </details>
      `;
    }
    return `
      <section class="domain-section">
        <h2 class="domain-title">${title}</h2>
        <div class="domain-content">${families}</div>
      </section>
    `;
  }).join("");

  return { html, total: visible.length, shown: shown.length };
}
