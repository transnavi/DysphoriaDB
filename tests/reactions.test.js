import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const baseUrl = "https://example.com";
const voterId = "1f02a040-3e27-4f34-991f-42e57b6ac4e9";
const slug = "unfamiliar-reflection";

function postReaction(pathSlug, body, origin = baseUrl) {
  return exports.default.fetch(new Request(`${baseUrl}/api/reactions/${pathSlug}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  }));
}

describe("experience reactions", () => {
  it("counts each anonymous voter once", async () => {
    const first = await postReaction(slug, { voterId, selected: true });
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ slug, selected: true, count: 1 });

    const duplicate = await postReaction(slug, { voterId, selected: true });
    expect(await duplicate.json()).toEqual({ slug, selected: true, count: 1 });

    const counts = await exports.default.fetch(`${baseUrl}/api/reactions`);
    expect(counts.status).toBe(200);
    expect(await counts.json()).toEqual({ counts: { [slug]: 1 } });
  });

  it("removes a reaction", async () => {
    await postReaction(slug, { voterId, selected: true });
    const response = await postReaction(slug, { voterId, selected: false });
    expect(await response.json()).toEqual({ slug, selected: false, count: 0 });
  });

  it("rejects invalid identifiers, slugs, and origins", async () => {
    expect((await postReaction(slug, { voterId: "invalid", selected: true })).status).toBe(400);
    expect((await postReaction("missing", { voterId, selected: true })).status).toBe(404);
    expect((await postReaction(slug, { voterId, selected: true }, "https://attacker.example")).status).toBe(403);
  });

  it("bounds request bodies and rejects malformed routes", async () => {
    const oversized = await exports.default.fetch(new Request(`${baseUrl}/api/reactions/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: baseUrl },
      body: JSON.stringify({ voterId, selected: true, padding: "x".repeat(1100) }),
    }));
    expect(oversized.status).toBe(413);

    const malformed = await exports.default.fetch(new Request(`${baseUrl}/api/reactions/%E0%A4%A`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: baseUrl },
      body: JSON.stringify({ voterId, selected: true }),
    }));
    expect(malformed.status).toBe(400);

    const wrongMethod = await exports.default.fetch(`${baseUrl}/api/reactions/${slug}`);
    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.get("allow")).toBe("POST");
  });

  it("sends defensive API headers", async () => {
    const response = await exports.default.fetch(`${baseUrl}/api/reactions`);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
