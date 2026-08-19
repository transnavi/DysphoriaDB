import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const baseUrl = "https://example.com";

describe("SvelteKit rendering", () => {
  it("renders the complete localized catalog with reaction totals in its first response", async () => {
    const slug = "unfamiliar-reflection";
    await exports.default.fetch(new Request(`${baseUrl}/api/reactions/${slug}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: baseUrl },
      body: JSON.stringify({
        voterId: "22fef018-2c6f-4954-aa2d-22b680b96c52",
        selected: true,
      }),
    }));

    const response = await exports.default.fetch(`${baseUrl}/ja/`);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('<html lang="ja"');
    expect(html).toContain("<title>ジェンダー体験事典</title>");
    expect(html.match(/class="card /g)).toHaveLength(58);
    expect(html).not.toContain("catalog-skeleton");
    expect(html).not.toContain("load-more-button");
    expect(html).toMatch(/data-card-slug="unfamiliar-reflection"[\s\S]*?class="reaction-count">1</);
    expect(html.indexOf('data-card-slug="unfamiliar-reflection"')).toBeLessThan(
      html.indexOf('data-card-slug="mirrors-and-photographs-feel-unflattering"'),
    );
  });

  it("renders URL filters and saved collapse state on the server", async () => {
    const response = await exports.default.fetch(new Request(
      `${baseUrl}/ja/?q=${encodeURIComponent("鏡")}&domain=body`,
      { headers: { cookie: "gex_closed_families_v1=body-image-and-self-recognition" } },
    ));
    const html = await response.text();
    const cards = html.match(/class="card /g) ?? [];
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThan(58);
    expect(html).toContain('value="鏡"');
    expect(html).toMatch(/data-family="body-image-and-self-recognition"(?![^>]* open)/);
  });

  it("serves localized detail metadata and data exports", async () => {
    const [detail, data, csv, sitemap] = await Promise.all([
      exports.default.fetch(`${baseUrl}/zh-cn/experience/unfamiliar-reflection/`),
      exports.default.fetch(`${baseUrl}/data/experiences.json`),
      exports.default.fetch(`${baseUrl}/data/experiences.csv`),
      exports.default.fetch(`${baseUrl}/sitemap.xml`),
    ]);
    const detailHtml = await detail.text();
    const json = await data.json();
    expect(detailHtml).toContain('<html lang="zh-Hans"');
    expect(detailHtml).toContain('rel="canonical" href="https://db.transnavi.jp/zh-cn/experience/unfamiliar-reflection/"');
    expect(detailHtml).toContain('"@type":"DefinedTerm"');
    expect(json.experiences).toHaveLength(58);
    expect((await csv.text()).trim().split("\n")).toHaveLength(1 + 58 * 3);
    expect((await sitemap.text()).match(/<url>/g)).toHaveLength(59 * 3);
  });

  it("applies defensive headers to rendered pages", async () => {
    const response = await exports.default.fetch(`${baseUrl}/ja/`);
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
