<script>
  import { page } from "$app/state";
</script>

<svelte:head>
  <title>{page.status} — Gender Experience Index</title>
  <meta name="robots" content="noindex,follow" />
</svelte:head>

<section class="experience-detail" id="catalog-browser" tabindex="-1">
  <h1>{page.status}</h1>
  <p class="detail-summary">{page.error?.message ?? "Page not found"}</p>
  <a class="detail-back" href="/">← Gender Experience Index</a>
</section>
