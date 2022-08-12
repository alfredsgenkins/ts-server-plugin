/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

export const callbackEntries = [];

// eslint-disable-next-line @scandipwa/scandipwa-guidelines/export-level-one
const callback = (entries, observer) => {
    entries.forEach((entry) => {
        const ref = entry.target;
        const index = callbackEntries.findIndex((entry) => entry && entry[0] === ref);

        if (entry.isIntersecting === false) {
            return;
        }

        if (index !== -1) {
            const CALLBACK_INDEX = 1;
            callbackEntries[index][CALLBACK_INDEX](entry, observer);
        }
    });
};

// eslint-disable-next-line @scandipwa/scandipwa-guidelines/export-level-one
const observer = new IntersectionObserver(callback, {
    rootMargin: '0px',
    threshold: 1.0
});

/** @namespace Scandiweb/GoogleTagManager/Util/Observer/registerCallback */
export const registerCallback = (ref, callback) => {
    const index = callbackEntries.findIndex((entry) => entry && entry[0] === ref);

    if (index === -1) {
        observer.observe(ref);
        callbackEntries.push([ref, callback]);
    }
};

/** @namespace Scandiweb/GoogleTagManager/Util/Observer/unregisterCallback */
export const unregisterCallback = (ref) => {
    const index = callbackEntries.findIndex((entry) => entry && entry[0] === ref);

    if (index !== -1) {
        observer.unobserve(ref);
        callbackEntries.splice(index, 1);
    }
};
