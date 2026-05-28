"""
DermAI Backend Test Suite
"""
import pytest
import json
from app import create_app
from app.database.db import db as _db


@pytest.fixture(scope="session")
def app():
    """Create Flask test application."""
    test_app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "JWT_SECRET_KEY": "test-jwt-secret",
        "MOCK_INFERENCE": True,
        "UPLOAD_FOLDER": "/tmp/dermai_test_uploads",
    })

    with test_app.app_context():
        _db.create_all()
        yield test_app
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    """Register and login a test user, return auth headers."""
    # Register
    client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "test@dermai.ai",
        "password": "testpass123",
    })
    # Login
    resp = client.post("/api/auth/login", json={
        "email": "test@dermai.ai",
        "password": "testpass123",
    })
    data = resp.get_json()
    token = data.get("token", "")
    return {"Authorization": f"Bearer {token}"}


class TestHealth:
    def test_health_check(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.get_json()
        assert data["status"] == "ok"


class TestAuth:
    def test_register(self, client):
        resp = client.post("/api/auth/register", json={
            "name": "Jane Doe",
            "email": "jane@dermai.ai",
            "password": "securepass123",
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert "token" in data
        assert data["user"]["email"] == "jane@dermai.ai"

    def test_register_duplicate_email(self, client):
        client.post("/api/auth/register", json={
            "name": "Dup User",
            "email": "dup@dermai.ai",
            "password": "testpass123",
        })
        resp = client.post("/api/auth/register", json={
            "name": "Dup User 2",
            "email": "dup@dermai.ai",
            "password": "testpass123",
        })
        assert resp.status_code == 409

    def test_register_missing_fields(self, client):
        resp = client.post("/api/auth/register", json={"email": "x@y.com"})
        assert resp.status_code == 422

    def test_login_valid(self, client, auth_headers):
        resp = client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert "user" in data

    def test_login_invalid(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "nobody@dermai.ai",
            "password": "wrongpass",
        })
        assert resp.status_code == 401

    def test_me_no_auth(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401


class TestHistory:
    def test_history_empty(self, client, auth_headers):
        resp = client.get("/api/history", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert "predictions" in data
        assert isinstance(data["predictions"], list)

    def test_history_no_auth(self, client):
        resp = client.get("/api/history")
        assert resp.status_code == 401


class TestChat:
    def test_chat(self, client, auth_headers):
        resp = client.post("/api/chat", json={
            "message": "What is eczema?",
            "messages": [],
        }, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.get_json()
        assert "reply" in data
        assert len(data["reply"]) > 0
