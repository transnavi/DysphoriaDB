import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { domains, experienceFamilies, experiences } from "../site/data/experiences.js";
import {
  createI18n,
  experiencePath,
  localeDefinitions,
  localeRoot,
  localizeClaim,
  localizeTaxonomy,
  localizeTerm,
  pathForLocale,
} from "../site/i18n/index.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(projectRoot, "dist", "client");
const siteUrl = "https://db.transnavi.jp";
const licenseUrl = "https://creativecommons.org/licenses/by/4.0/";
const lastModified = "2026-08-19";
const locales = Object.keys(localeDefinitions);
const ogImages = {
  en: "/og-image-en.png?v=20260819",
  ja: "/og-image-ja.png?v=20260819",
  "zh-CN": "/og-image-zh-cn.png?v=20260819",
};
const localeShortLabels = { en: "EN", ja: "JA", "zh-CN": "中文" };

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");
const escapeXml = escapeHtml;
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const jsonForHtml = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");
const absoluteUrl = (pathname) => new URL(pathname, siteUrl).href;

function replaceMeta(html, attribute, key, value) {
  const expression = new RegExp(`<meta\\s+${attribute}="${escapeRegExp(key)}"\\s+content="[^"]*"\\s*\\/?>`);
  const element = `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`;
  return expression.test(html) ? html.replace(expression, element) : html.replace("</head>", `    ${element}\n  </head>`);
}

function replaceTextById(html, id, value) {
  const expression = new RegExp(`(<([a-z][a-z0-9-]*)[^>]*\\bid="${escapeRegExp(id)}"[^>]*>)[\\s\\S]*?(<\\/\\2>)`, "i");
  return html.replace(expression, `$1${escapeHtml(value)}$3`);
}

function localizedAlternates(pathname) {
  return locales.map((locale) => ({
    locale,
    hreflang: localeDefinitions[locale].hreflang,
    href: absoluteUrl(pathForLocale(pathname, locale)),
  }));
}

function structuredData(i18n, locale, claim, canonicalUrl) {
  const siteName = i18n.t("ui.siteName");
  const description = i18n.t("ui.description");
  const language = localeDefinitions[locale].htmlLang;
  const rootUrl = absoluteUrl(localeRoot(locale));
  const websiteId = `${rootUrl}#website`;
  const indexId = `${rootUrl}#index`;
  const graph = [
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
      name: siteName,
      description,
      inLanguage: language,
      publisher: { "@id": "https://transnavi.jp/#organization" },
      license: licenseUrl,
    },
    {
      "@type": "Dataset",
      "@id": `${siteUrl}/#dataset`,
      name: "Gender Experience Index data",
      description: i18n.t("ui.datasetDescription"),
      url: `${siteUrl}/data/experiences.json`,
      inLanguage: locales.map((item) => localeDefinitions[item].htmlLang),
      license: licenseUrl,
      creator: { "@id": "https://transnavi.jp/#organization" },
      distribution: [
        { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${siteUrl}/data/experiences.json` },
        { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: `${siteUrl}/data/experiences.csv` },
      ],
    },
  ];

  if (!claim) {
    graph.push({
      "@type": "DefinedTermSet",
      "@id": indexId,
      url: rootUrl,
      name: siteName,
      description,
      inLanguage: language,
      isPartOf: { "@id": websiteId },
      license: licenseUrl,
    });
    return { "@context": "https://schema.org", "@graph": graph };
  }

  const localized = localizeClaim(i18n, claim, locale);
  graph.push(
    {
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: localized.title,
      description: localized.summary,
      inLanguage: language,
      isPartOf: { "@id": websiteId },
      mainEntity: { "@id": `${canonicalUrl}#experience` },
      license: licenseUrl,
    },
    {
      "@type": "DefinedTerm",
      "@id": `${canonicalUrl}#experience`,
      url: canonicalUrl,
      name: localized.title,
      description: localized.summary,
      inLanguage: language,
      inDefinedTermSet: { "@id": indexId },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: siteName, item: rootUrl },
        { "@type": "ListItem", position: 2, name: localized.title, item: canonicalUrl },
      ],
    },
  );
  return { "@context": "https://schema.org", "@graph": graph };
}

function localizeShell(baseHtml, i18n, locale, claim = null) {
  const definition = localeDefinitions[locale];
  const localized = claim ? localizeClaim(i18n, claim, locale) : null;
  const pathname = claim ? experiencePath(locale, claim.slug) : localeRoot(locale);
  const canonicalUrl = absoluteUrl(pathname);
  const siteName = i18n.t("ui.siteName");
  const pageTitle = localized ? `${localized.title} — ${siteName}` : siteName;
  const description = localized?.summary ?? i18n.t("ui.description");
  const alternates = localizedAlternates(pathname);
  const ogImage = absoluteUrl(ogImages[locale]);
  let html = baseHtml;

  html = html.replace(
    /(\s*<script type="module"[^>]*><\/script>)(\s*<link rel="stylesheet"[^>]*>)/,
    "$2$1",
  );
  html = html.replace(/<html lang="[^"]+"/, `<html lang="${definition.htmlLang}"`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`);
  html = replaceMeta(html, "name", "description", description);
  html = replaceMeta(html, "name", "robots", "index,follow,max-image-preview:large");
  html = replaceMeta(html, "property", "og:url", canonicalUrl);
  html = replaceMeta(html, "property", "og:type", claim ? "article" : "website");
  html = replaceMeta(html, "property", "og:site_name", siteName);
  html = replaceMeta(html, "property", "og:locale", definition.ogLocale);
  html = replaceMeta(html, "property", "og:title", pageTitle);
  html = replaceMeta(html, "property", "og:description", description);
  html = replaceMeta(html, "property", "og:image", ogImage);
  html = replaceMeta(html, "property", "og:image:width", "1200");
  html = replaceMeta(html, "property", "og:image:height", "630");
  html = replaceMeta(html, "property", "og:image:alt", i18n.t("ui.ogImageAlt"));
  html = replaceMeta(html, "name", "twitter:card", "summary_large_image");
  html = replaceMeta(html, "name", "twitter:title", pageTitle);
  html = replaceMeta(html, "name", "twitter:description", description);
  html = replaceMeta(html, "name", "twitter:image", ogImage);

  html = html.replace(/<link rel="canonical" href="[^"]+"\s*\/>/, `<link rel="canonical" href="${canonicalUrl}" />`);
  html = html.replace(/\s*<link rel="alternate" hreflang="[^"]+" href="[^"]+"\s*\/>/g, "");
  const alternateLinks = [
    ...alternates.map(({ hreflang, href }) => `<link rel="alternate" hreflang="${hreflang}" href="${href}" />`),
    `<link rel="alternate" hreflang="x-default" href="${absoluteUrl(pathForLocale(pathname, "en"))}" />`,
  ].join("\n    ");
  html = html.replace(/(<link rel="canonical"[^>]+>)/, `$1\n    ${alternateLinks}`);
  html = html.replace(/\s*<meta property="og:locale:alternate" content="[^"]+"\s*\/>/g, "");
  const ogAlternates = locales
    .filter((item) => item !== locale)
    .map((item) => `<meta property="og:locale:alternate" content="${localeDefinitions[item].ogLocale}" />`)
    .join("\n    ");
  html = html.replace(/(<meta property="og:locale"[^>]+>)/, `$1\n    ${ogAlternates}`);
  if (!html.includes('http-equiv="content-language"')) {
    html = html.replace("</head>", `    <meta http-equiv="content-language" content="${definition.htmlLang}" />\n  </head>`);
  }
  if (!html.includes('rel="license" href="https://creativecommons.org')) {
    html = html.replace(/(<link rel="sitemap"[^>]+>)/, `<link rel="license" href="${licenseUrl}" />\n    <link rel="alternate" type="application/json" href="/data/experiences.json" title="Gender Experience Index data" />\n    $1`);
  }
  html = html.replace(
    /<script type="application\/ld\+json" id="structured-data">[\s\S]*?<\/script>/,
    `<script type="application/ld+json" id="structured-data">${jsonForHtml(structuredData(i18n, locale, claim, canonicalUrl))}</script>`,
  );

  html = html.replace(/<a class="wordmark" href="[^"]*">[\s\S]*?<\/a>/, `<a class="wordmark" href="${localeRoot(locale)}">${escapeHtml(siteName)}</a>`);
  html = replaceTextById(html, "locale-label", i18n.t("ui.languageLabel"));
  html = html.replace(/(<span id="locale-current" data-short-label=")[^"]*(">)[\s\S]*?(<\/span>)/, `$1${localeShortLabels[locale]}$2${escapeHtml(definition.label)}$3`);
  for (const targetLocale of locales) {
    const targetPath = pathForLocale(pathname, targetLocale);
    const expression = new RegExp(`<a href="[^"]*" data-locale="${escapeRegExp(targetLocale)}"([^>]*)>`);
    const current = targetLocale === locale ? ' aria-current="page"' : "";
    html = html.replace(expression, `<a href="${targetPath}" data-locale="${targetLocale}"$1${current}>`);
  }
  html = html.replace(/(<button class="theme-toggle"[^>]*aria-label=")[^"]*(" title=")[^"]*(")/, `$1${escapeHtml(i18n.t("ui.useDarkTheme"))}$2${escapeHtml(i18n.t("ui.useDarkTheme"))}$3`);
  html = html.replace(/(<div class="intro">[\s\S]*?<h1>)[\s\S]*?(<\/h1>)/, `$1${escapeHtml(i18n.t("ui.heading"))}$2`);
  html = html.replace(/(<div class="intro">[\s\S]*?<p>)[\s\S]*?(<\/p>)/, `$1${escapeHtml(i18n.t("ui.introduction"))}$2`);
  html = replaceTextById(html, "submit-experience", `${i18n.t("ui.submitExperience")} ↗`);
  html = html.replace(/(<section class="browser" aria-label=")[^"]*(")/, `$1${escapeHtml(i18n.t("ui.browseExperiences"))}$2`);
  html = replaceTextById(html, "search-label", i18n.t("ui.searchLabel"));
  html = html.replace(/(<input id="search"[^>]*placeholder=")[^"]*(")/, `$1${escapeHtml(i18n.t("ui.searchPlaceholder"))}$2`);
  html = replaceTextById(html, "search-button", i18n.t("ui.searchButton"));
  html = html.replace(/(<nav class="domain-tabs" id="domain-tabs" aria-label=")[^"]*(")/, `$1${escapeHtml(i18n.t("ui.experienceAreas"))}$2`);
  html = replaceTextById(html, "empty", i18n.t("ui.noMatches"));
  html = replaceTextById(html, "footer-statement", i18n.t("ui.footerStatement"));
  html = html.replace(/(<div class="trans-pride-stripe"[^>]*aria-label=")[^"]*(")/, `$1${escapeHtml(i18n.t("ui.footerFlagLabel"))}$2`);
  html = replaceTextById(html, "footer-glossary", `${i18n.t("ui.glossary")} ↗`);
  html = replaceTextById(html, "footer-json", i18n.t("ui.downloadJson"));
  html = replaceTextById(html, "footer-csv", i18n.t("ui.downloadCsv"));
  html = replaceTextById(html, "footer-license", i18n.t("ui.contentLicense"));
  html = replaceTextById(html, "footer-copyright", i18n.t("ui.copyright"));

  if (localized) {
    html = html.replace('<div class="intro">', '<div class="intro" hidden>');
    html = html.replace('<div id="browse-view">', '<div id="browse-view" hidden>');
    html = html.replace(
      '<div class="experience-detail" id="experience-detail" hidden></div>',
      `<div class="experience-detail" id="experience-detail"><a class="detail-back" href="${localeRoot(locale)}">← ${escapeHtml(i18n.t("ui.allExperiences"))}</a><article><h1>${escapeHtml(localized.title)}</h1><p class="detail-summary">${escapeHtml(localized.summary)}</p></article></div>`,
    );
  }
  return html;
}

function outputDirectory(pathname) {
  return path.join(clientDir, ...pathname.split("/").filter(Boolean));
}

async function writePage(pathname, html) {
  const directory = outputDirectory(pathname);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), html);
}

const familyIds = new Set(experienceFamilies.map((family) => family.id));
const domainIds = new Set(domains.map((domain) => domain.id));
for (const experience of experiences) {
  if (!familyIds.has(experience.family)) throw new Error(`Unknown family: ${experience.family}`);
  if (!domainIds.has(experience.domain)) throw new Error(`Unknown domain: ${experience.domain}`);
}

await mkdir(path.join(clientDir, "schemas"), { recursive: true });
await mkdir(path.join(clientDir, "data"), { recursive: true });
const baseHtml = await readFile(path.join(clientDir, "index.html"), "utf8");
await copyFile(path.join(projectRoot, "schemas", "source.schema.json"), path.join(clientDir, "schemas", "source.schema.json"));

const i18nByLocale = Object.fromEntries(await Promise.all(locales.map(async (locale) => [locale, await createI18n(locale)])));
for (const locale of locales) {
  const i18n = i18nByLocale[locale];
  await writePage(localeRoot(locale), localizeShell(baseHtml, i18n, locale));
  for (const experience of experiences) {
    await writePage(experiencePath(locale, experience.slug), localizeShell(baseHtml, i18n, locale, experience));
  }
}

const exportData = {
  schemaVersion: 1,
  license: licenseUrl,
  attribution: "TransNavi contributors",
  locales: Object.fromEntries(locales.map((locale) => [locale, {
    language: localeDefinitions[locale].htmlLang,
    path: localeRoot(locale),
  }])),
  experiences: experiences.map((experience) => ({
    slug: experience.slug,
    family: experience.family,
    domain: experience.domain,
    types: experience.types,
    directions: experience.directions,
    responses: experience.responses,
    tags: experience.tags,
    reportCount: experience.reportCount,
    sources: experience.sources.map(([title, url, kind, note]) => ({ title, url, ...(kind ? { kind } : {}), ...(note ? { note } : {}) })),
    content: Object.fromEntries(locales.map((locale) => {
      const localized = localizeClaim(i18nByLocale[locale], experience, locale);
      return [locale, {
        title: localized.title,
        summary: localized.summary,
        patterns: localized.patterns ?? [],
        variations: localized.variations?.map(({ text }) => text) ?? [],
        tags: experience.tags.map((tag) => localizeTerm(i18nByLocale[locale], tag, locale)),
      }];
    })),
  })),
};
await writeFile(path.join(clientDir, "data", "experiences.json"), `${JSON.stringify(exportData, null, 2)}\n`);

const csvHeaders = ["slug", "locale", "title", "summary", "domain", "family", "types", "directions", "tags", "report_count", "sources"];
const csvCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
const csvRows = [csvHeaders, ...experiences.flatMap((experience) => locales.map((locale) => {
  const i18n = i18nByLocale[locale];
  const localized = localizeClaim(i18n, experience, locale);
  return [
    experience.slug,
    locale,
    localized.title,
    localized.summary,
    localizeTaxonomy(i18n, "domains", experience.domain, locale),
    localizeTaxonomy(i18n, "families", experience.family, locale),
    experience.types.map((type) => localizeTaxonomy(i18n, "types", type, locale)).join(" | "),
    experience.directions.map((direction) => localizeTaxonomy(i18n, "directions", direction, locale)).join(" | "),
    experience.tags.map((tag) => localizeTerm(i18n, tag, locale)).join(" | "),
    experience.reportCount,
    experience.sources.map(([, url]) => url).join(" | "),
  ];
}))];
await writeFile(path.join(clientDir, "data", "experiences.csv"), `${csvRows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`);

const sitemapEntries = [null, ...experiences];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemapEntries.flatMap((experience) => locales.map((locale) => {
  const pathname = experience ? experiencePath(locale, experience.slug) : localeRoot(locale);
  const alternates = localizedAlternates(pathname);
  return `  <url>
    <loc>${escapeXml(absoluteUrl(pathname))}</loc>
    <lastmod>${lastModified}</lastmod>
    <priority>${experience ? "0.8" : "1.0"}</priority>
${alternates.map(({ hreflang, href }) => `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${escapeXml(href)}" />`).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absoluteUrl(pathForLocale(pathname, "en")))}" />
  </url>`;
})).join("\n")}
</urlset>
`;
await writeFile(path.join(clientDir, "sitemap.xml"), sitemap);
await writeFile(path.join(clientDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
