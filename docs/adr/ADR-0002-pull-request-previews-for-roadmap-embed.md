---
id: ADR-0002
title: Pull request previews for the roadmap embed
status: Proposed
date: 2026-06-03
---

# ADR-0002: Pull request previews for the roadmap embed

## Context

Roadmap content and style changes are hard to review as raw JSON, CSS, or Git diffs. A reviewer can check syntax and individual text changes that way, but cannot easily judge the rendered hierarchy, spacing, responsive card layout, link treatment, or overall readability of the roadmap body.

This matters especially for agentic content and style updates. OpenCode or another coding agent can submit a syntactically valid pull request that still reads poorly, creates visual regressions, or changes the balance of the Live / Next / Sandbox sections. Humans need a rendered, styled preview of the roadmap body before deciding whether to revise, publish, or merge.

The preview should not touch Framer or autonomi.com. Production remains governed by the existing Framer code component and the `@main` jsDelivr URLs described in ADR-0001. Pull request previews are a review aid for candidate branch content and CSS, not a publishing path for the live site.

## Decision

Generate a standalone roadmap preview for each pull request by running the existing security tests, roadmap validation, and `npm run preview` against the pull request candidate. Upload `preview/standalone.html` as a workflow artifact for every pull request so reviewers always have a fallback preview file attached to the check run.

For same-repository pull requests only, publish the generated standalone preview to GitHub Pages under `/pr-<PR number>/` and create or update a single bot comment on the pull request with the preview URL when repository token settings allow it. The publish job must also expose the preview URL in the job summary so comment permission failures do not block an otherwise valid preview. The published file is the standalone roadmap body preview generated from that PR branch's JSON and CSS.

Fork pull requests do not get privileged deploy or comment steps. They still run the normal build, validation, security checks, and artifact upload using the `pull_request` event, but they do not receive write-token deployment or comment permissions.

When a pull request closes, remove `/pr-<PR number>/` from the Pages branch using a trusted cleanup path. If `pull_request_target` is used for cleanup, it must not check out or execute pull request code; it should only operate on the trusted Pages branch and remove the generated preview directory.

Production Framer stays pointed at the `@main` jsDelivr assets. Merging to `main` remains the only path that can affect the live roadmap body. PR previews are public review surfaces, not a staging Framer page and not a replacement for branch protection or CODEOWNERS review.

Security policy: do not run untrusted fork pull request code with write permissions. Build and validation run on `pull_request` with read-only contents access. Only same-repository pull requests get Pages deployment and PR-comment writes, requested with least-privilege `contents: write`, `issues: write`, and `pull-requests: write` job permissions. If repository policy still blocks PR comments, the comment step is non-blocking and reviewers use the job-summary URL or artifact fallback. Any `pull_request_target` use is limited to trusted cleanup work and must not check out or execute pull request code.

## Consequences

- Reviewers can inspect the rendered roadmap body before merge, including candidate JSON content and CSS from the pull request branch.
- Agentic edits become easier to assess because reviewers can judge the output rather than relying on raw diffs alone.
- Same-repo pull requests get a convenient URL in the publish job summary and, when permitted, in a stable PR comment; fork pull requests keep a safer artifact/checks-only workflow.
- Preview artifacts provide a fallback if GitHub Pages is not enabled, is still propagating, or fails to serve the preview URL.
- Because this repository is public, deployed PR previews are public too. Draft roadmap copy, links, and styling in same-repo PRs must be treated as publicly visible once the preview workflow publishes them.
- GitHub Pages setup, the `gh-pages` branch, preview comment updates, and closed-PR cleanup are additional moving parts that can fail independently of validation; comment updates are non-blocking because the summary URL and artifact remain available.
- The preview shows the standalone roadmap embed/body, not the full Framer page with its native hero, navigation, footer, and surrounding site context.
- The live Framer page is unchanged until a pull request merges to `main` and jsDelivr serves the updated `@main` assets.
- jsDelivr cache propagation for production remains a separate operational concern; PR previews do not prove that the production CDN cache has refreshed.

## Alternatives considered

1. **Review raw JSON, CSS, and diffs only.** This has the lowest tooling cost and works for small textual changes, but it has poor human readability and gives no styled rendering. It is too easy to miss layout regressions, awkward section balance, or visual issues introduced by a valid diff.
2. **Publish a draft or staging Framer page.** This would be the most representative review environment because it could include the full site context around the roadmap body. It is more long-winded, requires Framer setup, Framer API or manual work, and increases risk to site workflows that this repository is deliberately avoiding for the POC.
3. **Artifact-only preview.** This is safer and simpler because it avoids Pages deployment and PR comments. The downside is reviewer UX: humans must find the workflow run, download the artifact, and open the file locally for every update. That friction is likely to reduce actual preview usage.
4. **External deploy platforms such as Netlify, Vercel, or Cloudflare Pages.** These can provide polished preview URLs and richer deployment features, but they introduce another vendor, access setup, secrets or installation management, and operational surface area for a simple static preview.

## Follow-up / exit criteria

Keep this decision under review as the roadmap publishing workflow matures.

Revisit it if any of these become true:

- GitHub Pages is not enabled for the repository or cannot serve the `gh-pages` branch without a settings change.
- Public PR previews become inappropriate for draft roadmap work.
- Reviewers need the full Framer page context rather than the standalone roadmap body.
- Fork PR review UX becomes important enough to justify a separate, safer preview mechanism.
- Production moves away from Framer fetching `@main` jsDelivr assets, making these previews no longer representative of the reviewed body section.
