# Gender Experience Index

A localized reference of recurring gender experiences. SvelteKit renders the catalog and detail pages on Cloudflare Workers. Reaction totals come from D1 during server rendering.

## Development

Install the dependencies and start SvelteKit:

```sh
npm install
npx wrangler d1 migrations apply dysphoria-db-reactions --local
npm run dev
```

Then open `http://localhost:4174`.

## Experience data

Each entry in `site/data/experiences.js` has a stable `id`. Routes, reference sources, exports, and reactions use this ID. Localized titles, summaries, patterns, and variations live in `site/i18n/content/<locale>.js`; every locale, including English, keys its content by the same ID.

## Production build

```sh
npm run build
npm run preview
```

The Cloudflare adapter writes the Worker and static assets to `.svelte-kit/cloudflare/`.

## Tests

```sh
npm test
```

Run Svelte diagnostics separately:

```sh
npm run check
```

## Deployment

Authenticate Wrangler with Cloudflare before the first deployment, then run:

```sh
npm run deploy
```
