<script lang="ts">
  import type { CatalogTag } from "$lib/types";

  let { tag, active = false, onclick } = $props<{
    tag: CatalogTag;
    active?: boolean;
    onclick: () => void;
  }>();
</script>

<button
  type="button"
  class="category-tag {tag.className}"
  data-category-label={tag.categoryLabel}
  aria-label={`${tag.label}; ${tag.categoryLabel}`}
  aria-pressed={active}
  {onclick}
>
  {tag.label}
</button>
