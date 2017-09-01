"use strict";
// @flow
Object.defineProperty(exports, "__esModule", { value: true });
const collate_1 = require("./collate");
function Subtract(minuendTimeSeries, subtrahendTimeSeries) {
    return collate_1.Collate({
        minuend: minuendTimeSeries,
        subtrahend: subtrahendTimeSeries
    })
        .map(collection => ({
        d: collection.minuend.d,
        v: collection.minuend.v - collection.subtrahend.v
    }));
}
exports.Subtract = Subtract;
;
