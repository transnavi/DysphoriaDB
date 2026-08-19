import { experiences } from "$site/data/experiences.js";

const validSlugs = new Set(experiences.map(({ slug }) => slug));
const voterIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const maximumBodyBytes = 1024;
const apiSecurityHeaders = {
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "content-type": "application/json; charset=utf-8",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
};

type RuntimeEnv = Pick<Env, "REACTIONS_DB" | "REACTION_RATE_LIMITER">;

export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(data, {
    status,
    headers: { ...apiSecurityHeaders, "cache-control": "no-store", ...headers },
  });
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  return (origin === null || origin === new URL(request.url).origin)
    && (fetchSite === null || fetchSite === "same-origin");
}

async function limitedJson(request: Request): Promise<{ value: unknown } | { response: Response }> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null && Number(declaredLength) > maximumBodyBytes) {
    return { response: jsonResponse({ error: "Request body is too large" }, 413) };
  }
  if (!request.body) return { response: jsonResponse({ error: "Invalid JSON" }, 400) };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maximumBodyBytes) {
      await reader.cancel();
      return { response: jsonResponse({ error: "Request body is too large" }, 413) };
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
    return { response: jsonResponse({ error: "Invalid JSON" }, 400) };
  }
}

export async function getReactionCounts(env?: RuntimeEnv) {
  if (!env?.REACTIONS_DB) return {};
  const result = await env.REACTIONS_DB
    .prepare("SELECT experience_slug, COUNT(*) AS count FROM experience_reactions GROUP BY experience_slug")
    .all<{ experience_slug: string; count: number }>();

  return Object.fromEntries(result.results
    .filter((row) => validSlugs.has(row.experience_slug))
    .map((row) => [row.experience_slug, Number(row.count)]));
}

export async function updateReaction(request: Request, env: RuntimeEnv | undefined, slug: string) {
  if (!env?.REACTIONS_DB) return jsonResponse({ error: "Service unavailable" }, 503);
  if (!validSlugs.has(slug)) return jsonResponse({ error: "Unknown experience" }, 404);
  if (!sameOrigin(request)) return jsonResponse({ error: "Origin is not allowed" }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return jsonResponse({ error: "Expected JSON" }, 415);
  }
  const key = request.headers.get("cf-connecting-ip") ?? "local";
  if (env.REACTION_RATE_LIMITER && !(await env.REACTION_RATE_LIMITER.limit({ key })).success) {
    return jsonResponse({ error: "Too many requests" }, 429, { "retry-after": "10" });
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
    return jsonResponse({ error: "Invalid reaction" }, 400);
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

  return jsonResponse({
    slug,
    selected: body.selected,
    count: Number(countResult.results[0]?.count ?? 0),
  });
}
