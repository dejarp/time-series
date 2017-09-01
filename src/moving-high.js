"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const moving_window_1 = require("./moving-window");
function MovingHigh(timeSeries, periods) {
    return moving_window_1.MovingWindow(timeSeries, periods)
        .map(window => {
        return {
            d: _.last(window).d,
            v: _.maxBy(window, point => point.v).v
        };
    });
}
exports.MovingHigh = MovingHigh;
