import { experiences } from "$site/data/experiences.js";
import { catalogMetadata } from "$site/data/catalog-metadata.js";

export const sitemapLocales = {
  en: { path: "", hreflang: "en" },
  ja: { path: "ja", hreflang: "ja" },
  "zh-cn": { path: "zh-cn", hreflang: "zh-Hans" },
} as const;

export type SitemapLocale = keyof typeof sitemapLocales;

const escapeXml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const absoluteUrl = (path: string) => new URL(path, catalogMetadata.siteUrl).href;

function pagePath(locale: SitemapLocale, slug?: string) {
  const prefix = sitemapLocales[locale].path;
  return `${prefix ? `/${prefix}` : ""}${slug ? `/experience/${slug}` : ""}/`;
}

export function renderSitemapIndex() {
  const sitemaps = Object.keys(sitemapLocales) as SitemapLocale[];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((locale) => `  <sitemap>
    <loc>${escapeXml(absoluteUrl(`/sitemaps/${locale}.xml`))}</loc>
    <lastmod>${catalogMetadata.dateModified}</lastmod>
  </sitemap>`).join("\n")}
</sitemapindex>
`;
}

export function renderLocaleSitemap(locale: SitemapLocale) {
  const entries = [undefined, ...experiences.map(({ slug }) => slug)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map((slug) => `  <url>
    <loc>${escapeXml(absoluteUrl(pagePath(locale, slug)))}</loc>
    <lastmod>${catalogMetadata.dateModified}</lastmod>
    <priority>${slug ? "0.8" : "1.0"}</priority>
${(Object.keys(sitemapLocales) as SitemapLocale[]).map((alternateLocale) =>
    `    <xhtml:link rel="alternate" hreflang="${sitemapLocales[alternateLocale].hreflang}" href="${escapeXml(absoluteUrl(pagePath(alternateLocale, slug)))}" />`
  ).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absoluteUrl(pagePath("en", slug)))}" />
  </url>`).join("\n")}
</urlset>
`;
}

export function sitemapResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      "content-type": "application/xml; charset=utf-8",
      "last-modified": new Date(`${catalogMetadata.dateModified}T00:00:00Z`).toUTCString(),
      "x-content-type-options": "nosniff",
    },
  });
}
