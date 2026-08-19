import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { claimSlugs } from "../site/claim-slugs.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(projectRoot, "dist");
const siteDir = path.join(projectRoot, "site");
const siteUrl = "https://db.transnavi.jp";
const siteName = "Gender Experience Index";
const siteDescription = "A browsable reference of recurring gender experiences.";
const lastModified = "2026-08-19";

const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const escapeXml = escapeHtml;

function claimSummary(source, title) {
  const marker = `title: ${JSON.stringify(title)}`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Claim data missing for: ${title}`);
  const match = source.slice(start).match(/summary:\s*("(?:[^"\\]|\\.)*")/);
  if (!match) throw new Error(`Claim summary missing for: ${title}`);
  return JSON.parse(match[1]);
}

function replaceMeta(html, attribute, key, value) {
  const expression = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*\\/>`);
  return html.replace(expression, `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`);
}

function detailStructuredData(title, summary, canonicalUrl) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: siteName,
        description: siteDescription,
        inLanguage: "en",
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: title,
        description: summary,
        inLanguage: "en",
        isPartOf: { "@id": `${siteUrl}/#website` },
        mainEntity: { "@id": `${canonicalUrl}#experience` },
      },
      {
        "@type": "DefinedTerm",
        "@id": `${canonicalUrl}#experience`,
        url: canonicalUrl,
        name: title,
        description: summary,
        inDefinedTermSet: { "@id": `${siteUrl}/#index` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: siteName, item: `${siteUrl}/` },
          { "@type": "ListItem", position: 2, name: title, item: canonicalUrl },
        ],
      },
    ],
  };
}

function detailHtml(baseHtml, title, summary, slug) {
  const canonicalUrl = `${siteUrl}/experience/${slug}/`;
  const pageTitle = `${title} — ${siteName}`;
  let html = baseHtml;

  html = replaceMeta(html, "name", "description", summary);
  html = replaceMeta(html, "property", "og:url", canonicalUrl);
  html = replaceMeta(html, "property", "og:type", "article");
  html = replaceMeta(html, "property", "og:title", pageTitle);
  html = replaceMeta(html, "property", "og:description", summary);
  html = replaceMeta(html, "property", "og:image:alt", pageTitle);
  html = replaceMeta(html, "name", "twitter:title", pageTitle);
  html = replaceMeta(html, "name", "twitter:description", summary);
  html = html.replace(/<link rel="canonical" href="[^"]+" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`);
  html = html.replace(/<link rel="alternate" hreflang="en" href="[^"]+" \/>/, `<link rel="alternate" hreflang="en" href="${canonicalUrl}" />`);
  html = html.replace(/<link rel="alternate" hreflang="x-default" href="[^"]+" \/>/, `<link rel="alternate" hreflang="x-default" href="${canonicalUrl}" />`);
  html = html.replace(/<title>[^<]+<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`);
  html = html.replace(
    /<script type="application\/ld\+json" id="structured-data">[\s\S]*?<\/script>/,
    `<script type="application/ld+json" id="structured-data">${JSON.stringify(detailStructuredData(title, summary, canonicalUrl))}</script>`,
  );
  html = html.replace(
    "<h1>How people experience gender</h1>",
    '<p class="intro-title">How people experience gender</p>',
  );
  html = html.replace('<div class="intro">', '<div class="intro" hidden>');
  html = html.replace('<div id="browse-view">', '<div id="browse-view" hidden>');
  html = html.replace(
    '<div class="experience-detail" id="experience-detail" hidden></div>',
    `<div class="experience-detail" id="experience-detail"><a class="detail-back" href="/">← All experiences</a><article><h1>${escapeHtml(title)}</h1><p class="detail-summary">${escapeHtml(summary)}</p></article></div>`,
  );
  return html;
}

await mkdir(path.join(clientDir, "schemas"), { recursive: true });

const baseHtml = await readFile(path.join(clientDir, "index.html"), "utf8");
const appSource = await readFile(path.join(siteDir, "app.js"), "utf8");
await copyFile(path.join(projectRoot, "schemas", "source.schema.json"), path.join(clientDir, "schemas", "source.schema.json"));

const sitemapUrls = [{ loc: `${siteUrl}/`, priority: "1.0" }];
for (const [title, slug] of Object.entries(claimSlugs)) {
  const summary = claimSummary(appSource, title);
  const claimDir = path.join(clientDir, "experience", slug);
  await mkdir(claimDir, { recursive: true });
  await writeFile(path.join(claimDir, "index.html"), detailHtml(baseHtml, title, summary, slug));
  sitemapUrls.push({ loc: `${siteUrl}/experience/${slug}/`, priority: "0.8" });
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(({ loc, priority }) => `  <url><loc>${escapeXml(loc)}</loc><lastmod>${lastModified}</lastmod><priority>${priority}</priority></url>`).join("\n")}
</urlset>
`;
await writeFile(path.join(clientDir, "sitemap.xml"), sitemap);
await writeFile(path.join(clientDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`);
