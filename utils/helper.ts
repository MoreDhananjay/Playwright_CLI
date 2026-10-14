export class Helper {
    static convertPriceToNumber(price: string): number {
        const sanitizedValue = price.replace(/[^0-9.]/g, '');
        return Number(sanitizedValue);
    }

    static getProductDetails() {
        return {
            productName: 'MacBook',
            productQuantity: '1',
            totalPrice: '$602.00',
        };
    }

    static getLoginDetails() {
        return {
            email: 'dhananjay1.more@gmail.com',
            password: 'India@2025',
        };
    }
}
