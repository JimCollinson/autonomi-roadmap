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

Generate the single-file preview after edits:

```bash
npm run preview
# writes preview/standalone.html
```

Open `preview/standalone.html` directly to check the exact generated body HTML and CSS.

`fetch` is blocked on `file://`, so serve the folder:

```bash
npx serve            # from the repo root
# then open http://localhost:3000/preview/
```

Or use VS Code "Live Server". An AI tool editing the repo can do the same to
check its work.

## Preview pull requests

Pull requests run a roadmap preview workflow on open, synchronize, and reopen.
The workflow runs security tests, validates the roadmap content, builds
`preview/standalone.html`, and uploads that file as a workflow artifact.

For same-repo PRs, the workflow also publishes the generated standalone preview to
GitHub Pages at:

```text
https://jimcollinson.github.io/autonomi-roadmap/pr-<PR number>/
```

The workflow creates or updates one bot comment on the PR with that URL. Use it to
review the rendered and styled roadmap body before deciding whether to request
changes, publish, or merge.

Fork PRs do not get a deployed preview or bot comment because those steps require
write permissions. For forks, or if the Pages URL is unavailable, use the uploaded
`roadmap-preview-pr-<PR number>` artifact from the workflow run and open the
included `standalone.html` locally.

PR previews are public when served through GitHub Pages because this repository is
public. Do not put private draft material into same-repo PRs unless it is safe to
expose in a public preview URL.

The preview is only the standalone roadmap body generated from the PR branch's
`content/roadmap.json` and `styles/roadmap.css`. It does not update Framer or the
live `autonomi.com` page. The live Framer component remains pointed at the `@main`
jsDelivr URLs below, so production changes only after merge to `main` and normal
CDN propagation.

If the preview URL 404s after the workflow passes, GitHub Pages may not be enabled
for the repository/`gh-pages` branch yet, or Pages may still be propagating. The
artifact remains the fallback preview in either case.

## Wire it into Framer

### Important: private repos do not work with browser fetch

The Framer component fetches `content/roadmap.json` and `styles/roadmap.css` in the visitor's browser. That means the URLs must be publicly reachable without GitHub authentication.

At the moment this repo is private, so the public CDN/raw URLs will return 404 and Framer will not be able to load the roadmap body from them.

Before using this on a Framer test or live page, choose one delivery path:

1. **Make this repo public** and use jsDelivr URLs. This is the simplest POC path if the roadmap content is safe to publish.
2. **Keep the repo private** and copy/sync the generated content into a public host, Framer CMS, or another controlled public asset location. This is safer for private drafts but needs more setup.
3. **Use a server/proxy** that can read the private repo and expose only approved roadmap JSON/CSS publicly. This is usually overkill for the POC.

Do not put GitHub tokens or private credentials into the Framer component. Anything in the component runs client-side and would be visible to visitors.

### Use a Framer code component, not an embed

This is intended to be a **Framer code component**.

Do not paste generated roadmap HTML into a Framer HTML embed. The code-component approach renders inline, supports auto height, responds to real page width, and avoids iframe/breakpoint duplication.

What to paste into Framer:

- Paste the full contents of `framer/RoadmapBody.tsx` into a Framer code component.
- Then place that component on the roadmap page.
- The hero/header/intro/site nav/footer remain native Framer content.
- This repo controls only the roadmap body section.

### URLs to use if/when the repo is public

Once the repo or selected assets are publicly reachable, set these component properties:

- **JSON URL**: `https://cdn.jsdelivr.net/gh/jimcollinson/autonomi-roadmap@main/content/roadmap.json`
- **CSS URL**: `https://cdn.jsdelivr.net/gh/jimcollinson/autonomi-roadmap@main/styles/roadmap.css`

Manual Framer test path:

1. In Framer, create or update a code component using `framer/RoadmapBody.tsx`.
2. Drop the component onto a test page where the roadmap body should appear.
3. Set width **Fill** and height **Auto**.
4. In the component properties, set **JSON URL** and **CSS URL** to the public URLs above, or to whatever public asset URLs you choose.
5. Preview or publish the test page.
6. Confirm the body content renders, resizes across breakpoints, and matches `preview/standalone.html`.

Notes:

1. The easiest public delivery path is **jsDelivr** (proper MIME + CORS + caching):
   - `https://cdn.jsdelivr.net/gh/<org>/<repo>@main/content/roadmap.json`
   - `https://cdn.jsdelivr.net/gh/<org>/<repo>@main/styles/roadmap.css`
   - `raw.githubusercontent.com` can also work for public files, but jsDelivr is steadier for MIME/CORS.
2. jsDelivr does not serve private GitHub repo contents.
3. Pin to a tag/commit instead of `@main` (e.g. `@v1`) if you want changes to go live only when you cut a release.

## Known trade-off (read before going live)

Because the content is fetched in the browser at load time, it is **not** in
Framer's pre-rendered/static HTML — so it won't be in the initial paint or
indexed by search engines. Fine for an internal or JS-tolerant page. If SEO on
this page matters, the more robust pattern is a GitHub Action that syncs the
content into **Framer CMS** on push (content stays indexable); ask and we can
add that.

## Governance before live use

Keep the GitHub repo private for the POC. Before using `@main` on a live public page, protect `main` with required pull requests and CODEOWNERS review for `content/`, `styles/`, `framer/`, `lib/`, and `docs/adr/`.

Anyone with write access can change public roadmap copy and links once Framer points at `@main`, so direct pushes should be reserved for emergencies.

## Keeping the renderer in sync

`lib/render.js` and the renderer block inside `framer/RoadmapBody.tsx` are
intentional mirrors. To make it truly single-source later, publish `render.js`
and have the Framer component `import()` it from jsDelivr instead of inlining.
