/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { fireGeneralEvent } from '../../event/general';

// vvv Added a component to use location hook
function GTMGeneralEventTracker() {
    const location = useLocation();

    useEffect(() => {
        fireGeneralEvent();
    }, [location.pathname]);

    useEffect(() => {
        fireGeneralEvent();
    }, []);

    return null;
}

const addGTMGeneralEventTracker = (args, callback) => (
    <>
        { callback(args) }
        <GTMGeneralEventTracker />
    </>
);

export default {
    'Component/Router/Component': {
        'member-function': {
            renderRouterContent: addGTMGeneralEventTracker
        }
    }
};
