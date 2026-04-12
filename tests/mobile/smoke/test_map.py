"""APP_004 — Map screen & navigation"""

import pytest
from appium.webdriver.common.appiumby import AppiumBy


class TestMap:
    def test_map_screen_loads(self, driver):
        """地圖頁應能載入並顯示定位"""
        driver.find_element(AppiumBy.ACCESSIBILITY_ID, "mapTab").click()
        el = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "mapScreen")
        assert el.is_displayed()

    def test_place_card_opens(self, driver):
        """點擊地點應顯示詳情卡片"""
        driver.find_element(AppiumBy.ACCESSIBILITY_ID, "mapTab").click()
        places = driver.find_elements(AppiumBy.ACCESSIBILITY_ID, "placeListItem")
        assert len(places) > 0, "應有地點列表"
        places[0].click()
        card = driver.find_element(AppiumBy.ACCESSIBILITY_ID, "placeDetailCard")
        assert card.is_displayed()
