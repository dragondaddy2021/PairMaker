import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  private selectors = {
    emailInput:    '~email-input',
    passwordInput: '~password-input',
    loginBtn:      '~login-button',
    registerToggle:'~register-toggle',
    guestBtn:      '~guest-button',
    errorMsg:      '~error-message',
  };

  async fillEmail(email: string) {
    await this.typeText(this.selectors.emailInput, email);
  }

  async fillPassword(password: string) {
    await this.typeText(this.selectors.passwordInput, password);
  }

  async tapLogin() {
    await this.tap(this.selectors.loginBtn);
  }

  async tapRegister() {
    await this.tap(this.selectors.registerToggle);
  }

  async tapGuest() {
    await this.tap(this.selectors.guestBtn);
  }

  async getErrorMessage(): Promise<string> {
    return this.getText(this.selectors.errorMsg);
  }

  async isVisible(): Promise<boolean> {
    return this.isDisplayed(this.selectors.loginBtn);
  }
}
