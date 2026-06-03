#!/usr/bin/env python3
"""Lightweight ADRKit-style governance checks for docs/adr."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ADR_DIR = Path("docs/adr")
FILENAME_RE = re.compile(r"^ADR-(\d{4})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$")
ALLOWED_STATUSES = {"Proposed", "Accepted", "Superseded", "Deprecated"}
REQUIRED_FRONTMATTER = {"id", "title", "status", "date"}
REQUIRED_HEADINGS = [
    "## Context",
    "## Decision",
    "## Consequences",
    "## Alternatives considered",
    "## Follow-up / exit criteria",
]


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}
    frontmatter: dict[str, str] = {}
    for line in text[4:end].splitlines():
        if not line.strip() or line.strip().startswith("#"):
            continue
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        frontmatter[key.strip()] = value.strip().strip('"')
    return frontmatter


def check_adr(path: Path) -> list[str]:
    errors: list[str] = []
    match = FILENAME_RE.match(path.name)
    if not match:
        errors.append("filename must match ADR-000N-kebab-title.md")

    text = path.read_text(encoding="utf-8")
    frontmatter = parse_frontmatter(text)
    missing = sorted(REQUIRED_FRONTMATTER - set(frontmatter))
    if missing:
        errors.append("missing frontmatter: " + ", ".join(missing))

    status = frontmatter.get("status")
    if status and status not in ALLOWED_STATUSES:
        errors.append(f"status {status!r} is not one of {', '.join(sorted(ALLOWED_STATUSES))}")

    if match and frontmatter.get("id") and frontmatter["id"] != f"ADR-{match.group(1)}":
        errors.append(f"frontmatter id {frontmatter['id']!r} does not match filename")

    for heading in REQUIRED_HEADINGS:
        if heading not in text:
            errors.append(f"missing required heading: {heading}")

    return errors


def main() -> int:
    adr_files = sorted(ADR_DIR.glob("ADR-*.md"))
    if not adr_files:
        print("No ADR files found", file=sys.stderr)
        return 1

    failures: list[str] = []
    for path in adr_files:
        errors = check_adr(path)
        if errors:
            failures.append(f"{path}:\n  - " + "\n  - ".join(errors))

    if failures:
        print("ADR governance failed:\n" + "\n".join(failures), file=sys.stderr)
        return 1

    print(f"ADR governance passed ({len(adr_files)} ADR file(s))")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
