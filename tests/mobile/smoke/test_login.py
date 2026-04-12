"""APP_002 — Login flow (email + password)"""

import os
import pytest
from appium.webdriver.common.appiumby import AppiumBy

TEST_EMAIL    = os.getenv("TEST_USER_EMAIL", "test@pairmaker.app")
TEST_PASSWORD = os.getenv("TEST_USER_PASSWORD", "Test1234!")


class TestLogin:
    def test_login_success(self, driver):
        """有效帳號應成功登入並進入首頁"""
        driver.find_element(AppiumBy.ACCESSIBILITY_ID, "emailInput").send_keys(TEST_EMAIL)
        driver.find_element(AppiumBy.ACCESSIBILITY_ID, "passwordInput").send_keys(TEST_PASSWORD)
        driver.find_element(AppiumBy.ACCESSIBILITY_ID, "loginButton").click()

        home = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "homeScreen")
        assert home.is_displayed(), "登入後應顯示首頁"

    def test_invalid_password_shows_error(self, driver):
        """錯誤密碼應顯示錯誤提示"""
        driver.find_element(AppiumBy.ACCESSIBILITY_ID, "emailInput").send_keys(TEST_EMAIL)
        driver.find_element(AppiumBy.ACCESSIBILITY_ID, "passwordInput").send_keys("WrongPass!")
        driver.find_element(AppiumBy.ACCESSIBILITY_ID, "loginButton").click()

        err = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "loginError")
        assert err.is_displayed(), "應顯示登入錯誤訊息"
