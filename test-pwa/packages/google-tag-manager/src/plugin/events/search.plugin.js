/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { fireSearchEvent, fireSearchStartedEvent } from '../../event/search';

/** @namespace Scandiweb/GoogleTagManager/Plugin/Events/Search/addFireSearchStartedEvent */
export const addFireSearchStartedEvent = (args, callback) => {
    fireSearchStartedEvent();
    return callback(...args);
};

/** @namespace Scandiweb/GoogleTagManager/Plugin/Events/Search/addFireSearchEvent */
export const addFireSearchEvent = (args, callback) => {
    const [data,, options] = args;
    const { products: { total_count } = {} } = data;
    const { args: { search } } = options;

    fireSearchEvent({
        totalItems: total_count,
        searchTerm: search
    });

    return callback(...args);
};

export default {
    'Store/ProductList/Dispatcher': {
        'member-function': {
            onSuccess: addFireSearchEvent
        }
    },
    'Store/SearchBar/Dispatcher': {
        'member-function': {
            prepareRequest: addFireSearchStartedEvent,
            onSuccess: addFireSearchEvent
        }
    }
};
