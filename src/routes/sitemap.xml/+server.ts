import type { RequestHandler } from "./$types";
import { experiences } from "$site/data/experiences.js";

const siteUrl = "https://db.transnavi.jp";
const localeInfo = {
  en: { path: "", hreflang: "en" },
  ja: { path: "ja", hreflang: "ja" },
  "zh-CN": { path: "zh-cn", hreflang: "zh-Hans" },
};
const escapeXml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");
const pagePath = (locale: string, slug?: string) => {
  const prefix = localeInfo[locale as keyof typeof localeInfo].path;
  return `${prefix ? `/${prefix}` : ""}${slug ? `/experience/${slug}` : ""}/`;
};

export const GET: RequestHandler = () => {
  const entries = [undefined, ...experiences.map(({ slug }) => slug)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.flatMap((slug) => Object.keys(localeInfo).map((locale) => {
  const path = pagePath(locale, slug);
  return `  <url>
    <loc>${escapeXml(new URL(path, siteUrl).href)}</loc>
    <lastmod>2026-08-20</lastmod>
    <priority>${slug ? "0.8" : "1.0"}</priority>
${Object.entries(localeInfo).map(([alternateLocale, info]) =>
  `    <xhtml:link rel="alternate" hreflang="${info.hreflang}" href="${escapeXml(new URL(pagePath(alternateLocale, slug), siteUrl).href)}" />`
).join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(new URL(pagePath("en", slug), siteUrl).href)}" />
  </url>`;
})).join("\n")}
</urlset>
`;
  return new Response(xml, {
    headers: { "cache-control": "public, max-age=3600", "content-type": "application/xml; charset=utf-8" },
  });
};
