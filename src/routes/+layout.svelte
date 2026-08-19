<script lang="ts">
  import LocaleSwitcher from "$lib/components/LocaleSwitcher.svelte";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import "../../site/styles.css";

  let { data, children } = $props();
</script>

<svelte:head>
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="license" href="https://creativecommons.org/licenses/by/4.0/" />
  <link rel="alternate" type="application/json" href="/data/experiences.json" title="Gender Experience Index data" />
  <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
  <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
</svelte:head>

<a class="skip-link" href="#catalog-browser">{data.messages.skipToExperiences}</a>
<header class="site-header">
  <div class="header-inner">
    <a class="wordmark" href={data.localeDefinition.path ? `/${data.localeDefinition.path}/` : "/"}>
      {data.messages.siteName}
    </a>
    <div class="header-actions">
      <LocaleSwitcher
        locale={data.locale}
        label={data.messages.languageLabel}
        shortLabel={data.localeShortLabel}
        links={data.localeLinks}
      />
      <ThemeToggle
        initialTheme={data.theme}
        darkLabel={data.messages.useDarkTheme}
        lightLabel={data.messages.useLightTheme}
      />
    </div>
  </div>
</header>

<main>
  {@render children()}
</main>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-main">
      <div class="footer-identity">
        <a class="footer-brand" href="https://transnavi.jp/" target="_blank" rel="noreferrer">
          <span class="trans-pride-mark" role="img" aria-label={data.messages.footerFlagLabel}></span>
          <span>TransNavi</span>
        </a>
        <p class="footer-statement">{data.messages.footerStatement}</p>
      </div>
      <nav class="footer-navigation" aria-label={data.messages.footerNavLabel}>
        <section class="footer-link-group" aria-labelledby="footer-reference-title">
          <p class="footer-group-title" id="footer-reference-title">{data.messages.footerReference}</p>
          <div class="footer-link-list">
            <a class="footer-link" href="https://transnavi.jp/glossary/" target="_blank" rel="noreferrer">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11a3 3 0 0 1 3 3v16a3 3 0 0 0-3-3H7.5A3.5 3.5 0 0 0 4 21.5Zm16 0A3.5 3.5 0 0 0 16.5 2H14v19a3 3 0 0 1 3-3h3Z" /></svg>
              <span>{data.messages.glossary}</span>
              <span class="footer-link-arrow" aria-hidden="true">↗</span>
            </a>
            <a class="footer-link" href="https://github.com/transnavi/DysphoriaDB/issues/new?template=experience.yml">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>
              <span>{data.messages.submitExperience}</span>
              <span class="footer-link-arrow" aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
        <section class="footer-link-group footer-data-group" aria-labelledby="footer-data-title">
          <p class="footer-group-title" id="footer-data-title">{data.messages.footerOpenData}</p>
          <div class="footer-link-list">
            <a class="footer-link" href="/data/experiences.json" download>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12m-4-4 4 4 4-4M4 19v2h16v-2" /></svg>
              <span>{data.messages.downloadJson}</span>
              <span class="footer-link-arrow" aria-hidden="true">↓</span>
            </a>
            <a class="footer-link" href="/data/experiences.csv" download>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12m-4-4 4 4 4-4M4 19v2h16v-2" /></svg>
              <span>{data.messages.downloadCsv}</span>
              <span class="footer-link-arrow" aria-hidden="true">↓</span>
            </a>
          </div>
        </section>
      </nav>
    </div>
    <div class="footer-meta">
      <a class="footer-license" href="https://creativecommons.org/licenses/by/4.0/" rel="license">
        <span class="cc-mark" aria-hidden="true">CC</span>
        <span>{data.messages.contentLicense}</span>
      </a>
      <p class="footer-copyright">{data.messages.copyright}</p>
    </div>
  </div>
</footer>
