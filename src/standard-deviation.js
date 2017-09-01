"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const moving_window_1 = require("./moving-window");
function mean(points) {
    return _(points).map('v').sum() / points.length;
}
function stddev(points) {
    var m = mean(points);
    var variance = _(points).map('v').map(value => Math.pow(value - m, 2)).sum() / points.length;
    var standardDeviation = Math.sqrt(variance);
    return standardDeviation;
}
function StandardDeviation(timeSeries, periods) {
    return moving_window_1.MovingWindow(timeSeries, periods)
        .map(points => ({
        d: _.last(points).d,
        v: stddev(points)
    }));
}
exports.StandardDeviation = StandardDeviation;
;
