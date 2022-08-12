/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { getProductClickData, getProductImpressionsData } from '../data/list';
import { GTM_EVENT_KEY_IMPRESSIONS, GTM_EVENT_KEY_PRODUCT_CLICK } from '../util/events';
import { pushToDataLayer } from '../util/push';
import { debounceCallback } from '../util/wait';

/** @namespace Scandiweb/GoogleTagManager/Event/List/fireImpressionEvent */
export const fireImpressionEvent = async (
    product, position, forcedList
) => {
    // ^^^ not using debounce, as many impressions can come together
    // TODO: join multiple impressions
    pushToDataLayer({
        event: GTM_EVENT_KEY_IMPRESSIONS,
        ...await getProductImpressionsData(product, position, forcedList)
    });
};

/** @namespace Scandiweb/GoogleTagManager/Event/Card/fireProductClickEvent */
export const fireProductClickEvent = debounceCallback(async (
    product, position, forcedList
) => {
    pushToDataLayer({
        event: GTM_EVENT_KEY_PRODUCT_CLICK,
        ...await getProductClickData(product, position, forcedList)
    });
});
