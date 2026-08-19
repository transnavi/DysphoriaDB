<script lang="ts">
  import type { CatalogItem, LocalizedSite } from "$lib/types";
  import { catalogMetadata } from "$site/data/catalog-metadata.js";

  const localeInfo = {
    en: { path: "", htmlLang: "en", hreflang: "en", ogLocale: "en_US", image: "/og-image-en.png?v=20260819", siteName: "Gender Experience Index" },
    ja: { path: "ja", htmlLang: "ja", hreflang: "ja", ogLocale: "ja_JP", image: "/og-image-ja.png?v=20260819", siteName: "ジェンダー体験事典" },
    "zh-CN": { path: "zh-cn", htmlLang: "zh-Hans", hreflang: "zh-Hans", ogLocale: "zh_CN", image: "/og-image-zh-cn.png?v=20260819", siteName: "性别体验索引" },
  };

  let { site, experience = null, terms = [] } = $props<{
    site: Pick<LocalizedSite, "locale" | "messages">;
    experience?: Pick<CatalogItem, "slug" | "title" | "summary"> | null;
    terms?: Array<Pick<CatalogItem, "slug">>;
  }>();
  let rootPath = $derived(localeInfo[site.locale as keyof typeof localeInfo].path
    ? `/${localeInfo[site.locale as keyof typeof localeInfo].path}/`
    : "/");
  let pathname = $derived(experience ? `${rootPath}experience/${experience.slug}/` : rootPath);
  let canonical = $derived(new URL(pathname, catalogMetadata.siteUrl).href);
  let title = $derived(experience ? `${experience.title} — ${site.messages.siteName}` : site.messages.siteName);
  let description = $derived(experience?.summary ?? site.messages.description);
  let image = $derived(new URL(localeInfo[site.locale as keyof typeof localeInfo].image, catalogMetadata.siteUrl).href);
  let alternates = $derived(Object.entries(localeInfo).map(([locale, info]) => ({
    locale,
    hreflang: info.hreflang,
    href: new URL(`${info.path ? `/${info.path}` : ""}${experience ? `/experience/${experience.slug}` : ""}/`, catalogMetadata.siteUrl).href,
  })));
  let structuredData = $derived.by(() => {
    const rootUrl = new URL(rootPath, catalogMetadata.siteUrl).href;
    const websiteId = `${rootUrl}#website`;
    const indexId = `${rootUrl}#index`;
    const datasetId = `${catalogMetadata.siteUrl}/data/experiences.json#dataset`;
    const keywords = site.messages.datasetKeywords.split(",").map((keyword: string) => keyword.trim());
    const graph: Array<Record<string, unknown>> = [
      {
        "@type": "Organization",
        "@id": "https://transnavi.jp/#organization",
        name: "TransNavi",
        url: "https://transnavi.jp/",
        logo: {
          "@type": "ImageObject",
          url: `${catalogMetadata.siteUrl}/icon-192.png`,
          width: 192,
          height: 192,
        },
        sameAs: ["https://github.com/transnavi", "https://x.com/transnavi_jp"],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: rootUrl,
        name: site.messages.siteName,
        alternateName: Object.values(localeInfo)
          .map(({ siteName }) => siteName)
          .filter((siteName) => siteName !== site.messages.siteName),
        description: site.messages.description,
        inLanguage: localeInfo[site.locale as keyof typeof localeInfo].htmlLang,
        publisher: { "@id": "https://transnavi.jp/#organization" },
        license: catalogMetadata.license,
      },
    ];
    if (experience) {
      const item = experience as CatalogItem;
      const topicLabels = [
        ...(item.typeTags ?? []),
        ...(item.populationTags ?? []),
        ...(item.topicTags ?? []),
      ].map(({ label }) => label);
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
          primaryImageOfPage: { "@type": "ImageObject", url: image },
          keywords: topicLabels,
          about: topicLabels.map((name) => ({ "@type": "Thing", name })),
          license: catalogMetadata.license,
        },
        {
          "@type": "DefinedTerm",
          "@id": `${canonical}#experience`,
          url: canonical,
          name: experience.title,
          description: experience.summary,
          termCode: experience.slug,
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
      graph.push(
        {
          "@type": "CollectionPage",
          "@id": `${canonical}#webpage`,
          url: canonical,
          name: site.messages.siteName,
          description,
          inLanguage: localeInfo[site.locale as keyof typeof localeInfo].htmlLang,
          isPartOf: { "@id": websiteId },
          mainEntity: { "@id": indexId },
          about: { "@id": datasetId },
          primaryImageOfPage: { "@type": "ImageObject", url: image },
          dateModified: catalogMetadata.dateModified,
          license: catalogMetadata.license,
        },
        {
          "@type": "Dataset",
          "@id": datasetId,
          name: site.messages.siteName,
          alternateName: Object.values(localeInfo)
            .map(({ siteName }) => siteName)
            .filter((siteName) => siteName !== site.messages.siteName),
          description: site.messages.datasetDescription,
          url: rootUrl,
          sameAs: alternates.map(({ href }) => href),
          dateModified: catalogMetadata.dateModified,
          inLanguage: Object.values(localeInfo).map(({ htmlLang }) => htmlLang),
          keywords,
          isAccessibleForFree: true,
          license: catalogMetadata.license,
          creator: { "@id": "https://transnavi.jp/#organization" },
          publisher: { "@id": "https://transnavi.jp/#organization" },
          includedInDataCatalog: {
            "@type": "DataCatalog",
            name: site.messages.siteName,
            url: rootUrl,
          },
          distribution: [
            { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${catalogMetadata.siteUrl}/data/experiences.json` },
            { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${catalogMetadata.siteUrl}/data/experiences.csv` },
          ],
        },
        {
          "@type": "DefinedTermSet",
          "@id": indexId,
          url: rootUrl,
          name: site.messages.siteName,
          description,
          inLanguage: localeInfo[site.locale as keyof typeof localeInfo].htmlLang,
          isPartOf: { "@id": websiteId },
          hasDefinedTerm: terms.map(({ slug }: Pick<CatalogItem, "slug">) => ({
            "@id": `${new URL(`${rootPath}experience/${slug}/`, catalogMetadata.siteUrl).href}#experience`,
          })),
          dateModified: catalogMetadata.dateModified,
          license: catalogMetadata.license,
        },
      );
    }
    return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
  });
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="author" content="TransNavi" />
  <meta name="application-name" content={site.messages.siteName} />
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
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
  <meta property="og:image:secure_url" content={image} />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={site.messages.ogImageAlt} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@transnavi_jp" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={image} />
  <meta name="twitter:image:alt" content={site.messages.ogImageAlt} />
  {@html `<script type="application/ld+json">${structuredData}<\/script>`}
</svelte:head>
