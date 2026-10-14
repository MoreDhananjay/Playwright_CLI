import { Locator, Page } from '@playwright/test';

export class ProductPage {
    private readonly page: Page;

    // Locators
    private readonly headingSearchResults: Locator;
    private readonly headingProduct: Locator;
    private readonly headingPrice: Locator;
    private readonly txtQuantity: Locator;
    private readonly btnAddToCart: Locator;
    private readonly btnCartSummary: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators with CSS selectors
        this.headingSearchResults = page.getByRole('heading', { name: 'Products meeting the search criteria', exact: true });
        this.headingProduct = page.getByRole('heading', { level: 1 });
        this.headingPrice = page.getByRole('heading', { level: 2 });
        this.txtQuantity = page.locator('#input-quantity');
        this.btnAddToCart = page.getByRole('button', { name: 'Add to Cart', exact: true });
        this.btnCartSummary = page.getByRole('button', { name: /\d+ item\(s\) -/ });
    }

    /**
     * Verifies that the named product appears in search results.
     * @param productName - Product name expected in the results
     * @returns Promise<boolean> - True when the product link is visible
     */
    async isProductSearchResultVisible(productName: string): Promise<boolean> {
        await this.headingSearchResults.waitFor({ state: 'visible' });
        await this.page.getByRole('link', { name: productName, exact: true }).last().waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Opens a product from the search results.
     * @param productName - Product name to open
     */
    async openProduct(productName: string): Promise<void> {
        await this.page.getByRole('link', { name: productName, exact: true }).last().click();
    }

    /**
     * Verifies that the named product details page is displayed.
     * @param productName - Product name expected on the details page
     * @returns Promise<boolean> - True when the product heading is visible
     */
    async isProductDetailsPageExists(productName: string): Promise<boolean> {
        await this.headingProduct.filter({ hasText: productName }).waitFor({ state: 'visible' });
        return true;
    }

    /**
     * Returns the product's displayed price.
     * @returns Promise<string> - Product price text
     */
    async getProductPrice(): Promise<string> {
        return this.headingPrice.innerText();
    }

    /**
     * Sets the requested product quantity.
     * @param quantity - Quantity to add
     */
    async setQuantity(quantity: string): Promise<void> {
        await this.txtQuantity.fill(quantity);
    }

    /**
     * Adds the displayed product to the shopping cart.
     */
    async addToCart(): Promise<void> {
        await this.btnAddToCart.click();
    }

    /**
     * Returns the updated cart summary after adding a product.
     * @returns Promise<string> - Shopping cart item-count summary
     */
    async getCartSummary(): Promise<string> {
        return this.btnCartSummary.innerText();
    }
}
