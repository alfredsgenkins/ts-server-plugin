/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { fireUserLoginEvent, fireUserRegisterEvent } from '../../event/user';

const addFireUserRegisterEvent = async (args, callback) => {
    await callback(...args);
    // ^^^ this function calls sign in and register
    fireUserRegisterEvent();
};

const addFireUserLoginEvent = async (args, callback) => {
    await callback(...args);
    fireUserLoginEvent();
};

export default {
    'Store/MyAccount/Dispatcher': {
        'member-function': {
            createAccount: addFireUserRegisterEvent,
            signIn: addFireUserLoginEvent
        }
    }
};
