import { Locator, Page } from '@playwright/test';

export class AdminCustomerPage {
    private readonly page: Page;
    private readonly txtUsername: Locator;
    private readonly txtPassword: Locator;
    private readonly btnLogin: Locator;
    private readonly lnkCustomerMenu: Locator;
    private readonly lnkCustomers: Locator;
    private readonly txtEmailFilter: Locator;
    private readonly btnFilter: Locator;
    private readonly txtFirstName: Locator;
    private readonly txtLastName: Locator;
    private readonly txtEmail: Locator;
    private readonly chkStatus: Locator;

    constructor(page: Page) {
        this.page = page;
        this.txtUsername = page.getByRole('textbox', { name: 'Username' });
        this.txtPassword = page.getByRole('textbox', { name: 'Password' });
        this.btnLogin = page.getByRole('button', { name: 'Login', exact: true });
        this.lnkCustomerMenu = page.getByRole('link', { name: /Customers/ }).first();
        this.lnkCustomers = page.getByRole('link', { name: 'Customers', exact: true });
        this.txtEmailFilter = page.getByRole('textbox', { name: 'E-Mail' });
        this.btnFilter = page.getByRole('button', { name: 'Filter', exact: true });
        this.txtFirstName = page.locator('#input-firstname');
        this.txtLastName = page.locator('#input-lastname');
        this.txtEmail = page.locator('#input-email');
        this.chkStatus = page.locator('#input-status');
    }

    async login(url: string, username: string, password: string): Promise<void> {
        await this.page.goto(url);
        await this.txtUsername.fill(username);
        await this.txtPassword.fill(password);
        await this.btnLogin.click();
        await this.page.waitForURL(/route=common\/dashboard/);
    }

    async searchCustomer(email: string): Promise<void> {
        await this.lnkCustomerMenu.click();
        await this.lnkCustomers.click();
        await this.txtEmailFilter.fill(email);
        await this.btnFilter.click();
    }

    async getCustomerRowCount(email: string): Promise<number> {
        return this.page.getByRole('row').filter({ hasText: email }).count();
    }

    async openCustomer(email: string): Promise<void> {
        const customerRow = this.page.getByRole('row').filter({ hasText: email });
        await customerRow.locator('a[title="Edit"]').click();
    }

    async getCustomerDetails(): Promise<{ firstName: string; lastName: string; email: string }> {
        return {
            firstName: await this.txtFirstName.inputValue(),
            lastName: await this.txtLastName.inputValue(),
            email: await this.txtEmail.inputValue(),
        };
    }

    async isCustomerEnabled(): Promise<boolean> {
        return this.chkStatus.isChecked();
    }
}
