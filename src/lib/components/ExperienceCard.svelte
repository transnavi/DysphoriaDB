<script lang="ts">
  import { formatMessage } from "$lib/catalog";
  import type { CatalogItem, CatalogTag } from "$lib/types";
  import ReactionButton from "$lib/components/ReactionButton.svelte";
  import TagButton from "$lib/components/TagButton.svelte";

  let {
    item,
    locale,
    messages,
    rootPath,
    activeFilters,
    isNew,
    initiallySelected,
    openSource,
    ontag,
    onseen,
    onsource,
    onstatus,
  } = $props<{
    item: CatalogItem;
    locale: string;
    messages: Record<string, string>;
    rootPath: string;
    activeFilters: string[];
    isNew: boolean;
    initiallySelected: boolean;
    openSource: boolean;
    ontag: (tag: CatalogTag) => void;
    onseen: (slug: string) => void;
    onsource: (slug: string, open: boolean) => void;
    onstatus: (message: string) => void;
  }>();
  let tone = $derived(item.types.includes("dysphoric") && item.types.includes("euphoric")
    ? "mixed"
    : (item.types[0] ?? "neutral").toLowerCase().replaceAll(" ", "-"));
  const filterId = (tag: CatalogTag) => `${tag.group}:${tag.value}`;
</script>

<article
  class="card tone-{tone}"
  data-card-slug={item.slug}
  title={item.typeTags.map(({ label }: CatalogTag) => label).join(" · ")}
>
  <h4 class="card-title">
    <a class="claim-link" href={`${rootPath}experience/${item.slug}/`} onclick={() => onseen(item.slug)}>
      {item.title}
    </a>
    {#if isNew}<span class="new-badge">{messages.newBadge}</span>{/if}
  </h4>
  <p class="summary">{item.summary}</p>
  <p class:report-count-empty={!item.reportCount} class="report-count" aria-hidden={!item.reportCount}>
    {item.reportCount ? formatMessage(messages, "reviewedReports", { count: item.reportCount }) : " "}
  </p>
  <div class="categories" role="group" aria-label={messages.tags}>
    {#each [...item.typeTags, ...item.populationTags, ...item.topicTags.slice(0, 3)] as tag}
      <TagButton
        {tag}
        active={activeFilters.includes(filterId(tag))}
        onclick={() => ontag(tag)}
      />
    {/each}
  </div>
  <div class="card-actions">
    <details
      class="sources"
      open={openSource}
      ontoggle={(event) => onsource(item.slug, event.currentTarget.open)}
    >
      <summary>{formatMessage(messages, "sourceCount", { count: item.sources.length })}</summary>
      <ul class="source-list">
        {#each item.sources as source}
          <li>
            <span class="source-kind">{source.kind}</span>
            <a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a>
          </li>
        {/each}
      </ul>
    </details>
    <ReactionButton {item} {locale} {messages} {initiallySelected} {onstatus} />
  </div>
</article>
