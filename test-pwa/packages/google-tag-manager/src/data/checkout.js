/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { getCartItemsData } from './cart';
import { DL_VAL_PAGE_CHECKOUT } from './page';

export const DL_VAL_CHECKOUT_SHIPPING_STEP = 1;
export const DL_VAL_CHECKOUT_BILLING_STEP = 2;

/** @namespace Scandiweb/GoogleTagManager/Data/Checkout/getCheckoutEventData */
export const getCheckoutEventData = async (step) => ({
    ecommerce: {
        checkout: {
            actionField: {
                step,
                action: DL_VAL_PAGE_CHECKOUT
            },
            products: await getCartItemsData()
        }
    }
});

/** @namespace Scandiweb/GoogleTagManager/Data/Checkout/getCheckoutOptionEventData */
export const getCheckoutOptionEventData = async (step, option) => ({
    ecommerce: {
        checkout_option: {
            actionField: {
                option,
                step,
                action: DL_VAL_PAGE_CHECKOUT
            }
        }
    }
});
