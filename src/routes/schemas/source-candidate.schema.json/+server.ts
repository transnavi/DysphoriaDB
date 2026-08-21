import type { RequestHandler } from "./$types";
import schema from "../../../../schemas/source-candidate.schema.json";

export const GET: RequestHandler = () => Response.json(schema, {
  headers: { "cache-control": "public, max-age=86400" },
});
