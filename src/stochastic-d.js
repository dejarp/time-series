"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simple_moving_average_1 = require("./simple-moving-average");
const stochastic_k_1 = require("./stochastic-k");
function StochasticD(closeSeries, highSeries, lowSeries, periods, smoothingPeriods) {
    return simple_moving_average_1.SimpleMovingAverage(stochastic_k_1.StochasticK(closeSeries, highSeries, lowSeries, periods), smoothingPeriods);
}
exports.StochasticD = StochasticD;
