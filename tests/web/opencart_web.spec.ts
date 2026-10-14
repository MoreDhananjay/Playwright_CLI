import { resolve } from 'path';
import { test, expect } from '../../fixtures/pageFixtures';
import { DataProvider } from '../../utils/DataReader';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { Helper } from '../../utils/helper';

type LoginDataRow = {
    testName: string;
    email: string;
    password: string;
    expected: 'success' | 'failure';
};

const loginData = DataProvider.readJson(
    resolve(__dirname, '../../testdata/opencart_logindata.json')
) as LoginDataRow[];

test('Customer registration flow @master @sanity @web', async ({ homePage, registerPage, accountPage }) => {
    const firstName = RandomDataUtil.getFirstName();
    const lastName = RandomDataUtil.getLastName();
    const email = RandomDataUtil.getEmail().replace('@', `+${Date.now()}@`);
    const password = RandomDataUtil.getPassword();

    await test.step('1) Navigate to the registration page', async () => {
        await homePage.clickRegister();
        expect(await registerPage.isRegisterPageExists()).toBeTruthy();
    });

    await test.step('2) Register a new customer and verify confirmation', async () => {
        await registerPage.register(firstName, lastName, email, password);
        expect(await registerPage.isAccountCreated()).toBeTruthy();
    });

    await test.step('3) Verify the new account is available through account navigation', async () => {
        const account = await registerPage.continueToAccount();
        expect(await account.isMyAccountPageExists()).toBeTruthy();
        expect(await account.isLogoutOptionVisible()).toBeTruthy();
    });

    console.log('✅ Customer registration flow completed successfully.');
});

test('Valid customer login flow @master @sanity @web', async ({ homePage, loginPage, accountPage }) => {
    const { email, password } = Helper.getLoginDetails();

    await test.step('1) Navigate to the login page', async () => {
        await homePage.clickLogin();
        expect(await loginPage.isLoginPageExists()).toBeTruthy();
    });

    await test.step('2) Authenticate with the configured customer credentials', async () => {
        await loginPage.login(email, password);
        expect(await accountPage.isMyAccountPageExists()).toBeTruthy();
        expect(await accountPage.isLogoutOptionVisible()).toBeTruthy();
    });

    console.log('✅ Valid customer login flow completed successfully.');
});

test('Invalid customer login flow @master @sanity @web', async ({ homePage, loginPage, accountPage }) => {
    await test.step('1) Navigate to the login page', async () => {
        await homePage.clickLogin();
        expect(await loginPage.isLoginPageExists()).toBeTruthy();
    });

    await test.step('2) Submit invalid credentials and verify authentication is rejected', async () => {
        const invalidEmail = `invalid-${RandomDataUtil.getEmail()}`;
        await loginPage.login(invalidEmail, RandomDataUtil.getPassword());
        expect(await loginPage.isLoginWarningVisible()).toBeTruthy();
        expect(await loginPage.getLoginWarning()).toContain('Warning:');
        expect(await accountPage.isMyAccountPageExists()).toBeFalsy();
    });

    console.log('✅ Invalid customer login flow completed successfully.');
});

test('Customer logout flow @master @sanity @web', async ({ homePage, loginPage, accountPage, logoutPage }) => {
    const { email, password } = Helper.getLoginDetails();

    await test.step('1) Log in with valid customer credentials', async () => {
        await homePage.clickLogin();
        await loginPage.login(email, password);
        expect(await accountPage.isMyAccountPageExists()).toBeTruthy();
    });

    await test.step('2) Log out and verify the confirmation page', async () => {
        await accountPage.clickLogout();
        expect(await logoutPage.isLogoutPageExists()).toBeTruthy();
    });

    await test.step('3) Continue to the homepage and verify authenticated options are gone', async () => {
        await logoutPage.clickContinue();
        await homePage.clickMyAccount();
        expect(await homePage.isLoginOptionVisible()).toBeTruthy();
        expect(await homePage.isRegisterOptionVisible()).toBeTruthy();
        expect(await homePage.isLogoutOptionVisible()).toBeFalsy();
    });

    console.log('✅ Customer logout flow completed successfully.');
});

test('Product search flow @master @sanity @web', async ({ homePage, productPage }) => {
    const { productName } = Helper.getProductDetails();

    await test.step('1) Search for the known product', async () => {
        await homePage.searchProduct(productName);
        expect(await productPage.isProductSearchResultVisible(productName)).toBeTruthy();
    });

    console.log('✅ Product search flow completed successfully.');
});

test('Add product to shopping cart @master @sanity @web', async ({ homePage, productPage, cartPage }) => {
    const { productName, productQuantity, totalPrice } = Helper.getProductDetails();

    await test.step('1) Search for the product and open its details', async () => {
        await homePage.searchProduct(productName);
        expect(await productPage.isProductSearchResultVisible(productName)).toBeTruthy();
        await productPage.openProduct(productName);
        expect(await productPage.isProductDetailsPageExists(productName)).toBeTruthy();
    });

    await test.step('2) Add the requested quantity and verify the cart confirmation', async () => {
        await productPage.setQuantity(productQuantity);
        await productPage.addToCart();
        await expect.poll(() => productPage.getCartSummary()).toContain(`${productQuantity} item(s)`);
    });

    await test.step('3) Verify product and quantity in the shopping cart', async () => {
        await homePage.openShoppingCart();
        expect(await cartPage.isCartPageExists()).toBeTruthy();
        expect(await cartPage.isProductInCart(productName)).toBeTruthy();
        expect(await cartPage.getProductQuantity(productName)).toBe(productQuantity);
        expect(await cartPage.getProductPrice(productName)).toBe(totalPrice);
    });

    console.log('✅ Add product to shopping cart completed successfully.');
});

test('End-to-end customer shopping journey @master @end-to-end @web', async ({
    homePage,
    registerPage,
    accountPage,
    logoutPage,
    loginPage,
    productPage,
    cartPage,
}) => {
    const firstName = RandomDataUtil.getFirstName();
    const lastName = RandomDataUtil.getLastName();
    const email = RandomDataUtil.getEmail().replace('@', `+${Date.now()}@`);
    const password = RandomDataUtil.getPassword();
    const { productName, productQuantity, totalPrice } = Helper.getProductDetails();

    await test.step('1) Register a new customer', async () => {
        await homePage.clickRegister();
        expect(await registerPage.isRegisterPageExists()).toBeTruthy();
        await registerPage.register(firstName, lastName, email, password);
        expect(await registerPage.isAccountCreated()).toBeTruthy();
    });

    await test.step('2) Log out and log back in with the new customer credentials', async () => {
        const newAccountPage = await registerPage.continueToAccount();
        expect(await newAccountPage.isMyAccountPageExists()).toBeTruthy();
        await newAccountPage.clickLogout();
        expect(await logoutPage.isLogoutPageExists()).toBeTruthy();
        await logoutPage.clickContinue();
        await homePage.clickLogin();
        await loginPage.login(email, password);
        expect(await accountPage.isMyAccountPageExists()).toBeTruthy();
    });

    await test.step('3) Search and add the known product to the cart', async () => {
        await homePage.searchProduct(productName);
        expect(await productPage.isProductSearchResultVisible(productName)).toBeTruthy();
        await productPage.openProduct(productName);
        expect(await productPage.isProductDetailsPageExists(productName)).toBeTruthy();
        await productPage.setQuantity(productQuantity);
        await productPage.addToCart();
        await expect.poll(() => productPage.getCartSummary()).toContain(`${productQuantity} item(s)`);
    });

    await test.step('4) Verify the cart item, quantity, price, and total', async () => {
        await homePage.openShoppingCart();
        expect(await cartPage.isCartPageExists()).toBeTruthy();
        expect(await cartPage.isProductInCart(productName)).toBeTruthy();
        expect(await cartPage.getProductQuantity(productName)).toBe(productQuantity);
        expect(await cartPage.getProductPrice(productName)).toBe(totalPrice);
        expect(await cartPage.getProductTotal(productName)).toBe(totalPrice);
        expect(await cartPage.getCartTotal()).toMatch(/^\$\d[\d,]*\.\d{2}$/);
    });

    console.log('✅ End-to-end customer shopping journey completed successfully.');
});

for (const [index, row] of loginData.entries()) {
    test(`${row.testName} [row ${index + 1}] - ${row.expected} @master @datadriven @web`, async ({
        homePage,
        loginPage,
        accountPage,
    }) => {
        const configuredLogin = Helper.getLoginDetails();
        const email = row.email === '${APP_EMAIL}' ? configuredLogin.email : row.email;
        const password = row.password === '${APP_PASSWORD}' ? configuredLogin.password : row.password;
        const emailValue = email.trim() ? email : '';
        const passwordValue = password.trim() ? password : '';

        await test.step('1) Open the login page and submit the row credentials', async () => {
            await homePage.clickLogin();
            expect(await loginPage.isLoginPageExists()).toBeTruthy();
            await loginPage.login(emailValue, passwordValue);
        });

        await test.step(`2) Verify the ${row.expected} result`, async () => {
            if (row.expected === 'success') {
                expect(await accountPage.isMyAccountPageExists()).toBeTruthy();
            } else {
                expect(await accountPage.isMyAccountPageExists()).toBeFalsy();
                expect(await loginPage.isLoginWarningVisible()).toBeTruthy();
                expect(await loginPage.getLoginWarning()).toContain('Warning:');
            }
        });

        console.log(`✅ Data-driven login row completed: ${row.testName}.`);
    });
}
