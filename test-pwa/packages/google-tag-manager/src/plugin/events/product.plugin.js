/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { fireProductDetailsEvent } from '../../event/product';

const addFireProductDetailEvent = (args, callback, instance) => {
    callback(...args);
    fireProductDetailsEvent(instance.props.product);
};

export default {
    'Route/ProductPage/Container': {
        'member-function': {
            updateMeta: addFireProductDetailEvent
        }
    }
};
