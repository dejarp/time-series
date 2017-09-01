"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moving_window_1 = require("./moving-window");
function Lag(timeSeries, periods) {
    return moving_window_1.default(timeSeries, periods + 1)
        .map(window => ({
        d: window[window.length - 1].d,
        v: window[0].v
    }));
}
exports.default = Lag;
;
