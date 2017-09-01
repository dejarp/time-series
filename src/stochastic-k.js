"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const collate_atomic_1 = require("./collate-atomic");
const moving_low_1 = require("./moving-low");
const moving_high_1 = require("./moving-high");
function StochasticK(closeSeries, highSeries, lowSeries, periods) {
    return collate_atomic_1.CollateAtomic([
        closeSeries.skip(periods - 1),
        moving_low_1.MovingLow(lowSeries, periods),
        moving_high_1.MovingHigh(highSeries, periods)
    ], (close, lowestLow, highestHigh) => {
        if (close.d.getTime() !== lowestLow.d.getTime()) {
            throw new Error('misaligned');
        }
        return {
            d: close.d,
            v: 100 * (close.v - lowestLow.v) / (highestHigh.v - lowestLow.v)
        };
    });
}
exports.StochasticK = StochasticK;
