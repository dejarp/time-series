const _ = require('lodash');
const MovingWindow = require('./moving-window');

module.exports = function MovingLow(timeSeries, periods) {
    return MovingWindow(timeSeries, periods)
        .map(window => ({
            d: _.last(window).d,
            v: _.minBy(window, point => point.v).v
        }))
        .distinctUntilChanged(_.isEqual);
};