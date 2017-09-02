// @flow

import Collate from './collate';

export default function Subtract(minuendTimeSeries, subtrahendTimeSeries) {
    return Collate({ 
        minuend: minuendTimeSeries, 
        subtrahend: subtrahendTimeSeries })
        .map(collection => ({
            d: collection.d,
            v: collection.v.minuend.v - collection.v.subtrahend.v
        }))
};