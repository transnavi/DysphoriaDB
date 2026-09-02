import assert from "node:assert/strict";
import test from "node:test";

import { referenceSources } from "../data/source/reference-sources.js";
import { domains, experienceFamilies, experiences, journeyStages } from "../site/data/experiences.js";
import { content as en } from "../site/i18n/content/en.js";
import { content as ja } from "../site/i18n/content/ja.js";
import { content as zhCN } from "../site/i18n/content/zh-CN.js";
import { en as enUi } from "../site/i18n/ui/en.js";
import { ja as jaUi } from "../site/i18n/ui/ja.js";
import { zhCN as zhCNUi } from "../site/i18n/ui/zh-CN.js";
import { experiencePath, localeFromPath, pathForLocale } from "../site/i18n/index.js";

const contentByLocale = { en, ja, "zh-CN": zhCN };
const uiByLocale = { en: enUi, ja: jaUi, "zh-CN": zhCNUi };

test("experience IDs are stable data keys", () => {
  const ids = experiences.map(({ id }) => id);
  const validIds = new Set(ids);
  assert.equal(validIds.size, ids.length);
  for (const experience of experiences) {
    assert.match(experience.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal("title" in experience, false, experience.id);
    assert.equal("summary" in experience, false, experience.id);
  }
  for (const id of Object.keys(referenceSources)) {
    assert.ok(validIds.has(id), `reference:${id}`);
  }
});

test("every locale supplies peer content for every experience", () => {
  const ids = experiences.map(({ id }) => id).sort();
  for (const [locale, content] of Object.entries(contentByLocale)) {
    assert.deepEqual(Object.keys(content.experiences).sort(), ids, locale);
    for (const experience of experiences) {
      const localized = content.experiences[experience.id];
      assert.ok(localized.title.trim(), `${locale}:${experience.id}:title`);
      assert.ok(localized.summary.trim(), `${locale}:${experience.id}:summary`);
      assert.equal(localized.patterns.length, en.experiences[experience.id].patterns.length, `${locale}:${experience.id}:patterns`);
      assert.equal(localized.variations.length, en.experiences[experience.id].variations.length, `${locale}:${experience.id}:variations`);
      assert.equal(localized.variations.length, experience.variations?.length ?? 0, `${locale}:${experience.id}:variation-directions`);
      for (const [index, variation] of localized.variations.entries()) {
        assert.ok(variation.trim(), `${locale}:${experience.id}:variation:${index}`);
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
    for (const { id } of journeyStages) assert.ok(ui.taxonomy.stages[id], `${locale}:stage:${id}`);
    for (const experience of experiences) {
      for (const type of experience.types) assert.ok(ui.taxonomy.types[type], `${locale}:type:${type}`);
      for (const direction of experience.directions) assert.ok(ui.taxonomy.directions[direction], `${locale}:direction:${direction}`);
    }
  }
});

test("journey stages classify every experience", () => {
  const stageIds = new Set(journeyStages.map(({ id }) => id));
  for (const experience of experiences) {
    assert.ok(experience.stages.length > 0, experience.id);
    for (const stage of experience.stages) {
      assert.ok(stageIds.has(stage), `${experience.id}:${stage}`);
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
  const id = experiences[0].id;
  assert.equal(experiencePath("en", id), `/experience/${id}/`);
  assert.equal(experiencePath("ja", id), `/ja/experience/${id}/`);
  assert.equal(experiencePath("zh-CN", id), `/zh-cn/experience/${id}/`);
  assert.equal(pathForLocale(`/ja/experience/${id}/`, "zh-CN"), `/zh-cn/experience/${id}/`);
  assert.equal(localeFromPath("/zh-cn/"), "zh-CN");
});

test("every locale's Dataset description satisfies Google's 50 to 5000 character range", () => {
  for (const [locale, ui] of Object.entries(uiByLocale)) {
    const length = [...ui.ui.datasetDescription.trim()].length;
    assert.ok(length >= 50 && length <= 5000, `${locale}:datasetDescription is ${length} characters`);
  }
});
