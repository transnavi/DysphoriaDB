<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { formatMessage } from "$lib/catalog";
  import type { CatalogItem } from "$lib/types";
  import {
    reactionIsSelected,
    reactionStorageKey,
    toggledReactionState,
    updatedReactionStorageValue,
  } from "$site/reaction-state.js";

  let { item, locale, messages, initiallySelected = false, onstatus = () => {} } = $props<{
    item: CatalogItem;
    locale: string;
    messages: Record<string, string>;
    initiallySelected?: boolean;
    onstatus?: (message: string) => void;
  }>();
  let count = $state(untrack(() => Number(item.reactionCount ?? 0)));
  let selected = $state(untrack(() => initiallySelected));
  let pending = $state(false);

  function voterId() {
    const key = "gender-experience-voter-v1";
    try {
      const saved = localStorage.getItem(key);
      if (saved) return saved;
      const created = crypto.randomUUID();
      localStorage.setItem(key, created);
      return created;
    } catch {
      return crypto.randomUUID();
    }
  }

  function saveSelection(nextSelected: boolean) {
    const match = document.cookie.match(/(?:^|; )gex_selected_v1=([^;]*)/);
    const values = new Set(decodeURIComponent(match?.[1] ?? "").split(",").filter(Boolean));
    if (nextSelected) values.add(item.id);
    else values.delete(item.id);
    document.cookie = `gex_selected_v1=${encodeURIComponent([...values].join(","))}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    try {
      localStorage.setItem(
        reactionStorageKey,
        updatedReactionStorageValue(localStorage.getItem(reactionStorageKey), item.id, nextSelected),
      );
    } catch {
      // The cookie preserves the selection when local storage is unavailable.
    }
  }

  onMount(() => {
    let storedValue = null;
    try {
      storedValue = localStorage.getItem(reactionStorageKey);
    } catch {
      return;
    }
    if (!reactionIsSelected(selected, item.id, storedValue)) return;
    selected = true;
    saveSelection(true);
  });

  async function toggleReaction() {
    if (pending) return;
    const previousSelected = selected;
    const previousCount = count;
    const next = toggledReactionState(count, selected);
    selected = next.selected;
    count = next.count;
    pending = true;
    saveSelection(selected);

    try {
      const response = await fetch(`/api/reactions/${encodeURIComponent(item.id)}`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ voterId: voterId(), selected }),
      });
      if (response.status === 429) {
        onstatus(messages.reactionRateLimited);
        throw new Error("rate_limited");
      }
      if (!response.ok) throw new Error("reaction_failed");
      const result = await response.json() as { count?: number };
      count = Number(result.count ?? count);
      onstatus(selected ? messages.reactionSaved : messages.reactionRemoved);
    } catch (error) {
      selected = previousSelected;
      count = previousCount;
      saveSelection(selected);
      if ((error as Error).message !== "rate_limited") onstatus(messages.reactionError);
    } finally {
      pending = false;
    }
  }

  let accessibleLabel = $derived(formatMessage(
    messages,
    selected ? "meTooSelectedLabel" : "meTooLabel",
    { title: item.title, count },
  ));
</script>

<button
  class="reaction-button"
  type="button"
  aria-label={accessibleLabel}
  aria-pressed={selected}
  disabled={pending}
  onclick={toggleReaction}
>
  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
  <span>{messages.meToo}</span>
  <span class="reaction-count">{new Intl.NumberFormat(locale).format(count)}</span>
</button>
