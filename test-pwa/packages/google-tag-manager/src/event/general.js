/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { getCartItemsData } from '../data/cart';
import { getCustomerData } from '../data/customer';
import { getPageData } from '../data/page';
import { getStoreData } from '../data/store';
import { GTM_EVENT_KEY_GENERAL } from '../util/events';
import { pushToDataLayer } from '../util/push';
import { debounceCallback } from '../util/wait';

/** @namespace Scandiweb/GoogleTagManager/Event/General/fireGeneralEvent */
export const fireGeneralEvent = debounceCallback(async () => {
    pushToDataLayer({
        event: GTM_EVENT_KEY_GENERAL,
        ...await getStoreData(),
        ...await getCustomerData(),
        ...await getPageData(),
        cart: await getCartItemsData()
    });
});
