import { experiences } from "../site/data/experiences.js";

const validSlugs = new Set(experiences.map(({ slug }) => slug));
const voterIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maximumBodyBytes = 1024;
const apiSecurityHeaders = {
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "content-type": "application/json; charset=utf-8",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(data, {
    status,
    headers: { ...apiSecurityHeaders, "cache-control": "no-store", ...headers },
  });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return (origin === null || origin === new URL(request.url).origin)
    && (fetchSite === null || fetchSite === "same-origin");
}

async function limitedJson(request: Request): Promise<{ value: unknown } | { response: Response }> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null && Number(declaredLength) > maximumBodyBytes) {
    return { response: json({ error: "Request body is too large" }, 413) };
  }
  if (!request.body) return { response: json({ error: "Invalid JSON" }, 400) };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maximumBodyBytes) {
      await reader.cancel();
      return { response: json({ error: "Request body is too large" }, 413) };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { response: json({ error: "Invalid JSON" }, 400) };
  }
}

async function reactionAllowed(request: Request, env: Env): Promise<boolean> {
  const key = request.headers.get("cf-connecting-ip") ?? "local";
  const { success } = await env.REACTION_RATE_LIMITER.limit({ key });
  return success;
}

async function reactionCounts(env: Env): Promise<Record<string, number>> {
  const result = await env.REACTIONS_DB
    .prepare("SELECT experience_slug, COUNT(*) AS count FROM experience_reactions GROUP BY experience_slug")
    .all<{ experience_slug: string; count: number }>();

  return Object.fromEntries(result.results
    .filter((row) => validSlugs.has(row.experience_slug))
    .map((row) => [row.experience_slug, Number(row.count)]));
}

async function updateReaction(request: Request, env: Env, slug: string): Promise<Response> {
  if (!validSlugs.has(slug)) return json({ error: "Unknown experience" }, 404);
  if (!sameOrigin(request)) return json({ error: "Origin is not allowed" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json({ error: "Expected JSON" }, 415);
  }
  if (!await reactionAllowed(request, env)) {
    return json({ error: "Too many requests" }, 429, { "retry-after": "10" });
  }

  const parsed = await limitedJson(request);
  if ("response" in parsed) return parsed.response;
  const body = parsed.value;

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

      if (url.pathname === "/api/reactions") {
        return json({ error: "Method not allowed" }, 405, { allow: "GET" });
      }

      const match = url.pathname.match(/^\/api\/reactions\/([^/]+)$/);
      if (match) {
        if (request.method !== "POST") {
          return json({ error: "Method not allowed" }, 405, { allow: "POST" });
        }
        let slug: string;
        try {
          slug = decodeURIComponent(match[1]);
        } catch {
          return json({ error: "Invalid experience" }, 400);
        }
        return updateReaction(request, env, slug);
      }

      if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(JSON.stringify({
        message: "reaction_api_error",
        method: request.method,
        pathname: url.pathname,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      return json({ error: "Service unavailable" }, 503);
    }
  },
} satisfies ExportedHandler<Env>;
