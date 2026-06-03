# ADR tooling

`scripts/adr-governance.py` provides the local and CI check for ADR files.

It verifies:

- ADR filenames match `ADR-000N-kebab-title.md`.
- Required frontmatter fields exist.
- Status is one of `Proposed`, `Accepted`, `Superseded`, or `Deprecated`.
- Required headings are present.
- ADR numeric IDs match their filenames.

Run it locally with:

```bash
python3 scripts/adr-governance.py
```

CI runs the same command on ADR-related pull requests and pushes to `main`.
