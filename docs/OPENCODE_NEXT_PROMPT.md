# OpenCode next prompt — Autonomi roadmap shim

Use this with OpenCode from the repo root:

`/Users/jimcollinson/code/autonomi-roadmap`

Use Jim's normal OpenCode/GSD flow:

1. Start in OpenCode planning mode.
2. Have OpenCode produce the plan first.
3. Once the plan is good, hand execution to the GSD-derived orchestrator agent inside OpenCode.
4. Let the orchestrator break down and execute the work.

Suggested interactive start:

```bash
cd /Users/jimcollinson/code/autonomi-roadmap
opencode --title "Autonomi roadmap GitHub/ADR/Framer POC"
```

Then ask OpenCode to enter planning mode and paste everything below this line.

Avoid starting with a one-shot `opencode run` for this task unless Jim explicitly asks for it; this is a multi-step planning + orchestrator workflow.

---

You are helping turn this last-minute Autonomi roadmap shim into a safe, reviewable GitHub-hosted POC.

Read first:

1. `docs/AGENT_BRIEF.md`
2. `README.md`
3. `content/roadmap.json`
4. `framer/RoadmapBody.tsx`
5. `lib/render.js`
6. `build-preview.mjs`

Important context:

- This repo is currently local only.
- Publish it under Jim's GitHub account as `jimcollinson/autonomi-roadmap` unless Jim says otherwise.
- The repo is named `autonomi-roadmap`, not `autonomy-roadmap`.
- Use OpenCode, not Claude Code.
- This is a temporary shim/POC for the Autonomi roadmap page.
- GitHub owns the roadmap body content and section CSS.
- Framer owns the hero/header/intro/site nav/footer.
- The Framer code component fetches JSON + CSS from GitHub/jsDelivr and renders inline, not in an iframe.
- Do not render raw HTML from repo content. Preserve escaping + limited inline Markdown.

Goals:

1. Publish the repo to GitHub under `jimcollinson/autonomi-roadmap`.
2. Add ADRKit-style governance and an ADR for the roadmap-content-shim decision.
3. Add validation so malformed roadmap edits do not blank the live page.
4. Improve the GitHub editing/preview workflow.
5. Prepare for testing in Framer, including a Framer MCP path if available.

Tasks:

## 1. Clean repo state before publishing

- Check `git status`.
- Add `docs/AGENT_BRIEF.md` and this prompt if appropriate.
- Check for stale `.git/*.lock` files; only remove them if no git process is running.
- Remove `.DS_Store` from tracking / add to `.gitignore` if needed.
- Ensure default branch is `main`, unless there is a reason to keep `master`.

## 2. Create GitHub repo and push

Use `gh` if available and authenticated:

```bash
gh repo create jimcollinson/autonomi-roadmap --private --source . --push --description "GitHub-driven roadmap content shim for Autonomi/Framer"
```

If the repo already exists, add/set origin and push.

Use private initially unless Jim explicitly approves public.

## 3. Add ADRKit-style governance

Add:

- `.adr-kit.yaml`
- `.github/workflows/adr-governance.yml`
- `docs/adr/README.md`
- `docs/adr/TEMPLATE.md`
- `docs/adr/TOOLING.md`
- `scripts/adr-governance.py`
- `docs/adr/ADR-0001-roadmap-content-as-github-driven-framer-shim.md`

ADR content should adapt the draft in `docs/AGENT_BRIEF.md`.

Status should be `Proposed` unless Jim explicitly approves `Accepted`. If marking Accepted, note that this is a temporary POC and include exit criteria.

The ADR must capture:

- code component, not HTML embed
- structured JSON + fixed templates, not raw HTML
- runtime fetch tradeoff: no SEO/static export
- jsDelivr/raw GitHub delivery and caching delay
- `@main` vs pinned tag release control
- no baked fallback yet
- duplicated renderer risk
- font dependencies
- governance: write access can alter live copy/links
- JSON Schema + CI validation as safety net
- Framer CMS sync as likely successor when SEO/native CMS matters

Run:

```bash
python3 scripts/adr-governance.py
```

## 4. Add content validation and CI

Add a JSON Schema for `content/roadmap.json`.

Add a validation script that checks:

- JSON parses
- required top-level fields exist
- sections have `id`, `label`, `title`, `tiers`
- tiers have recognised layouts
- cards have at least `title` and `body`
- tags are from allowed set: `protocol`, `app`, `infra`, `tools`
- icons are from allowed set: `live`, `next`, `sandbox`
- links in Markdown are http/https only

Add CI that runs:

```bash
npm run validate
npm run preview
```

Optional but useful: fail if `framer/RoadmapBody.tsx` renderer drifts from `lib/render.js`, or explicitly document the duplication.

## 5. Improve preview workflow

Ensure:

```bash
npm run preview
```

writes `preview/standalone.html` successfully.

Consider a GitHub Pages or Actions artifact preview later, but do not overbuild unless quick.

## 6. Framer integration test

Once GitHub is pushed, compute the URLs:

```text
https://cdn.jsdelivr.net/gh/jimcollinson/autonomi-roadmap@main/content/roadmap.json
https://cdn.jsdelivr.net/gh/jimcollinson/autonomi-roadmap@main/styles/roadmap.css
```

Then test whether the Framer code component can fetch them.

If Framer MCP is available, use it to create/update a test page on autonmomi.com with `framer/RoadmapBody.tsx` and those URLs.

If Framer MCP is not available, produce exact manual Framer instructions:

1. Add/paste `framer/RoadmapBody.tsx` as a code component.
2. Drop it onto a test page.
3. Set width Fill and height Auto.
4. Set JSON URL and CSS URL to the jsDelivr URLs.
5. Preview/publish test page.
6. Confirm body content renders, resizes, and matches `preview/standalone.html`.

## 7. Branch protection / governance

Recommend or configure:

- branch protection on `main`
- required PRs before merge
- CODEOWNERS for `content/`, `styles/`, `framer/`, `lib/`, `docs/adr/`

Do not overcomplicate if this blocks the last-minute test.

## 8. Final report

Return:

- GitHub repo URL
- preview instructions
- Framer test instructions/status
- ADR file path/status
- validation/CI status
- remaining risks
- recommended next step
