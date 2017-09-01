const _ = require('lodash');
const BinWindow = require('./bin-window');

module.exports = function BinLow(timeSeries) {
    return BinWindow(timeSeries)
        .map(point => ({
            d: point.d,
            v: _.min(point.v)
        }));
};