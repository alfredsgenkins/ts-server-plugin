/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

const addGtmSpecificFields = (args, callback) => ([
    ...callback(...args),
    'store_name',
    'store_code',
    'locale'
]);

export default {
    'Query/Config/Query': {
        'member-function': {
            _getStoreConfigFields: addGtmSpecificFields
        }
    }
};
