/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { GTM_EVENT_KEY_USER_LOGIN, GTM_EVENT_KEY_USER_REGISTER } from '../util/events';
import { pushToDataLayer } from '../util/push';
import { debounceCallback } from '../util/wait';

/** @namespace Scandiweb/GoogleTagManager/Event/General/fireGeneralEvent */
export const fireUserLoginEvent = debounceCallback(async () => {
    pushToDataLayer({
        event: GTM_EVENT_KEY_USER_LOGIN
    });
});

/** @namespace Scandiweb/GoogleTagManager/Event/General/fireGeneralEvent */
export const fireUserRegisterEvent = debounceCallback(async () => {
    pushToDataLayer({
        event: GTM_EVENT_KEY_USER_REGISTER
    });
});
