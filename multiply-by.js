module.exports = function MultiplyBy(timeSeries, multiplier) {
    return timeSeries
        .map(point => ({
           d: point.d,
           v: point.v * multiplier
        }));
};