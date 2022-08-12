/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

const addGtmSpecificFields = (args, callback) => [
    ...callback(...args),
    'userExistingCustomer',
    'userLifetimeValue',
    'userLifetimeOrders'
];

export default {
    'Query/MyAccount/Query': {
        'member-function': {
            _getCustomerFields: addGtmSpecificFields
        }
    }
};
