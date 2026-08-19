import type { Handle } from "@sveltejs/kit";
import { localeFromPath, localeDefinitions } from "$site/i18n/index.js";

const pageSecurityHeaders = {
  "content-security-policy": "default-src 'self'; base-uri 'none'; connect-src 'self'; font-src 'self'; form-action 'self' https://github.com; frame-ancestors 'none'; img-src 'self' data:; manifest-src 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests",
  "permissions-policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

export const handle: Handle = async ({ event, resolve }) => {
  const locale = localeFromPath(event.url.pathname);
  const savedTheme = event.cookies.get("gex_theme_v1");
  const theme = savedTheme === "dark" ? "dark" : "light";
  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html
      .replace("%lang%", localeDefinitions[locale].htmlLang)
      .replace("%theme%", theme),
  });

  if (response.headers.get("content-type")?.startsWith("text/html")) {
    response.headers.set("content-language", localeDefinitions[locale].htmlLang);
  }

  if (!event.url.pathname.startsWith("/api/")) {
    for (const [name, value] of Object.entries(pageSecurityHeaders)) {
      response.headers.set(name, value);
    }
  }
  return response;
};
