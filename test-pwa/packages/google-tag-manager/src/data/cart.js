/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import getStore from 'SourceUtil/Store';

import { waitForCallback } from '../util/wait';
import { getProductData } from './product';

/** @namespace Scandiweb/GoogleTagManager/Data/Cart/getCartItemData */
export const getCartItemData = async (item) => {
    const {
        qty: quantity,
        price,
        product
    } = item;

    return {
        ...await getProductData(product),
        price,
        quantity
    };
};

/** @namespace Scandiweb/GoogleTagManager/Data/Cart/getCartItemsData */
export const getCartItemsData = async () => {
    // vvv Wait for cart id
    await waitForCallback(() => getStore().getState().CartReducer?.cartTotals?.id);

    const {
        cartTotals: {
            items = []
        }
    } = getStore().getState().CartReducer;

    if (items.length === 0) {
        return {};
    }

    return Promise.all(items.map(getCartItemData));
};

/** @namespace Scandiweb/GoogleTagManager/Data/Cart/getRemoveFromCartData */
export const getRemoveFromCartData = async (item, currencyCode) => ({
    ecommerce: {
        currencyCode,
        // ^^^ We can not read currencyCode via getStore (Redux limitation) => forced to pass
        remove: {
            products: [await getCartItemData(item)]
        }
    }
});

/** @namespace Scandiweb/GoogleTagManager/Data/Cart/getAddToCartData */
export const getAddToCartData = async (item, currencyCode) => ({
    ecommerce: {
        currencyCode,
        // ^^^ We can not read currencyCode via getStore (Redux limitation) => forced to pass
        add: {
            products: [await getCartItemData(item)]
        }
    }
});
