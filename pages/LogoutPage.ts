import { Locator, Page } from '@playwright/test';
import { HomePage } from './HomePage';

export class LogoutPage {
    private readonly page: Page;

    // Locators
    private readonly headingLogout: Locator;
    private readonly lnkContinue: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.headingLogout = page.getByRole('heading', { name: 'Account Logout', exact: true });
        this.lnkContinue = page.getByRole('link', { name: 'Continue', exact: true }).first();
    }

    /**
     * Verifies that the logout confirmation page is displayed.
     * @returns Promise<boolean> - True when the logout heading is visible
     */
    async isLogoutPageExists(): Promise<boolean> {
        await this.headingLogout.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Continues to the store homepage after logout.
     * @returns Promise<HomePage> - Store homepage object
     */
    async clickContinue(): Promise<HomePage> {
        await this.lnkContinue.click();
        return new HomePage(this.page);
    }
}
