"""APP_001 — App launch & login screen visibility"""

import pytest
from appium.webdriver.common.appiumby import AppiumBy


class TestLaunch:
    def test_login_screen_visible(self, driver):
        """啟動後應看到登入畫面"""
        el = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "loginScreen")
        assert el.is_displayed(), "登入畫面未顯示"

    def test_logo_present(self, driver):
        """PairMaker logo 應存在"""
        el = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "appLogo")
        assert el.is_displayed()
