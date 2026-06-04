# Autonomi Roadmap — GitHub-driven production content

This repository contains the production roadmap body content and supporting
styles consumed by the Autonomi.com Framer site. It enables roadmap updates
through GitHub pull requests, CI validation, hosted previews, and agentic
workflows, while Framer continues to own the surrounding page structure and
global site components.

## How it fits together

```
content/roadmap.json   <- WHAT it says   (structured content; Markdown allowed in card bodies)
styles/roadmap.css     <- HOW it looks   (all styling + responsive layout)
lib/render.js          <- glue: turns JSON -> HTML (shared, tiny, rarely changes)
preview/index.html     <- render it locally / via AI, no Framer needed
framer/RoadmapBody.tsx <- the fixed Framer component: fetches the two files above and renders
```

Edit `roadmap.json` to change content. Edit `roadmap.css` to change styling or
layout. Merge to `main` and GitHub Actions publishes the production assets to
GitHub Pages for Framer to fetch. The hero stays a separate native Framer
component above this one.

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
https://withautonomi.github.io/autonomi-roadmap/pr-<PR number>/
```

The workflow creates or updates one bot comment on the PR with that URL when the
repository's Actions token policy allows PR comments. It also writes the URL to
the publish job summary, so a comment permission failure does not block an
otherwise valid preview. Use the URL to review the rendered and styled roadmap
body before deciding whether to request changes, publish, or merge.

Fork PRs do not get a deployed preview or bot comment because those steps require
write permissions. For forks, or if the Pages URL is unavailable, use the uploaded
`roadmap-preview-pr-<PR number>` artifact from the workflow run and open the
included `standalone.html` locally.

PR previews are public when served through GitHub Pages because this repository is
public. Do not put private draft material into same-repo PRs unless it is safe to
expose in a public preview URL.

The preview is only the standalone roadmap body generated from the PR branch's
`content/roadmap.json` and `styles/roadmap.css`. It does not update Framer or the
live `autonomi.com` page. Production changes only after merge to `main`, the
production asset publish workflow completes, and GitHub Pages plus Framer/browser
refresh behavior expose the new files.

If the preview URL 404s immediately after the workflow passes, GitHub Pages may
still be propagating. This delay is usually seconds to a few minutes. If the PR
comment is absent, check the publish job summary for the same URL and confirm
repository Actions workflow token settings permit `issues: write` and
`pull-requests: write`. The artifact remains the fallback preview in either case.

## Production asset publishing

Merges to `main` run the same security, validation, and preview checks, then
publish the approved production assets to GitHub Pages:

- **JSON URL**: `https://withautonomi.github.io/autonomi-roadmap/content/roadmap.json`
- **CSS URL**: `https://withautonomi.github.io/autonomi-roadmap/styles/roadmap.css`
- **Manifest URL**: `https://withautonomi.github.io/autonomi-roadmap/manifest.json`

The manifest records the deployed commit SHA, UTC update timestamp, and asset
paths/URLs. If a merged change is not visible on the Framer page, wait a short
period, hard refresh, and check the manifest URL to confirm which commit GitHub
Pages is serving. GitHub Pages propagation, browser caching, and Framer preview or
publish refresh behavior can all affect when a change becomes visible; normally it
is seconds to a few minutes, but short delays can happen.

jsDelivr is no longer the intended production source for this roadmap body. Treat
GitHub Pages as the production asset host unless a future ADR replaces it.

## Wire it into Framer

### Browser fetch requires public asset URLs

The Framer component fetches `content/roadmap.json` and `styles/roadmap.css` in the visitor's browser. That means the URLs must be publicly reachable without GitHub authentication.

For production, use the public GitHub Pages URLs above. Do not point Framer at private GitHub file URLs; they will return 404 to visitors unless a public delivery path such as GitHub Pages is serving the published assets.

Do not put GitHub tokens or private credentials into the Framer component. Anything in the component runs client-side and would be visible to visitors.

### Use a Framer code component, not an embed

This is intended to be a **Framer code component**.

Do not paste generated roadmap HTML into a Framer HTML embed. The code-component approach renders inline, supports auto height, responds to real page width, and avoids iframe/breakpoint duplication.

What to paste into Framer:

- Paste the full contents of `framer/RoadmapBody.tsx` into a Framer code component.
- Then place that component on the roadmap page.
- The hero/header/intro/site nav/footer remain native Framer content.
- This repo controls only the roadmap body section.

### URLs to use in Framer

Once GitHub Pages production assets are publicly reachable, set these component properties:

- **JSON URL**: `https://withautonomi.github.io/autonomi-roadmap/content/roadmap.json`
- **CSS URL**: `https://withautonomi.github.io/autonomi-roadmap/styles/roadmap.css`

Manual Framer test path:

1. In Framer, create or update a code component using `framer/RoadmapBody.tsx`.
2. Drop the component onto a test page where the roadmap body should appear.
3. Set width **Fill** and height **Auto**.
4. In the component properties, set **JSON URL** and **CSS URL** to the GitHub Pages URLs above, or to whatever public asset URLs you choose.
5. Preview or publish the test page.
6. Confirm the body content renders, resizes across breakpoints, and matches `preview/standalone.html`.

Notes:

1. The intended production delivery path is **GitHub Pages** from the `gh-pages`
   branch, written by GitHub Actions on `main` pushes.
2. jsDelivr is no longer intended as the production source. It may still serve
   public repository files, but its stale-cache behavior is why production moved
   to GitHub Pages.
3. Pin to release-managed URLs in a future workflow if you want changes to go live
   only when you cut a release.

## Known trade-offs (read before going live)

This remains a pragmatic bridge, not a full site rebuild: it lets the roadmap
body on the production website be updated through GitHub, supports rapid updates
and agentic workflows, and preserves Framer's global components. The main
trade-offs are that some styling still has to be coordinated between this repo
and Framer, and because the content is fetched in the browser at load time, it is
**not** in Framer's pre-rendered/static HTML — so it won't be in the initial
paint or indexed by search engines. If SEO on this page matters, the more robust
pattern is a GitHub Action that syncs the content into **Framer CMS** on push
(content stays indexable); ask and we can add that.

## Governance before live use

Before using GitHub Pages URLs on a live public page, protect `main` with required pull requests and CODEOWNERS review for `content/`, `styles/`, `framer/`, `lib/`, and `docs/adr/`.

Anyone with write access can change public roadmap copy and links once Framer points at the GitHub Pages assets, so direct pushes should be reserved for emergencies.

## Keeping the renderer in sync

`lib/render.js` and the renderer block inside `framer/RoadmapBody.tsx` are
intentional mirrors. To make it truly single-source later, publish `render.js`
and have the Framer component import it instead of inlining.
