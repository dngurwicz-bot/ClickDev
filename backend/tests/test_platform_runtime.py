from fastapi import HTTPException

from backend.services.platform_runtime import ensure_transition


def test_ensure_transition_allows_valid_change():
    allowed = {"draft": ["in_progress", "cancelled"]}
    result = ensure_transition("draft", "in_progress", allowed, "workflow")
    assert result == "in_progress"


def test_ensure_transition_rejects_invalid_change():
    allowed = {"draft": ["in_progress", "cancelled"]}
    try:
        ensure_transition("draft", "completed", allowed, "workflow")
        assert False, "Expected HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 422
        assert "invalid transition" in str(exc.detail)
