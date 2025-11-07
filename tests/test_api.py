import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # Reset activities before each test
    for activity in activities.values():
        activity['participants'] = activity['participants'][:2]


def test_signup_success():
    response = client.post("/activities/Chess Club/signup?email=tester@mergington.edu")
    assert response.status_code == 200
    assert "Signed up tester@mergington.edu" in response.json()["message"]
    assert "tester@mergington.edu" in activities["Chess Club"]["participants"]


def test_signup_duplicate():
    email = activities["Chess Club"]["participants"][0]
    response = client.post(f"/activities/Chess Club/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]


def test_signup_activity_not_found():
    response = client.post("/activities/Nonexistent/signup?email=someone@mergington.edu")
    assert response.status_code == 404
    assert "Activity not found" in response.json()["detail"]


def test_unregister_success():
    email = activities["Chess Club"]["participants"][0]
    response = client.post(f"/activities/Chess Club/unregister?email={email}")
    assert response.status_code == 200
    assert f"Removed {email}" in response.json()["message"]
    assert email not in activities["Chess Club"]["participants"]


def test_unregister_not_registered():
    response = client.post("/activities/Chess Club/unregister?email=notfound@mergington.edu")
    assert response.status_code == 400
    assert "not registered" in response.json()["detail"]


def test_unregister_activity_not_found():
    response = client.post("/activities/Nonexistent/unregister?email=someone@mergington.edu")
    assert response.status_code == 404
    assert "Activity not found" in response.json()["detail"]
