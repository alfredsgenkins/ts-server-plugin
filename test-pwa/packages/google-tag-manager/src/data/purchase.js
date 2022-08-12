/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { roundPrice } from 'Util/Price';
import { fetchQuery } from 'Util/Request';
import getStore from 'Util/Store';

import PurchaseQuery from '../query/Purchase.query';
import { waitForCallback } from '../util/wait';
import { getCustomerData } from './customer';
import { getProductDimensionsData } from './product';

/** @namespace Scandiweb/GoogleTagManager/Data/Purchase/getPurchaseProductsData */
export const getPurchaseProductsData = async (purchase) => {
    const { products } = purchase;

    return Promise.all(products.map(async (product) => {
        const {
            category,
            id,
            name,
            price,
            quantity
        } = product;

        return {
            category,
            id,
            name,
            price: +roundPrice(price),
            quantity,
            dimensions: await getProductDimensionsData(product)
        };
    }));
};

/** @namespace Scandiweb/GoogleTagManager/Data/Purchase/getPurchaseShippingData */
export const getPurchaseShippingData = (purchase) => {
    const { shippingAddress, additional_data } = purchase;

    if (!additional_data || !shippingAddress) {
        return {};
    }

    const {
        city,
        postcode,
        region,
        region_id,
        street
    } = shippingAddress;

    return {
        shipping_city: city,
        shipping_region: region,
        shipping_country_id: region_id,
        shipping_street: street.replace(/\r?\n|\r/g, ' '),
        shipping_postcode: postcode
    };
};

/** @namespace Scandiweb/GoogleTagManager/Data/Purchase/getPurchaseCustomerData */
export const getPurchaseCustomerData = async (purchase) => {
    const { additional_data } = purchase;

    if (!additional_data) {
        return {};
    }

    return {
        ...await getCustomerData(),
        shipping_email: getStore().getState().CheckoutReducer?.email || ''
    };
};

/** @namespace Scandiweb/GoogleTagManager/Data/Purchase/getPurchaseEventData */
export const getPurchaseEventData = async (orderId, guestQuoteId) => {
    // vvv Wait for currency code
    await waitForCallback(() => getStore().getState().ConfigReducer?.currencyData?.current_currency_code);

    const currencyCode = getStore().getState().ConfigReducer?.currencyData?.current_currency_code;

    const query = PurchaseQuery.getPurchaseField(orderId, guestQuoteId);
    const { purchase } = await fetchQuery(query);
    const {
        orderPaymentMethod,
        orderShippingMethod,
        revenue,
        tax,
        shipping,
        coupon,
        discount_amount
    } = purchase;

    return {
        orderPaymentMethod,
        orderShippingMethod,
        ...await getPurchaseShippingData(purchase),
        discount_amount,
        ...await getPurchaseCustomerData(purchase),
        ecommerce: {
            currencyCode,
            purchase: {
                actionField: {
                    id: orderId,
                    revenue: +roundPrice(revenue),
                    tax: +roundPrice(tax),
                    coupon: coupon === null ? '' : coupon,
                    shipping: +roundPrice(shipping),
                    products: await getPurchaseProductsData(purchase)
                }
            }
        }
    };
};
