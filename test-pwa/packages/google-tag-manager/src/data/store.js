/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import getStore from 'Util/Store';

import { waitForCallback } from '../util/wait';

/** @namespace Scandiweb/GoogleTagManager/Data/Store/getStoreData */
export const getStoreData = async () => {
    // vvv Wait for store code
    await waitForCallback(() => getStore().getState().ConfigReducer?.store_code);

    const {
        ConfigReducer: {
            locale,
            store_code,
            store_name
        } = {}
    } = getStore().getState();

    return {
        language: locale || '',
        storeView: store_code || '',
        store: store_name || ''
        // ^^^ this fields are added via plugins
    };
};
