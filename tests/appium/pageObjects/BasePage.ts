import { $ , $$ } from '@wdio/globals';

export class BasePage {
  protected async waitForVisible(selector: string, timeout = 10000) {
    const el = await $(selector);
    await el.waitForDisplayed({ timeout });
    return el;
  }

  protected async tap(selector: string) {
    const el = await this.waitForVisible(selector);
    await el.click();
  }

  protected async typeText(selector: string, text: string) {
    const el = await this.waitForVisible(selector);
    await el.clearValue();
    await el.setValue(text);
  }

  protected async getText(selector: string): Promise<string> {
    const el = await this.waitForVisible(selector);
    return el.getText();
  }

  protected async isDisplayed(selector: string): Promise<boolean> {
    try {
      const el = await $(selector);
      return el.isDisplayed();
    } catch {
      return false;
    }
  }

  protected async scrollDown() {
    await driver.execute('mobile: scroll', { direction: 'down' });
  }

  protected async waitForMs(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
