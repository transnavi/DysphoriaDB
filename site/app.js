import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import { domains, experienceFamilies, experiences as claims } from "./data/experiences.js";
import {
  createI18n,
  experiencePath,
  localeDefinitions,
  localeFromPath,
  localeRoot,
  localizeClaim,
  localizeSourceKind,
  localizeSourceNote,
  localizeTaxonomy,
  localizeTerm,
  pathForLocale,
} from "./i18n/index.js";

const locale = localeFromPath(window.location.pathname);
const i18n = await createI18n(locale);
const t = (key, options) => i18n.t(key, options);

const cards = document.querySelector("#cards");
const searchForm = document.querySelector("#search-form");
const search = document.querySelector("#search");
const searchLabel = document.querySelector("#search-label");
const searchButton = document.querySelector("#search-button");
const count = document.querySelector("#result-count");
const empty = document.querySelector("#empty");
const domainTabs = document.querySelector("#domain-tabs");
const activeFiltersElement = document.querySelector("#active-filters");
const browseView = document.querySelector("#browse-view");
const detailView = document.querySelector("#experience-detail");
const intro = document.querySelector(".intro");
const submitExperience = document.querySelector("#submit-experience");
const wordmark = document.querySelector(".wordmark");
const browser = document.querySelector(".browser");
const localeLabel = document.querySelector("#locale-label");
const localeTrigger = document.querySelector("#locale-trigger");
const localeCurrent = document.querySelector("#locale-current");
const localeMenu = document.querySelector("#locale-menu");
const themeToggle = document.querySelector("#theme-toggle");
const themeColor = document.querySelector("#theme-color");
const reactionStatus = document.querySelector("#reaction-status");
const footerStatement = document.querySelector("#footer-statement");
const footerFlagLabel = document.querySelector("#footer-flag-label");
const footerNavigation = document.querySelector("#footer-navigation");
const footerReferenceTitle = document.querySelector("#footer-reference-title");
const footerDataTitle = document.querySelector("#footer-data-title");
const footerJson = document.querySelector("#footer-json");
const footerCsv = document.querySelector("#footer-csv");
const footerGlossary = document.querySelector("#footer-glossary");
const footerSubmit = document.querySelector("#footer-submit");
const footerLicense = document.querySelector("#footer-license");
const footerCopyright = document.querySelector("#footer-copyright");
const themePreference = matchMedia("(prefers-color-scheme: dark)");
const themeStorageKey = "gender-experience-theme";
const reactionStorageKey = "gender-experience-reactions-v1";
const voterStorageKey = "gender-experience-voter-v1";
let activeDomain = "all";
const activeFilters = new Set();
const closedFamilies = new Set();
const pendingReactions = new Set();
const localeShortLabels = { en: "EN", ja: "JA", "zh-CN": "中文" };
let stopLocalePositioning = null;
let selectedReactions = loadSelectedReactions();

function loadSelectedReactions() {
  try {
    const value = JSON.parse(localStorage.getItem(reactionStorageKey) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter((slug) => claims.some((claim) => claim.slug === slug)) : []);
  } catch {
    return new Set();
  }
}

function saveSelectedReactions() {
  try {
    localStorage.setItem(reactionStorageKey, JSON.stringify([...selectedReactions]));
  } catch {
    // Reactions still work for the current page when storage is unavailable.
  }
}

function voterId() {
  try {
    const saved = localStorage.getItem(voterStorageKey);
    if (saved) return saved;
    const created = crypto.randomUUID();
    localStorage.setItem(voterStorageKey, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function savedTheme() {
  try {
    const value = localStorage.getItem(themeStorageKey);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme, save = false) {
  document.documentElement.dataset.theme = theme;
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = t(nextTheme === "dark" ? "ui.useDarkTheme" : "ui.useLightTheme");
  themeToggle.setAttribute("aria-label", label);
  themeToggle.title = label;
  themeColor.content = theme === "dark" ? "#1a1624" : "#fffdf8";
  if (save) {
    try {
      localStorage.setItem(themeStorageKey, theme);
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }
}

function positionLocaleMenu() {
  return computePosition(localeTrigger, localeMenu, {
    placement: "bottom-end",
    strategy: "fixed",
    middleware: [offset(7), flip(), shift({ padding: 10 })],
  }).then(({ x, y }) => {
    Object.assign(localeMenu.style, { left: `${x}px`, top: `${y}px` });
  });
}

function closeLocaleMenu(returnFocus = false) {
  localeTrigger.setAttribute("aria-expanded", "false");
  localeMenu.hidden = true;
  stopLocalePositioning?.();
  stopLocalePositioning = null;
  if (returnFocus) localeTrigger.focus();
}

function openLocaleMenu(focusFirst = false) {
  localeTrigger.setAttribute("aria-expanded", "true");
  localeMenu.hidden = false;
  stopLocalePositioning = autoUpdate(localeTrigger, localeMenu, positionLocaleMenu);
  if (focusFirst) localeMenu.querySelector("a")?.focus();
}

function sourceKind(source) {
  if (source[2]?.startsWith("Community report")) {
    const relation = source[2].slice("Community report".length);
    return `${t("ui.communityReport")}${relation}`;
  }
  if (source[2]) return localizeSourceKind(i18n, source[2]);
  if (source[1].includes("genderdysphoria.fyi") || source[1].includes("transnavi.jp")) return t("ui.communityReference");
  if (source[1].includes("x.com/") || source[1].includes("reddit.com/")) return t("ui.communityReport");
  return t("ui.reference");
}

function renderSourceItem(source, detailed = false) {
  const [label, url] = source;
  const note = source[3] ? localizeSourceNote(i18n, source[3]) : "";
  return `<li><span class="source-kind">${sourceKind(source)}</span><a href="${url}" target="_blank" rel="noreferrer">${label} ↗</a>${detailed && note ? `<span class="source-note">${note}</span>` : ""}</li>`;
}

function localizedFilter(group, value) {
  if (group === "type") return localizeTaxonomy(i18n, "types", value);
  if (group === "population") return localizeTaxonomy(i18n, "directions", value);
  return localizeTerm(i18n, value);
}

function renderTag(group, value, className, categoryKey) {
  const key = filterKey(group, value);
  const label = localizedFilter(group, value);
  const categoryLabel = t(categoryKey);
  return `<button type="button" class="category-tag ${className}" data-filter-group="${group}" data-filter-value="${value}" data-category-label="${categoryLabel}" aria-label="${label}; ${categoryLabel}" aria-pressed="${activeFilters.has(key)}">${label}</button>`;
}

function renderReaction(claim) {
  const selected = selectedReactions.has(claim.slug);
  const label = t(selected ? "ui.meTooSelectedLabel" : "ui.meTooLabel", {
    title: localizeClaim(i18n, claim).title,
    count: claim.reactionCount,
  });
  return `
    <button class="reaction-button" type="button" data-reaction-slug="${claim.slug}" aria-label="${label}" aria-pressed="${selected}" ${pendingReactions.has(claim.slug) ? "disabled" : ""}>
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
      <span>${t("ui.meToo")}</span>
      <span class="reaction-count">${new Intl.NumberFormat(locale).format(claim.reactionCount)}</span>
    </button>
  `;
}

function renderTabs() {
  domainTabs.innerHTML = [null, ...domains.map((domain) => domain.id)].map((id) => {
    const value = id ?? "all";
    const label = id ? localizeTaxonomy(i18n, "domains", id) : t("ui.all");
    return `<button type="button" data-domain="${value}" aria-pressed="${value === activeDomain}">${label}</button>`;
  }).join("");
}

function filterKey(group, value) {
  return `${group}:${value}`;
}

function claimHasFilter(claim, key) {
  const [group, value] = key.split(":", 2);
  if (group === "type") return claim.types.includes(value);
  if (group === "population") return claim.directions.includes(value);
  return claim.tags.includes(value);
}

function renderActiveFilters() {
  if (activeFilters.size === 0) {
    activeFiltersElement.innerHTML = "";
    return;
  }
  activeFiltersElement.innerHTML = `
    <span>${t("ui.filteredBy")}</span>
    ${[...activeFilters].map((key) => {
      const [group, value] = key.split(":", 2);
      return `<button type="button" data-remove-filter="${key}">${localizedFilter(group, value)} ×</button>`;
    }).join("")}
    <button class="clear-filters" type="button" data-clear-filters>${t("ui.clear")}</button>
  `;
}

function renderCards() {
  const query = search.value.trim().toLocaleLowerCase();
  const visible = claims.filter((claim) => {
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
    ]
      .join(" ")
      .toLocaleLowerCase();
    return searchable.includes(query)
      && (activeDomain === "all" || claim.domain === activeDomain)
      && [...activeFilters].every((key) => claimHasFilter(claim, key));
  });

  const renderClaim = (claim) => {
    const localized = localizeClaim(i18n, claim);
    const tone = claim.types.includes("dysphoric") && claim.types.includes("euphoric")
      ? "mixed"
      : (claim.types[0] ?? "neutral").toLowerCase().replaceAll(" ", "-");
    return `
    <article class="card tone-${tone}" title="${claim.types.map((type) => localizeTaxonomy(i18n, "types", type)).join(" · ")}">
      <h3><a class="claim-link" href="${experiencePath(locale, claim.slug)}">${localized.title}</a></h3>
      <p class="summary">${localized.summary}</p>
      <p class="report-count ${claim.reportCount ? "" : "report-count-empty"}" ${claim.reportCount ? "" : "aria-hidden=\"true\""}>${claim.reportCount ? t("ui.reviewedReports", { count: claim.reportCount }) : "&nbsp;"}</p>
      <div class="categories" aria-label="${t("ui.tags")}">
        ${claim.types.map((type) => renderTag("type", type, `type-${type.toLowerCase().replaceAll(" ", "-")}`, "ui.experienceType")).join("")}
        ${claim.directions.filter((direction) => direction !== "cross-directional").map((direction) => renderTag("population", direction, "population-tag", "ui.population")).join("")}
        ${claim.tags.slice(0, 3).map((tag) => renderTag("topic", tag, "topic-tag", "ui.topic")).join("")}
      </div>
      <div class="card-actions">
        <details class="sources">
          <summary>${t("ui.sourceCount", { count: claim.sources.length })}</summary>
          <ul class="source-list">
            ${claim.sources.map(renderSourceItem).join("")}
          </ul>
        </details>
        ${renderReaction(claim)}
      </div>
    </article>
  `;
  };

  const familyScore = (familyTitle) => visible
    .filter((claim) => claim.family === familyTitle)
    .reduce((score, claim) => ({
      reactions: score.reactions + claim.reactionCount,
      reports: score.reports + claim.reportCount,
    }), { reactions: 0, reports: 0 });
  const compareScore = (a, b) => b.reactions - a.reactions || b.reports - a.reports;
  const renderFamily = (family) => {
    const familyClaims = visible
      .filter((claim) => claim.family === family.id)
      .sort((a, b) => b.reactionCount - a.reactionCount || b.reportCount - a.reportCount);
    if (familyClaims.length === 0) return "";
    return `
      <details class="experience-group" data-family="${family.id}" ${closedFamilies.has(family.id) ? "" : "open"}>
        <summary><h2>${localizeTaxonomy(i18n, "families", family.id)}</h2></summary>
        <div class="group-grid">${familyClaims.map(renderClaim).join("")}</div>
      </details>
    `;
  };

  const rankedDomains = [...domains].sort((a, b) => {
    const domainScore = (domain) => domain.families.reduce((score, family) => {
      const familyResult = familyScore(family);
      return {
        reactions: score.reactions + familyResult.reactions,
        reports: score.reports + familyResult.reports,
      };
    }, { reactions: 0, reports: 0 });
    return compareScore(domainScore(a), domainScore(b));
  });

  cards.innerHTML = rankedDomains.map((domain) => {
    if (activeDomain !== "all" && domain.id !== activeDomain) return "";
    const families = domain.families
      .map((title) => experienceFamilies.find((family) => family.id === title))
      .filter(Boolean)
      .sort((a, b) => compareScore(familyScore(a.id), familyScore(b.id)));
    const content = families.map(renderFamily).join("");
    if (!content) return "";
    return `
      <section class="domain-section">
        ${activeDomain === "all" ? `<h2 class="domain-title">${localizeTaxonomy(i18n, "domains", domain.id)}</h2>` : ""}
        <div class="domain-content">${content}</div>
      </section>
    `;
  }).join("");

  cards.querySelectorAll(".experience-group").forEach((group) => {
    group.addEventListener("toggle", () => {
      if (group.open) closedFamilies.delete(group.dataset.family);
      else closedFamilies.add(group.dataset.family);
    });
  });

  count.textContent = t("ui.resultCount", { count: visible.length });
  empty.textContent = t("ui.noMatches");
  empty.hidden = visible.length !== 0;
}

function renderDetail(claim) {
  const related = claims.filter((candidate) => candidate.family === claim.family && candidate !== claim);
  const localized = localizeClaim(i18n, claim);
  detailView.innerHTML = `
    <a class="detail-back" href="${localeRoot(locale)}">← ${t("ui.allExperiences")}</a>
    <article>
      <div class="detail-context">
        <span>${localizeTaxonomy(i18n, "domains", claim.domain)}</span>
        <span>${localizeTaxonomy(i18n, "families", claim.family)}</span>
      </div>
      <h1>${localized.title}</h1>
      <p class="detail-summary">${localized.summary}</p>
      ${claim.reportCount ? `<p class="report-count">${t("ui.reviewedReports", { count: claim.reportCount })}</p>` : ""}
      <div class="categories detail-tags" aria-label="${t("ui.tags")}">
        ${claim.types.map((type) => renderTag("type", type, `type-${type.toLowerCase().replaceAll(" ", "-")}`, "ui.experienceType")).join("")}
        ${claim.directions.filter((direction) => direction !== "cross-directional").map((direction) => renderTag("population", direction, "population-tag", "ui.population")).join("")}
        ${claim.tags.map((tag) => renderTag("topic", tag, "topic-tag", "ui.topic")).join("")}
      </div>
      <div class="reaction-row detail-reaction">${renderReaction(claim)}</div>
      ${localized.patterns ? `
        <section class="detail-section">
          <h3>${t("ui.reportedVariations")}</h3>
          <dl class="pattern-list">
            ${localized.patterns.map(([title, text]) => `<div><dt>${title}</dt><dd>${text}</dd></div>`).join("")}
          </dl>
        </section>
      ` : ""}
      ${localized.variations ? `
        <section class="detail-section">
          <h3>${t("ui.populationVariations")}</h3>
          <ul class="detail-variations">${localized.variations.map((variation) => `<li><strong>${localizeTaxonomy(i18n, "directions", variation.direction)}:</strong> ${variation.text}</li>`).join("")}</ul>
        </section>
      ` : ""}
      <section class="detail-section" id="sources">
        <h3>${t("ui.sources")}</h3>
        <ul class="detail-source-list">${claim.sources.map((source) => renderSourceItem(source, true)).join("")}</ul>
      </section>
      ${related.length ? `
        <section class="detail-section">
          <h3>${t("ui.relatedExperiences")}</h3>
          <ul class="related-list">${related.map((item) => `<li><a href="${experiencePath(locale, item.slug)}">${localizeClaim(i18n, item).title}</a></li>`).join("")}</ul>
        </section>
      ` : ""}
    </article>
  `;
}

function setMeta(attribute, key, value) {
  document.querySelector(`meta[${attribute}="${key}"]`)?.setAttribute("content", value);
}

function updateMetadata(claim = null) {
  const localized = claim ? localizeClaim(i18n, claim) : null;
  const path = claim ? experiencePath(locale, claim.slug) : localeRoot(locale);
  const url = new URL(path, "https://db.transnavi.jp").href;
  const title = localized ? `${localized.title} — ${t("ui.siteName")}` : t("ui.siteName");
  const description = localized?.summary ?? t("ui.description");
  document.title = title;
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", url);
  setMeta("name", "description", description);
  setMeta("property", "og:url", url);
  setMeta("property", "og:type", claim ? "article" : "website");
  setMeta("property", "og:locale", localeDefinitions[locale].ogLocale);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
}

function applyStaticTranslations() {
  document.documentElement.lang = localeDefinitions[locale].htmlLang;
  wordmark.textContent = t("ui.siteName");
  wordmark.href = localeRoot(locale);
  intro.querySelector("h1, .intro-title").textContent = t("ui.heading");
  intro.querySelector(":scope > p").textContent = t("ui.introduction");
  submitExperience.innerHTML = `${t("ui.submitExperience")} <span aria-hidden="true">↗</span>`;
  browser.setAttribute("aria-label", t("ui.browseExperiences"));
  searchLabel.textContent = t("ui.searchLabel");
  search.placeholder = t("ui.searchPlaceholder");
  searchButton.textContent = t("ui.searchButton");
  domainTabs.setAttribute("aria-label", t("ui.experienceAreas"));
  empty.textContent = t("ui.noMatches");
  localeLabel.textContent = t("ui.languageLabel");
  localeCurrent.textContent = localeDefinitions[locale].label;
  localeCurrent.dataset.shortLabel = localeShortLabels[locale];
  localeMenu.querySelectorAll("[data-locale]").forEach((link) => {
    const isCurrent = link.dataset.locale === locale;
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
    const nextPath = pathForLocale(window.location.pathname, link.dataset.locale);
    link.href = `${nextPath}${window.location.search}${window.location.hash}`;
  });
  footerStatement.textContent = t("ui.footerStatement");
  footerFlagLabel.setAttribute("aria-label", t("ui.footerFlagLabel"));
  footerNavigation.setAttribute("aria-label", t("ui.footerNavLabel"));
  footerReferenceTitle.textContent = t("ui.footerReference");
  footerDataTitle.textContent = t("ui.footerOpenData");
  footerJson.textContent = t("ui.downloadJson");
  footerCsv.textContent = t("ui.downloadCsv");
  footerGlossary.textContent = t("ui.glossary");
  footerSubmit.textContent = t("ui.submitExperience");
  footerLicense.textContent = t("ui.contentLicense");
  footerCopyright.textContent = t("ui.copyright");
}

function renderRoute() {
  const match = window.location.pathname.match(/^\/(?:ja\/|zh-cn\/)?experience\/([^/]+)\/?$/i)
    ?? window.location.hash.match(/^#\/experience\/([^/]+)$/);
  const claim = match ? claims.find((item) => item.slug === decodeURIComponent(match[1])) : null;
  if (claim) {
    browseView.hidden = true;
    intro.hidden = true;
    detailView.hidden = false;
    renderDetail(claim);
    updateMetadata(claim);
    return;
  }
  browseView.hidden = false;
  intro.hidden = false;
  detailView.hidden = true;
  updateMetadata();
}

function rerenderForReactions(focusSlug = null) {
  renderCards();
  renderRoute();
  if (focusSlug) document.querySelector(`[data-reaction-slug="${focusSlug}"]`)?.focus();
}

async function loadReactionCounts() {
  try {
    const response = await fetch("/api/reactions", { headers: { accept: "application/json" } });
    if (!response.ok) return;
    const data = await response.json();
    for (const claim of claims) claim.reactionCount = Number(data.counts?.[claim.slug] ?? 0);
    rerenderForReactions();
  } catch {
    // The index remains available if the reaction service is offline.
  }
}

async function handleReaction(button) {
  const claim = claims.find((item) => item.slug === button.dataset.reactionSlug);
  if (!claim || button.disabled) return;

  const wasSelected = selectedReactions.has(claim.slug);
  const previousCount = claim.reactionCount;
  const selected = !wasSelected;
  pendingReactions.add(claim.slug);
  selected ? selectedReactions.add(claim.slug) : selectedReactions.delete(claim.slug);
  claim.reactionCount = Math.max(0, previousCount + (selected ? 1 : -1));
  saveSelectedReactions();
  rerenderForReactions(claim.slug);

  try {
    const response = await fetch(`/api/reactions/${encodeURIComponent(claim.slug)}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ voterId: voterId(), selected }),
    });
    if (!response.ok) throw new Error("Reaction request failed");
    const data = await response.json();
    claim.reactionCount = Number(data.count ?? claim.reactionCount);
    reactionStatus.textContent = t(selected ? "ui.reactionSaved" : "ui.reactionRemoved");
  } catch {
    wasSelected ? selectedReactions.add(claim.slug) : selectedReactions.delete(claim.slug);
    claim.reactionCount = previousCount;
    saveSelectedReactions();
    reactionStatus.textContent = t("ui.reactionError");
  }
  pendingReactions.delete(claim.slug);
  rerenderForReactions(claim.slug);
}

search.addEventListener("input", renderCards);
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderCards();
});
domainTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-domain]");
  if (!button) return;
  activeDomain = button.dataset.domain;
  renderTabs();
  renderCards();
});
cards.addEventListener("click", (event) => {
  const reaction = event.target.closest("[data-reaction-slug]");
  if (reaction) {
    void handleReaction(reaction);
    return;
  }
  const tag = event.target.closest("[data-filter-group]");
  if (!tag) return;
  const key = filterKey(tag.dataset.filterGroup, tag.dataset.filterValue);
  activeFilters.has(key) ? activeFilters.delete(key) : activeFilters.add(key);
  renderActiveFilters();
  renderCards();
});
detailView.addEventListener("click", (event) => {
  const reaction = event.target.closest("[data-reaction-slug]");
  if (reaction) {
    void handleReaction(reaction);
    return;
  }
  const tag = event.target.closest("[data-filter-group]");
  if (!tag) return;
  activeFilters.add(filterKey(tag.dataset.filterGroup, tag.dataset.filterValue));
  renderActiveFilters();
  renderCards();
  window.history.pushState(null, "", localeRoot(locale));
  renderRoute();
});
activeFiltersElement.addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove-filter]");
  if (remove) activeFilters.delete(remove.dataset.removeFilter);
  if (event.target.closest("[data-clear-filters]")) activeFilters.clear();
  renderActiveFilters();
  renderCards();
});
themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme, true);
});
localeTrigger.addEventListener("click", () => {
  if (localeMenu.hidden) openLocaleMenu();
  else closeLocaleMenu();
});
localeTrigger.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowDown") return;
  event.preventDefault();
  if (localeMenu.hidden) openLocaleMenu(true);
  else localeMenu.querySelector("a")?.focus();
});
localeMenu.addEventListener("keydown", (event) => {
  const links = [...localeMenu.querySelectorAll("a")];
  const currentIndex = links.indexOf(document.activeElement);
  if (event.key === "Escape") {
    event.preventDefault();
    closeLocaleMenu(true);
    return;
  }
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const nextIndex = event.key === "Home"
    ? 0
    : event.key === "End"
      ? links.length - 1
      : (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
  links[nextIndex]?.focus();
});
document.addEventListener("pointerdown", (event) => {
  if (!localeMenu.hidden && !event.target.closest(".locale-switcher")) closeLocaleMenu();
});
document.addEventListener("focusin", (event) => {
  if (!localeMenu.hidden && !event.target.closest(".locale-switcher")) closeLocaleMenu();
});
themePreference.addEventListener("change", (event) => {
  if (!savedTheme()) applyTheme(event.matches ? "dark" : "light");
});
window.addEventListener("storage", (event) => {
  if (event.key !== themeStorageKey) return;
  const theme = event.newValue === "light" || event.newValue === "dark"
    ? event.newValue
    : (themePreference.matches ? "dark" : "light");
  applyTheme(theme);
});
applyStaticTranslations();
applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
renderTabs();
renderActiveFilters();
renderCards();
renderRoute();
void loadReactionCounts();
window.addEventListener("hashchange", () => {
  renderRoute();
  window.scrollTo({ top: 0, behavior: "instant" });
});
window.addEventListener("popstate", () => {
  renderRoute();
  window.scrollTo({ top: 0, behavior: "instant" });
});
