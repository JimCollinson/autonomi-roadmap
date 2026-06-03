#!/usr/bin/env python3
"""Validate content/roadmap.json for safe Framer roadmap rendering."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


CONTENT_PATH = Path("content/roadmap.json")
SCHEMA_PATH = Path("schemas/roadmap.schema.json")
ALLOWED_TAGS = {"protocol", "app", "infra", "tools"}
ALLOWED_ICONS = {"live", "next", "sandbox"}
ALLOWED_LAYOUTS = {"platforms", "products", "infra", "sandbox", "herocards"}
MARKDOWN_LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")


def is_non_empty_string(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def require(condition: bool, errors: list[str], path: str, message: str) -> None:
    if not condition:
        errors.append(f"{path}: {message}")


def check_markdown_links(text: str, errors: list[str], path: str) -> None:
    for match in MARKDOWN_LINK_RE.finditer(text):
        url = match.group(2)
        if not (url.startswith("http://") or url.startswith("https://")):
            errors.append(f"{path}: Markdown link must use http/https URL: {url}")


def validate(data: Any) -> list[str]:
    errors: list[str] = []
    require(isinstance(data, dict), errors, "$", "must be an object")
    if not isinstance(data, dict):
        return errors

    for field in ("pills", "sections", "footer"):
        require(field in data, errors, "$", f"missing required top-level field {field!r}")

    require(isinstance(data.get("pills"), list), errors, "$.pills", "must be an array")
    require(isinstance(data.get("sections"), list) and bool(data.get("sections")), errors, "$.sections", "must be a non-empty array")
    require(is_non_empty_string(data.get("footer")), errors, "$.footer", "must be a non-empty string")

    if isinstance(data.get("footer"), str):
        check_markdown_links(data["footer"], errors, "$.footer")

    sections = data.get("sections") if isinstance(data.get("sections"), list) else []
    seen_ids: set[str] = set()
    for section_index, section in enumerate(sections):
        section_path = f"$.sections[{section_index}]"
        require(isinstance(section, dict), errors, section_path, "must be an object")
        if not isinstance(section, dict):
            continue
        for field in ("id", "label", "title", "tiers"):
            require(field in section, errors, section_path, f"missing required field {field!r}")
        if is_non_empty_string(section.get("id")):
            if section["id"] in seen_ids:
                errors.append(f"{section_path}.id: duplicate section id {section['id']!r}")
            seen_ids.add(section["id"])
        else:
            errors.append(f"{section_path}.id: must be a non-empty string")
        require(is_non_empty_string(section.get("label")), errors, f"{section_path}.label", "must be a non-empty string")
        require(is_non_empty_string(section.get("title")), errors, f"{section_path}.title", "must be a non-empty string")
        if "icon" in section:
            require(section["icon"] in ALLOWED_ICONS, errors, f"{section_path}.icon", f"must be one of {sorted(ALLOWED_ICONS)}")
        require(isinstance(section.get("tiers"), list) and bool(section.get("tiers")), errors, f"{section_path}.tiers", "must be a non-empty array")

        tiers = section.get("tiers") if isinstance(section.get("tiers"), list) else []
        for tier_index, tier in enumerate(tiers):
            tier_path = f"{section_path}.tiers[{tier_index}]"
            require(isinstance(tier, dict), errors, tier_path, "must be an object")
            if not isinstance(tier, dict):
                continue
            require(tier.get("layout") in ALLOWED_LAYOUTS, errors, f"{tier_path}.layout", f"must be one of {sorted(ALLOWED_LAYOUTS)}")
            require(isinstance(tier.get("cards"), list) and bool(tier.get("cards")), errors, f"{tier_path}.cards", "must be a non-empty array")

            cards = tier.get("cards") if isinstance(tier.get("cards"), list) else []
            for card_index, card in enumerate(cards):
                card_path = f"{tier_path}.cards[{card_index}]"
                require(isinstance(card, dict), errors, card_path, "must be an object")
                if not isinstance(card, dict):
                    continue
                require(is_non_empty_string(card.get("title")), errors, f"{card_path}.title", "must be a non-empty string")
                require(is_non_empty_string(card.get("body")), errors, f"{card_path}.body", "must be a non-empty string")
                if "tag" in card:
                    require(card["tag"] in ALLOWED_TAGS, errors, f"{card_path}.tag", f"must be one of {sorted(ALLOWED_TAGS)}")
                if isinstance(card.get("body"), str):
                    check_markdown_links(card["body"], errors, f"{card_path}.body")

    return errors


def main() -> int:
    if not SCHEMA_PATH.exists():
        print(f"Missing schema: {SCHEMA_PATH}", file=sys.stderr)
        return 1

    try:
        json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"Schema does not parse as JSON: {exc}", file=sys.stderr)
        return 1

    try:
        data = json.loads(CONTENT_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"Roadmap JSON does not parse: {exc}", file=sys.stderr)
        return 1

    errors = validate(data)
    if errors:
        print("Roadmap validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Roadmap validation passed: {CONTENT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
