import type { RequestHandler } from "./$types";
import schema from "../../../../schemas/source.schema.json";

export const GET: RequestHandler = () => Response.json(schema, {
  headers: { "cache-control": "public, max-age=86400" },
});
