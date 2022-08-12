/**
 * Google Tag Manager frontend compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { Field } from 'SourceUtil/Query';

const addGtmSpecificFields = (args, callback) => {
    const [isVariant] = args;

    const fields = [
        ...callback(...args),
        'dimensions'
    ];

    if (isVariant) {
        // only add categories to parent product
        return fields;
    }

    const isCategoryFieldPresent = fields.includes((field) => {
        if (typeof field === 'string') {
            return false;
        }

        return field.name === 'categories';
    });

    if (isCategoryFieldPresent) {
        return fields;
    }

    return [
        ...fields,
        // vvv Only add category name, avoiding breadcrumbs
        new Field('categories')
            .addField('name')
    ];
};

const addGtmSpecificFieldToVariant = (args, callback) => {
    const product = callback(...args);
    product.addField('dimensions');
    return product;
};

export default {
    'Query/ProductList/Query': {
        'member-function': {
            // vvv Cart specific product fields
            _getCartProductInterfaceFields: addGtmSpecificFields,
            _getCartProductField: addGtmSpecificFieldToVariant,
            // vvv General product fields
            _getProductInterfaceFields: addGtmSpecificFields
        }
    }
};
