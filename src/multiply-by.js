"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function MultiplyBy(timeSeries, multiplier) {
    return timeSeries
        .map(point => ({
        d: point.d,
        v: point.v * multiplier
    }));
}
exports.default = MultiplyBy;
;
