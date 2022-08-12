/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

/** @namespace Scandiweb/GoogleTagManager/Util/Position/getElPosition */
export const getElPosition = (targetEl) => {
    if (!targetEl) {
        return 0;
    }

    // vvv Could fail, in case first class will not be block
    const productCardClass = targetEl.classList[0];

    // vvv Finds element position on page
    const indexOnPage = Array.from(
        document.getElementsByClassName(productCardClass)
    ).findIndex((el) => el === targetEl);

    // vvv Prefer position 0 over -1 (can be done via Math too)
    return indexOnPage === -1 ? 0 : (indexOnPage + 1);
    // ^^^ Add +1 to ensure we start from 1, not 0
};
