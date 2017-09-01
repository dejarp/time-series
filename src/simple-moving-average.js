"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const moving_window_1 = require("./moving-window");
function mean(points) {
    return _(points).map('v').sum() / points.length;
}
function SimpleMovingAverage(timeSeries, periods) {
    return moving_window_1.MovingWindow(timeSeries, periods)
        .map(points => ({
        d: _.last(points).d,
        v: mean(points)
    }));
}
exports.SimpleMovingAverage = SimpleMovingAverage;
