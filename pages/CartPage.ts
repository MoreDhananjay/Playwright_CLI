import { Locator, Page } from '@playwright/test';

export class CartPage {
    private readonly page: Page;

    // Locators
    private readonly headingCart: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.headingCart = page.getByRole('heading', { name: /Shopping Cart/ });
    }

    /**
     * Verifies that the shopping cart page is displayed.
     * @returns Promise<boolean> - True when the cart heading is visible
     */
    async isCartPageExists(): Promise<boolean> {
        await this.headingCart.waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Verifies that the named product is present in the cart.
     * @param productName - Product name expected in the cart
     * @returns Promise<boolean> - True when the matching product row is visible
     */
    async isProductInCart(productName: string): Promise<boolean> {
        await this.getProductRow(productName).waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Returns the quantity shown for a cart product.
     * @param productName - Product name in the cart
     * @returns Promise<string> - Product quantity
     */
    async getProductQuantity(productName: string): Promise<string> {
        return this.getProductRow(productName).getByRole('textbox').inputValue();
    }

    /**
     * Returns the unit price shown for a cart product.
     * @param productName - Product name in the cart
     * @returns Promise<string> - Product unit price
     */
    async getProductPrice(productName: string): Promise<string> {
        return this.getProductRow(productName).getByRole('cell').nth(3).innerText();
    }

    /**
     * Returns the line total shown for a cart product.
     * @param productName - Product name in the cart
     * @returns Promise<string> - Product line total
     */
    async getProductTotal(productName: string): Promise<string> {
        return this.getProductRow(productName).getByRole('cell').nth(4).innerText();
    }

    /**
     * Returns the final total shown in the cart totals table.
     * @returns Promise<string> - Cart total amount
     */
    async getCartTotal(): Promise<string> {
        const totalRow = this.page.getByRole('row').filter({
            has: this.page.getByText('Total', { exact: true }),
        });
        return totalRow.getByRole('cell').nth(1).innerText();
    }

    private getProductRow(productName: string): Locator {
        return this.page.getByRole('row').filter({
            has: this.page.getByRole('link', { name: productName, exact: true }),
        });
    }
}
