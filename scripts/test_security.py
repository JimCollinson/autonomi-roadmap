#!/usr/bin/env python3
from copy import deepcopy
import importlib.util
from pathlib import Path


module_path = Path(__file__).with_name("validate-roadmap.py")
spec = importlib.util.spec_from_file_location("validate_roadmap", module_path)
validate_roadmap = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(validate_roadmap)


def valid_data():
    return {
        "pills": [{"label": "Live", "href": "https://example.com/#live", "style": "is-live"}],
        "sections": [
            {
                "id": "live",
                "label": "Live",
                "title": "Running today",
                "icon": "live",
                "tiers": [
                    {
                        "layout": "products",
                        "cards": [{"title": "Card", "body": "[ok](https://example.com)"}],
                    }
                ],
            }
        ],
        "footer": "Footer",
    }


def assert_invalid(mutator, expected):
    data = valid_data()
    mutator(data)
    errors = validate_roadmap.validate(data)
    assert any(expected in error for error in errors), errors


assert validate_roadmap.validate(valid_data()) == []
assert_invalid(lambda data: data["pills"][0].update({"href": "javascript:alert(1)"}), "$.pills[0].href")
assert_invalid(lambda data: data["pills"][0].update({"href": "data:text/html,evil"}), "$.pills[0].href")
assert_invalid(lambda data: data["sections"][0].update({"id": "Not Safe"}), "$.sections[0].id")
assert_invalid(lambda data: data.update({"extra": True}), "$.extra: unknown field")
assert_invalid(lambda data: data["sections"][0]["tiers"][0]["cards"][0].update({"extra": True}), "unknown field")
assert_invalid(lambda data: data["pills"][0].update({"style": "is-evil"}), "$.pills[0].style")
assert_invalid(lambda data: data["sections"][0].pop("icon"), "missing required field 'icon'")
assert_invalid(lambda data: data["sections"][0]["tiers"][0]["cards"][0].update({"body": "[bad](javascript:alert(1))"}), "Markdown link must use http/https URL")

print("security validation tests passed")
