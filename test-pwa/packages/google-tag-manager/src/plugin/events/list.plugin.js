/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { ProductListEntryTracker } from '../../component/ProductListEntryTracker';
import { DL_VAL_PAGE_SEARCH } from '../../data/page';

const addProductCardImpressionObserver = (args, callback, instance) => (
    <ProductListEntryTracker product={ instance.props.product }>
        { callback(...args) }
    </ProductListEntryTracker>
);

const addSearchItemImpressionObserver = (args, callback, instance) => (
    <ProductListEntryTracker
      product={ instance.props.product }
      list={ DL_VAL_PAGE_SEARCH }
    >
        { callback(...args) }
    </ProductListEntryTracker>
);

export default {
    'Component/ProductCard/Component': {
        'member-function': {
            render: addProductCardImpressionObserver
        }
    },
    'Component/SearchItem/Component': {
        'member-function': {
            render: addSearchItemImpressionObserver
        }
    }
};
