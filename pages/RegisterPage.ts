import { Locator, Page } from '@playwright/test';
import { AccountPage } from './AccountPage';

export class RegisterPage {
    private readonly page: Page;

    // Locators
    private readonly headingRegister: Locator;
    private readonly txtFirstName: Locator;
    private readonly txtLastName: Locator;
    private readonly txtEmail: Locator;
    private readonly txtPassword: Locator;
    private readonly chkPrivacyPolicy: Locator;
    private readonly btnContinue: Locator;
    private readonly headingAccountCreated: Locator;
    private readonly lnkContinue: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.headingRegister = page.getByRole('heading', { name: 'Register Account', exact: true });
        this.txtFirstName = page.getByPlaceholder('First Name', { exact: true });
        this.txtLastName = page.getByPlaceholder('Last Name', { exact: true });
        this.txtEmail = page.getByPlaceholder('E-Mail', { exact: true });
        this.txtPassword = page.getByPlaceholder('Password', { exact: true });
        this.chkPrivacyPolicy = page.locator('input[name="agree"]');
        this.btnContinue = page.getByRole('button', { name: 'Continue', exact: true }).first();
        this.headingAccountCreated = page.getByRole('heading', { name: 'Your Account Has Been Created!', exact: true });
        this.lnkContinue = page.getByRole('link', { name: 'Continue', exact: true }).first();
    }

    /**
     * Verifies that the registration page is displayed.
     * @returns Promise<boolean> - True when the registration heading is visible
     */
    async isRegisterPageExists(): Promise<boolean> {
        await this.headingRegister.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Fills and submits the registration form.
     * @param firstName - Customer first name
     * @param lastName - Customer last name
     * @param email - Unique customer email address
     * @param password - Customer password
     */
    async register(firstName: string, lastName: string, email: string, password: string): Promise<void> {
        try {
            await this.txtFirstName.fill(firstName);
            await this.txtLastName.fill(lastName);
            await this.txtEmail.fill(email);
            await this.txtPassword.fill(password);
            await this.chkPrivacyPolicy.check();
            await this.btnContinue.click();
        } catch (error) {
            console.log(`Error submitting the registration form: ${error}`);
            throw error;
        }
    }

    /**
     * Verifies that the account-created confirmation is displayed.
     * @returns Promise<boolean> - True when the confirmation heading is visible
     */
    async isAccountCreated(): Promise<boolean> {
        await this.headingAccountCreated.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Continues from the confirmation page to the customer account page.
     * @returns Promise<AccountPage> - Customer account page object
     */
    async continueToAccount(): Promise<AccountPage> {
        await this.lnkContinue.click();
        return new AccountPage(this.page);
    }
}
