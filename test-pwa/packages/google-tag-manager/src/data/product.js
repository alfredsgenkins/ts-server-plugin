/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { roundPrice } from 'SourceUtil/Price';

import { getPageData } from './page';

export const DL_VAL_CATEGORY_LIMIT = 5;

/** @namespace Scandiweb/GoogleTagManager/Data/Product/getProductVariantData */
export const getProductVariantData = async (product) => {
    const { variants = [] } = product;
    const { sku } = variants[0] || {};
    return sku || '';
};

/** @namespace Scandiweb/GoogleTagManager/Data/Product/getProductDimensionsData */
export const getProductDimensionsData = async (product) => {
    const { variants = [], dimensions } = product;
    const { dimensions: childDimensions } = variants[0] || {};
    const rawDimensions = childDimensions || dimensions;
    return rawDimensions ? JSON.parse(rawDimensions) : {};
};

/** @namespace Scandiweb/GoogleTagManager/Data/Product/getProductCategoriesData */
export const getProductCategoriesData = async ({ categories = [] }) => (
    categories.slice(0, DL_VAL_CATEGORY_LIMIT).map(({ name }) => name).join('/')
);

/** @namespace Scandiweb/GoogleTagManager/Data/Product/getProductPriceData */
export const getProductPriceData = async (product) => {
    const { variants = [], type_id, price_range } = product;

    if (!price_range) {
        return -1;
        // ^^^ must be replaced, if price range is not present
    }

    if (type_id === 'grouped') {
        return 0;
    }

    const {
        price_range: {
            minimum_price: {
                final_price: {
                    value: discountValue = null
                } = {},
                regular_price: {
                    value = 0
                } = {}
            }
        } = {}
    } = variants[0] || product;

    return +roundPrice(discountValue || value);
};

/** @namespace Scandiweb/GoogleTagManager/Data/Product/getProductData */
export const getProductData = async (product) => {
    const {
        sku,
        name
    } = product;

    return {
        id: sku,
        name,
        price: await getProductPriceData(product),
        variant: await getProductVariantData(product),
        category: await getProductCategoriesData(product),
        dimensions: await getProductDimensionsData(product)
        // ^^^ TODO: use dimensions feature for brand?
    };
};

/** @namespace Scandiweb/GoogleTagManager/Data/Product/getProductListEntryData */
export const getProductListEntryData = async (
    product,
    position,
    forcedList
) => {
    const { pageType: list } = await getPageData();
    // ^^^ Reuse page data as list information

    return {
        ...await getProductData(product),
        list: forcedList || list,
        position
    };
};

/** @namespace Scandiweb/GoogleTagManager/Data/Product/getProductDetailsData */
export const getProductDetailsData = async (product) => ({
    ecommerce: {
        detail: {
            products: [await getProductData(product)]
        }
    }
});
