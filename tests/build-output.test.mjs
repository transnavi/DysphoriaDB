import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const output = (pathname) => new URL(`../dist/client/${pathname}`, import.meta.url);

test("localized root pages include canonical metadata and visible actions", async () => {
  const [en, ja, zhCN] = await Promise.all([
    readFile(output("index.html"), "utf8"),
    readFile(output("ja/index.html"), "utf8"),
    readFile(output("zh-cn/index.html"), "utf8"),
  ]);
  assert.match(en, /hreflang="ja" href="https:\/\/db\.transnavi\.jp\/ja\/"/);
  assert.match(ja, /<html lang="ja"/);
  assert.match(ja, /性別高揚感/);
  assert.match(ja, /繰り返し語られるジェンダー体験を分類・整理し/);
  assert.doesNotMatch(ja, /出典とともに探す|体験を探せる資料/);
  assert.match(ja, />体験を投稿する ↗<\/a>/);
  assert.match(ja, /id="search-button" type="submit">検索<\/button>/);
  assert.match(ja, /id="skip-link"[^>]*>体験一覧へ移動<\/a>/);
  assert.match(ja, /data-prerendered-locale="ja"/);
  assert.match(ja, /id="load-more-button"[^>]*>さらに表示<\/button>/);
  assert.equal((ja.match(/class="card /g) ?? []).length, 16);
  assert.doesNotMatch(ja, /class="catalog-skeleton"/);
  assert.match(ja, /og-image-ja\.png\?v=20260819/);
  assert.match(ja, /property="og:image:alt" content="ジェンダー体験事典。ジェンダー体験を分類・整理し/);
  assert.match(ja, /class="trans-pride-mark"/);
  assert.match(ja, /<summary class="domain-summary"><h2 class="domain-title">身体<\/h2><\/summary>/);
  assert.match(ja, /<summary><h3>/);
  assert.match(ja, /<h4 class="card-title">/);
  assert.match(ja, /class="categories" role="group" aria-label="タグ"/);
  assert.match(ja, /id="footer-reference-title">資料<\/p>/);
  assert.match(ja, /id="footer-data-title">オープンデータ<\/p>/);
  assert.match(ja, /id="footer-submit">体験を投稿する<\/span>/);
  assert.doesNotMatch(ja, /trans-pride-stripe/);
  assert.match(zhCN, /<html lang="zh-Hans"/);
  assert.match(zhCN, /og-image-zh-cn\.png\?v=20260819/);
  assert.ok(en.indexOf('rel="stylesheet"') < en.indexOf('type="module"'));
});

test("localized detail pages point to their language equivalents", async () => {
  const html = await readFile(output("ja/experience/unfamiliar-reflection/index.html"), "utf8");
  assert.match(html, /<link rel="canonical" href="https:\/\/db\.transnavi\.jp\/ja\/experience\/unfamiliar-reflection\/"/);
  assert.match(html, /hreflang="zh-Hans" href="https:\/\/db\.transnavi\.jp\/zh-cn\/experience\/unfamiliar-reflection\/"/);
  assert.match(html, /"@type":"DefinedTerm"/);
  assert.match(html, /class="detail-section" id="sources"/);
  assert.match(html, /class="reaction-button"/);
  assert.match(html, /<h2>/);
});

test("JSON and CSV exports contain every experience in every locale", async () => {
  const data = JSON.parse(await readFile(output("data/experiences.json"), "utf8"));
  const csv = await readFile(output("data/experiences.csv"), "utf8");
  assert.equal(data.license, "https://creativecommons.org/licenses/by/4.0/");
  assert.equal(data.experiences.length, 58);
  for (const experience of data.experiences) assert.deepEqual(Object.keys(experience.content), ["en", "ja", "zh-CN"]);
  assert.equal(csv.trim().split("\n").length, 1 + 58 * 3);
});

test("the sitemap lists localized alternates", async () => {
  const sitemap = await readFile(output("sitemap.xml"), "utf8");
  assert.match(sitemap, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  assert.match(sitemap, /hreflang="x-default"/);
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 59 * 3);
});

test("missing asset paths return the static 404 page", async () => {
  const [notFound, workerConfig, headers] = await Promise.all([
    readFile(output("404.html"), "utf8"),
    readFile(new URL("../dist/transnavi_db_site/wrangler.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(output("_headers"), "utf8"),
  ]);
  assert.match(notFound, /<meta name="robots" content="noindex"/);
  assert.equal(workerConfig.assets.not_found_handling, "404-page");
  assert.equal(workerConfig.assets.html_handling, "auto-trailing-slash");
  assert.equal(workerConfig.ratelimits[0].name, "REACTION_RATE_LIMITER");
  assert.equal(workerConfig.observability.logs.enabled, true);
  assert.match(headers, /Content-Security-Policy:/);
  assert.match(headers, /script-src 'self' 'unsafe-inline' https:\/\/static\.cloudflareinsights\.com/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
});
