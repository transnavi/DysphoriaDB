import { loadDetailPage } from "$lib/server/page-data";
import type { PageServerLoad } from "./$types";

export const trailingSlash = "always";
export const load: PageServerLoad = (event) => loadDetailPage(event, "ja");
