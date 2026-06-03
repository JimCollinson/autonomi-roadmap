---
id: ADR-0001
title: Roadmap content as a GitHub-driven Framer shim
status: Proposed
date: 2026-06-03
---

# ADR-0001: Roadmap content as a GitHub-driven Framer shim

## Context

The Autonomi roadmap page needs frequent body-content updates by team members and coding agents. Direct edits in Framer are slow for this workflow, and pasting generated HTML into a Framer HTML embed created brittle breakpoint duplication, fixed-height iframe issues, weak review history, and poor maintainability.

The POC needs to be liveable within hours while preserving a clear boundary: GitHub owns the roadmap body content, section CSS, fonts, and responsive layout; Framer keeps the hero/header/intro, site navigation, and footer.

## Decision

Store the roadmap body content in `content/roadmap.json` and the section styling in `styles/roadmap.css`. A fixed Framer code component, `framer/RoadmapBody.tsx`, fetches the JSON and CSS at runtime from GitHub/jsDelivr and renders the body inline in the page.

This is a code component, not an HTML embed or iframe. Inline rendering gives the section normal page width behaviour, auto-height, and real viewport reflow.

Content is structured JSON rendered through fixed templates, not raw HTML. Card bodies allow only limited inline Markdown (`**bold**`, `*italic*`, `` `code` ``, and HTTP/HTTPS Markdown links). Text is escaped before Markdown is applied, so repository write access cannot inject arbitrary markup or scripts.

For the initial integration, URLs should use jsDelivr on `@main`:

- `https://cdn.jsdelivr.net/gh/jimcollinson/autonomi-roadmap@main/content/roadmap.json`
- `https://cdn.jsdelivr.net/gh/jimcollinson/autonomi-roadmap@main/styles/roadmap.css`

Using `@main` means approved merges publish automatically after CDN propagation. A pinned tag or commit can replace `@main` when release control matters more than speed.

## Consequences

- Team members and agents can edit roadmap copy and section styles in GitHub with review history.
- Local preview via `npm run preview` gives a Framer-free check before publishing.
- The code component avoids the iframe sizing and breakpoint issues of HTML embeds.
- Runtime fetch means the roadmap body is not part of Framer's static/pre-rendered HTML, so it has no static-export SEO value, may not be indexed reliably, and can show a loading/error state before content arrives.
- jsDelivr provides steadier MIME/CORS behaviour than raw GitHub URLs, but it caches aggressively. Edits can take time to propagate unless the cache is purged or a different pinned ref is used.
- There is no baked last-known-good fallback yet. Fetch failure currently shows an error message rather than rendering a bundled copy.
- The renderer is duplicated between `lib/render.js` and `framer/RoadmapBody.tsx`. This is acceptable for the POC but creates drift risk until the component imports a single shared renderer.
- Font loading depends on external font URLs, including Framer-hosted Method v0.1 assets and Google-hosted Inter/IBM Plex Mono. Those dependencies can change or fail independently of this repo.
- Governance matters because anyone or any agent with write access can alter live public copy and links, even though raw HTML injection is blocked.
- JSON Schema, content validation, preview generation, CI checks, branch protection, and CODEOWNERS are the safety net for repeated rapid edits.

## Alternatives considered

- HTML pasted into a Framer embed: rejected because it is brittle, hard to review, duplicated across breakpoints, and suffers fixed iframe height/responsiveness problems.
- Raw HTML stored in GitHub and rendered by Framer: rejected because repo write access would become stored-XSS capability without a sanitizer.
- Pinned tag/commit delivery from day one: deferred because `@main` better fits the POC goal of fast repeated editing. Pinning remains the likely release-control option once the workflow stabilises.
- Baked fallback content inside the component: deferred to keep the POC small. Add it if the live page needs graceful CDN/network failure behaviour.
- Framer CMS with a GitHub Action sync: deferred because it needs more setup than the POC timeline allows, but it is the likely successor when SEO, native CMS editing, or static export matters.
- Move all styling into Framer and keep only content in GitHub: deferred until the design/system boundary is clearer.

## Follow-up / exit criteria

Treat this decision as a temporary POC, not the final site architecture.

Revisit or replace it when any of these become true:

- The roadmap page needs SEO/indexable static content.
- Framer-native editing or CMS workflows become more important than GitHub-first agent edits.
- CDN propagation delays create publishing confusion.
- Renderer drift between preview and component causes defects.
- A release-control process requires pinned tags instead of `@main`.
- The team is ready to sync GitHub content into Framer CMS via GitHub Actions.
