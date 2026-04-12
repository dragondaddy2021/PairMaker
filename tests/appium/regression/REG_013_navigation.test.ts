/**
 * REG_013 — Tab Bar 導航回歸
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[REG_013] Tab Bar 導航', () => {
  const loginPage = new LoginPage();

  before(async () => {
    await loginPage.tapGuest();
  });

  const tabs = [
    { key: '~dating-tab',  screen: '~dating-screen'  },
    { key: '~map-tab',     screen: '~map-view'       },
    { key: '~couple-tab',  screen: '~couple-home'    },
    { key: '~mine-tab',    screen: '~profile-screen' },
  ];

  for (const { key, screen } of tabs) {
    it(`REG_013: ${key} 應切換到對應頁面`, async () => {
      const tab = await $(key);
      await tab.waitForDisplayed({ timeout: 4000 });
      await tab.click();
      const s = await $(screen);
      await s.waitForDisplayed({ timeout: 5000 });
      expect(await s.isDisplayed()).toBe(true);
    });
  }
});
