/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { TYPE_CATEGORY, TYPE_CMS_PAGE, TYPE_PRODUCT } from 'Route/UrlRewrites/UrlRewrites.config';
import getStore from 'Util/Store';

import { waitForCallback } from '../util/wait';

export const DL_VAL_PAGE_HOME = 'homepage';
export const DL_VAL_PAGE_CART = 'cart';
export const DL_VAL_PAGE_CHECKOUT = 'checkout';
export const DL_VAL_PAGE_ACCOUNT = 'account';
export const DL_VAL_PAGE_WISHLIST = 'wishlist';
export const DL_VAL_PAGE_FORGOT = 'forgot';
export const DL_VAL_PAGE_CONTACT = 'contact';
export const DL_VAL_PAGE_COMPARE = 'compare';
export const DL_VAL_PAGE_BLOG = 'blog';
export const DL_VAL_PAGE_STORES = 'stores';
export const DL_VAL_PAGE_SEARCH = 'search';
export const DL_VAL_PAGE_CATEGORY = 'category';
export const DL_VAL_PAGE_PRODUCT = 'product';
export const DL_VAL_PAGE_404 = 'not_found';
export const DL_VAL_PAGE_CMS = 'cmspage';

/** @namespace Scandiweb/GoogleTagManager/Data/Page/getPageData */
export const getPageData = async () => {
    // vvv Wait for store code
    await waitForCallback(() => getStore().getState().ConfigReducer?.store_code);

    const {
        ConfigReducer: {
            store_code
        } = {}
    } = getStore().getState();

    const realPath = window.location.pathname.replace(
        `/${store_code}`,
        ''
    );

    if (realPath === '/') {
        return { pageType: DL_VAL_PAGE_HOME };
    }

    // vvv Try lookign up the page from an array of pre-defined ones

    const pathnameMap = {
        [DL_VAL_PAGE_CART]: '/cart',
        [DL_VAL_PAGE_CHECKOUT]: '/checkout',
        [DL_VAL_PAGE_ACCOUNT]: '/account',
        [DL_VAL_PAGE_WISHLIST]: '/wishlist',
        [DL_VAL_PAGE_FORGOT]: '/forgot-password',
        [DL_VAL_PAGE_CONTACT]: '/contact',
        [DL_VAL_PAGE_COMPARE]: '/compare',
        [DL_VAL_PAGE_BLOG]: '/blog',
        [DL_VAL_PAGE_STORES]: '/stores',
        [DL_VAL_PAGE_SEARCH]: '/search'
    };

    const [pathnameKey] = Object.entries(pathnameMap).find(([, pathname]) => (
        realPath.indexOf(pathname) !== -1
    )) || [];

    if (pathnameKey) {
        return { pageType: pathnameKey };
    }

    // vvv Wait for store code
    await waitForCallback(() => getStore().getState().UrlRewritesReducer?.urlRewrite?.type);

    const {
        urlRewrite: {
            type,
            notFound = false
        }
    } = getStore().getState().UrlRewritesReducer;

    if (notFound) {
        return { pageType: DL_VAL_PAGE_404 };
    }

    if (!type) {
        return { pageType: '' };
    }

    const typeToKeyMap = {
        [TYPE_CMS_PAGE]: `${DL_VAL_PAGE_CMS}${realPath}`,
        [TYPE_CATEGORY]: DL_VAL_PAGE_CATEGORY,
        [TYPE_PRODUCT]: DL_VAL_PAGE_PRODUCT
    };

    return { pageType: typeToKeyMap[type] };
};
