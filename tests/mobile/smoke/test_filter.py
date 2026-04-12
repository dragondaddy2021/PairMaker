"""APP_003 — Dating filter & matching flow"""

import pytest
from appium.webdriver.common.appiumby import AppiumBy


class TestFilter:
    def test_filter_screen_opens(self, driver):
        """首頁按下篩選應開啟 FilterScreen"""
        driver.find_element(AppiumBy.ACCESSIBILITY_ID, "openFilterBtn").click()
        el = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "filterScreen")
        assert el.is_displayed()

    def test_start_matching(self, driver):
        """設定篩選條件後按開始配對，應顯示結果畫面"""
        driver.find_element(AppiumBy.ACCESSIBILITY_ID, "openFilterBtn").click()
        driver.find_element(AppiumBy.ACCESSIBILITY_ID, "ageSliderMin").send_keys("25")
        driver.find_element(AppiumBy.ACCESSIBILITY_ID, "startMatchingBtn").click()

        results = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "resultsScreen")
        assert results.is_displayed(), "應顯示配對結果畫面"
