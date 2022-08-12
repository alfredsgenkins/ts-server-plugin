/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import getStore from 'Util/Store';

import { waitForCallback } from '../util/wait';
import { getPageData } from './page';
import { getProductListEntryData } from './product';

/** @namespace Scandiweb/GoogleTagManager/Data/List/getProductImpressionsData */
export const getProductImpressionsData = async (
    product, position, forcedList
) => {
    // vvv Wait for currency code
    await waitForCallback(() => getStore().getState().ConfigReducer?.currencyData?.current_currency_code);

    const currencyCode = getStore().getState().ConfigReducer?.currencyData?.current_currency_code;

    return {
        ecommerce: {
            currencyCode,
            impressions: [await getProductListEntryData(
                product, position, forcedList
            )]
        }
    };
};

/** @namespace Scandiweb/GoogleTagManager/Data/List/getProductClickData */
export const getProductClickData = async (
    product, position, forcedList
) => {
    const { pageType: list } = await getPageData();
    // ^^^ Reuse page data as list information

    return {
        ecommerce: {
            click: {
                actionField: {
                    list: forcedList || list
                },
                products: [await getProductListEntryData(
                    product, position, forcedList
                )]
            }
        }
    };
};
