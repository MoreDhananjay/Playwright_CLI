import { Locator, Page } from '@playwright/test';

export class LoginPage {
    private readonly page: Page;

    // Locators
    private readonly headingLogin: Locator;
    private readonly txtEmail: Locator;
    private readonly txtPassword: Locator;
    private readonly btnLogin: Locator;
    private readonly txtWarning: Locator;
    private readonly headingAccount: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.headingLogin = page.getByRole('heading', { name: 'Returning Customer', exact: true });
        this.txtEmail = page.getByRole('textbox', { name: 'E-Mail Address' });
        this.txtPassword = page.getByRole('textbox', { name: 'Password' });
        this.btnLogin = page.getByRole('button', { name: 'Login', exact: true });
        this.txtWarning = page.getByText(/Warning:/);
        this.headingAccount = page.getByRole('heading', { name: 'My Account', exact: true, level: 1 });
    }

    /**
     * Verifies that the login page is displayed.
     * @returns Promise<boolean> - True when the login heading is visible
     */
    async isLoginPageExists(): Promise<boolean> {
        await this.headingLogin.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Submits the login form.
     * @param email - Customer email address
     * @param password - Customer password
     */
    async login(email: string, password: string): Promise<void> {
        try {
            await this.txtEmail.fill(email);
            await this.txtPassword.fill(password);
            await this.btnLogin.click();
            await Promise.any([
                this.headingAccount.waitFor({ state: 'visible' }),
                this.txtWarning.waitFor({ state: 'visible' }),
            ]);
        } catch (error) {
            console.log(`Error submitting the login form: ${error}`);
            throw error;
        }
    }

    /**
     * Verifies that the invalid-login warning is displayed.
     * @returns Promise<boolean> - True when the warning is visible
     */
    async isLoginWarningVisible(): Promise<boolean> {
        await this.txtWarning.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Returns the invalid-login warning text.
     * @returns Promise<string> - Visible warning text
     */
    async getLoginWarning(): Promise<string> {
        return (await this.txtWarning.innerText()).trim();
    }
}
