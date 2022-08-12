/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import GoogleTagManagerQuery from '../../query/Config.query';

const addGTMToRequest = (args, callback) => ([
    ...callback(...args),
    GoogleTagManagerQuery.getGtmField()
]);

export default {
    'Store/Config/Dispatcher': {
        'member-function': {
            prepareRequest: addGTMToRequest
        }
    }
};
