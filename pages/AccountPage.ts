import { Locator, Page } from '@playwright/test';
import { LogoutPage } from './LogoutPage';

export class AccountPage {
    private readonly page: Page;

    // Locators
    private readonly headingAccount: Locator;
    private readonly lnkLogout: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.headingAccount = page.getByRole('heading', { name: 'My Account', exact: true, level: 1 });
        this.lnkLogout = page.getByRole('link', { name: 'Logout', exact: true }).first();
    }

    /**
     * Verifies that the authenticated My Account page is displayed.
     * @returns Promise<boolean> - True when the account heading is visible
     */
    async isMyAccountPageExists(): Promise<boolean> {
        return this.headingAccount.isVisible();
    }

    /**
     * Verifies that account navigation offers a logout option.
     * @returns Promise<boolean> - True when the logout link is visible
     */
    async isLogoutOptionVisible(): Promise<boolean> {
        return this.lnkLogout.isVisible();
    }

    /**
     * Logs out the authenticated customer.
     * @returns Promise<LogoutPage> - Logout confirmation page object
     */
    async clickLogout(): Promise<LogoutPage> {
        await this.lnkLogout.click();
        return new LogoutPage(this.page);
    }
}
