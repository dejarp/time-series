"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const moving_window_1 = require("./moving-window");
function MovingLow(timeSeries, periods) {
    return moving_window_1.default(timeSeries, periods)
        .map(window => ({
        d: _.last(window).d,
        v: _.minBy(window, point => point.v).v
    }));
}
exports.default = MovingLow;
;
