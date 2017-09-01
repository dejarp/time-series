import * as _ from 'lodash';
import MovingWindow from './moving-window';

function mean(points) {
    return _(points).map('v').sum() / points.length;
}

function stddev(points) {
    var m = mean(points);
    var variance = _(points).map('v').map(value => Math.pow(value - m, 2)).sum() / points.length;
    var standardDeviation = Math.sqrt(variance);
    return standardDeviation;
}

export default function StandardDeviation(timeSeries, periods) {
    return MovingWindow(timeSeries, periods)
        .map(points => ({
            d: _.last(points).d,
            v: stddev(points)
        }));
};