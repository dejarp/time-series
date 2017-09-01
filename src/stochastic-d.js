const SimpleMovingAverage = require('./simple-moving-average');
const StochasticK = require('./stochastic-k');

module.exports = function StochasticD(closeSeries, highSeries, lowSeries, periods, smoothingPeriods) {
    return SimpleMovingAverage(
        StochasticK(closeSeries, highSeries, lowSeries, periods), 
        smoothingPeriods
    );
}