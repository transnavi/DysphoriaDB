import { experiences } from "../site/data/experiences.js";

const validSlugs = new Set(experiences.map(({ slug }) => slug));
const voterIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: jsonHeaders });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === null || origin === new URL(request.url).origin;
}

async function reactionCounts(env: Env): Promise<Record<string, number>> {
  const result = await env.REACTIONS_DB
    .prepare("SELECT experience_slug, COUNT(*) AS count FROM experience_reactions GROUP BY experience_slug")
    .all<{ experience_slug: string; count: number }>();

  return Object.fromEntries(result.results.map((row) => [row.experience_slug, Number(row.count)]));
}

async function updateReaction(request: Request, env: Env, slug: string): Promise<Response> {
  if (!validSlugs.has(slug)) return json({ error: "Unknown experience" }, 404);
  if (!sameOrigin(request)) return json({ error: "Origin is not allowed" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "Expected JSON" }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 1024) return json({ error: "Request body is too large" }, 413);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (
    typeof body !== "object"
    || body === null
    || !("voterId" in body)
    || !("selected" in body)
    || typeof body.voterId !== "string"
    || !voterIdPattern.test(body.voterId)
    || typeof body.selected !== "boolean"
  ) {
    return json({ error: "Invalid reaction" }, 400);
  }

  const write = body.selected
    ? env.REACTIONS_DB.prepare(
      "INSERT OR IGNORE INTO experience_reactions (experience_slug, voter_id) VALUES (?, ?)",
    ).bind(slug, body.voterId)
    : env.REACTIONS_DB.prepare(
      "DELETE FROM experience_reactions WHERE experience_slug = ? AND voter_id = ?",
    ).bind(slug, body.voterId);
  const count = env.REACTIONS_DB.prepare(
    "SELECT COUNT(*) AS count FROM experience_reactions WHERE experience_slug = ?",
  ).bind(slug);
  const [, countResult] = await env.REACTIONS_DB.batch<{ count: number }>([write, count]);

  return json({ slug, selected: body.selected, count: Number(countResult.results[0]?.count ?? 0) });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (request.method === "GET" && url.pathname === "/api/reactions") {
        return json({ counts: await reactionCounts(env) });
      }

      const match = url.pathname.match(/^\/api\/reactions\/([^/]+)$/);
      if (request.method === "POST" && match) {
        return updateReaction(request, env, decodeURIComponent(match[1]));
      }

      if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("reaction_api_error", {
        method: request.method,
        pathname: url.pathname,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return json({ error: "Service unavailable" }, 503);
    }
  },
} satisfies ExportedHandler<Env>;
