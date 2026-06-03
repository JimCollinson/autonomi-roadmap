---
id: ADR-0003
title: GitHub Pages production roadmap assets
status: Proposed
date: 2026-06-03
---

# ADR-0003: GitHub Pages production roadmap assets

## Context

The roadmap Framer component currently expects public JSON and CSS assets to be fetched by the visitor's browser. The first production delivery path used jsDelivr URLs against the GitHub repository because jsDelivr provides public CDN delivery, MIME types, and CORS behavior that works from Framer.

That added an extra dependency between GitHub and Framer. It also introduced stale-cache behavior: updates merged to `main` can remain invisible until jsDelivr refreshes or is purged, which is awkward for a roadmap workflow intended to be edited and reviewed through GitHub pull requests.

The desired stack is simpler: GitHub remains the source of truth and automation surface, and Framer remains the page-rendering surface. We should not modify ADR-0002 while making this production publishing change, because ADR-0002 records the pull request preview decision.

## Decision

Publish the production roadmap JSON, CSS, and a small manifest through GitHub Pages whenever changes merge to `main`. The existing GitHub Actions workflow will validate the repository, build the standalone preview, then copy these files to the `gh-pages` branch:

- `content/roadmap.json`
- `styles/roadmap.css`
- `manifest.json`

Framer should use the GitHub Pages production asset URLs:

- `https://jimcollinson.github.io/autonomi-roadmap/content/roadmap.json`
- `https://jimcollinson.github.io/autonomi-roadmap/styles/roadmap.css`
- `https://jimcollinson.github.io/autonomi-roadmap/manifest.json`

Pull request previews remain under `/pr-<number>/` on the same `gh-pages` branch. The workflow should preserve existing preview behavior: pull request build and artifact upload, same-repository `/pr-<number>/` publish, and pull request close cleanup. Using one workflow to write to `gh-pages` reduces the chance that separate deploy workflows clobber each other's files.

ADR-0002 is not modified by this decision.

## Consequences

- Framer no longer needs jsDelivr for the intended production roadmap source; the production path is GitHub Actions publishing to GitHub Pages, then Framer fetching GitHub Pages URLs.
- Production roadmap assets are public. Any content or styling merged to `main` and published to Pages should be safe for public access.
- Updates become visible after the GitHub Actions run completes, GitHub Pages propagates, and Framer/browser caches or refresh behavior allow the new fetches to be observed. This is usually seconds to a few minutes, but short delays can happen.
- The manifest gives humans and agents a lightweight way to check the deployed commit SHA, update time, and asset URLs without adding manifest-driven cache busting to the Framer component yet.
- GitHub Pages limits and availability apply, including public hosting constraints, Pages propagation delay, bandwidth/build limits, and repository Pages configuration.
- The root Pages index can point to both production asset paths and pull request preview paths, making the `gh-pages` branch easier to inspect.

## Alternatives considered

1. **Keep jsDelivr with purge/cache busting.** This preserves the current production URL shape and CDN behavior, but keeps an extra dependency and operational cache-purge step in the editing loop.
2. **Use `raw.githubusercontent.com`.** This removes jsDelivr but is less purpose-built for browser asset delivery, MIME/CORS expectations, and public site use.
3. **Use pinned release, tag, or SHA URLs.** This gives stronger release control and reproducibility, but makes routine roadmap publishing slower because a release/tag/SHA migration step is required for each live update.
4. **Use Framer CMS or manual copy.** This can make content more native to Framer and potentially better for SEO, but it reintroduces manual work or needs a larger Framer API/CMS sync project beyond this production asset change.
5. **Use another host such as Vercel, Netlify, or Cloudflare Pages.** These platforms can serve static assets well, but add another vendor, setup surface, access policy, and possible secrets/installations for a simple GitHub-to-Framer workflow.

## Follow-up / exit criteria

Revisit this decision if GitHub Pages propagation or limits become a practical publishing problem, if the roadmap needs SEO/static rendering through Framer CMS, or if production requires release-pinned assets rather than immediate publish-on-merge behavior.
