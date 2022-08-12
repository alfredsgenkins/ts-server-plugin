/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { getCheckoutEventData, getCheckoutOptionEventData } from '../data/checkout';
import { getPurchaseEventData } from '../data/purchase';
import {
    GTM_EVENT_KEY_CHECKOUT,
    GTM_EVENT_KEY_CHECKOUT_OPTION,
    GTM_EVENT_KEY_PURCHASE
} from '../util/events';
import { pushToDataLayer } from '../util/push';
import { debounceCallback } from '../util/wait';

export const fireCheckoutOptionEvent = debounceCallback(async (step, option) => {
    pushToDataLayer({
        event: GTM_EVENT_KEY_CHECKOUT_OPTION,
        ...await getCheckoutOptionEventData(step, option)
    });
});

export const fireCheckoutEvent = debounceCallback(async (step) => {
    pushToDataLayer({
        event: GTM_EVENT_KEY_CHECKOUT,
        ...await getCheckoutEventData(step)
    });
});

export const firePurchaseEvent = debounceCallback(async (orderId, guestQuoteId) => {
    pushToDataLayer({
        event: GTM_EVENT_KEY_PURCHASE,
        ...await getPurchaseEventData(orderId, guestQuoteId)
    });
});
