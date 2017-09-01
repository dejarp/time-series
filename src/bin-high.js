const _ = require('lodash');
const BinWindow = require('./bin-window');

module.exports = function BinHigh(timeSeries) {
    return BinWindow(timeSeries)
        .map(point => ({
            d: point.d,
            v: _.max(point.v)
        }));
};