# Architecture Decision Records

This directory records important architecture and governance decisions for the Autonomi roadmap content shim.

ADRs are intentionally lightweight and ADRKit-style:

1. Copy `TEMPLATE.md`.
2. Name the file `ADR-000N-short-kebab-title.md`.
3. Use frontmatter with `id`, `title`, `status`, and `date`.
4. Start new decisions as `Proposed` until reviewed.
5. Run `python3 scripts/adr-governance.py` before merging.

The current roadmap shim is a temporary POC. Successor decisions should explicitly say whether they keep this shim, replace it with Framer CMS sync, or consolidate styling into Framer.
