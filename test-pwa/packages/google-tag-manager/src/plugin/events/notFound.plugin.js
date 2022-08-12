/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { fireNotFoundEvent } from '../../event/notFound';

const addFireNotFoundEvent = (args, callback) => {
    callback(...args);
    fireNotFoundEvent();
};

export default {
    'Route/NoMatch/Component': {
        'member-function': {
            componentDidMount: addFireNotFoundEvent
        }
    }
};
