"""API — Auth endpoints"""

import pytest


class TestAuth:
    def test_login_success(self, api_client):
        import os
        res = api_client.post("/auth/login", json={
            "email": os.getenv("TEST_USER_EMAIL", "test@pairmaker.app"),
            "password": os.getenv("TEST_USER_PASSWORD", "Test1234!"),
        })
        assert res.status_code == 200
        data = res.json()
        assert "token" in data, "回應應包含 token"

    def test_login_wrong_password(self, api_client):
        import os
        res = api_client.post("/auth/login", json={
            "email": os.getenv("TEST_USER_EMAIL", "test@pairmaker.app"),
            "password": "wrong_password",
        })
        assert res.status_code in (401, 403), "錯誤密碼應回傳 4xx"

    def test_get_profile_requires_auth(self, api_client):
        """未帶 token 存取 /users/me 應回傳 401"""
        client_no_auth = api_client
        headers_backup = dict(client_no_auth.headers)
        client_no_auth.headers.pop("Authorization", None)
        res = client_no_auth.get("/users/me")
        assert res.status_code == 401
        # restore
        client_no_auth.headers.update(headers_backup)

    def test_get_profile_with_auth(self, authed_client):
        res = authed_client.get("/users/me")
        assert res.status_code == 200
        data = res.json()
        assert "userId" in data or "id" in data
