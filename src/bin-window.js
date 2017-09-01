"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function BinWindow(timeSeries) {
    return timeSeries
        .scan((accumulator, point) => {
        if (accumulator.d === null || accumulator.d.getTime() !== point.d.getTime()) {
            accumulator.d = point.d;
            accumulator.v = [point.v];
        }
        else {
            accumulator.v.push(point.v);
        }
        return accumulator;
    }, {
        d: null,
        v: []
    });
}
exports.BinWindow = BinWindow;
;
