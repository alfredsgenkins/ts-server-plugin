/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import {
    cloneElement,
    useEffect,
    useRef,
    useState
} from 'react';

import { fireImpressionEvent, fireProductClickEvent } from '../event/list';
import { registerCallback, unregisterCallback } from '../util/observer';
import { getElPosition } from '../util/position';

export const VISIBILITY_TIMEOUT_MS = 150;

/** @namespace Scandiweb/GoogleTagManager/Component/ProductTracker/ProductTracker */
export function ProductListEntryTracker(props) {
    // eslint-disable-next-line react/prop-types
    const { children, product, list } = props;
    const productRef = useRef(null);
    const [position, setPosition] = useState(-1);

    useEffect(() => {
        const { current: productEl } = productRef;
        setPosition(getElPosition(productEl));
        // ^^^ Cache position, we need to do it synchronously,
        // as at the moment of click, page may re-render to new one

        const onClick = () => {
            fireProductClickEvent(
                product,
                position !== -1 ? position : getElPosition(productEl),
                // ^^^ Try cached position, else calculate
                list
            );
        };

        const visibilityTimeout = setTimeout(() => {
            registerCallback(productEl, () => {
                if (!product.id) {
                    return;
                }

                fireImpressionEvent(
                    product,
                    position !== -1 ? position : getElPosition(productEl),
                    // ^^^ Try cached position, else calculate
                    list
                );

                unregisterCallback(productEl);
            });
        }, VISIBILITY_TIMEOUT_MS);

        productEl.addEventListener('click', onClick);

        return () => {
            const { current: productEl } = productRef;

            clearTimeout(visibilityTimeout);

            if (!productEl) {
                return;
            }

            unregisterCallback(productEl);
            productEl.removeEventListener('click', onClick);
        };
    }, []);

    return cloneElement(
        children,
        {
            ref: productRef,
            ...children.props
        },
        children.props.children
    );
}
