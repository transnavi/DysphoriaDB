import type { RequestHandler } from "./$types";
import { renderSitemapIndex, sitemapResponse } from "$lib/server/sitemaps";

export const GET: RequestHandler = () => sitemapResponse(renderSitemapIndex());
