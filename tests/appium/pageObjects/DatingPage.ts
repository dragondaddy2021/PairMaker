import { BasePage } from './BasePage';

export class DatingPage extends BasePage {
  private selectors = {
    filterBtn:       '~filter-button',
    resultsTab:      '~results-tab',
    userCard:        '~user-card',
    likeBtn:         '~like-button',
    passBtn:         '~pass-button',
    mapTab:          '~map-tab',
    searchBar:       '~search-input',
    noResultsText:   '~no-results',
  };

  async tapFilter() {
    await this.tap(this.selectors.filterBtn);
  }

  async tapResultsTab() {
    await this.tap(this.selectors.resultsTab);
  }

  async tapMapTab() {
    await this.tap(this.selectors.mapTab);
  }

  async getUserCardCount(): Promise<number> {
    const cards = await $$(this.selectors.userCard);
    return cards.length;
  }

  async tapFirstLike() {
    await this.tap(this.selectors.likeBtn);
  }

  async tapFirstPass() {
    await this.tap(this.selectors.passBtn);
  }

  async hasResults(): Promise<boolean> {
    return this.isDisplayed(this.selectors.userCard);
  }

  async hasNoResults(): Promise<boolean> {
    return this.isDisplayed(this.selectors.noResultsText);
  }
}
