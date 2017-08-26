const Subtract = require('./subtract');
const MultiplyBy = require('./multiply-by');
const SimpleMovingAverage = require('./simple-moving-average');
const StandardDeviation = require('./standard-deviation');

module.exports = function BollingerBandLower(timeSeries, periods, multiplier) {
    return Subtract(
        SimpleMovingAverage(timeSeries, periods),
        MultiplyBy(
            StandardDeviation(timeSeries, periods), multiplier
        )
    )
};