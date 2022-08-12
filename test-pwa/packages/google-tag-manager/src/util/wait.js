/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

export const MAX_TRY_COUNT = 10;
export const TRY_INTERVAL_MS = 150;
export const DEBOUNCE_INTERVAL_MS = 150;
/* eslint-enable @scandipwa/scandipwa-guidelines/export-level-one */

/** @namespace Scandiweb/GoogleTagManager/Util/Wait/waitForCallback */
export const waitForCallback = async (callback, n = 0) => {
    if (n === MAX_TRY_COUNT) {
        return false;
    }

    const val = callback();

    if (val) {
        return true;
    }

    await new Promise((res) => setTimeout(res, TRY_INTERVAL_MS));
    return waitForCallback(callback, n + 1);
};

/** @namespace Scandiweb/GoogleTagManager/Util/Wait/debounceCallback */
export const debounceCallback = (callback) => {
    // eslint-disable-next-line fp/no-let
    let timer;

    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(
            () => callback(...args),
            DEBOUNCE_INTERVAL_MS
        );
    };
};
