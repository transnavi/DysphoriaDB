import type { RequestHandler } from "./$types";
import { exportData } from "$lib/server/exports";

export const GET: RequestHandler = async () => Response.json(await exportData(), {
  headers: {
    "cache-control": "public, max-age=3600",
    "content-disposition": 'attachment; filename="gender-experiences.json"',
    "x-robots-tag": "noindex",
  },
});
