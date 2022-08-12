/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { isSignedIn } from 'Util/Auth';
import getStore from 'Util/Store';

import { waitForCallback } from '../util/wait';
import { DL_VAL_NOT_APPLICABLE } from './common';

export const DL_VAL_USER_LOGIN = 'Logged in';
export const DL_VAL_USER_LOGOUT = 'Logged out';

/** @namespace Scandiweb/GoogleTagManager/Data/Customer/getCustomerData */
export const getCustomerData = async () => {
    if (!isSignedIn()) {
        // user is not signed in => return default object
        return {
            userLoginState: DL_VAL_USER_LOGOUT,
            customerId: DL_VAL_NOT_APPLICABLE,
            userExistingCustomer: DL_VAL_NOT_APPLICABLE,
            userLifetimeValue: 0,
            userLifetimeOrders: 0
        };
    }

    // vvv Wait for customer id, if customer is logged in
    await waitForCallback(() => getStore().getState().MyAccountReducer?.customer?.id);

    const {
        MyAccountReducer: {
            customer: {
                id,
                email,
                userExistingCustomer,
                userLifetimeValue,
                userLifetimeOrders
            } = {}
        } = {}
    } = getStore().getState();

    return {
        userLoginState: DL_VAL_USER_LOGIN,
        customerId: id || 0,
        customerEmail: email || '',
        // vvv this fields are added via plugins
        userExistingCustomer: userExistingCustomer || DL_VAL_NOT_APPLICABLE,
        userLifetimeValue: userLifetimeValue || 0,
        userLifetimeOrders: userLifetimeOrders || 0
    };
};
