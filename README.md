# Gender Experience Index

A browsable reference of recurring gender experiences.

## Development

Install the JavaScript dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

Then open `http://localhost:4174`.

## Experience data

Each experience in `site/data/experiences.js` has a stable `id`. The ID is also
used in routes, evidence records, archive matches, and reaction records.

Titles, summaries, patterns, and variation text live in
`site/i18n/content/<locale>.js`. Every locale uses the experience ID as its key,
including English in `site/i18n/content/en.js`.

## Production build

```sh
npm run build
npm run preview
```

The build creates the Vite asset bundle and static HTML pages in `dist/`.

## Tests

```sh
npm test
```

## Deployment

Authenticate Wrangler with Cloudflare before the first deployment, then run:

```sh
npm run deploy
```
