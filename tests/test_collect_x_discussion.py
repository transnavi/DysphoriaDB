from collectors.fxtwitter import CollectionError
from scripts.collect_x_discussion import collect_pages


def test_collect_pages_reports_provider_end() -> None:
    def fetch(post_id: str, *, cursor: str | None = None) -> dict:
        assert post_id == "1"
        assert cursor is None
        return {"replies": [{"id": "2"}], "cursor": {}}

    result = collect_pages(fetch, "1", "replies", 3)
    assert [item["id"] for item in result.records] == ["2"]
    assert result.status == "complete"
    assert result.terminal_reason == "provider_end"


def test_collect_pages_reports_page_limit_with_resume_cursor() -> None:
    def fetch(post_id: str, *, cursor: str | None = None) -> dict:
        return {
            "replies": [{"id": str(cursor or "first")}],
            "cursor": {"bottom": "next" if cursor is None else "after-next"},
        }

    result = collect_pages(fetch, "1", "replies", 2)
    assert result.status == "partial"
    assert result.terminal_reason == "page_limit"
    assert result.next_cursor == "after-next"


def test_collect_pages_reports_cursor_cycle() -> None:
    def fetch(post_id: str, *, cursor: str | None = None) -> dict:
        return {"results": [], "cursor": {"bottom": "same"}}

    result = collect_pages(fetch, "1", "results", 3)
    assert result.status == "partial"
    assert result.terminal_reason == "cursor_cycle"
    assert result.pages_completed == 2


def test_collect_pages_records_later_failure() -> None:
    def fetch(post_id: str, *, cursor: str | None = None) -> dict:
        if cursor:
            raise CollectionError("provider timeout")
        return {"replies": [{"id": "2"}], "cursor": {"bottom": "next"}}

    result = collect_pages(fetch, "1", "replies", 3)
    assert result.status == "partial"
    assert result.terminal_reason == "request_failed"
    assert result.pages_attempted == 2
    assert result.pages_completed == 1
    assert result.failures == ["provider timeout"]
