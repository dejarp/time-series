"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const bin_window_1 = require("./bin-window");
function BinHigh(timeSeries) {
    return bin_window_1.default(timeSeries)
        .map(point => ({
        d: point.d,
        v: _.max(point.v)
    }));
}
exports.default = BinHigh;
;
