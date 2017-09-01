const Rx = require('rxjs');
const Collate = require('./collate');
const MovingLow = require('./moving-low');
const MovingHigh = require('./moving-high');
const Lag = require('./lag');

module.exports = function StochasticK(closeSeries, highSeries, lowSeries, periods) {
    return Rx.Observable
        .zip(
            closeSeries.skip(periods - 1), 
            MovingLow(lowSeries, periods), 
            MovingHigh(highSeries, periods)
        )
        .map(results => {
            var close = results[0];
            var low = results[1];
            var high = results[2];
            if(close.d.getTime() !== low.d.getTime()) {
                throw new Error('misaligned');
            }
            return {
                d: close.d,
                v: 100 * (close.v - low.v) / (high.v - low.v)
            };
        });
}