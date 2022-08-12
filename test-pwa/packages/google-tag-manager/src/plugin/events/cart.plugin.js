/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { UPDATE_TOTALS } from 'SourceStore/Cart/Cart.action';

import { fireAddToCartEvent, fireRemoveFromCartEvent } from '../../event/cart';

// vvv Index items, so we have SKU => item
const indexItems = (items) => items.reduce(
    (acc, item) => ({ ...acc, [item.sku]: item }),
    {}
);

const fireCartEvents = (args, callback) => {
    const [state, action] = args;
    const { type } = action;
    const newState = callback(...args);

    if (type !== UPDATE_TOTALS) {
        return newState;
    }

    const { cartTotals: { items, id, quote_currency_code: currencyCode } } = newState;
    const { cartTotals: { items: prevItems, id: prevId } } = state;
    const indexedItems = indexItems(items);
    const indexedPrevitems = indexItems(prevItems);

    if (!id || !prevId) {
        return newState;
    }

    // TODO: compare items, qty
    Object.entries(indexedItems).forEach(([sku, item]) => {
        const prevItem = indexedPrevitems[sku];

        if (!prevItem) {
            fireAddToCartEvent(item, currencyCode);
            // ^^^ item was added
            return;
        }

        const { qty } = item;
        const { qty: prevQty } = prevItem;

        // eslint-disable-next-line fp/no-delete
        delete indexedPrevitems[sku];
        // ^^^ Remove processed indexed items, all which will remain
        // in the map should be considered removed items

        if (qty === prevQty) {
            return;
        }

        if (qty > prevQty) {
            // ^^^ Item qty increased

            fireAddToCartEvent({
                ...item,
                qty: qty - prevQty
                // ^^^ If qty was increased => treat as delta add to cart
            });

            return;
        }

        // vvv Item qty decreased
        fireRemoveFromCartEvent({
            ...item,
            qty: prevQty - qty
            // ^^^ if qty was decreased => treat as delta remove from cart
        });
    });

    Object.values(indexedPrevitems).forEach((item) => {
        // ^^^ item was removed
        fireRemoveFromCartEvent(item, currencyCode);
    });

    return callback(...args);
};

export default {
    'Store/Cart/Reducer/CartReducer': {
        function: fireCartEvents
    }
};
