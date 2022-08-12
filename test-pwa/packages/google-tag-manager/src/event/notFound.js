/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { GTM_EVENT_KEY_NOT_FOUND } from '../util/events';
import { pushToDataLayer } from '../util/push';
import { debounceCallback } from '../util/wait';

/** @namespace Scandiweb/GoogleTagManager/Event/General/fireNotFoundEvent */
export const fireNotFoundEvent = debounceCallback(async () => {
    pushToDataLayer({
        event: GTM_EVENT_KEY_NOT_FOUND,
        eventAction: window.location.href,
        eventNonInteraction: 1
        // TODO: understand if label and category where required?
    });
});
