import type { RequestHandler } from "./$types";
import { exportCsv } from "$lib/server/exports";

export const GET: RequestHandler = async () => new Response(await exportCsv(), {
  headers: {
    "cache-control": "public, max-age=3600",
    "content-disposition": 'attachment; filename="gender-experiences.csv"',
    "content-type": "text/csv; charset=utf-8",
    "x-robots-tag": "noindex",
  },
});
