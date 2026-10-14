import { test, expect } from '../../fixtures/pageFixtures';
import { executeQuery } from '../../utils/dbClient';
import { RandomDataUtil } from '../../utils/dataGenerator';
import dotenv from 'dotenv';

dotenv.config();

interface CustomerRecord {
    customer_id: number;
    firstname: string;
    lastname: string;
    email: string;
    status: number;
    date_added: Date | string | null;
}

test.describe('OpenCart Customer UI, Admin, and Database Tests', () => {
    // ---------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------

    const ADMIN_URL = process.env.ADMIN_APP_URL;
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const EXPECTED_CUSTOMER_STATUS = 1;

    test('E2E - Register and verify customer across storefront, admin, and MySQL @master @end-to-end @db', async ({
        homePage,
        registerPage,
        adminCustomerPage,
    }) => {
        expect(ADMIN_URL, 'ADMIN_APP_URL must be configured in .env').toBeTruthy();
        expect(ADMIN_USERNAME, 'ADMIN_USERNAME must be configured in .env').toBeTruthy();
        expect(ADMIN_PASSWORD, 'ADMIN_PASSWORD must be configured in .env').toBeTruthy();

        const firstName = RandomDataUtil.getFirstName();
        const lastName = RandomDataUtil.getLastName();
        const email = RandomDataUtil.getEmail().toLowerCase().replace('@', `+${Date.now()}@`);
        const password = RandomDataUtil.getPassword(12);
        let registrationSubmitted = false;

        try {
            await test.step('1) Register a dynamically generated customer through the storefront', async () => {
                await homePage.clickRegister();
                expect(await registerPage.isRegisterPageExists(),
                    'The storefront should display the registration page').toBe(true);

                await registerPage.register(firstName, lastName, email, password);
                registrationSubmitted = true;
                expect(await registerPage.isAccountCreated(),
                    'The storefront should confirm that the account was created').toBe(true);
            });

            await test.step('2) Find and validate the same customer in the Admin Portal', async () => {
                await adminCustomerPage.login(ADMIN_URL!, ADMIN_USERNAME!, ADMIN_PASSWORD!);
                await adminCustomerPage.searchCustomer(email);

                expect(await adminCustomerPage.getCustomerRowCount(email),
                    'The admin customer list should contain exactly one matching email').toBe(1);
                await adminCustomerPage.openCustomer(email);

                const adminCustomer = await adminCustomerPage.getCustomerDetails();
                expect(adminCustomer.firstName, 'The Admin first name should match registration')
                    .toBe(firstName);
                expect(adminCustomer.lastName, 'The Admin last name should match registration')
                    .toBe(lastName);
                expect(adminCustomer.email, 'The Admin email should match registration')
                    .toBe(email);
                expect(await adminCustomerPage.isCustomerEnabled(),
                    'A newly registered customer should be enabled in Admin').toBe(true);
            });

            await test.step('3) Query and validate the customer record in MySQL', async () => {
                const customers = await executeQuery(
                    `SELECT customer_id, firstname, lastname, email, status, date_added
                     FROM oc_customer
                     WHERE email = ?`,
                    [email],
                ) as CustomerRecord[];

                expect(customers.length,
                    'The database should contain exactly one record for the registered email').toBe(1);
                expect(customers[0].firstname, 'The database first name should match registration')
                    .toBe(firstName);
                expect(customers[0].lastname, 'The database last name should match registration')
                    .toBe(lastName);
                expect(customers[0].email, 'The database email should match registration')
                    .toBe(email);
                expect(customers[0].status, 'The database status should be enabled for a new customer')
                    .toBe(EXPECTED_CUSTOMER_STATUS);
                expect(customers[0].date_added, 'The customer date_added field should be populated')
                    .toBeTruthy();
            });
        } finally {
            if (registrationSubmitted) {
                await executeQuery('DELETE FROM oc_customer WHERE email = ?', [email]);
            }
        }
    });
});
