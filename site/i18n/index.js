import { createInstance } from "i18next";

export const localeDefinitions = {
  en: { path: "", htmlLang: "en", hreflang: "en", ogLocale: "en_US", label: "English" },
  ja: { path: "ja", htmlLang: "ja", hreflang: "ja", ogLocale: "ja_JP", label: "日本語" },
  "zh-CN": { path: "zh-cn", htmlLang: "zh-Hans", hreflang: "zh-Hans", ogLocale: "zh_CN", label: "简体中文" },
};

const localeLoaders = {
  en: async () => {
    const [{ en }, { content }] = await Promise.all([import("./ui/en.js"), import("./content/en.js")]);
    return { ...en, ...content };
  },
  ja: async () => {
    const [{ ja }, { content }] = await Promise.all([import("./ui/ja.js"), import("./content/ja.js")]);
    return { ...ja, ...content };
  },
  "zh-CN": async () => {
    const [{ zhCN }, { content }] = await Promise.all([import("./ui/zh-CN.js"), import("./content/zh-CN.js")]);
    return { ...zhCN, ...content };
  },
};

export function normalizeLocale(locale) {
  if (locale === "ja") return "ja";
  if (locale?.toLowerCase() === "zh-cn" || locale?.toLowerCase() === "zh-hans") return "zh-CN";
  return "en";
}

export function localeFromPath(pathname) {
  const segment = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  if (segment === "ja") return "ja";
  if (segment === "zh-cn") return "zh-CN";
  return "en";
}

export function localeRoot(locale) {
  const path = localeDefinitions[normalizeLocale(locale)].path;
  return path ? `/${path}/` : "/";
}

export function experiencePath(locale, slug) {
  return `${localeRoot(locale)}experience/${slug}/`;
}

export function pathForLocale(pathname, locale) {
  const normalizedPath = pathname.replace(/^\/(?:ja|zh-cn)(?=\/|$)/i, "") || "/";
  const root = localeRoot(locale);
  return root === "/" ? normalizedPath : `${root.slice(0, -1)}${normalizedPath}`;
}

export async function createI18n(locale = "en") {
  const normalizedLocale = normalizeLocale(locale);
  const translation = await localeLoaders[normalizedLocale]();
  const instance = createInstance();
  await instance.init({
    lng: normalizedLocale,
    fallbackLng: false,
    supportedLngs: Object.keys(localeDefinitions),
    resources: { [normalizedLocale]: { translation } },
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}

function translatedObject(instance, key, locale = instance.resolvedLanguage) {
  const value = instance.t(key, { lng: normalizeLocale(locale), returnObjects: true });
  return typeof value === "object" && value !== null ? value : {};
}

export function localizeTaxonomy(instance, group, value, locale) {
  return translatedObject(instance, `taxonomy.${group}`, locale)[value] ?? value;
}

export function localizeTerm(instance, value, locale) {
  return translatedObject(instance, "terms", locale)[value] ?? value;
}

export function localizeSourceKind(instance, value, locale) {
  return translatedObject(instance, "sourceKinds", locale)[value] ?? value;
}

export function localizeSourceNote(instance, value, locale) {
  return translatedObject(instance, "sourceNotes", locale)[value] ?? value;
}

export function localizeClaim(instance, claim, locale = instance.resolvedLanguage) {
  const localized = translatedObject(instance, "experiences", locale)[claim.slug] ?? {};
  return {
    ...claim,
    title: localized.title ?? claim.slug,
    summary: localized.summary ?? "",
    patterns: localized.patterns?.length ? localized.patterns : undefined,
    variations: claim.variations?.map((variation, index) => ({
      ...variation,
      text: localized.variations?.[index] ?? "",
    })),
  };
}
