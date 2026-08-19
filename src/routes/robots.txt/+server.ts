import type { RequestHandler } from "./$types";

export const GET: RequestHandler = () => new Response(
  "User-agent: *\nAllow: /\nSitemap: https://db.transnavi.jp/sitemap.xml\n",
  { headers: { "cache-control": "public, max-age=86400", "content-type": "text/plain; charset=utf-8" } },
);
