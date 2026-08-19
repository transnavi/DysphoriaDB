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
  assert.match(ja, /og-image-ja\.png/);
  assert.match(zhCN, /<html lang="zh-Hans"/);
  assert.match(zhCN, /og-image-zh-cn\.png/);
  assert.ok(en.indexOf('rel="stylesheet"') < en.indexOf('type="module"'));
});

test("localized detail pages point to their language equivalents", async () => {
  const html = await readFile(output("ja/experience/unfamiliar-reflection/index.html"), "utf8");
  assert.match(html, /<link rel="canonical" href="https:\/\/db\.transnavi\.jp\/ja\/experience\/unfamiliar-reflection\/"/);
  assert.match(html, /hreflang="zh-Hans" href="https:\/\/db\.transnavi\.jp\/zh-cn\/experience\/unfamiliar-reflection\/"/);
  assert.match(html, /"@type":"DefinedTerm"/);
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
