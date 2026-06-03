# Autonomi Roadmap — GitHub-driven content (POC)

Proof of concept for managing the roadmap **content** and **styles** in GitHub
(AI- and PR-friendly) and rendering them in Framer through one small fixed
component. No more copy-pasting HTML into Framer.

## How it fits together

```
content/roadmap.json   <- WHAT it says   (structured content; Markdown allowed in card bodies)
styles/roadmap.css     <- HOW it looks   (all styling + responsive layout)
lib/render.js          <- glue: turns JSON -> HTML (shared, tiny, rarely changes)
preview/index.html     <- render it locally / via AI, no Framer needed
framer/RoadmapBody.tsx <- the fixed Framer component: fetches the two files above and renders
```

Edit `roadmap.json` to change content. Edit `roadmap.css` to change styling or
layout. Push to GitHub — the live site shows the latest. The hero stays a
separate native Framer component above this one.

## Editing content

`content/roadmap.json` is a list of `sections`, each with `tiers`, each with
`cards`. A card looks like:

```json
{ "tag": "app", "title": "Indelible", "sub": "Permanent storage for organisations",
  "body": "Free, open-source gateway... [indelibletool.com](https://indelibletool.com)" }
```

- `tag` (optional): `protocol` | `app` | `infra` | `tools` — renders the coloured pill.
- `body` supports inline **Markdown**: `**bold**`, `*italic*`, `` `code` ``, `[text](https://url)`.
- A tier's `layout` picks the card style/grid: `platforms` | `products` | `infra` | `sandbox` | `herocards`.
- A section's `icon` is `live` | `next` | `sandbox`.

Text is HTML-escaped before Markdown is applied, so content can't inject markup
or scripts — safe for colleagues/AI to edit freely.

## Preview locally (no Framer)

`fetch` is blocked on `file://`, so serve the folder:

```bash
npx serve            # from the repo root
# then open http://localhost:3000/preview/
```

Or use VS Code "Live Server". An AI tool editing the repo can do the same to
check its work.

## Wire it into Framer

1. Push this repo to GitHub.
2. Get the raw URLs for the two files. Easiest/most reliable is **jsDelivr** (proper MIME + CORS + caching):
   - `https://cdn.jsdelivr.net/gh/<org>/<repo>@main/content/roadmap.json`
   - `https://cdn.jsdelivr.net/gh/<org>/<repo>@main/styles/roadmap.css`
   - (raw.githubusercontent.com works too, but jsDelivr is steadier.)
3. In Framer, paste `framer/RoadmapBody.tsx` as a code component (or update the existing one).
4. Drop it on the page where the embed was, set width **Fill**, height **Auto**.
5. In the component's properties, set **JSON URL** and **CSS URL** to your two URLs. Optionally set **Max width** to match the nav.

Pin to a tag/commit instead of `@main` (e.g. `@v1`) if you want changes to go
live only when you cut a release.

## Known trade-off (read before going live)

Because the content is fetched in the browser at load time, it is **not** in
Framer's pre-rendered/static HTML — so it won't be in the initial paint or
indexed by search engines. Fine for an internal or JS-tolerant page. If SEO on
this page matters, the more robust pattern is a GitHub Action that syncs the
content into **Framer CMS** on push (content stays indexable); ask and we can
add that.

## Keeping the renderer in sync

`lib/render.js` and the renderer block inside `framer/RoadmapBody.tsx` are
intentional mirrors. To make it truly single-source later, publish `render.js`
and have the Framer component `import()` it from jsDelivr instead of inlining.
