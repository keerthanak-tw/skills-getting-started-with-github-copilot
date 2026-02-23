import copy
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

import src.app as app_module


client = TestClient(app_module.app)
_snapshot = copy.deepcopy(app_module.activities)


@pytest.fixture(autouse=True)
def reset_activities():
    # Restore the in-memory activities before each test
    app_module.activities.clear()
    app_module.activities.update(copy.deepcopy(_snapshot))
    yield
    app_module.activities.clear()
    app_module.activities.update(copy.deepcopy(_snapshot))


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_duplicate_block():
    activity = "Chess Club"
    email = "tester@example.com"
    path = f"/activities/{quote(activity)}/signup"

    res = client.post(path, params={"email": email})
    assert res.status_code == 200
    assert "Signed up" in res.json().get("message", "")

    # verify participant appears
    res2 = client.get("/activities")
    assert email in res2.json()[activity]["participants"]

    # duplicate attempt
    res_dup = client.post(path, params={"email": email})
    assert res_dup.status_code == 400


def test_unregister():
    activity = "Chess Club"
    existing = "michael@mergington.edu"
    data_before = client.get("/activities").json()
    assert existing in data_before[activity]["participants"]

    path = f"/activities/{quote(activity)}/signup"
    res = client.delete(path, params={"email": existing})
    assert res.status_code == 200

    data_after = client.get("/activities").json()
    assert existing not in data_after[activity]["participants"]
