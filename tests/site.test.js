import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { experiences } from "../site/data/experiences.js";

const baseUrl = "https://example.com";

describe("SvelteKit rendering", () => {
  it("renders the complete localized catalog with reaction totals in its first response", async () => {
    const id = "unfamiliar-reflection";
    await exports.default.fetch(new Request(`${baseUrl}/api/reactions/${id}`, {
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
    expect(html).toContain("<title>ジェンダー体験事典｜ジェンダー体験を分類・整理した資料</title>");
    expect(html.match(/class="card /g)).toHaveLength(60);
    expect(html).not.toContain("catalog-skeleton");
    expect(html).not.toContain("load-more-button");
    expect(html).toMatch(/data-card-id="unfamiliar-reflection"[\s\S]*?class="reaction-count">1</);
    expect(html.indexOf('data-card-id="unfamiliar-reflection"')).toBeLessThan(
      html.indexOf('data-card-id="mirrors-and-photographs-feel-unflattering"'),
    );
  });

  it("renders descriptive catalog titles for every locale", async () => {
    const pages = await Promise.all([
      exports.default.fetch(`${baseUrl}/`),
      exports.default.fetch(`${baseUrl}/ja/`),
      exports.default.fetch(`${baseUrl}/zh-cn/`),
    ]);
    const titles = await Promise.all(pages.map(async (response) => {
      const html = await response.text();
      return html.match(/<title>([^<]+)<\/title>/)?.[1];
    }));

    expect(titles).toEqual([
      "Gender Experience Index | Categorized Gender Experiences",
      "ジェンダー体験事典｜ジェンダー体験を分類・整理した資料",
      "性别体验索引｜分类整理性别体验的参考资料",
    ]);
  });

  it("shows newly added experiences first", async () => {
    const newExperience = experiences.at(-1);
    const knownIds = experiences
      .filter(({ id }) => id !== newExperience.id)
      .map(({ id }) => id)
      .join(",");
    const response = await exports.default.fetch(new Request(`${baseUrl}/`, {
      headers: { cookie: `gex_known_v1=${knownIds}` },
    }));
    const html = await response.text();
    const firstCardId = html.match(/data-card-id="([^"]+)"/)?.[1];
    expect(firstCardId).toBe(newExperience.id);
  });

  it("renders URL filters and saved collapse state on the server", async () => {
    const response = await exports.default.fetch(new Request(
      `${baseUrl}/ja/?q=${encodeURIComponent("鏡")}&domain=body`,
      { headers: { cookie: "gex_closed_families_v1=body-image-and-self-recognition" } },
    ));
    const html = await response.text();
    const cards = html.match(/class="card /g) ?? [];
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThan(60);
    expect(html).toContain('value="鏡"');
    expect(html).toMatch(/data-family="body-image-and-self-recognition"(?![^>]* open)/);
  });

  it("filters the catalog by recognition and transition context", async () => {
    const response = await exports.default.fetch(`${baseUrl}/ja/?filter=stage:established`);
    const html = await response.text();
    const expected = experiences.filter(({ stages }) => stages.includes("established")).length;
    expect(response.status).toBe(200);
    expect(html.match(/class="card /g)).toHaveLength(expected);
    expect(html).toContain('aria-pressed="true">性別移行後の生活が定着した時期</button>');
    expect(html).toContain("時期は重なることがあり");
  });

  it("serves localized detail metadata, dataset metadata, and data exports", async () => {
    const [detail, catalog, data, csv] = await Promise.all([
      exports.default.fetch(`${baseUrl}/zh-cn/experience/unfamiliar-reflection/`),
      exports.default.fetch(`${baseUrl}/zh-cn/`),
      exports.default.fetch(`${baseUrl}/data/experiences.json`),
      exports.default.fetch(`${baseUrl}/data/experiences.csv`),
    ]);
    const detailHtml = await detail.text();
    const catalogHtml = await catalog.text();
    const json = await data.json();
    expect(detailHtml).toContain('<html lang="zh-Hans"');
    expect(detail.headers.get("content-language")).toBe("zh-Hans");
    expect(detailHtml).toContain('rel="canonical" href="https://db.transnavi.jp/zh-cn/experience/unfamiliar-reflection/"');
    expect(detailHtml).toContain('"@type":"DefinedTerm"');
    expect(detailHtml).toContain('class="category-tag stage-tag"');
    expect(detailHtml).not.toContain('"@type":"Dataset"');
    expect(catalogHtml).toContain('"@type":"Dataset"');
    expect(catalogHtml).toContain('"isAccessibleForFree":true');
    expect(catalogHtml.match(/#experience"/g)).toHaveLength(60);
    const jsonLdMatch = catalogHtml.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
    expect(jsonLdMatch).not.toBeNull();
    const jsonLd = JSON.parse(jsonLdMatch[1]);
    const dataset = jsonLd["@graph"].find((node) => node["@type"] === "Dataset");
    expect([...dataset.description].length).toBeGreaterThanOrEqual(50);
    expect(dataset.sameAs).toEqual([
      "https://db.transnavi.jp/",
      "https://db.transnavi.jp/ja/",
      "https://db.transnavi.jp/zh-cn/",
    ]);
    expect(dataset.distribution).toHaveLength(2);
    expect(json.experiences).toHaveLength(60);
    expect(json.schemaVersion).toBe(3);
    expect(json.experiences.every((experience) => experience.id && !("slug" in experience))).toBe(true);
    expect(json.experiences.every((experience) => experience.stages.length > 0)).toBe(true);
    expect(json.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.headers.get("x-robots-tag")).toBe("noindex");
    const csvText = await csv.text();
    expect(csvText.split("\n", 1)[0]).toContain('"stages"');
    expect(csvText.trim().split("\n")).toHaveLength(1 + 60 * 3);
    expect(csv.headers.get("x-robots-tag")).toBe("noindex");
  });

  it("serves a sitemap index with complete localized child sitemaps", async () => {
    const [index, english, japanese, chinese, missing] = await Promise.all([
      exports.default.fetch(`${baseUrl}/sitemap.xml`),
      exports.default.fetch(`${baseUrl}/sitemaps/en.xml`),
      exports.default.fetch(`${baseUrl}/sitemaps/ja.xml`),
      exports.default.fetch(`${baseUrl}/sitemaps/zh-cn.xml`),
      exports.default.fetch(`${baseUrl}/sitemaps/unknown.xml`),
    ]);
    const indexXml = await index.text();
    expect(index.status).toBe(200);
    expect(index.headers.get("content-type")).toContain("application/xml");
    expect(indexXml).toContain("<sitemapindex");
    expect(indexXml.match(/<sitemap>/g)).toHaveLength(3);
    expect(indexXml).toContain("https://db.transnavi.jp/sitemaps/zh-cn.xml");
    for (const response of [english, japanese, chinese]) {
      const xml = await response.text();
      expect(response.status).toBe(200);
      expect(xml.match(/<url>/g)).toHaveLength(61);
      expect(xml.match(/<lastmod>/g)).toHaveLength(1);
      expect(xml.match(/hreflang="x-default"/g)).toHaveLength(61);
      expect(xml.match(/hreflang="zh-Hans"/g)).toHaveLength(61);
    }
    expect(missing.status).toBe(404);
  });

  it("keeps crawler traps and non-public endpoints out of crawl queues", async () => {
    const [robots, missing] = await Promise.all([
      exports.default.fetch(`${baseUrl}/robots.txt`),
      exports.default.fetch(`${baseUrl}/missing-page`),
    ]);
    const text = await robots.text();
    expect(text).toContain("Disallow: /api/");
    expect(text).toContain("Disallow: /*?*q=");
    expect(text).toContain("Sitemap: https://db.transnavi.jp/sitemap.xml");
    expect(await missing.text()).toContain('content="noindex,follow"');
  });

  it("applies defensive headers to rendered pages", async () => {
    const response = await exports.default.fetch(`${baseUrl}/ja/`);
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
