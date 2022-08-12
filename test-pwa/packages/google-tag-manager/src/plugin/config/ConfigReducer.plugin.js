/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { UPDATE_CONFIG } from 'SourceStore/Config/Config.action';

const addGTMToState = (args, callback) => ({
    ...callback(...args),
    gtm: []
});

const getGTMFromAction = (args, callback) => {
    const [, action] = args;
    const { type, config: { gtm } = {} } = action;

    if (type !== UPDATE_CONFIG) {
        return callback(...args);
    }

    return {
        ...callback(...args),
        gtm
    };
};

export default {
    'Store/Config/Reducer/getInitialState': {
        function: addGTMToState
    },
    'Store/Config/Reducer/ConfigReducer': {
        function: getGTMFromAction
    }
};
