/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { Field } from 'Util/Query';

/** @namespace Scandiweb/GoogleTagManager/Query/Config/Query/ConfigQuery */
export class ConfigQuery {
    _getConfigFields = () => ([
        'enabled',
        'gtm_id',
        this._getEventField()
    ]);

    _getEventField = () => new Field('events')
        .addFieldList(this._getEventFields());

    _getEventFields = () => ([
        'gtm_general_init',
        'gtm_impressions_plp',
        'gtm_impressions_search',
        'gtm_site_search',
        'gtm_product_click',
        'gtm_product_detail',
        'gtm_product_add_to_cart',
        'gtm_product_remove_from_cart',
        'gtm_purchase',
        'gtm_checkout',
        'gtm_checkout_option',
        'gtm_user_login',
        'gtm_user_register',
        'gtm_not_found',
        'gtm_category_filters',
        'gtm_additional',
        'gtm_site_search_started'
    ]);

    getGtmField = () => new Field('getGtm')
        .setAlias('gtm')
        .addFieldList(this._getConfigFields());
}

export default new ConfigQuery();
