"""API — Matching endpoints"""

import pytest


class TestMatching:
    def test_get_matches(self, authed_client):
        """取得配對列表應回傳陣列"""
        res = authed_client.get("/matches")
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_filter_matching(self, authed_client):
        """POST /matches/filter 應回傳篩選後的配對結果"""
        res = authed_client.post("/matches/filter", json={
            "ageRange": [20, 35],
            "gender": "female",
            "maxDistance": 10,
        })
        assert res.status_code == 200
        data = res.json()
        assert "results" in data or isinstance(data, list)

    def test_like_user(self, authed_client):
        """對某個 userId 按讚應回傳 200 或 201"""
        res = authed_client.post("/matches/like", json={"targetUserId": "mock_user_001"})
        assert res.status_code in (200, 201)


class TestPoints:
    def test_get_points_balance(self, authed_client):
        """取得積分餘額"""
        res = authed_client.get("/points/balance")
        assert res.status_code == 200
        data = res.json()
        assert "balance" in data

    def test_redeem_coupon(self, authed_client):
        """兌換優惠券 — 無效代碼應回傳 4xx"""
        res = authed_client.post("/coupons/redeem", json={"code": "INVALID_CODE_XYZ"})
        assert res.status_code in (400, 404, 422)
