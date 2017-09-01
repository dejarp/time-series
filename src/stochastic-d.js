"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const simple_moving_average_1 = require("./simple-moving-average");
const stochastic_k_1 = require("./stochastic-k");
function StochasticD(closeSeries, highSeries, lowSeries, periods, smoothingPeriods) {
    return simple_moving_average_1.default(stochastic_k_1.default(closeSeries, highSeries, lowSeries, periods), smoothingPeriods);
}
exports.default = StochasticD;
