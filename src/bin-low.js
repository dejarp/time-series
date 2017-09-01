"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const bin_window_1 = require("./bin-window");
function BinLow(timeSeries) {
    return bin_window_1.default(timeSeries)
        .map(point => ({
        d: point.d,
        v: _.min(point.v)
    }));
}
exports.default = BinLow;
;
