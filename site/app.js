import {
  buildSearchIndex,
  CARD_BATCH_SIZE,
  escapeHtml,
  filterKey,
  INITIAL_CARD_COUNT,
  renderCatalog,
  renderExperienceDetail,
  renderReaction,
} from "./catalog-render.js";
import { normalizeBrowseState, reconcileCatalogItems } from "./browser-state.js";
import { domains, experienceFamilies, experiences as claims } from "./data/experiences.js";
import { rankByReactionCount } from "./reaction-ranking.js";
import {
  createI18n,
  experiencePath,
  localeDefinitions,
  localeFromPath,
  localeRoot,
  localizeClaim,
  localizeTaxonomy,
  localizeTerm,
  pathForLocale,
} from "./i18n/index.js";

const locale = localeFromPath(window.location.pathname);
if (locale === "ja") void import("./fonts-ja.css");
if (locale === "zh-CN") void import("./fonts-zh-cn.css");
const i18n = await createI18n(locale);
const t = (key, options) => i18n.t(key, options);

const cards = document.querySelector("#cards");
const searchForm = document.querySelector("#search-form");
const search = document.querySelector("#search");
const searchLabel = document.querySelector("#search-label");
const searchButton = document.querySelector("#search-button");
const count = document.querySelector("#result-count");
const empty = document.querySelector("#empty");
const loadMore = document.querySelector("#load-more");
const loadMoreButton = document.querySelector("#load-more-button");
const incrementalSkeleton = document.querySelector("#incremental-skeleton");
const catalogLoadingLabel = document.querySelector("#catalog-loading-label");
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
const newCount = document.querySelector("#new-count");
const skipLink = document.querySelector("#skip-link");
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
const knownItemsStorageKey = "gender-experience-known-items-v1";
const unseenItemsStorageKey = "gender-experience-unseen-items-v1";
const browseStateStorageKey = `gender-experience-browser-v1:${locale}`;
const validDomainIds = new Set(domains.map(({ id }) => id));
const validFamilyIds = new Set(experienceFamilies.map(({ id }) => id));
const claimsBySlug = new Map(claims.map((claim) => [claim.slug, claim]));
const validFilterKeys = new Set(claims.flatMap((claim) => [
  ...claim.types.map((value) => filterKey("type", value)),
  ...claim.directions.map((value) => filterKey("population", value)),
  ...claim.tags.map((value) => filterKey("topic", value)),
]));
const restoredBrowseState = loadBrowseState();
let activeDomain = restoredBrowseState.activeDomain;
const activeFilters = new Set(restoredBrowseState.activeFilters);
const closedFamilies = new Set(restoredBrowseState.closedFamilies);
const closedDomains = new Set(restoredBrowseState.closedDomains);
const pendingReactions = new Set();
const localeShortLabels = { en: "EN", ja: "JA", "zh-CN": "中文" };
let stopLocalePositioning = null;
let floatingUiPromise = null;
let selectedReactions = loadSelectedReactions();
let newSlugs = loadNewItems();
let visibleLimit = restoredBrowseState.visibleLimit;
let currentCatalogTotal = claims.length;
let loadMorePending = false;
let reactionCountsLoaded = false;
let searchTimer = null;
const searchIndex = buildSearchIndex(i18n, claims);
search.value = restoredBrowseState.query;

function storedJson(storage, key, fallback) {
  try {
    return JSON.parse(storage.getItem(key) ?? JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function loadBrowseState() {
  return normalizeBrowseState(storedJson(sessionStorage, browseStateStorageKey, {}), {
    validDomains: validDomainIds,
    validFamilies: validFamilyIds,
    validFilters: validFilterKeys,
    initialLimit: INITIAL_CARD_COUNT,
    itemCount: claims.length,
  });
}

function saveBrowseState() {
  if (claimForCurrentRoute()) return;
  try {
    sessionStorage.setItem(browseStateStorageKey, JSON.stringify({
      activeDomain,
      activeFilters: [...activeFilters],
      closedDomains: [...closedDomains],
      closedFamilies: [...closedFamilies],
      query: search.value,
      scrollY: window.scrollY,
      visibleLimit,
    }));
  } catch {
    // Browsing remains available when session storage is unavailable.
  }
}

function loadNewItems() {
  const current = claims.map(({ slug }) => slug);
  const reconciled = reconcileCatalogItems(
    current,
    storedJson(localStorage, knownItemsStorageKey, []),
    storedJson(localStorage, unseenItemsStorageKey, []),
  );
  try {
    localStorage.setItem(knownItemsStorageKey, JSON.stringify(reconciled.known));
    localStorage.setItem(unseenItemsStorageKey, JSON.stringify(reconciled.unseen));
  } catch {
    // New-item markers remain available for the current page.
  }
  return new Set(reconciled.unseen);
}

function markItemSeen(slug) {
  if (!newSlugs.delete(slug)) return;
  try {
    localStorage.setItem(unseenItemsStorageKey, JSON.stringify([...newSlugs]));
  } catch {
    // The marker still clears for the current page.
  }
  cards.querySelector(`[data-card-slug="${CSS.escape(slug)}"] .new-badge`)?.remove();
  syncNewCount();
}

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

function floatingUi() {
  floatingUiPromise ??= import("@floating-ui/dom");
  return floatingUiPromise;
}

async function positionLocaleMenu() {
  const { computePosition, flip, offset, shift } = await floatingUi();
  if (localeMenu.hidden) return;
  const { x, y } = await computePosition(localeTrigger, localeMenu, {
    placement: "bottom-end",
    strategy: "fixed",
    middleware: [offset(7), flip(), shift({ padding: 10 })],
  });
  Object.assign(localeMenu.style, { left: `${x}px`, top: `${y}px` });
}

function closeLocaleMenu(returnFocus = false) {
  localeTrigger.setAttribute("aria-expanded", "false");
  localeMenu.hidden = true;
  stopLocalePositioning?.();
  stopLocalePositioning = null;
  if (returnFocus) localeTrigger.focus();
}

async function openLocaleMenu(focusFirst = false) {
  localeTrigger.setAttribute("aria-expanded", "true");
  localeMenu.hidden = false;
  const { autoUpdate } = await floatingUi();
  if (localeMenu.hidden) return;
  stopLocalePositioning = autoUpdate(localeTrigger, localeMenu, positionLocaleMenu);
  if (focusFirst) localeMenu.querySelector("a")?.focus();
}

function localizedFilter(group, value) {
  if (group === "type") return localizeTaxonomy(i18n, "types", value);
  if (group === "population") return localizeTaxonomy(i18n, "directions", value);
  return localizeTerm(i18n, value);
}

function renderTabs() {
  domainTabs.innerHTML = [null, ...domains.map((domain) => domain.id)].map((id) => {
    const value = id ?? "all";
    const label = id ? localizeTaxonomy(i18n, "domains", id) : t("ui.all");
    return `<button type="button" data-domain="${escapeHtml(value)}" aria-pressed="${value === activeDomain}">${escapeHtml(label)}</button>`;
  }).join("");
}

function renderActiveFilters() {
  if (activeFilters.size === 0) {
    activeFiltersElement.innerHTML = "";
    return;
  }
  activeFiltersElement.innerHTML = `
    <span>${escapeHtml(t("ui.filteredBy"))}</span>
    ${[...activeFilters].map((key) => {
      const [group, value] = key.split(":", 2);
      const label = localizedFilter(group, value);
      return `<button type="button" data-remove-filter="${escapeHtml(key)}" aria-label="${escapeHtml(t("ui.removeFilter", { label }))}">${escapeHtml(label)} ×</button>`;
    }).join("")}
    <button class="clear-filters" type="button" data-clear-filters>${escapeHtml(t("ui.clear"))}</button>
  `;
}

function closeOtherSources(current) {
  cards.querySelectorAll(".sources[open]").forEach((source) => {
    if (source !== current) source.open = false;
  });
}

function attachCatalogListeners() {
  cards.querySelectorAll(".experience-group").forEach((group) => {
    group.addEventListener("toggle", () => {
      if (group.open) closedFamilies.delete(group.dataset.family);
      else closedFamilies.add(group.dataset.family);
      saveBrowseState();
    });
  });
  cards.querySelectorAll(".domain-section[data-domain-section]").forEach((domain) => {
    domain.addEventListener("toggle", () => {
      if (domain.open) closedDomains.delete(domain.dataset.domainSection);
      else closedDomains.add(domain.dataset.domainSection);
      saveBrowseState();
    });
  });
  cards.querySelectorAll(".sources").forEach((source) => {
    source.addEventListener("toggle", () => {
      if (source.open) closeOtherSources(source);
    });
  });
}

function sortCatalogByReactions() {
  if (!reactionCountsLoaded) return;
  cards.querySelectorAll(".group-grid").forEach((grid) => {
    const rankedCards = rankByReactionCount(
      [...grid.querySelectorAll(":scope > [data-card-slug]")],
      (card) => claimsBySlug.get(card.dataset.cardSlug)?.reactionCount,
    );
    for (const card of rankedCards) grid.append(card);
  });
}

function syncNewCount() {
  newCount.textContent = t("ui.newCount", { count: newSlugs.size });
  newCount.hidden = newSlugs.size === 0;
}

function syncCatalogControls(total, shown) {
  currentCatalogTotal = total;
  count.textContent = t("ui.resultCount", { count: total });
  empty.textContent = t("ui.noMatches");
  empty.hidden = total !== 0;
  loadMore.hidden = shown >= total;
  loadMoreButton.textContent = t("ui.loadMore");
  loadMoreButton.setAttribute("aria-label", t("ui.loadMoreLabel", { shown, total }));
  cards.setAttribute("aria-busy", "false");
}

function renderCards({ reusePrerendered = false } = {}) {
  const result = renderCatalog({
    i18n,
    locale,
    activeDomain,
    activeFilters,
    closedDomains,
    closedFamilies,
    newSlugs,
    selectedReactions,
    pendingReactions,
    query: search.value,
    limit: visibleLimit,
    searchIndex,
    collection: claims,
  });
  if (!reusePrerendered) cards.innerHTML = result.html;
  cards.removeAttribute("data-prerendered-locale");
  attachCatalogListeners();
  sortCatalogByReactions();
  syncCatalogControls(result.total, result.shown);
  syncNewCount();
}

function resetCatalogView() {
  visibleLimit = INITIAL_CARD_COUNT;
  renderCards();
  saveBrowseState();
}

function showMoreExperiences() {
  if (loadMorePending || visibleLimit >= currentCatalogTotal) return;
  loadMorePending = true;
  loadMoreButton.disabled = true;
  incrementalSkeleton.hidden = false;
  cards.setAttribute("aria-busy", "true");

  const complete = () => {
    visibleLimit += CARD_BATCH_SIZE;
    loadMorePending = false;
    loadMoreButton.disabled = false;
    incrementalSkeleton.hidden = true;
    renderCards();
    saveBrowseState();
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(complete, { timeout: 180 });
  else window.requestAnimationFrame(complete);
}

function renderDetail(claim) {
  detailView.innerHTML = renderExperienceDetail({
    i18n,
    locale,
    claim,
    activeFilters,
    selectedReactions,
    pendingReactions,
    collection: claims,
  });
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
  skipLink.textContent = t("ui.skipToExperiences");
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
  if (catalogLoadingLabel) catalogLoadingLabel.textContent = t("ui.loadingExperiences");
  loadMoreButton.textContent = t("ui.loadMore");
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

function claimForCurrentRoute() {
  const match = window.location.pathname.match(/^\/(?:ja\/|zh-cn\/)?experience\/([^/]+)\/?$/i)
    ?? window.location.hash.match(/^#\/experience\/([^/]+)$/);
  return match ? claims.find((item) => item.slug === decodeURIComponent(match[1])) : null;
}

function renderRoute() {
  const claim = claimForCurrentRoute();
  if (claim) {
    markItemSeen(claim.slug);
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

function updateReactionControls(slug, restoreFocus = false) {
  const claim = claims.find((item) => item.slug === slug);
  if (!claim) return;
  document.querySelectorAll(`[data-reaction-slug="${CSS.escape(slug)}"]`).forEach((button) => {
    button.outerHTML = renderReaction(i18n, locale, claim, selectedReactions, pendingReactions);
  });
  if (restoreFocus) {
    document.querySelector(`[data-reaction-slug="${CSS.escape(slug)}"]`)?.focus({ preventScroll: true });
  }
}

async function loadReactionCounts() {
  try {
    const response = await fetch("/api/reactions", { headers: { accept: "application/json" } });
    if (!response.ok) return;
    const data = await response.json();
    for (const claim of claims) {
      const nextCount = Number(data.counts?.[claim.slug] ?? 0);
      const changed = claim.reactionCount !== nextCount;
      claim.reactionCount = nextCount;
      if (changed) updateReactionControls(claim.slug);
    }
    reactionCountsLoaded = true;
    sortCatalogByReactions();
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
  updateReactionControls(claim.slug, true);
  let failureMessage = "ui.reactionError";

  try {
    const response = await fetch(`/api/reactions/${encodeURIComponent(claim.slug)}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ voterId: voterId(), selected }),
    });
    if (response.status === 429) {
      failureMessage = "ui.reactionRateLimited";
      throw new Error("Reaction rate limited");
    }
    if (!response.ok) throw new Error("Reaction request failed");
    const data = await response.json();
    claim.reactionCount = Number(data.count ?? claim.reactionCount);
    reactionStatus.textContent = t(selected ? "ui.reactionSaved" : "ui.reactionRemoved");
    pendingReactions.delete(claim.slug);
    updateReactionControls(claim.slug, true);
    return;
  } catch {
    wasSelected ? selectedReactions.add(claim.slug) : selectedReactions.delete(claim.slug);
    claim.reactionCount = previousCount;
    saveSelectedReactions();
    reactionStatus.textContent = t(failureMessage);
  }
  pendingReactions.delete(claim.slug);
  updateReactionControls(claim.slug, true);
}

search.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(resetCatalogView, 120);
});
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  window.clearTimeout(searchTimer);
  resetCatalogView();
});
domainTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-domain]");
  if (!button) return;
  activeDomain = button.dataset.domain;
  renderTabs();
  resetCatalogView();
});
cards.addEventListener("click", (event) => {
  const claimLink = event.target.closest("[data-claim-slug]");
  if (claimLink) markItemSeen(claimLink.dataset.claimSlug);
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
  resetCatalogView();
});
detailView.addEventListener("click", (event) => {
  const claimLink = event.target.closest("[data-claim-slug]");
  if (claimLink) markItemSeen(claimLink.dataset.claimSlug);
  const reaction = event.target.closest("[data-reaction-slug]");
  if (reaction) {
    void handleReaction(reaction);
    return;
  }
  const tag = event.target.closest("[data-filter-group]");
  if (!tag) return;
  activeFilters.add(filterKey(tag.dataset.filterGroup, tag.dataset.filterValue));
  renderActiveFilters();
  resetCatalogView();
  window.history.pushState(null, "", localeRoot(locale));
  renderRoute();
});
activeFiltersElement.addEventListener("click", (event) => {
  const remove = event.target.closest("[data-remove-filter]");
  if (remove) activeFilters.delete(remove.dataset.removeFilter);
  if (event.target.closest("[data-clear-filters]")) activeFilters.clear();
  renderActiveFilters();
  resetCatalogView();
});
loadMoreButton.addEventListener("click", showMoreExperiences);
themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme, true);
});
localeTrigger.addEventListener("click", () => {
  if (localeMenu.hidden) void openLocaleMenu();
  else closeLocaleMenu();
});
localeTrigger.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowDown") return;
  event.preventDefault();
  if (localeMenu.hidden) void openLocaleMenu(true);
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
  if (!event.target.closest(".sources")) closeOtherSources(null);
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const source = cards.querySelector(".sources[open]");
  if (!source) return;
  source.open = false;
  source.querySelector("summary")?.focus();
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
if (claimForCurrentRoute()) {
  cards.innerHTML = "";
  cards.setAttribute("aria-busy", "false");
  loadMore.hidden = true;
} else {
  const canReusePrerendered = cards.dataset.prerenderedLocale === locale
    && selectedReactions.size === 0
    && newSlugs.size === 0
    && activeDomain === "all"
    && activeFilters.size === 0
    && closedDomains.size === 0
    && closedFamilies.size === 0
    && search.value === ""
    && visibleLimit === INITIAL_CARD_COUNT;
  renderCards({ reusePrerendered: canReusePrerendered });
}
renderRoute();
void loadReactionCounts();
if ("IntersectionObserver" in window) {
  const loadMoreObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) showMoreExperiences();
  }, { rootMargin: "280px 0px" });
  loadMoreObserver.observe(loadMore);
}
window.addEventListener("hashchange", () => {
  renderRoute();
  window.scrollTo({ top: 0, behavior: "instant" });
});
window.addEventListener("popstate", () => {
  renderRoute();
  window.scrollTo({ top: 0, behavior: "instant" });
});
window.addEventListener("pagehide", saveBrowseState);

if (!claimForCurrentRoute() && restoredBrowseState.scrollY > 0) {
  history.scrollRestoration = "manual";
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
    window.scrollTo({ top: restoredBrowseState.scrollY, behavior: "instant" });
  }));
}
