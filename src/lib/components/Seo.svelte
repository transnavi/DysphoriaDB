<script lang="ts">
  import type { CatalogItem, LocalizedSite } from "$lib/types";

  const siteUrl = "https://db.transnavi.jp";
  const licenseUrl = "https://creativecommons.org/licenses/by/4.0/";
  const localeInfo = {
    en: { path: "", htmlLang: "en", hreflang: "en", ogLocale: "en_US", image: "/og-image-en.png?v=20260819" },
    ja: { path: "ja", htmlLang: "ja", hreflang: "ja", ogLocale: "ja_JP", image: "/og-image-ja.png?v=20260819" },
    "zh-CN": { path: "zh-cn", htmlLang: "zh-Hans", hreflang: "zh-Hans", ogLocale: "zh_CN", image: "/og-image-zh-cn.png?v=20260819" },
  };

  let { site, experience = null } = $props<{
    site: Pick<LocalizedSite, "locale" | "messages">;
    experience?: Pick<CatalogItem, "slug" | "title" | "summary"> | null;
  }>();
  let rootPath = $derived(localeInfo[site.locale as keyof typeof localeInfo].path
    ? `/${localeInfo[site.locale as keyof typeof localeInfo].path}/`
    : "/");
  let pathname = $derived(experience ? `${rootPath}experience/${experience.slug}/` : rootPath);
  let canonical = $derived(new URL(pathname, siteUrl).href);
  let title = $derived(experience ? `${experience.title} — ${site.messages.siteName}` : site.messages.siteName);
  let description = $derived(experience?.summary ?? site.messages.description);
  let image = $derived(new URL(localeInfo[site.locale as keyof typeof localeInfo].image, siteUrl).href);
  let alternates = $derived(Object.entries(localeInfo).map(([locale, info]) => ({
    locale,
    hreflang: info.hreflang,
    href: new URL(`${info.path ? `/${info.path}` : ""}${experience ? `/experience/${experience.slug}` : ""}/`, siteUrl).href,
  })));
  let structuredData = $derived.by(() => {
    const rootUrl = new URL(rootPath, siteUrl).href;
    const websiteId = `${rootUrl}#website`;
    const indexId = `${rootUrl}#index`;
    const graph: Array<Record<string, unknown>> = [
      {
        "@type": "Organization",
        "@id": "https://transnavi.jp/#organization",
        name: "TransNavi",
        url: "https://transnavi.jp/",
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: rootUrl,
        name: site.messages.siteName,
        description: site.messages.description,
        inLanguage: localeInfo[site.locale as keyof typeof localeInfo].htmlLang,
        publisher: { "@id": "https://transnavi.jp/#organization" },
        license: licenseUrl,
      },
      {
        "@type": "Dataset",
        "@id": `${siteUrl}/#dataset`,
        name: "Gender Experience Index data",
        description: site.messages.datasetDescription,
        url: `${siteUrl}/data/experiences.json`,
        inLanguage: Object.values(localeInfo).map(({ htmlLang }) => htmlLang),
        license: licenseUrl,
        creator: { "@id": "https://transnavi.jp/#organization" },
        distribution: [
          { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${siteUrl}/data/experiences.json` },
          { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${siteUrl}/data/experiences.csv` },
        ],
      },
    ];
    if (experience) {
      graph.push(
        {
          "@type": "WebPage",
          "@id": `${canonical}#webpage`,
          url: canonical,
          name: experience.title,
          description: experience.summary,
          inLanguage: localeInfo[site.locale as keyof typeof localeInfo].htmlLang,
          isPartOf: { "@id": websiteId },
          mainEntity: { "@id": `${canonical}#experience` },
          license: licenseUrl,
        },
        {
          "@type": "DefinedTerm",
          "@id": `${canonical}#experience`,
          url: canonical,
          name: experience.title,
          description: experience.summary,
          inLanguage: localeInfo[site.locale as keyof typeof localeInfo].htmlLang,
          inDefinedTermSet: { "@id": indexId },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: site.messages.siteName, item: rootUrl },
            { "@type": "ListItem", position: 2, name: experience.title, item: canonical },
          ],
        },
      );
    } else {
      graph.push({
        "@type": "DefinedTermSet",
        "@id": indexId,
        url: rootUrl,
        name: site.messages.siteName,
        description,
        inLanguage: localeInfo[site.locale as keyof typeof localeInfo].htmlLang,
        isPartOf: { "@id": websiteId },
        license: licenseUrl,
      });
    }
    return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
  });
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  {#each alternates as alternate}
    <link rel="alternate" hreflang={alternate.hreflang} href={alternate.href} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={alternates[0].href} />
  <meta property="og:url" content={canonical} />
  <meta property="og:type" content={experience ? "article" : "website"} />
  <meta property="og:site_name" content={site.messages.siteName} />
  <meta property="og:locale" content={localeInfo[site.locale as keyof typeof localeInfo].ogLocale} />
  {#each Object.values(localeInfo).filter(({ ogLocale }) => ogLocale !== localeInfo[site.locale as keyof typeof localeInfo].ogLocale) as alternate}
    <meta property="og:locale:alternate" content={alternate.ogLocale} />
  {/each}
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={image} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={site.messages.ogImageAlt} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={image} />
  {@html `<script type="application/ld+json">${structuredData}<\/script>`}
</svelte:head>
