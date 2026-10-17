import sys
import os

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# The legacy agent scaffold under backend/app/ is optional and requires Pillow
# (PIL), which is not part of the LegalSathi requirements. Skip this test when
# either the scaffold or its dependencies are unavailable, so the rest of the
# suite (and CI) still runs cleanly.
pytest.importorskip("PIL", reason="backend/app/ scaffold requires Pillow (not installed)")
pytest.importorskip("app.main", reason="legacy backend/app/ scaffold not available")

from app.database import engine, Base
from app.main import app

# Drop & Recreate database tables for clean test
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def test_agent_orchestrator_flow():
    # 1. Register User & Create Channel
    reg_res = client.post("/api/auth/register", json={
        "email": "agenttest@bharattoon.ai",
        "password": "Password123!",
        "full_name": "Autonomous Creator"
    })
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    chan_res = client.post("/api/channels/", json={
        "channel_name": "BharatToon AI Channel",
        "niche": "Indian History + Culture"
    }, headers=headers)
    channel_id = chan_res.json()["id"]

    # 2. Start Autonomous Agent Cycle
    start_res = client.post(f"/api/agent/start/{channel_id}", headers=headers)
    assert start_res.status_code == 200
    res_data = start_res.json()
    assert res_data["status"] == "success"
    assert "details" in res_data
    assert res_data["details"]["quality_score"] >= 90.0

    # 3. Check Agent Status
    status_res = client.get(f"/api/agent/status/{channel_id}", headers=headers)
    assert status_res.status_code == 200
    st_data = status_res.json()
    assert st_data["videos_created_today"] >= 1

    # 4. Check Agent Live Event Stream
    events_res = client.get(f"/api/agent/events/{channel_id}", headers=headers)
    assert events_res.status_code == 200
    events_list = events_res.json()
    assert len(events_list) >= 5
    event_types = [e["event_type"] for e in events_list]
    assert "TOPIC_SELECTED" in event_types
    assert "CONTENT_PUBLISHED" in event_types

    # 5. Pause & Resume Agent
    pause_res = client.post(f"/api/agent/pause/{channel_id}", headers=headers)
    assert pause_res.status_code == 200
    assert pause_res.json()["is_paused"] is True

    resume_res = client.post(f"/api/agent/resume/{channel_id}", headers=headers)
    assert resume_res.status_code == 200
    assert resume_res.json()["is_paused"] is False
