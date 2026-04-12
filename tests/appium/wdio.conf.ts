import type { Options } from '@wdio/types';

const isAndroid = process.env.PLATFORM !== 'ios';

export const config: Options.Testrunner = {
  runner: 'local',
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: { project: './tsconfig.json', transpileOnly: true },
  },

  specs: [
    './tests/appium/**/*.test.ts',
  ],

  exclude: [],

  maxInstances: 1,

  capabilities: [isAndroid ? {
    platformName:          'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName':   process.env.ANDROID_DEVICE ?? 'emulator-5554',
    'appium:app':          process.env.APP_PATH ?? './android/app/build/outputs/apk/release/app-release.apk',
    'appium:appPackage':   'com.pairmaker.app',
    'appium:appActivity':  '.MainActivity',
    'appium:noReset':      false,
  } : {
    platformName:            'iOS',
    'appium:automationName': 'XCUITest',
    'appium:deviceName':     process.env.IOS_DEVICE ?? 'iPhone 15',
    'appium:platformVersion': process.env.IOS_VERSION ?? '17.0',
    'appium:app':             process.env.APP_PATH ?? './ios/build/PairMaker.app',
    'appium:bundleId':        'com.pairmaker.app',
    'appium:noReset':         false,
  }],

  logLevel: 'info',
  bail: 0,
  baseUrl: '',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: ['appium'],
  appium: {
    command: 'appium',
    args: { relaxedSecurity: true },
  },

  framework: 'mocha',
  reporters: [
    'spec',
    ['allure', {
      outputDir:       'allure-results',
      disableWebdriverStepsReporting: false,
      disableWebdriverScreenshotsReporting: false,
    }],
  ],

  mochaOpts: {
    ui:      'bdd',
    timeout: 60000,
  },

  afterTest: async (_test, _ctx, { error }) => {
    if (error) {
      await driver.takeScreenshot();
    }
  },
};
