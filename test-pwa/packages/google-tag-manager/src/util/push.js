/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import TagManager from 'react-gtm-module';

import getStore from 'Util/Store';

// eslint-disable-next-line fp/no-let, @scandipwa/scandipwa-guidelines/export-level-one
let isGtmInitialized = false;

// eslint-disable-next-line @scandipwa/scandipwa-guidelines/export-level-one
const beforeInitQue = [];

/** @namespace Scandiweb/GoogleTagManager/Util/Push/pushToDataLayer */
export const pushToDataLayer = (data) => {
    const {
        enabled: isEnabled,
        gtm_id: gtmId
        // vvv These values are injected using GTM
    } = getStore().getState().ConfigReducer.gtm;

    if (isEnabled === undefined) {
        // Config is not yet obtained
        // Push request must be qued
        beforeInitQue.push(data);
        return;
    }

    if (isEnabled === false) {
        // GTM is disabled, skipping
        return;
    }

    if (isGtmInitialized === false) {
        // GTM needs to be init before push
        // Que needs to be executed
        TagManager.initialize({ gtmId });

        beforeInitQue.forEach((qData) => {
            TagManager.dataLayer({
                dataLayer: qData
            });
        });

        // eslint-disable-next-line no-console
        console.log('GTM que was emptied');

        isGtmInitialized = true;
    }

    TagManager.dataLayer({
        dataLayer: data
    });
};
