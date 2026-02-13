"""Unit tests for CLICK temporal behavior helpers."""
from datetime import date

from backend.services.click_actions import ClickActionService


def test_find_covering_row_returns_active_interval():
    rows = [
        {"id": "a", "valid_from": "2025-01-01", "valid_to": "2025-01-31"},
        {"id": "b", "valid_from": "2025-02-01", "valid_to": None},
    ]
    covering = ClickActionService._find_covering_row(rows, date(2025, 1, 15))
    assert covering is not None
    assert covering["id"] == "a"


def test_next_future_start_returns_closest_future():
    rows = [
        {"id": "a", "valid_from": "2025-01-01", "valid_to": "2025-01-31"},
        {"id": "b", "valid_from": "2025-03-01", "valid_to": None},
        {"id": "c", "valid_from": "2025-02-01", "valid_to": "2025-02-28"},
    ]
    next_future = ClickActionService._next_future_start(rows, date(2025, 1, 20))
    assert next_future == date(2025, 2, 1)
