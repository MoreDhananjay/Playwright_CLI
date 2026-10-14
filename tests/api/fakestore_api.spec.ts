import { test, expect } from '@playwright/test';
import Ajv from 'ajv';
import dotenv from 'dotenv';
import { Routes } from '../../api/endpoints/routes';
import { DataProvider } from '../../utils/DataReader';
import { RandomDataUtil } from '../../utils/dataGenerator';

dotenv.config();

interface Product {
    id: number;
    title: string;
    price: number;
    description: string;
    category: string;
    image: string;
    rating?: {
        rate: number;
        count: number;
    };
}

interface User {
    id: number;
    username: string;
    password: string;
    email: string;
    name: {
        firstname: string;
        lastname: string;
    };
    phone: string;
}

interface Cart {
    id: number;
    userId: number;
    date: string;
    products: Array<{
        productId: number;
        quantity: number;
    }>;
}

test.describe('FakeStore API Tests', () => {
    // ---------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------

    const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;
    const PRODUCT_ID = 1;
    const USER_ID = 1;
    const CART_ID = 1;
    const RESULT_LIMIT = 5;

    // ---------------------------------------------------------
    // Authentication
    // ---------------------------------------------------------

    test('POST - Login with valid user credentials @master @sanity @api', async ({ request }) => {
        const userResponse = await request.get(
            `${BASE_URL}${Routes.GET_USER_BY_ID.replace('{id}', String(USER_ID))}`,
        );
        expect(userResponse.status(), 'The reference user should be available for login data').toBe(200);
        const user: User = await userResponse.json();
        expect(user.username, 'The reference user should include a username').toBeTruthy();
        expect(user.password, 'The reference user should include a password').toBeTruthy();

        const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
            data: { username: user.username, password: user.password },
        });
        expect(response.status(), 'Valid credentials should return HTTP 201').toBe(201);

        const body: { token?: unknown } = await response.json();
        expect(body, 'The login response should contain a token field').toHaveProperty('token');
        expect(body.token, 'The authentication token should be a string').toEqual(expect.any(String));
        expect(body.token, 'The authentication token should not be empty').not.toBe('');
    });

    test('POST - Login with invalid credentials @master @regression @api', async ({ request }) => {
        const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
            data: {
                username: `invalid-user-${Date.now()}`,
                password: `invalid-password-${Date.now()}`,
            },
        });
        expect(response.status(), 'Invalid credentials should return HTTP 401').toBe(401);
        expect(await response.text(), 'The API should explain that the credentials are incorrect')
            .toBe('username or password is incorrect');
    });

    // ---------------------------------------------------------
    // Products - GET
    // ---------------------------------------------------------

    test('GET - All products @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_PRODUCTS}`);
        expect(response.status(), 'The products endpoint should return HTTP 200').toBe(200);

        const products: Product[] = await response.json();
        expect(Array.isArray(products), 'The products response should be an array').toBe(true);
        expect(products.length, 'At least one product should be returned').toBeGreaterThan(0);
        for (const product of products) {
            expect(typeof product.id, 'Each product should have a numeric ID').toBe('number');
            expect(typeof product.title, 'Each product should have a title').toBe('string');
            expect(typeof product.price, 'Each product should have a numeric price').toBe('number');
            expect(typeof product.category, 'Each product should have a category').toBe('string');
            expect(typeof product.image, 'Each product should have an image URL').toBe('string');
        }
    });

    test('GET - Product by ID @master @sanity @api', async ({ request }) => {
        const route = Routes.GET_PRODUCT_BY_ID.replace('{id}', String(PRODUCT_ID));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'A valid product ID should return HTTP 200').toBe(200);

        const product: Product = await response.json();
        expect(product.id, 'The returned product ID should match the requested ID').toBe(PRODUCT_ID);
        expect(product.title, 'The product should include a title').toBeTruthy();
        expect(typeof product.price, 'The product price should be numeric').toBe('number');
        expect(product.category, 'The product should include a category').toBeTruthy();
        expect(product.image, 'The product should include an image URL').toBeTruthy();
    });

    test('GET - Products with limit @master @regression @api', async ({ request }) => {
        const route = Routes.GET_PRODUCTS_WITH_LIMIT.replace('{limit}', String(RESULT_LIMIT));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'The limited products endpoint should return HTTP 200').toBe(200);

        const products: Product[] = await response.json();
        expect(Array.isArray(products), 'The limited products response should be an array').toBe(true);
        expect(products.length, 'The response should contain the requested number of products')
            .toBe(RESULT_LIMIT);
    });

    for (const order of ['asc', 'desc'] as const) {
        test(`GET - Products sorted ${order} @master @regression @api`, async ({ request }) => {
            const route = Routes.GET_PRODUCTS_SORTED.replace('{order}', order);
            const response = await request.get(`${BASE_URL}${route}`);
            expect(response.status(), `Product sorting (${order}) should return HTTP 200`).toBe(200);

            const products: Product[] = await response.json();
            const ids = products.map((product) => product.id);
            expect(ids.length, 'The sorted products response should not be empty').toBeGreaterThan(0);
            const sortedIds = [...ids].sort((left, right) =>
                order === 'asc' ? left - right : right - left,
            );
            expect(ids, `Product IDs should be sorted ${order}`).toEqual(sortedIds);
        });
    }

    test('GET - All product categories @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CATEGORIES}`);
        expect(response.status(), 'The product categories endpoint should return HTTP 200').toBe(200);

        const categories: string[] = await response.json();
        expect(Array.isArray(categories), 'The categories response should be an array').toBe(true);
        expect(categories.length, 'At least one product category should be returned').toBeGreaterThan(0);
        expect(categories.every((category) => typeof category === 'string'))
            .toBe(true);
    });

    test('GET - Products by category @master @regression @api', async ({ request }) => {
        const category = 'electronics';
        const route = Routes.GET_PRODUCTS_BY_CATEGORY.replace('{category}', encodeURIComponent(category));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'The category endpoint should return HTTP 200').toBe(200);

        const products: Product[] = await response.json();
        expect(Array.isArray(products), 'The category response should be an array').toBe(true);
        expect(products.length, 'The selected category should contain products').toBeGreaterThan(0);
        expect(products.every((product) => product.category === category),
            'Every returned product should belong to the requested category').toBe(true);
    });

    // ---------------------------------------------------------
    // Products - POST / PUT / DELETE
    // ---------------------------------------------------------

    test('POST - Create product @master @regression @api', async ({ request }) => {
        const productPayload = RandomDataUtil.generateProductPayload();
        const response = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, { data: productPayload });
        expect(response.status(), 'Creating a product should return HTTP 201').toBe(201);

        const createdProduct: Product = await response.json();
        expect(Number.isInteger(createdProduct.id), 'The created product should have an integer ID').toBe(true);
        expect(createdProduct.title, 'The created product title should match the submitted title')
            .toBe(productPayload.title);
        expect(createdProduct.price, 'The created product price should match the submitted price')
            .toBe(productPayload.price);
        expect(createdProduct.description, 'The created product description should match the submitted value')
            .toBe(productPayload.description);
        expect(createdProduct.image, 'The created product image should match the submitted value')
            .toBe(productPayload.image);
        expect(createdProduct.category, 'The created product category should match the submitted category')
            .toBe(productPayload.category);
    });

    test('PUT - Update product @master @regression @api', async ({ request }) => {
        const productPayload = RandomDataUtil.generateUpdatedProductPayload();
        const route = Routes.UPDATE_PRODUCT.replace('{id}', String(PRODUCT_ID));
        const response = await request.put(`${BASE_URL}${route}`, { data: productPayload });
        expect(response.status(), 'Updating a valid product should return HTTP 200').toBe(200);

        const updatedProduct: Product = await response.json();
        expect(updatedProduct.id, 'The updated product ID should match the requested ID').toBe(PRODUCT_ID);
        expect(updatedProduct.title, 'The product title should reflect the update').toBe(productPayload.title);
        expect(updatedProduct.price, 'The product price should reflect the update').toBe(productPayload.price);
        expect(updatedProduct.category, 'The product category should reflect the update')
            .toBe(productPayload.category);
    });

    test('DELETE - Product @master @regression @api', async ({ request }) => {
        const route = Routes.DELETE_PRODUCT.replace('{id}', String(PRODUCT_ID));
        const response = await request.delete(`${BASE_URL}${route}`);
        expect(response.status(), 'Deleting a valid product should return HTTP 200').toBe(200);
        const responseText = await response.text();
        if (responseText.trim()) {
            const deletedProduct: { id: number } = JSON.parse(responseText);
            expect(deletedProduct.id, 'A returned deleted product should match the requested ID')
                .toBe(PRODUCT_ID);
        }
    });

    // ---------------------------------------------------------
    // Users - GET
    // ---------------------------------------------------------

    test('GET - All users @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_USERS}`);
        expect(response.status(), 'The users endpoint should return HTTP 200').toBe(200);

        const users: User[] = await response.json();
        expect(Array.isArray(users), 'The users response should be an array').toBe(true);
        expect(users.length, 'At least one user should be returned').toBeGreaterThan(0);
        expect(users.every((user) => Number.isInteger(user.id)), 'Each returned user should have an integer ID')
            .toBe(true);
    });

    test('GET - User by ID @master @sanity @api', async ({ request }) => {
        const route = Routes.GET_USER_BY_ID.replace('{id}', String(USER_ID));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'A valid user ID should return HTTP 200').toBe(200);

        const user: User = await response.json();
        expect(user.id, 'The returned user ID should match the requested ID').toBe(USER_ID);
        expect(user.username, 'The user should include a username').toBeTruthy();
        expect(user.email, 'The user should include an email address').toBeTruthy();
    });

    test('GET - Users with limit @master @regression @api', async ({ request }) => {
        const route = Routes.GET_USERS_WITH_LIMIT.replace('{limit}', String(RESULT_LIMIT));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'The limited users endpoint should return HTTP 200').toBe(200);

        const users: User[] = await response.json();
        expect(Array.isArray(users), 'The limited users response should be an array').toBe(true);
        expect(users.length, 'The response should contain the requested number of users').toBe(RESULT_LIMIT);
    });

    for (const order of ['asc', 'desc'] as const) {
        test(`GET - Users sorted ${order} @master @regression @api`, async ({ request }) => {
            const route = Routes.GET_USERS_SORTED.replace('{order}', order);
            const response = await request.get(`${BASE_URL}${route}`);
            expect(response.status(), `User sorting (${order}) should return HTTP 200`).toBe(200);

            const users: User[] = await response.json();
            const ids = users.map((user) => user.id);
            expect(ids.length, 'The sorted users response should not be empty').toBeGreaterThan(0);
            const sortedIds = [...ids].sort((left, right) =>
                order === 'asc' ? left - right : right - left,
            );
            expect(ids, `User IDs should be sorted ${order}`).toEqual(sortedIds);
        });
    }

    // ---------------------------------------------------------
    // Users - POST / PUT / DELETE
    // ---------------------------------------------------------

    test('POST - Create user @master @regression @api', async ({ request }) => {
        const userPayload = RandomDataUtil.generateUserPayload();
        const response = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, { data: userPayload });
        expect(response.status(), 'Creating a user should return HTTP 201').toBe(201);

        const createdUser: { id: number } = await response.json();
        expect(Number.isInteger(createdUser.id), 'The created user response should include an integer ID')
            .toBe(true);
    });

    test('PUT - Update user @master @regression @api', async ({ request }) => {
        const userPayload = RandomDataUtil.generateUserUpdatePayload();
        const route = Routes.UPDATE_USER.replace('{id}', String(USER_ID));
        const response = await request.put(`${BASE_URL}${route}`, { data: userPayload });
        expect(response.status(), 'Updating a valid user should return HTTP 200').toBe(200);

        const updatedUser: User = await response.json();
        expect(updatedUser.username, 'The user response should contain the updated username')
            .toBe(userPayload.username);
        expect(updatedUser.email, 'The user response should contain the submitted email')
            .toBe(userPayload.email);
        expect(updatedUser.name, 'The user response should contain the submitted name')
            .toEqual(userPayload.name);
    });

    test('DELETE - User @master @regression @api', async ({ request }) => {
        const route = Routes.DELETE_USER.replace('{id}', String(USER_ID));
        const response = await request.delete(`${BASE_URL}${route}`);
        expect(response.status(), 'Deleting a valid user should return HTTP 200').toBe(200);
        expect((await response.text()).length, 'The user delete endpoint should return a response body')
            .toBeGreaterThan(0);
    });

    // ---------------------------------------------------------
    // Carts - GET
    // ---------------------------------------------------------

    test('GET - All carts @master @sanity @api', async ({ request }) => {
        const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CARTS}`);
        expect(response.status(), 'The carts endpoint should return HTTP 200').toBe(200);

        const carts: Cart[] = await response.json();
        expect(Array.isArray(carts), 'The carts response should be an array').toBe(true);
        expect(carts.length, 'At least one cart should be returned').toBeGreaterThan(0);
    });

    test('GET - Cart by ID @master @sanity @api', async ({ request }) => {
        const route = Routes.GET_CART_BY_ID.replace('{id}', String(CART_ID));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'A valid cart ID should return HTTP 200').toBe(200);

        const cart: Cart = await response.json();
        expect(cart.id, 'The returned cart ID should match the requested ID').toBe(CART_ID);
        expect(Number.isInteger(cart.userId), 'The cart should include an integer user ID').toBe(true);
        expect(Array.isArray(cart.products), 'The cart products should be an array').toBe(true);
    });

    test('GET - Carts within date range @master @regression @api', async ({ request }) => {
        const startDate = '2000-01-01';
        const endDate = '2099-12-31';
        const route = Routes.GET_CARTS_BY_DATE_RANGE
            .replace('{startdate}', startDate)
            .replace('{enddate}', endDate);
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'Filtering carts by date range should return HTTP 200').toBe(200);

        const carts: Cart[] = await response.json();
        expect(Array.isArray(carts), 'The date-filtered carts response should be an array').toBe(true);
        const startTimestamp = Date.parse(`${startDate}T00:00:00.000Z`);
        const endTimestamp = Date.parse(`${endDate}T23:59:59.999Z`);
        for (const cart of carts) {
            const cartTimestamp = Date.parse(cart.date);
            expect(Number.isNaN(cartTimestamp), `Cart ${cart.id} should have a valid date`).toBe(false);
            expect(cartTimestamp, `Cart ${cart.id} should be on or after the start date`)
                .toBeGreaterThanOrEqual(startTimestamp);
            expect(cartTimestamp, `Cart ${cart.id} should be on or before the end date`)
                .toBeLessThanOrEqual(endTimestamp);
        }
    });

    test('GET - Carts by user @master @regression @api', async ({ request }) => {
        const route = Routes.GET_USER_CART.replace('{userId}', String(USER_ID));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'The user carts endpoint should return HTTP 200').toBe(200);

        const carts: Cart[] = await response.json();
        expect(Array.isArray(carts), 'The user carts response should be an array').toBe(true);
        expect(carts.length, 'The reference user should have at least one cart').toBeGreaterThan(0);
        expect(carts.every((cart) => cart.userId === USER_ID),
            'Every returned cart should belong to the requested user').toBe(true);
    });

    test('GET - Carts with limit @master @regression @api', async ({ request }) => {
        const route = Routes.GET_CARTS_WITH_LIMIT.replace('{limit}', String(RESULT_LIMIT));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'The limited carts endpoint should return HTTP 200').toBe(200);

        const carts: Cart[] = await response.json();
        expect(Array.isArray(carts), 'The limited carts response should be an array').toBe(true);
        expect(carts.length, 'The response should contain the requested number of carts')
            .toBe(RESULT_LIMIT);
    });

    for (const order of ['asc', 'desc'] as const) {
        test(`GET - Carts sorted ${order} @master @regression @api`, async ({ request }) => {
            const route = Routes.GET_CARTS_SORTED.replace('{order}', order);
            const response = await request.get(`${BASE_URL}${route}`);
            expect(response.status(), `Cart sorting (${order}) should return HTTP 200`).toBe(200);

            const carts: Cart[] = await response.json();
            const ids = carts.map((cart) => cart.id);
            expect(ids.length, 'The sorted carts response should not be empty').toBeGreaterThan(0);
            const sortedIds = [...ids].sort((left, right) =>
                order === 'asc' ? left - right : right - left,
            );
            expect(ids, `Cart IDs should be sorted ${order}`).toEqual(sortedIds);
        });
    }

    // ---------------------------------------------------------
    // Carts - POST / PUT / DELETE
    // ---------------------------------------------------------

    test('POST - Create cart @master @regression @api', async ({ request }) => {
        const cartPayload = RandomDataUtil.generateCartPayload(USER_ID);
        const response = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, { data: cartPayload });
        expect(response.status(), 'Creating a cart should return HTTP 201').toBe(201);

        const createdCart: Cart = await response.json();
        expect(Number.isInteger(createdCart.id), 'The created cart should have an integer ID').toBe(true);
        expect(createdCart.userId, 'The created cart should retain the submitted user ID').toBe(USER_ID);
        expect(createdCart.products, 'The created cart should retain the submitted products')
            .toEqual(cartPayload.products);
    });

    test('PUT - Update cart @master @regression @api', async ({ request }) => {
        const cartPayload = RandomDataUtil.generateUpdatedCartPayload(USER_ID);
        const route = Routes.UPDATE_CART.replace('{id}', String(CART_ID));
        const response = await request.put(`${BASE_URL}${route}`, { data: cartPayload });
        expect(response.status(), 'Updating a valid cart should return HTTP 200').toBe(200);

        const updatedCart: Cart = await response.json();
        expect(updatedCart.id, 'The updated cart ID should match the requested ID').toBe(CART_ID);
        expect(updatedCart.userId, 'The updated cart should retain the submitted user ID').toBe(USER_ID);
        expect(updatedCart.products, 'The cart should reflect the submitted product quantities')
            .toEqual(cartPayload.products);
    });

    test('DELETE - Cart @master @regression @api', async ({ request }) => {
        const route = Routes.DELETE_CART.replace('{id}', String(CART_ID));
        const response = await request.delete(`${BASE_URL}${route}`);
        expect(response.status(), 'Deleting a valid cart should return HTTP 200').toBe(200);
        const responseText = await response.text();
        if (responseText.trim()) {
            const deletedCart: unknown = JSON.parse(responseText);
            if (deletedCart !== null) {
                expect(deletedCart, 'A returned deleted cart should match the requested ID')
                    .toMatchObject({ id: CART_ID });
            }
        }
    });

    // ---------------------------------------------------------
    // JSON Schema Validation
    // ---------------------------------------------------------

    test('GET - Product response matches schema @master @regression @api', async ({ request }) => {
        const route = Routes.GET_PRODUCT_BY_ID.replace('{id}', String(PRODUCT_ID));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'The product schema sample should return HTTP 200').toBe(200);

        const product = await response.json();
        const schema = DataProvider.readJson('./api/schemas/product_api_schema.json');
        const isValid = new Ajv().compile(schema)(product);
        expect(isValid, 'The product response should match its schema').toBe(true);
    });

    test('GET - User response matches schema @master @regression @api', async ({ request }) => {
        const route = Routes.GET_USER_BY_ID.replace('{id}', String(USER_ID));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'The user schema sample should return HTTP 200').toBe(200);

        const user = await response.json();
        const schema = DataProvider.readJson('./api/schemas/user_api_schema.json');
        const validator = new Ajv().compile(schema);
        const isValid = validator(user);
        expect(isValid, `The user response should match its schema. Errors: ${JSON.stringify(validator.errors)}`)
            .toBe(true);
    });

    test('GET - Cart response matches schema @master @regression @api', async ({ request }) => {
        const route = Routes.GET_CART_BY_ID.replace('{id}', String(CART_ID));
        const response = await request.get(`${BASE_URL}${route}`);
        expect(response.status(), 'The cart schema sample should return HTTP 200').toBe(200);

        const cart = await response.json();
        const schema = DataProvider.readJson('./api/schemas/cart_api_schema.json');
        const validator = new Ajv().compile(schema);
        const isValid = validator(cart);
        expect(isValid, `The cart response should match its schema. Errors: ${JSON.stringify(validator.errors)}`)
            .toBe(true);
    });

    // ---------------------------------------------------------
    // End-to-end CRUD workflows
    // ---------------------------------------------------------

    test('Workflow - Create, update, and delete product @master @end-to-end @api', async ({ request }) => {
        const createPayload = RandomDataUtil.generateProductPayload();
        const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, {
            data: createPayload,
        });
        expect(createResponse.status(), 'The workflow should create the product with HTTP 201').toBe(201);

        const createdProduct: Product = await createResponse.json();
        expect(Number.isInteger(createdProduct.id), 'The workflow create response should provide an ID')
            .toBe(true);
        const productId = createdProduct.id;

        const updatePayload = RandomDataUtil.generateUpdatedProductPayload();
        const updateRoute = Routes.UPDATE_PRODUCT.replace('{id}', String(productId));
        const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, { data: updatePayload });
        expect(updateResponse.status(), 'The workflow should update the created product with HTTP 200')
            .toBe(200);

        const updatedProduct: Product = await updateResponse.json();
        expect(updatedProduct.id, 'The update should target the product returned by create').toBe(productId);
        expect(updatedProduct.title, 'The workflow update should return the requested title')
            .toBe(updatePayload.title);
        expect(updatedProduct.price, 'The workflow update should return the requested price')
            .toBe(updatePayload.price);

        const deleteRoute = Routes.DELETE_PRODUCT.replace('{id}', String(productId));
        const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
        expect(deleteResponse.status(), 'The workflow should delete the created product with HTTP 200')
            .toBe(200);
    });

    test('Workflow - Create, update, and delete user @master @end-to-end @api', async ({ request }) => {
        const createPayload = RandomDataUtil.generateUserPayload();
        const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, {
            data: createPayload,
        });
        expect(createResponse.status(), 'The workflow should create the user with HTTP 201').toBe(201);

        const createdUser: { id: number } = await createResponse.json();
        expect(Number.isInteger(createdUser.id), 'The workflow create response should provide an ID')
            .toBe(true);
        const userId = createdUser.id;

        const updatePayload = RandomDataUtil.generateUserUpdatePayload();
        const updateRoute = Routes.UPDATE_USER.replace('{id}', String(userId));
        const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, { data: updatePayload });
        expect(updateResponse.status(), 'The workflow should update the created user with HTTP 200')
            .toBe(200);

        const updatedUser: User = await updateResponse.json();
        expect(updatedUser.username, 'The workflow update should return the requested username')
            .toBe(updatePayload.username);
        expect(updatedUser.email, 'The workflow update should return the requested email')
            .toBe(updatePayload.email);

        const deleteRoute = Routes.DELETE_USER.replace('{id}', String(userId));
        const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
        expect(deleteResponse.status(), 'The workflow should delete the created user with HTTP 200')
            .toBe(200);
    });

    test('Workflow - Create, update, and delete cart @master @end-to-end @api', async ({ request }) => {
        const createPayload = RandomDataUtil.generateCartPayload(USER_ID);
        const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, {
            data: createPayload,
        });
        expect(createResponse.status(), 'The workflow should create the cart with HTTP 201').toBe(201);

        const createdCart: Cart = await createResponse.json();
        expect(Number.isInteger(createdCart.id), 'The workflow create response should provide an ID')
            .toBe(true);
        expect(createdCart.userId, 'The created cart should belong to the requested user').toBe(USER_ID);
        expect(createdCart.products, 'The created cart should include the submitted products')
            .toEqual(createPayload.products);
        const cartId = createdCart.id;

        const updatePayload = RandomDataUtil.generateUpdatedCartPayload(USER_ID);
        const updateRoute = Routes.UPDATE_CART.replace('{id}', String(cartId));
        const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, { data: updatePayload });
        expect(updateResponse.status(), 'The workflow should update the created cart with HTTP 200')
            .toBe(200);

        const updatedCart: Cart = await updateResponse.json();
        expect(updatedCart.id, 'The update should target the cart returned by create').toBe(cartId);
        expect(updatedCart.products, 'The workflow update should return the requested quantities')
            .toEqual(updatePayload.products);

        const deleteRoute = Routes.DELETE_CART.replace('{id}', String(cartId));
        const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
        expect(deleteResponse.status(), 'The workflow should delete the created cart with HTTP 200')
            .toBe(200);
    });
});
