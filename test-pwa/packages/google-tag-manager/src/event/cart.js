/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { getAddToCartData, getRemoveFromCartData } from '../data/cart';
import { GTM_EVENT_KEY_ADD_TO_CART, GTM_EVENT_KEY_REMOVE_FROM_CART } from '../util/events';
import { pushToDataLayer } from '../util/push';

/** @namespace Scandiweb/GoogleTagManager/Event/Cart/fireAddToCartEvent */
export const fireAddToCartEvent = async (item, currencyCode) => {
    // ^^^ not using debounce, as many cart edits may happen at once
    pushToDataLayer({
        event: GTM_EVENT_KEY_ADD_TO_CART,
        ...await getAddToCartData(item, currencyCode)
    });
};

/** @namespace Scandiweb/GoogleTagManager/Event/Cart/fireRemoveFromCartEvent */
export const fireRemoveFromCartEvent = async (item, currencyCode) => {
    // ^^^ not using debounce, as many cart edits may happen at once
    pushToDataLayer({
        event: GTM_EVENT_KEY_REMOVE_FROM_CART,
        ...await getRemoveFromCartData(item, currencyCode)
    });
};
