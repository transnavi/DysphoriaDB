import type { RequestHandler } from "./$types";

export const GET: RequestHandler = () => new Response(
  [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /*?*q=",
    "Disallow: /*?*domain=",
    "Disallow: /*?*filter=",
    "Sitemap: https://db.transnavi.jp/sitemap.xml",
    "",
  ].join("\n"),
  { headers: { "cache-control": "public, max-age=86400", "content-type": "text/plain; charset=utf-8" } },
);
