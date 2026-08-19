import { createI18n, localeDefinitions, localeFromPath, pathForLocale } from "$site/i18n/index.js";
import type { LayoutServerLoad } from "./$types";

const localeShortLabels = { en: "EN", ja: "JA", "zh-CN": "中文" };

export const load: LayoutServerLoad = async ({ url, cookies }) => {
  const locale = localeFromPath(url.pathname);
  const i18n = await createI18n(locale);
  const themeCookie = cookies.get("gex_theme_v1");
  const suffix = url.search;
  return {
    locale,
    localeDefinition: localeDefinitions[locale],
    localeShortLabel: localeShortLabels[locale],
    localeLinks: Object.entries(localeDefinitions).map(([id, definition]) => ({
      id,
      label: definition.label,
      htmlLang: definition.htmlLang,
      hreflang: definition.hreflang,
      href: `${pathForLocale(url.pathname, id)}${suffix}`,
    })),
    messages: i18n.t("ui", { returnObjects: true }) as Record<string, string>,
    theme: (themeCookie === "dark" ? "dark" : "light") as "dark" | "light",
  };
};
