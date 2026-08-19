<script lang="ts">
  import { onMount } from "svelte";
  import { filterKey, formatMessage } from "$lib/catalog";
  import type { CatalogTag, DetailPageData } from "$lib/types";
  import ReactionButton from "$lib/components/ReactionButton.svelte";
  import Seo from "$lib/components/Seo.svelte";

  let { data } = $props<{ data: DetailPageData }>();
  let site = $derived(data.site);
  let item = $derived(data.experience);
  let messages = $derived(site.messages);
  let rootPath = $derived(site.localeDefinition.path ? `/${site.localeDefinition.path}/` : "/");
  let related = $derived(data.related);
  let reactionStatus = $state("");

  function filterHref(tag: CatalogTag) {
    const parameters = new URLSearchParams({ filter: filterKey(tag.group, tag.value) });
    return `${rootPath}?${parameters}`;
  }

  onMount(() => {
    const match = document.cookie.match(/(?:^|; )gex_unread_v1=([^;]*)/);
    const unread = decodeURIComponent(match?.[1] ?? "").split(",").filter((slug) => slug && slug !== item.slug);
    document.cookie = `gex_unread_v1=${encodeURIComponent(unread.join(","))}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  });
</script>

<Seo {site} experience={item} />

<section class="browser" id="catalog-browser" aria-label={item.title} tabindex="-1">
  <div class="experience-detail">
    <a class="detail-back" href={rootPath}>← {messages.allExperiences}</a>
    <article>
      <div class="detail-context">
        <span>{data.context.domain}</span>
        <span>{data.context.family}</span>
      </div>
      <h1>{item.title}</h1>
      <p class="detail-summary">{item.summary}</p>
      {#if item.reportCount}
        <p class="report-count">{formatMessage(messages, "reviewedReports", { count: item.reportCount })}</p>
      {/if}
      <div class="categories detail-tags" role="group" aria-label={messages.tags}>
        {#each [...item.typeTags, ...item.populationTags, ...item.topicTags] as tag}
          <a
            href={filterHref(tag)}
            class="category-tag {tag.className}"
            data-category-label={tag.categoryLabel}
            aria-label={`${tag.label}; ${tag.categoryLabel}`}
          >{tag.label}</a>
        {/each}
      </div>
      <div class="reaction-row detail-reaction">
        <ReactionButton
          {item}
          locale={site.locale}
          {messages}
          initiallySelected={data.selectedReactions.includes(item.slug)}
          onstatus={(message) => { reactionStatus = message; }}
        />
      </div>
      <p class="visually-hidden" aria-live="polite">{reactionStatus}</p>

      {#if item.patterns.length}
        <section class="detail-section">
          <h2>{messages.reportedVariations}</h2>
          <dl class="pattern-list">
            {#each item.patterns as pattern}
              <div><dt>{pattern[0]}</dt><dd>{pattern[1]}</dd></div>
            {/each}
          </dl>
        </section>
      {/if}

      {#if item.variations.length}
        <section class="detail-section">
          <h2>{messages.populationVariations}</h2>
          <ul class="detail-variations">
            {#each item.variations as variation}
              <li><strong>{variation.directionLabel}:</strong> {variation.text}</li>
            {/each}
          </ul>
        </section>
      {/if}

      <section class="detail-section" id="sources">
        <h2>{messages.sources}</h2>
        <ul class="detail-source-list">
          {#each item.sources as source}
            <li>
              <span class="source-kind">{source.kind}</span>
              <a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>
              {#if source.note}<span class="source-note">{source.note}</span>{/if}
            </li>
          {/each}
        </ul>
      </section>

      {#if related.length}
        <section class="detail-section">
          <h2>{messages.relatedExperiences}</h2>
          <ul class="related-list">
            {#each related as relatedItem}
              <li><a href={`${rootPath}experience/${relatedItem.slug}/`}>{relatedItem.title}</a></li>
            {/each}
          </ul>
        </section>
      {/if}
    </article>
  </div>
</section>
