import assert from "node:assert/strict";
import test from "node:test";

import { domains, experienceFamilies, experiences } from "../site/data/experiences.js";
import { content as en } from "../site/i18n/content/en.js";
import { content as ja } from "../site/i18n/content/ja.js";
import { content as zhCN } from "../site/i18n/content/zh-CN.js";
import { en as enUi } from "../site/i18n/ui/en.js";
import { ja as jaUi } from "../site/i18n/ui/ja.js";
import { zhCN as zhCNUi } from "../site/i18n/ui/zh-CN.js";
import { experiencePath, localeFromPath, pathForLocale } from "../site/i18n/index.js";

const contentByLocale = { en, ja, "zh-CN": zhCN };
const uiByLocale = { en: enUi, ja: jaUi, "zh-CN": zhCNUi };

test("every locale supplies peer content for every experience", () => {
  const slugs = experiences.map(({ slug }) => slug).sort();
  for (const [locale, content] of Object.entries(contentByLocale)) {
    assert.deepEqual(Object.keys(content.experiences).sort(), slugs, locale);
    for (const experience of experiences) {
      const localized = content.experiences[experience.slug];
      assert.ok(localized.title.trim(), `${locale}:${experience.slug}:title`);
      assert.ok(localized.summary.trim(), `${locale}:${experience.slug}:summary`);
      assert.equal(localized.patterns.length, en.experiences[experience.slug].patterns.length, `${locale}:${experience.slug}:patterns`);
      assert.equal(localized.variations.length, en.experiences[experience.slug].variations.length, `${locale}:${experience.slug}:variations`);
      assert.equal(localized.variations.length, experience.variations?.length ?? 0, `${locale}:${experience.slug}:variation-directions`);
      for (const [index, variation] of localized.variations.entries()) {
        assert.ok(variation.trim(), `${locale}:${experience.slug}:variation:${index}`);
      }
    }
  }
});

test("all visible tags and taxonomy IDs are localized", () => {
  const tags = new Set(experiences.flatMap(({ tags }) => tags));
  for (const [locale, content] of Object.entries(contentByLocale)) {
    for (const tag of tags) assert.ok(content.terms[tag]?.trim(), `${locale}:tag:${tag}`);
  }

  for (const [locale, ui] of Object.entries(uiByLocale)) {
    for (const { id } of domains) assert.ok(ui.taxonomy.domains[id], `${locale}:domain:${id}`);
    for (const { id } of experienceFamilies) assert.ok(ui.taxonomy.families[id], `${locale}:family:${id}`);
    for (const experience of experiences) {
      for (const type of experience.types) assert.ok(ui.taxonomy.types[type], `${locale}:type:${type}`);
      for (const direction of experience.directions) assert.ok(ui.taxonomy.directions[direction], `${locale}:direction:${direction}`);
    }
  }
});

test("localized terminology follows the TransNavi vocabulary", () => {
  assert.equal(ja.terms["gender-euphoria"], "性別高揚感");
  assert.equal(ja.terms["gender-incongruence"], "性別不合");
  assert.equal(ja.terms.misgendering, "ミスジェンダリング");
  assert.equal(ja.terms.passing, "パッシング");
  assert.equal(zhCN.terms.misgendering, "性别错称");
  assert.equal(zhCN.terms.passing, "过关");
});

test("site descriptions present the catalog as an organized reference", () => {
  assert.match(enUi.ui.description, /categorizes recurring gender experiences/i);
  assert.match(jaUi.ui.description, /分類・整理/);
  assert.match(jaUi.ui.introduction, /クィア・スタディーズ/);
  assert.doesNotMatch(jaUi.ui.description, /探せる|出典/);
  assert.match(zhCNUi.ui.description, /分类整理/);
  for (const [locale, ui] of Object.entries(uiByLocale)) {
    assert.ok([...ui.ui.datasetDescription].length >= 50, `${locale}:datasetDescription`);
    assert.ok(ui.ui.datasetKeywords.split(",").length >= 5, `${locale}:datasetKeywords`);
  }
});

test("language-specific expressions remain in their localized content", () => {
  const english = JSON.stringify(en);
  assert.equal(english.includes("女々しい"), false);
  assert.equal(english.includes("娘娘腔"), false);
  assert.match(JSON.stringify(ja), /女々しい/);
  assert.match(JSON.stringify(zhCN), /娘娘腔/);
  assert.match(ja.experiences["gender-policing-insults-feel-affirming"].summary, /女々しい/);
  assert.match(zhCN.experiences["gender-policing-insults-feel-affirming"].summary, /娘娘腔/);
  assert.match(ja.experiences["belonging-among-peers-of-another-gender"].summary, /女性同士の友人グループ/);
  assert.match(ja.experiences["overperforming-the-assigned-gender"].summary, /ひげ/);
});

test("locale routes preserve equivalent experience paths", () => {
  const slug = experiences[0].slug;
  assert.equal(experiencePath("en", slug), `/experience/${slug}/`);
  assert.equal(experiencePath("ja", slug), `/ja/experience/${slug}/`);
  assert.equal(experiencePath("zh-CN", slug), `/zh-cn/experience/${slug}/`);
  assert.equal(pathForLocale(`/ja/experience/${slug}/`, "zh-CN"), `/zh-cn/experience/${slug}/`);
  assert.equal(localeFromPath("/zh-cn/"), "zh-CN");
});
