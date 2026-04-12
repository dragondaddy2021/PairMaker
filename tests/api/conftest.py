"""
PairMaker API Tests — shared fixtures
"""

import os
import pytest
import httpx
from dotenv import load_dotenv

load_dotenv()

API_BASE = os.getenv("EXPO_PUBLIC_API_BASE_URL", "")
API_STAGE = os.getenv("EXPO_PUBLIC_API_STAGE", "prod")

BASE_URL = f"{API_BASE}/{API_STAGE}" if API_BASE else ""

TEST_EMAIL    = os.getenv("TEST_USER_EMAIL", "test@pairmaker.app")
TEST_PASSWORD = os.getenv("TEST_USER_PASSWORD", "Test1234!")


@pytest.fixture(scope="session")
def api_client():
    """httpx client with base URL."""
    with httpx.Client(base_url=BASE_URL, timeout=15) as client:
        yield client


@pytest.fixture(scope="session")
def auth_token(api_client):
    """Obtain a valid JWT by logging in."""
    res = api_client.post("/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["token"]


@pytest.fixture
def authed_client(api_client, auth_token):
    """httpx client with Authorization header pre-set."""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client
