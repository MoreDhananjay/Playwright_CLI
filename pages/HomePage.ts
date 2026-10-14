import { Locator, Page } from '@playwright/test';

export class HomePage {
    private readonly page: Page;

    // Locators
    private readonly btnMyAccount: Locator;
    private readonly lnkLogin: Locator;
    private readonly lnkRegister: Locator;
    private readonly lnkLogout: Locator;
    private readonly txtSearch: Locator;
    private readonly lnkShoppingCart: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.btnMyAccount = page.getByRole('button', { name: 'My Account', exact: true });
        this.lnkLogin = page.getByRole('link', { name: 'Login', exact: true }).first();
        this.lnkRegister = page.getByRole('link', { name: 'Register', exact: true }).first();
        this.lnkLogout = page.getByRole('link', { name: 'Logout', exact: true });
        this.txtSearch = page.getByRole('textbox', { name: 'Search' });
        this.lnkShoppingCart = page.getByRole('link', { name: 'Shopping Cart', exact: true }).first();
    }

    /**
     * Opens the My Account menu.
     */
    async clickMyAccount(): Promise<void> {
        await this.btnMyAccount.click();
    }

    /**
     * Verifies that the account menu offers the login option.
     * @returns Promise<boolean> - True when the login link is visible
     */
    async isLoginOptionVisible(): Promise<boolean> {
        return this.lnkLogin.isVisible();
    }

    /**
     * Verifies that the account menu offers the registration option.
     * @returns Promise<boolean> - True when the register link is visible
     */
    async isRegisterOptionVisible(): Promise<boolean> {
        return this.lnkRegister.isVisible();
    }

    /**
     * Verifies that authenticated navigation is no longer available.
     * @returns Promise<boolean> - True when a logout link is visible
     */
    async isLogoutOptionVisible(): Promise<boolean> {
        return this.lnkLogout.first().isVisible();
    }

    /**
     * Navigates to the login page.
     */
    async clickLogin(): Promise<void> {
        await this.clickMyAccount();
        await this.lnkLogin.click();
    }

    /**
     * Navigates to the registration page.
     */
    async clickRegister(): Promise<void> {
        await this.clickMyAccount();
        await this.lnkRegister.click();
    }

    /**
     * Searches for a product by name.
     * @param productName - Product name to search for
     */
    async searchProduct(productName: string): Promise<void> {
        await this.txtSearch.fill(productName);
        await this.txtSearch.press('Enter');
    }

    /**
     * Opens the shopping cart.
     */
    async openShoppingCart(): Promise<void> {
        await this.lnkShoppingCart.click();
    }
}
