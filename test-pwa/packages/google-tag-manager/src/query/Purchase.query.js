/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { isSignedIn } from 'Util/Auth';
import { Field } from 'Util/Query';

/** @namespace Scandiweb/GoogleTagManager/Query/Purchase/Query/PurchaseQuery */
export class PurchaseQuery {
    getPurchaseField(orderId, guestQuoteId) {
        const field = new Field('getPurchase')
            .setAlias('purchase')
            .addArgument('orderID', 'String!', orderId)
            .addFieldList(this.getPurchaseFields());

        if (!isSignedIn() && guestQuoteId) {
            field.addArgument('guestCartId', 'String', guestQuoteId);
        }

        return field;
    }

    getPurchaseFields() {
        return [
            'orderPaymentMethod',
            'orderShippingMethod',
            'revenue',
            'tax',
            'shipping',
            'coupon',
            'discount_amount',
            'additional_data',
            this.getProductField(),
            this.getShippingField()
        ];
    }

    getProductField() {
        return new Field('purchaseProducts')
            .setAlias('products')
            .addFieldList(this.getProductFields());
    }

    getProductFields() {
        return [
            'name',
            'id',
            'price',
            'quantity',
            'category',
            'dimensions'
        ];
    }

    getShippingField() {
        return new Field('shippingAddress')
            .addFieldList(this.getShippingFields());
    }

    getShippingFields() {
        return [
            'street',
            'city',
            'region_id',
            'region',
            'postcode',
            'email'
        ];
    }
}
export default new PurchaseQuery();
