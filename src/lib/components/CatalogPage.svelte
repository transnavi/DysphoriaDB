<script lang="ts">
  import { replaceState } from "$app/navigation";
  import { onMount, untrack } from "svelte";
  import { experienceHasFilter, filterKey, formatMessage } from "$lib/catalog";
  import type { CatalogDomain, CatalogPageData, CatalogTag, LocalizedSite } from "$lib/types";
  import ExperienceCard from "$lib/components/ExperienceCard.svelte";
  import Seo from "$lib/components/Seo.svelte";

  let { data } = $props<{ data: CatalogPageData }>();
  let site: LocalizedSite = $derived(data.site);
  let messages = $derived(site.messages);
  let rootPath = $derived(site.localeDefinition.path ? `/${site.localeDefinition.path}/` : "/");
  let query = $state(untrack(() => data.browse.query));
  let activeDomain = $state(untrack(() => data.browse.activeDomain));
  let activeFilters = $state<string[]>(untrack(() => [...data.browse.activeFilters]));
  let closedDomains = $state<string[]>(untrack(() => [...data.browse.closedDomains]));
  let closedFamilies = $state<string[]>(untrack(() => [...data.browse.closedFamilies]));
  let selectedReactions = $state<string[]>(untrack(() => [...data.browse.selectedReactions]));
  let newExperienceIds = $state<string[]>(untrack(() => [...data.browse.newExperienceIds]));
  let openSourceExperienceId = $state("");
  let reactionStatus = $state("");
  let searchTimer: ReturnType<typeof setTimeout>;

  function prioritizeNew<T>(items: T[], isNew: (item: T) => boolean) {
    return [...items.filter(isNew), ...items.filter((item) => !isNew(item))];
  }

  let visibleDomains: CatalogDomain[] = $derived.by(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(site.locale);
    const newIds = new Set(newExperienceIds);
    const visible = site.domains
      .filter((domain) => activeDomain === "all" || domain.id === activeDomain)
      .map((domain) => ({
        ...domain,
        families: prioritizeNew(domain.families
          .map((family) => ({
            ...family,
            items: prioritizeNew(family.items.filter((item) =>
              item.searchText.includes(normalizedQuery)
              && activeFilters.every((key) => experienceHasFilter(item, key))
            ), (item) => newIds.has(item.id)),
          }))
          .filter((family) => family.items.length > 0), (family) =>
            family.items.some((item) => newIds.has(item.id))),
      }))
      .filter((domain) => domain.families.length > 0);
    return prioritizeNew(visible, (domain) => domain.families.some((family) =>
      family.items.some((item) => newIds.has(item.id))));
  });
  let resultCount: number = $derived(visibleDomains.reduce(
    (total, domain) =>
      total + domain.families.reduce((subtotal, family) => subtotal + family.items.length, 0),
    0,
  ));

  function setCookie(name: string, values: string[]) {
    document.cookie = `${name}=${encodeURIComponent(values.join(","))}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }

  function syncUrl() {
    const url = new URL(location.href);
    url.searchParams.delete("q");
    url.searchParams.delete("domain");
    url.searchParams.delete("filter");
    if (query.trim()) url.searchParams.set("q", query.trim().slice(0, 200));
    if (activeDomain !== "all") url.searchParams.set("domain", activeDomain);
    for (const key of activeFilters) url.searchParams.append("filter", key);
    replaceState(`${url.pathname}${url.search}`, {});
  }

  function delayedUrlSync() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(syncUrl, 120);
  }

  function toggleFilter(tag: CatalogTag) {
    const key = filterKey(tag.group, tag.value);
    activeFilters = activeFilters.includes(key)
      ? activeFilters.filter((item) => item !== key)
      : [...activeFilters, key];
    syncUrl();
  }

  function toggleClosed(name: "domain" | "family", id: string, open: boolean) {
    const values = name === "domain" ? closedDomains : closedFamilies;
    const next = open ? values.filter((item) => item !== id) : [...new Set([...values, id])];
    if (name === "domain") {
      closedDomains = next;
      setCookie("gex_closed_domains_v1", next);
    } else {
      closedFamilies = next;
      setCookie("gex_closed_families_v1", next);
    }
  }

  function markSeen(id: string) {
    if (!newExperienceIds.includes(id)) return;
    newExperienceIds = newExperienceIds.filter((item) => item !== id);
    setCookie("gex_unread_v1", newExperienceIds);
  }

  onMount(() => {
    const key = `gender-experience-scroll-v2:${site.locale}`;
    const saved = Number(sessionStorage.getItem(key) ?? 0);
    if (saved > 0) requestAnimationFrame(() => requestAnimationFrame(() => scrollTo({ top: saved, behavior: "instant" })));
    const saveScroll = () => sessionStorage.setItem(key, String(scrollY));
    addEventListener("pagehide", saveScroll);
    return () => {
      clearTimeout(searchTimer);
      removeEventListener("pagehide", saveScroll);
    };
  });
</script>

<Seo {site} terms={site.experiences} />

<div class="intro">
  <h1>{messages.heading}</h1>
  <p>{messages.introduction}</p>
  <div class="intro-actions">
    <a class="submit-link" href="https://github.com/transnavi/DysphoriaDB/issues/new?template=experience.yml">
      {messages.submitExperience} <span aria-hidden="true">↗</span>
    </a>
  </div>
</div>

<section class="browser" id="catalog-browser" aria-label={messages.browseExperiences} tabindex="-1">
  <form class="search" role="search" onsubmit={(event) => { event.preventDefault(); clearTimeout(searchTimer); syncUrl(); }}>
    <label class="visually-hidden" for="search">{messages.searchLabel}</label>
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m21 21-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg>
    <input id="search" type="search" placeholder={messages.searchPlaceholder} autocomplete="off" bind:value={query} oninput={delayedUrlSync} />
    <button class="search-button" type="submit">{messages.searchButton}</button>
  </form>
  <nav class="domain-tabs" aria-label={messages.experienceAreas}>
    {#each site.domainTabs as domain}
      <button
        type="button"
        data-domain={domain.id}
        aria-pressed={activeDomain === domain.id}
        onclick={() => { activeDomain = domain.id; syncUrl(); }}
      >{domain.label}</button>
    {/each}
  </nav>

  <div class="active-filters">
    {#if activeFilters.length}
      <span>{messages.filteredBy}</span>
      {#each activeFilters as key}
        {@const item = site.experiences.flatMap((experience) => [...experience.typeTags, ...experience.populationTags, ...experience.stageTags, ...experience.topicTags]).find((tag) => filterKey(tag.group, tag.value) === key)}
        {#if item}
          <button type="button" aria-label={formatMessage(messages, "removeFilter", { label: item.label })} onclick={() => { activeFilters = activeFilters.filter((value) => value !== key); syncUrl(); }}>
            {item.label} ×
          </button>
        {/if}
      {/each}
      <button class="clear-filters" type="button" onclick={() => { activeFilters = []; syncUrl(); }}>{messages.clear}</button>
    {/if}
  </div>
  <div class="catalog-status">
    <p class="result-count" aria-live="polite">{formatMessage(messages, "resultCount", { count: resultCount })}</p>
    {#if newExperienceIds.length}
      <p class="new-count" aria-live="polite">{formatMessage(messages, "newCount", { count: newExperienceIds.length })}</p>
    {/if}
  </div>
  <p class="visually-hidden" aria-live="polite">{reactionStatus}</p>

  <div class="cards">
    {#each visibleDomains as domain}
      {#if activeDomain === "all"}
        <details
          class="domain-section"
          data-domain-section={domain.id}
          open={!closedDomains.includes(domain.id)}
          ontoggle={(event) => toggleClosed("domain", domain.id, event.currentTarget.open)}
        >
          <summary class="domain-summary"><h2 class="domain-title">{domain.label}</h2></summary>
          <div class="domain-content">
            {#each domain.families as family}
              <details
                class="experience-group"
                data-family={family.id}
                open={!closedFamilies.includes(family.id)}
                ontoggle={(event) => toggleClosed("family", family.id, event.currentTarget.open)}
              >
                <summary><h3>{family.label}</h3></summary>
                <div class="group-grid">
                  {#each family.items as item (item.id)}
                    <ExperienceCard
                      {item}
                      locale={site.locale}
                      {messages}
                      {rootPath}
                      {activeFilters}
                      isNew={newExperienceIds.includes(item.id)}
                      initiallySelected={selectedReactions.includes(item.id)}
                      openSource={openSourceExperienceId === item.id}
                      ontag={toggleFilter}
                      onseen={markSeen}
                      onsource={(id, open) => { openSourceExperienceId = open ? id : (openSourceExperienceId === id ? "" : openSourceExperienceId); }}
                      onstatus={(message) => { reactionStatus = message; }}
                    />
                  {/each}
                </div>
              </details>
            {/each}
          </div>
        </details>
      {:else}
        <section class="domain-section">
          <h2 class="domain-title">{domain.label}</h2>
          <div class="domain-content">
            {#each domain.families as family}
              <details
                class="experience-group"
                data-family={family.id}
                open={!closedFamilies.includes(family.id)}
                ontoggle={(event) => toggleClosed("family", family.id, event.currentTarget.open)}
              >
                <summary><h3>{family.label}</h3></summary>
                <div class="group-grid">
                  {#each family.items as item (item.id)}
                    <ExperienceCard
                      {item}
                      locale={site.locale}
                      {messages}
                      {rootPath}
                      {activeFilters}
                      isNew={newExperienceIds.includes(item.id)}
                      initiallySelected={selectedReactions.includes(item.id)}
                      openSource={openSourceExperienceId === item.id}
                      ontag={toggleFilter}
                      onseen={markSeen}
                      onsource={(id, open) => { openSourceExperienceId = open ? id : (openSourceExperienceId === id ? "" : openSourceExperienceId); }}
                      onstatus={(message) => { reactionStatus = message; }}
                    />
                  {/each}
                </div>
              </details>
            {/each}
          </div>
        </section>
      {/if}
    {/each}
  </div>
  {#if resultCount === 0}<p class="empty">{messages.noMatches}</p>{/if}
</section>
