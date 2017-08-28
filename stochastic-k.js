const Collate = require('./collate');
const MovingLow = require('./moving-low');
const MovingHigh = require('./moving-high');
const Lag = require('./lag');

module.exports = function StochasticK(closeSeries, highSeries, lowSeries, periods) {
    return Collate({
        close: closeSeries,
        // low of the previous n periods
        low: MovingLow(Lag(lowSeries, 1), periods),
        // high of the previous n periods
        high: MovingHigh(Lag(highSeries, 1), periods)})
        .map(collection => ({
            d: collection.low.d,
            v: 100 * (collection.close.v - collection.low.v) / (collection.high.v - collection.low.v)
        }));
}