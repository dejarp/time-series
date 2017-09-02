import * as _ from 'lodash';
import MovingWindow from './moving-window';
import TimeSeries from '../time-series';

function mean(points) : number {
    return _(points).map('v').sum() / points.length;
}

function stddev(points) {
    var m = mean(points);
    var variance = _(points).map('v').map(value => Math.pow(value - m, 2)).sum() / points.length;
    var standardDeviation = Math.sqrt(variance);
    return standardDeviation;
}

export default function StandardDeviation(timeSeries: TimeSeries<number>, periods) : TimeSeries<number> {
    return MovingWindow(timeSeries, periods)
        .map(window => ({
            d: window.d,
            v: stddev(window.v)
        }));
};