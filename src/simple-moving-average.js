const _ = require('lodash');
const MovingWindow = require('./moving-window');

function mean(points) {
    return _(points).map('v').sum() / points.length;
}

module.exports = function SimpleMovingAverage(timeSeries, periods) {
    return MovingWindow(timeSeries, periods)
        .map(points => ({
            d: _.last(points).d,
            v: mean(points)
        }))
        //.do(point => console.log(`SMA: Date: ${point.d}, Value: ${point.v}`))
        ;
}