"""
PairMaker Mobile E2E — Appium shared fixtures
"""

import os
import pytest
from appium import webdriver
from appium.options import XCUITestOptions, UiAutomator2Options

# ── 環境設定 ──────────────────────────────────────────────────────────────────

APPIUM_HOST = os.getenv("APPIUM_HOST", "http://127.0.0.1:4723")
PLATFORM    = os.getenv("TEST_PLATFORM", "ios")  # ios | android

IOS_APP_PATH     = os.getenv("IOS_APP_PATH", "")      # /path/to/PairMaker.app
ANDROID_APP_PATH = os.getenv("ANDROID_APP_PATH", "")  # /path/to/app-debug.apk

DEVICE_NAME_IOS     = os.getenv("IOS_DEVICE_NAME", "iPhone 15 Pro")
DEVICE_NAME_ANDROID = os.getenv("ANDROID_DEVICE_NAME", "emulator-5554")
IOS_VERSION         = os.getenv("IOS_VERSION", "17.4")
ANDROID_VERSION     = os.getenv("ANDROID_VERSION", "14")

# ── Driver fixtures ───────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def driver():
    """Launch Appium driver for the target platform (session-scoped)."""
    if PLATFORM == "ios":
        opts = XCUITestOptions()
        opts.platform_name          = "iOS"
        opts.platform_version       = IOS_VERSION
        opts.device_name            = DEVICE_NAME_IOS
        opts.app                    = IOS_APP_PATH
        opts.automation_name        = "XCUITest"
        opts.no_reset               = False
        opts.language               = "zh"
        opts.locale                 = "zh_TW"
    else:
        opts = UiAutomator2Options()
        opts.platform_name          = "Android"
        opts.platform_version       = ANDROID_VERSION
        opts.device_name            = DEVICE_NAME_ANDROID
        opts.app                    = ANDROID_APP_PATH
        opts.automation_name        = "UiAutomator2"
        opts.no_reset               = False
        opts.language               = "zh"
        opts.locale                 = "TW"

    d = webdriver.Remote(APPIUM_HOST, options=opts)
    yield d
    d.quit()


@pytest.fixture(autouse=True)
def reset_app_state(driver):
    """Reset app to foreground before each test."""
    driver.activate_app(
        "com.pairmaker.app" if PLATFORM == "android"
        else "com.pairmaker.app"
    )
    yield
