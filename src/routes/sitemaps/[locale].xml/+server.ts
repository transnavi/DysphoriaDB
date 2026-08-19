import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import {
  renderLocaleSitemap,
  sitemapLocales,
  sitemapResponse,
  type SitemapLocale,
} from "$lib/server/sitemaps";

export const GET: RequestHandler = ({ params }) => {
  if (!(params.locale in sitemapLocales)) error(404, "Sitemap not found");
  return sitemapResponse(renderLocaleSitemap(params.locale as SitemapLocale));
};
