/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { getProductDetailsData } from '../data/product';
import { GTM_EVENT_KEY_PRODUCT_DETAIL } from '../util/events';
import { pushToDataLayer } from '../util/push';
import { debounceCallback } from '../util/wait';

/** @namespace Scandiweb/GoogleTagManager/Event/General/fireNotFoundEvent */
export const fireProductDetailsEvent = debounceCallback(async (product) => {
    pushToDataLayer({
        event: GTM_EVENT_KEY_PRODUCT_DETAIL,
        ...await getProductDetailsData(product)
    });
});
