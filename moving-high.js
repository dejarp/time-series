const _ = require('lodash');
const MovingWindow = require('./moving-window');

module.exports = function MovingHigh(timeSeries, periods) {
    return MovingWindow(timeSeries, periods)
        .map(window => ({
            d: _.last(window).d,
            v: _.maxBy(window, point => point.v).v
        }))
        .distinctUntilChanged(_.isEqual);
}