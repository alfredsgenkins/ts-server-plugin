/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { getGuestQuoteId } from '@scandipwa/scandipwa/src/util/Cart';

import { DL_VAL_CHECKOUT_BILLING_STEP, DL_VAL_CHECKOUT_SHIPPING_STEP } from '../../data/checkout';
import { fireCheckoutEvent, fireCheckoutOptionEvent, firePurchaseEvent } from '../../event/checkout';

const addFireCheckoutOptionEventForBilling = (args, callback, instance) => {
    callback(...args);

    const { paymentMethod } = instance.state;

    fireCheckoutOptionEvent(
        DL_VAL_CHECKOUT_BILLING_STEP,
        paymentMethod
    );
};

const addFireCheckoutEventForBilling = (args, callback) => {
    callback(...args);
    fireCheckoutEvent(DL_VAL_CHECKOUT_BILLING_STEP);
};

const addFireCheckoutOptionEventForShipping = (args, callback, instance) => {
    callback(...args);

    const { selectedShippingMethod: { carrier_title } } = instance.state;

    fireCheckoutOptionEvent(
        DL_VAL_CHECKOUT_SHIPPING_STEP,
        carrier_title
    );
};

const addFireCheckoutEventForShipping = (args, callback) => {
    callback(...args);
    fireCheckoutEvent(DL_VAL_CHECKOUT_SHIPPING_STEP);
};

const addFirePurchaseEvent = (args, callback) => {
    const [orderId] = args;
    const guestQuoteId = getGuestQuoteId();
    // ^^^ getting this here, as it will soon be reset
    firePurchaseEvent(orderId, guestQuoteId);
    // vvv This must be called after guest quote id is obtained
    callback(...args);
};

export default {
    'Component/CheckoutBilling/Container': {
        'member-function': {
            onBillingSuccess: addFireCheckoutOptionEventForBilling,
            componentDidMount: addFireCheckoutEventForBilling
        }
    },
    'Component/CheckoutShipping/Container': {
        'member-function': {
            onShippingSuccess: addFireCheckoutOptionEventForShipping,
            componentDidMount: addFireCheckoutEventForShipping
        }
    },
    'Route/Checkout/Container': {
        'member-function': {
            setDetailsStep: addFirePurchaseEvent
        }
    }
};
